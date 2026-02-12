import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { IS_PUBLIC_KEY } from '../../modules/auth/decorators/index.js';

/**
 * Global guard that enforces role-based access control.
 *
 * Execution order in NestJS guard chain:
 *   ThrottlerGuard → JwtAuthGuard → TenantGuard → RolesGuard
 *
 * Logic:
 *   1. Skip for @Public() routes
 *   2. If no @Roles() decorator → allow (default open for reads)
 *   3. If @Roles() applied → check request.activeTenant.userRole against required roles
 *   4. If no tenant context → deny (role can't be determined)
 */
@Injectable()
export class RolesGuard implements CanActivate {
    private readonly logger = new Logger(RolesGuard.name);

    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        // Skip for public routes
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        // Get required roles from @Roles() decorator (method-level takes precedence over class-level)
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );

        // If no @Roles() decorator, endpoint is open to all authenticated users
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const activeTenant = request.activeTenant;

        // If no tenant context, can't determine role → deny
        if (!activeTenant?.userRole) {
            this.logger.warn(
                `Access denied: No tenant context for role-restricted endpoint`,
            );
            throw new ForbiddenException(
                'Se requiere contexto de tenant para acceder a este recurso',
            );
        }

        const userRole = activeTenant.userRole as UserRole;
        const hasRole = requiredRoles.includes(userRole);

        if (!hasRole) {
            this.logger.warn(
                `Access denied: User role ${userRole} not in required roles [${requiredRoles.join(', ')}]`,
            );
            throw new ForbiddenException(
                `Acceso denegado. Se requiere uno de los siguientes roles: ${requiredRoles.join(', ')}`,
            );
        }

        return true;
    }
}
