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
import { ROLES_KEY } from 'src/utils/decorators/roles.decorator';
import envConfig from 'src/utils/config/env.config';
import { UserEntity, UserRoleEnum } from 'src/utils/types/db.types';
import { UserService } from 'src/modules/user/user.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    @Inject(JWT_SYMBOL) private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get the roles required for this route
    const requiredRoles = this.reflector.getAllAndOverride<UserRoleEnum[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest() as Request;

    try {
      const user = await this.authenticateRequest(request);

      // Fetch the user with their role from the database
      const dbUser = await this.userService.findOne(user.id);
      if (!dbUser) {
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
    let token = request.cookies?.Authorization;

    if (!token) {
      const authHeader = request.headers.authorization;
      token = authHeader?.split(' ')[1];
    }

    if (!token) {
      throw new UnauthorizedException('JWT token is missing');
    }

    try {
      const decoded = this.jwtService.verify(token);
      return { id: decoded.sub };
    } catch (error) {
      throw new UnauthorizedException('Invalid JWT token');
    }
  }
}
