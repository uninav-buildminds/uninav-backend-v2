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
    console.log('req from google login', req.url, req.headers);
    // Extract origin from request headers
    const origin = req.headers.origin || req.headers.referer || req.query.state;

    if (!origin || typeof origin !== 'string') {
      return fallbackUrl;
    }

    try {
      const originUrl = new URL(origin);
      const baseOrigin = `${originUrl.protocol}//${originUrl.hostname}${
        originUrl.port ? ':' + originUrl.port : ''
      }`;

      // Check if the origin is in the allowed list
      if (this.allowedOrigins.includes(baseOrigin)) {
        return baseOrigin;
      }
    } catch (error) {
      console.warn('Failed to parse origin URL:', error);
    }

    return fallbackUrl;
  }
}
