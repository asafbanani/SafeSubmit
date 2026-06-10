import * as https from 'https';
import * as dns from 'dns';
import * as net from 'net';
import * as ipaddr from 'ipaddr.js';
import { env } from '../config/env';
import { ValidationError } from './AppError';

// ── Config (resolved once at module load, not per-request) ─────────────────────

const TRUSTED_DOMAINS: ReadonlySet<string> = new Set(
  env.SSRF_TRUSTED_DOMAINS
    .split(',')
    .map(d => d.trim().toLowerCase())
    .filter(Boolean),
);

const MAX_BYTES  = env.SSRF_MAX_RESPONSE_BYTES;
const TIMEOUT_MS = env.SSRF_TIMEOUT_MS;

// MIME types we accept — raster images only.
// SVG is intentionally excluded: it can embed scripts and trigger XSS.
const ALLOWED_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const MAX_URL_LENGTH = 2048;

// ── Public result type ─────────────────────────────────────────────────────────

export interface SsrfFetchResult {
  buffer:      Buffer;
  contentType: string;
}

// ── Main exported function ─────────────────────────────────────────────────────

/**
 * Fetches an image from `rawUrl` after passing all SSRF defence layers.
 * Throws a `ValidationError` (422) for any security violation — the message
 * is intentionally generic so it is safe to forward to the client.
 */
export async function ssrfFetch(rawUrl: string): Promise<SsrfFetchResult> {

  // ── Layer A: Input validation ──────────────────────────────────────────────

  if (typeof rawUrl !== 'string' || rawUrl.trim() === '') {
    throw new ValidationError('URL is required');
  }
  if (rawUrl.length > MAX_URL_LENGTH) {
    throw new ValidationError('URL is too long');
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new ValidationError('Invalid URL format');
  }

  // ── Layer B: Protocol + userinfo enforcement ───────────────────────────────

  if (parsed.protocol !== 'https:') {
    throw new ValidationError('Only HTTPS URLs are allowed');
  }
  // Reject https://user:pass@host — userinfo can be used to confuse parsers
  if (parsed.username || parsed.password) {
    throw new ValidationError('URLs with credentials are not allowed');
  }

  // ── Layer C: Port restriction ──────────────────────────────────────────────

  // url.port is '' when the URL uses the default port for its scheme (443 for https)
  if (parsed.port !== '' && parsed.port !== '443') {
    throw new ValidationError('Only the default HTTPS port (443) is allowed');
  }

  // ── Layer D: Hostname normalisation + allowlist ────────────────────────────

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, ''); // strip trailing dot
  if (!hostname) {
    throw new ValidationError('Invalid URL: empty hostname');
  }

  // Reject bare IP literals — they bypass the domain allowlist and DNS step
  if (net.isIP(hostname) !== 0) {
    throw new ValidationError('IP address literals are not allowed — use a hostname');
  }

  if (!TRUSTED_DOMAINS.has(hostname)) {
    throw new ValidationError('Domain is not on the trusted allowlist');
  }

  // ── Layer E: DNS resolution ────────────────────────────────────────────────

  let ipv4Addresses: string[] = [];
  let ipv6Addresses: string[] = [];

  try {
    ipv4Addresses = await dns.promises.resolve4(hostname);
  } catch {
    ipv4Addresses = []; // NODATA for A records is fine — host might be IPv6-only
  }

  try {
    ipv6Addresses = await dns.promises.resolve6(hostname);
  } catch {
    ipv6Addresses = [];
  }

  const allAddresses = [...ipv4Addresses, ...ipv6Addresses];
  if (allAddresses.length === 0) {
    throw new ValidationError('Could not resolve the requested resource');
  }

  // ── Layer F: Private / local IP check ─────────────────────────────────────

  for (const addr of allAddresses) {
    assertNotPrivateIp(addr);
  }

  // ── Layer G: DNS pinning ─────────────────────────────────────────

  const pinnedIp     = ipv4Addresses[0] ?? ipv6Addresses[0]!;
  const pinnedFamily = ipv4Addresses.length > 0 ? 4 : 6;

  // The lookup callback signature must match net.LookupFunction.
  // We intentionally ignore the incoming hostname — always return the pinned IP.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pinnedLookup = (_h: string, _opts: any, cb: (e: Error | null, a: string, f: number) => void) => {
    cb(null, pinnedIp, pinnedFamily);
  };

  // ── Layers H–K: make the request ──────────────────────────────────────────

  return await makeRequest(parsed, pinnedLookup);
}

// ── Private helpers ────────────────────────────────────────────────────────────

/**
 * Throws ValidationError if `addr` falls into any private / restricted range.
 * ipaddr.js .range() handles IPv4-mapped IPv6 (::ffff:127.0.0.1) automatically.
 */
function assertNotPrivateIp(addr: string): void {
  let ip: ipaddr.IPv4 | ipaddr.IPv6;
  try {
    ip = ipaddr.parse(addr);
  } catch {
    throw new ValidationError('Could not resolve the requested resource');
  }
  // Normalise IPv4-mapped IPv6 (::ffff:x.x.x.x) to plain IPv4 before range check
  if (ip.kind() === 'ipv6') {
    const v6 = ip as ipaddr.IPv6;
    if (v6.isIPv4MappedAddress()) {
      ip = v6.toIPv4Address();
    }
  }
  const range = ip.range();

  // These range names are defined by ipaddr.js for both IPv4 and IPv6
  const blockedRanges = new Set([
    'loopback',
    'private',
    'linkLocal',
    'uniqueLocal',    // IPv6 fc00::/7
    'unspecified',
    'broadcast',
    'carrierGradeNat',
    'reserved',
    'multicast',
  ]);

  if (blockedRanges.has(range)) {
    throw new ValidationError('Could not resolve the requested resource');
  }

  // Belt-and-suspenders: explicitly block cloud metadata service IPs
  // (169.254.169.254 is already caught by linkLocal, but be explicit for clarity)
  if (addr === '169.254.169.254' || addr === 'fd00:ec2::254') {
    throw new ValidationError('Could not resolve the requested resource');
  }
}

/**
 * Makes the HTTPS GET request using the pinned DNS lookup.
 * Enforces: no redirects (Layer I), Content-Type (Layer J), size limit (Layer K).
 */
function makeRequest(
  parsed: URL,
  pinnedLookup: (h: string, o: any, cb: (e: Error | null, a: string, f: number) => void) => void,
): Promise<SsrfFetchResult> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname:           parsed.hostname,
        port:               443,
        path:               parsed.pathname + parsed.search,
        method:             'GET',
        timeout:            TIMEOUT_MS,
        rejectUnauthorized: true, // always verify TLS certificate
        lookup:             pinnedLookup,
      },
      (res) => {
        // ── Layer I: Redirect rejection ──────────────────────────────────
        const status = res.statusCode ?? 0;
        if (status >= 300 && status < 400) {
          res.destroy();
          reject(new ValidationError('Redirects are not allowed'));
          return;
        }
        if (status < 200 || status >= 300) {
          res.destroy();
          reject(new ValidationError('Could not fetch the requested resource'));
          return;
        }

        // ── Layer J: Content-Type enforcement ────────────────────────────
        const ct = (res.headers['content-type'] ?? '').split(';')[0]!.trim().toLowerCase();
        if (!ALLOWED_CONTENT_TYPES.has(ct)) {
          res.destroy();
          reject(new ValidationError('Unsupported resource type'));
          return;
        }

        // ── Layer K: Size enforcement (Content-Length header first) ──────
        const clRaw = parseInt(res.headers['content-length'] ?? '0', 10);
        if (!isNaN(clRaw) && clRaw > MAX_BYTES) {
          res.destroy();
          reject(new ValidationError('Resource exceeds maximum allowed size'));
          return;
        }

        // Stream body with running byte count
        const chunks: Buffer[] = [];
        let bytesReceived = 0;

        res.on('data', (chunk: Buffer) => {
          bytesReceived += chunk.length;
          if (bytesReceived > MAX_BYTES) {
            res.destroy();
            reject(new ValidationError('Resource exceeds maximum allowed size'));
          } else {
            chunks.push(chunk);
          }
        });

        res.on('end', () => {
          resolve({
            buffer:      Buffer.concat(chunks),
            contentType: ct,
          });
        });

        res.on('error', () => {
          reject(new ValidationError('Could not fetch the requested resource'));
        });
      },
    );

    req.on('timeout', () => {
      req.destroy();
      reject(new ValidationError('Request timed out'));
    });

    req.on('error', () => {
      reject(new ValidationError('Could not fetch the requested resource'));
    });

    req.end();
  });
}
