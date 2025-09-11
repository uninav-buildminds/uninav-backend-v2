import { Request } from 'express';
import { AppEnum } from 'src/utils/config/app.config';

export class OriginDetectorHelper {
  // Define allowed origins for security
  private static readonly allowedOrigins = AppEnum.CORS_OPTIONS
    .origin as string;

  static detectAndValidateOrigin(
    req: Request,
    fallbackUrl: string = 'https://uninav.live',
  ): string {
    console.log(' will detect origin from ', req.url);
    // Extract origin from request headers
    const origin = req.headers.origin || req.headers.referer || req.query.state;

    if (!origin || typeof origin !== 'string') {
      return fallbackUrl;
    }

    let decodedOrigin = origin;
    try {
      // Try decoding if it looks encoded
      if (origin.includes('%')) {
        decodedOrigin = decodeURIComponent(origin);
      }
      const originUrl = new URL(decodedOrigin);
      const baseOrigin = `${originUrl.protocol}//${originUrl.hostname}${
        originUrl.port ? ':' + originUrl.port : ''
      }`;

      // Check if the origin is in the allowed list
      if (this.allowedOrigins.includes(baseOrigin)) {
        console.log('detected origin', baseOrigin);
        return baseOrigin;
      }
    } catch (error) {
      console.warn('Failed to parse origin URL:', error);
    }
    console.log('failed to detect origin, using fallback', fallbackUrl);
    return fallbackUrl;
  }
}
