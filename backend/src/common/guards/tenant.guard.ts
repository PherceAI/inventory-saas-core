import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../database/index.js';
import { IS_PUBLIC_KEY } from '../../modules/auth/decorators/index.js';
import { REQUIRE_TENANT_KEY } from '../decorators/require-tenant.decorator.js';

export const TENANT_HEADER = 'x-tenant-id';

@Injectable()
export class TenantGuard implements CanActivate {
  private readonly logger = new Logger(TenantGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip tenant validation for public routes
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const tenantId = request.headers[TENANT_HEADER];
    const user = request.user;

    // If no tenant header, check if route requires it
    if (!tenantId) {
      const requireTenant = this.reflector.getAllAndOverride<boolean>(
        REQUIRE_TENANT_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (requireTenant) {
        throw new BadRequestException(
          'x-tenant-id header is required for this endpoint',
        );
      }

      return true;
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      throw new BadRequestException('Invalid tenant ID format');
    }

    // User must be authenticated to access tenant resources
    if (!user || !user.userId) {
      throw new ForbiddenException('Authentication required to access tenant');
    }

    // Verify user belongs to this tenant
    const tenantUser = await this.prisma.tenantUser.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId: user.userId,
        },
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    if (!tenantUser) {
      this.logger.warn(
        `User ${user.email} attempted to access tenant ${tenantId} without permission`,
      );
      throw new ForbiddenException('You do not have access to this tenant');
    }

    if (!tenantUser.isActive) {
      throw new ForbiddenException(
        'Your access to this tenant has been disabled',
      );
    }

    if (!tenantUser.tenant.isActive) {
      throw new ForbiddenException('This tenant is currently inactive');
    }

    // Attach tenant info to request for use in controllers
    request.activeTenant = {
      tenantId: tenantUser.tenant.id,
      tenantName: tenantUser.tenant.name,
      userRole: tenantUser.role,
    };

    this.logger.debug(
      `User ${user.email} accessing tenant ${tenantUser.tenant.name}`,
    );
    return true;
  }
}
