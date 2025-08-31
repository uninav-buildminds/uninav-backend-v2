import { Request } from 'express';

export class OriginDetectorHelper {
  // Define allowed origins for security
  private static readonly allowedOrigins = [
    'http://localhost:3000', // Development frontend
    'http://localhost:3001', // Alternative dev port
    'https://uninav.live', // Production frontend
    'https://www.uninav.live', // Production frontend with www
  ];

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
