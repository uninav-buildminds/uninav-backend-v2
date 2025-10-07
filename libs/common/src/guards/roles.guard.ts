import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JWT_SYMBOL } from 'src/utils/config/constants.config';
import {
  ROLES_KEY,
  ROLES_STRICT_KEY,
} from '@app/common/decorators/roles.decorator';
import { ConfigService } from '@nestjs/config';
import { UserEntity, UserRoleEnum } from '@app/common/types/db.types';
import { UserService } from 'src/modules/user/user.service';
import { ENV } from 'src/utils/config/env.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    @Inject(JWT_SYMBOL) private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get the roles required for this route
    const requiredRoles = this.reflector.getAllAndOverride<UserRoleEnum[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Get the strict mode setting
    const isStrict =
      this.reflector.getAllAndOverride<boolean>(ROLES_STRICT_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? true;

    const request = context.switchToHttp().getRequest() as Request;

    try {
      const user = await this.authenticateRequest(request);

      // Fetch the user with their role from the database
      const dbUser = await this.userService.findOne(user.id);
      if (!dbUser) {
        if (!isStrict) {
          // In non-strict mode, continue without user
          return true;
        }
        throw new UnauthorizedException('User not found');
      }

      request.user = dbUser;

      // If no specific roles are required, just having a valid token is enough
      if (!requiredRoles || requiredRoles.length === 0) {
        return true;
      }

      // Check if the user's role matches any of the required roles
      const authorized = requiredRoles.includes(dbUser.role as UserRoleEnum);
      if (!authorized) {
        throw new ForbiddenException(
          'You do not have permission to access this resource',
        );
      }
      return authorized;
    } catch (error) {
      // In non-strict mode, authentication failures are allowed
      if (!isStrict) {
        // Allow access but without user context
        request.user = undefined;
        return true;
      }

      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new UnauthorizedException('Invalid token');
    }
  }

  private async authenticateRequest(request: Request): Promise<{ id: string }> {
    // Check if token exists in cookies or authorization header
    let token = request.cookies?.authorization;

    if (!token) {
      const authHeader = request.headers.authorization;
      token = authHeader?.split(' ')[1];
    }

    if (!token) {
      throw new UnauthorizedException('User not logged in');
    }

    try {
      const decoded = this.jwtService.verify(token);
      return { id: decoded.sub };
    } catch (error) {
      throw new UnauthorizedException(
        'Invalid JWT token (Please signin to perform this operation)',
      );
    }
  }
}
