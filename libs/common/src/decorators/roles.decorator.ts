import { SetMetadata } from '@nestjs/common';
import { UserRoleEnum } from '@app/common/types/db.types';

export const ROLES_KEY = 'roles';

/**
 * Roles decorator for specifying which user roles can access an endpoint
 * @param roles List of roles that are authorized to access the route
 */
export const Roles = (...roles: UserRoleEnum[]) =>
  SetMetadata(ROLES_KEY, roles);
