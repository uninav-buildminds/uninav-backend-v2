import { SetMetadata } from '@nestjs/common';
import { UserRoleEnum } from '@app/common/types/db.types';

export const ROLES_KEY = 'roles';
export const ROLES_STRICT_KEY = 'roles_strict';

/**
 * Roles decorator for specifying which user roles can access an endpoint
 * @param roles List of roles that are authorized to access the route
 * @param options Configuration options
 * @param options.strict If false, authentication is optional and route remains accessible to guests
 */
export const Roles = (
  roles: UserRoleEnum[] = [],
  options: { strict?: boolean } = { strict: true },
) => {
  return (
    target: any,
    propertyKey?: string,
    descriptor?: PropertyDescriptor,
  ) => {
    SetMetadata(ROLES_KEY, roles)(target, propertyKey, descriptor);
    SetMetadata(ROLES_STRICT_KEY, options.strict ?? true)(
      target,
      propertyKey,
      descriptor,
    );
  };
};
