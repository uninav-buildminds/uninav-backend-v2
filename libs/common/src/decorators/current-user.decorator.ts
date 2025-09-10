import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserEntity } from '@app/common/types/db.types';

/**
 * Extract current user from request object
 * Usage: @CurrentUser() user: UserEntity
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserEntity => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
