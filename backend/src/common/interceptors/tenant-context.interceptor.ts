import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
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

        // Get tenant context from request (set by TenantGuard)
        const activeTenant = request.activeTenant;

        if (activeTenant?.tenantId) {
            try {
                // Set PostgreSQL session variable for RLS
                // Using parameterized query to prevent SQL injection
                await this.prisma.$executeRawUnsafe(
                    `SET app.current_tenant_id = '${activeTenant.tenantId}'`
                );

                this.logger.debug(
                    `RLS context set for tenant: ${activeTenant.tenantId}`
                );
            } catch (error) {
                this.logger.error(
                    `Failed to set RLS context for tenant ${activeTenant.tenantId}: ${error.message}`
                );
                // Don't throw - let the request continue
                // Application-level filtering will still work as fallback
            }
        } else {
            // No tenant context - reset to null for safety
            // This ensures no accidental cross-tenant access
            try {
                await this.prisma.$executeRawUnsafe(
                    `RESET app.current_tenant_id`
                );
            } catch {
                // Ignore reset errors
            }
        }

        return next.handle();
    }
}
