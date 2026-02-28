import { Request } from 'express';
import { AppEnum } from 'src/utils/config/app.config';

export class OriginDetectorHelper {
  private static readonly allowedOrigins = AppEnum.CORS_OPTIONS
    .origin as string[];

  /**
   * Validate a raw origin string against the allowlist.
   * Returns the clean base origin or null if invalid.
   */
  private static validateOrigin(raw: string): string | null {
    try {
      let decoded = raw;
      if (raw.includes('%')) {
        decoded = decodeURIComponent(raw);
      }
      const url = new URL(decoded);
      const base = `${url.protocol}//${url.hostname}${
        url.port ? ':' + url.port : ''
      }`;

      if (this.allowedOrigins.includes(base)) {
        return base;
      }
    } catch {
      // invalid URL — ignore
    }
    return null;
  }

  /**
   * Detect origin from an initial request (e.g. GET /auth/google).
   * Reads Origin / Referer headers sent by the user's browser.
   */
  static detectAndValidateOrigin(
    req: Request,
    fallbackUrl: string = 'https://uninav.live',
  ): string {
    const candidates = [
      req.headers.origin,
      req.headers.referer,
    ].filter(Boolean) as string[];

    for (const candidate of candidates) {
      const validated = this.validateOrigin(candidate);
      if (validated) return validated;
    }

    return fallbackUrl;
  }

  /**
   * Resolve redirect origin from an OAuth callback request.
   * Prioritises the `state` query parameter (set by us during initiation)
   * because headers on the callback belong to Google, not the user's frontend.
   */
  static resolveCallbackOrigin(
    req: Request,
    fallbackUrl: string = 'https://uninav.live',
  ): string {
    const state = req.query.state;
    if (state && typeof state === 'string') {
      const validated = this.validateOrigin(state);
      if (validated) return validated;
    }

    // Fallback: try headers (unlikely to work on OAuth callbacks, but safe)
    return this.detectAndValidateOrigin(req, fallbackUrl);
  }
}
