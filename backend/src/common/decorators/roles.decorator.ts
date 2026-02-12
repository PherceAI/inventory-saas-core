import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Decorator to restrict endpoint access to specific roles.
 * When applied, only users with one of the specified roles can access the endpoint.
 * If not applied, all authenticated users with a valid tenant can access.
 *
 * Usage:
 *   @Roles(UserRole.OWNER, UserRole.ADMIN)
 *   @Post('create')
 *   create() { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
