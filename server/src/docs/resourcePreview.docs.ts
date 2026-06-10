/**
 * @swagger
 * tags:
 *   name: Resource Preview
 *   description: Server-side image fetch with SSRF defense (lecturers and TAs only)
 */

/**
 * @swagger
 * /api/resource-preview:
 *   post:
 *     summary: Fetch an external image via the SSRF-guarded proxy
 *     tags: [Resource Preview]
 *     description: |
 *       Instructs the server to fetch an image from a trusted external URL and
 *       return the image bytes to the caller. The server acts as a proxy so the
 *       client never contacts the external host directly.
 *
 *       **SSRF defence layers applied (server-side, in order):**
 *
 *       1. **Input validation** — URL must be a non-empty string ≤ 2048 chars
 *       2. **HTTPS-only** — `http://`, `file://`, `data:`, etc. are rejected
 *       3. **No credentials in URL** — `https://user:pass@host` is rejected
 *       4. **Port restriction** — only port 443 (or default) is accepted
 *       5. **Domain allowlist** — hostname must exactly match `SSRF_TRUSTED_DOMAINS`
 *          (configured in `.env`; no wildcards, no prefixes)
 *       6. **DNS resolution** — all A and AAAA records are resolved
 *       7. **Private IP check** — rejects loopback, private ranges (10/8, 172.16/12,
 *          192.168/16), link-local (169.254/16), IPv6 ULA (fc00::/7), and the cloud
 *          metadata service IP (169.254.169.254)
 *       8. **DNS pinning** — a custom `lookup` callback is injected into the HTTPS
 *          request so the TCP connection uses the pre-verified IP, preventing
 *          DNS-rebinding / TOCTOU attacks
 *       9. **No redirect follow** — any 3xx response is rejected immediately
 *       10. **Content-Type enforcement** — only `image/jpeg`, `image/png`,
 *           `image/webp`, `image/gif` are accepted; SVG is explicitly excluded
 *       11. **Size limit** — responses exceeding `SSRF_MAX_RESPONSE_BYTES` (default
 *           2 MB) are rejected both by `Content-Length` header and by streaming
 *           byte count
 *
 *       All rejections are written to the audit log with `severity: warning`
 *       so they are visible in `GET /api/security-logs`.
 *
 *       **Default trusted domains:** `upload.wikimedia.org`, `images.unsplash.com`
 *       (override via `SSRF_TRUSTED_DOMAINS` env var — comma-separated).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [url]
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 maxLength: 2048
 *                 description: HTTPS URL on a trusted domain
 *                 example: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Simple_English_Wikipedia_globe_enwp.png/240px-Simple_English_Wikipedia_globe_enwp.png"
 *     responses:
 *       200:
 *         description: Image bytes proxied from the external source
 *         headers:
 *           Content-Type:
 *             description: MIME type of the fetched image
 *             schema:
 *               type: string
 *               example: image/png
 *           X-Content-Type-Options:
 *             description: Always set to nosniff
 *             schema:
 *               type: string
 *               example: nosniff
 *           Cache-Control:
 *             description: Always set to no-store
 *             schema:
 *               type: string
 *               example: no-store
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *           image/webp:
 *             schema:
 *               type: string
 *               format: binary
 *           image/gif:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Insufficient role (students may not use this endpoint)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: |
 *           URL rejected by SSRF guard. Possible reasons (generic message returned to client):
 *           - Non-HTTPS scheme
 *           - Credentials in URL
 *           - Non-443 port
 *           - Domain not in allowlist
 *           - Resolved IP is private / loopback / metadata range
 *           - Server returned a redirect
 *           - Response has unsupported Content-Type
 *           - Response exceeds size limit
 *           - DNS resolution failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               httpScheme:
 *                 summary: HTTP scheme rejected
 *                 value:
 *                   error: "Only HTTPS URLs are allowed"
 *               notAllowlisted:
 *                 summary: Domain not in allowlist
 *                 value:
 *                   error: "Domain is not on the trusted allowlist"
 *               privateIp:
 *                 summary: Resolved IP is private
 *                 value:
 *                   error: "Could not resolve the requested resource"
 *               wrongType:
 *                 summary: Response is not a raster image
 *                 value:
 *                   error: "Unsupported resource type"
 */
export {};
