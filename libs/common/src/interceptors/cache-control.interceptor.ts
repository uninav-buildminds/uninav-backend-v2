import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { CACHE_CONTROL_KEY } from '../decorators/cache-control.decorator';

@Injectable()
export class CacheControlInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const directive = this.reflector.get<string>(
      CACHE_CONTROL_KEY,
      context.getHandler(),
    );

    if (directive) {
      const response = context.switchToHttp().getResponse();
      response.setHeader('Cache-Control', directive);
    }

    return next.handle();
  }
}
