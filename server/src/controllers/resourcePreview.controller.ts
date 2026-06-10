import type { Request, Response, NextFunction } from 'express';
import { ssrfFetch } from '../utils/ssrfGuard';
import { auditLog } from '../utils/auditLogger';
import { ValidationError } from '../utils/AppError';

// POST /api/resource-preview
// Accepts { url: string }, passes it through the SSRF defense layer,
// then proxies the image bytes back to the caller.
// Auth: lecturer / teaching_assistant / admin (enforced in the router).

export async function fetchResourcePreview(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const userId    = (req as Request & { user?: { id: string } }).user?.id ?? null;
  const clientIp  = req.ip ?? null;
  const rawUrl    = (req.body as Record<string, unknown>)['url'];

  // Basic type guard — ssrfGuard also validates, but we want a clear 422 early
  if (typeof rawUrl !== 'string' || rawUrl.trim() === '') {
    next(new ValidationError('url is required'));
    return;
  }

  try {
    const { buffer, contentType } = await ssrfFetch(rawUrl);

    auditLog({
      userId,
      action:       'resource_preview_fetch',
      resourceType: 'external_url',
      ipAddress:    clientIp,
      status:       'success',
      severity:     'info',
      description:  `Fetched external resource from: ${new URL(rawUrl).hostname}`,
    });

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.length);
    // Never cache proxied content — avoids stale or confused content
    res.setHeader('Cache-Control', 'no-store');
    // Prevent the browser from guessing a different MIME type
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.status(200).send(buffer);
  } catch (err) {
    // Log every SSRF rejection as a warning so admins can monitor for probing
    const message = err instanceof Error ? err.message : 'Unknown error';
    auditLog({
      userId,
      action:       'resource_preview_rejected',
      resourceType: 'external_url',
      ipAddress:    clientIp,
      status:       'failure',
      severity:     'warning',
      description:  `SSRF guard rejected URL. Reason: ${message}`,
    });
    next(err);
  }
}
