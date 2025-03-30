import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigType } from 'src/utils/types/config.types';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { JWT_SYMBOL } from 'src/utils/config/constants.config';
import envConfig from 'src/utils/config/env.config';
@Injectable()
export class JWTGuard implements CanActivate {
  constructor(
    @Inject(JWT_SYMBOL) private readonly jwtService: JwtService,
    @Inject(envConfig.KEY)
    private readonly configService: ConfigService<ConfigType>,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest() as Request;
    console.log('cookies', request.cookies);

    // * check if the request cookie has the JWT token
    let token = request.cookies.Authorization;

    // * if not, check the Authorization header (sessions)
    if (!token) {
      const authHeader = request.headers.authorization;
      token = authHeader?.split(' ')[1];
    }
    if (!token) {
      console.error('JWT token is missing in cookies or Authorization header');
      return false;
    }

    try {
      const decoded = this.jwtService.verify(token);
      console.log({ decoded });
      request.user = { id: decoded.sub };
      return !!decoded;
    } catch (error) {
      console.error('Error verifying JWT token:', error.message);
      return false;
    }
  }
}
