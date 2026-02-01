import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';

export interface ActiveTenantData {
  tenantId: string;
  tenantName: string;
  userRole: string;
}

/**
 * Decorator to extract the active tenant from the request.
 * The tenant is validated by TenantGuard and attached to request.activeTenant
 *
 * @throws BadRequestException if tenant header is missing and route requires tenant
 *
 * Usage:
 * @Get()
 * findAll(@ActiveTenant() tenant: ActiveTenantData) {
 *   return this.service.findAll(tenant.tenantId);
 * }
 */
export const ActiveTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ActiveTenantData => {
    const request = ctx.switchToHttp().getRequest();
    const tenant = request.activeTenant;

    if (!tenant) {
      throw new BadRequestException(
        'x-tenant-id header is required for this endpoint',
      );
    }

    return tenant;
  },
);
