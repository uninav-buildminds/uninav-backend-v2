import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { OriginDetectorHelper } from 'src/utils/helpers/origin-detector.helper';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();

    const origin = OriginDetectorHelper.detectAndValidateOrigin(req);

    return {
      state: origin,
    };
  }
}
