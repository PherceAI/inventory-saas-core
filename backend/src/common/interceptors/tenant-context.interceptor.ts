import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';

/**
 * Interceptor that sets the PostgreSQL session variable for RLS
 *
 * This interceptor runs BEFORE each request handler and sets the
 * `app.current_tenant_id` PostgreSQL session variable based on the
 * tenant context established by TenantGuard.
 *
 * This enables Row-Level Security (RLS) policies to automatically
 * filter queries by tenant_id at the database level.
 *
 * SECURITY: Uses parameterized queries to prevent SQL injection.
 * SECURITY: Fails closed — if RLS context cannot be set, the request is rejected.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
    private readonly logger = new Logger(TenantContextInterceptor.name);

    constructor(private readonly prisma: PrismaService) { }

    async intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();
        const activeTenant = request.activeTenant;

        if (activeTenant?.tenantId) {
            try {
                // SECURITY: Use parameterized query — never interpolate user input
                await this.prisma.$executeRaw`SELECT set_config('app.current_tenant_id', ${activeTenant.tenantId}, true)`;

                this.logger.debug(
                    `RLS context set for tenant: ${activeTenant.tenantId}`
                );
            } catch (error) {
                this.logger.error(
                    `Failed to set RLS context for tenant ${activeTenant.tenantId}: ${error.message}`
                );
                // SECURITY: Fail closed — reject the request if RLS cannot be established
                throw new ForbiddenException(
                    'No se pudo establecer el contexto de seguridad del tenant. Intente de nuevo.'
                );
            }
        } else {
            // No tenant context — reset for safety to prevent cross-tenant leakage
            try {
                await this.prisma.$executeRaw`SELECT set_config('app.current_tenant_id', '', true)`;
            } catch {
                // Reset failure is non-critical since no tenant context means
                // the request won't access tenant-scoped data
            }
        }

        return next.handle();
    }
}
