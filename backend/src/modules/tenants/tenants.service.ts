import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/database/index.js';

export interface UserTenant {
  id: string;
  name: string;
  slug: string;
  businessType: string;
  role: string;
}

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all tenants the user has access to
   * Used for the tenant selector in the frontend
   */
  async getUserTenants(userId: string): Promise<UserTenant[]> {
    const tenantUsers = await this.prisma.tenantUser.findMany({
      where: {
        userId,
        isActive: true,
        tenant: {
          isActive: true,
        },
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            businessType: true,
          },
        },
      },
      orderBy: {
        tenant: { name: 'asc' },
      },
    });

    this.logger.debug(
      `User ${userId} has access to ${tenantUsers.length} tenants`,
    );

    return tenantUsers.map((tu) => ({
      id: tu.tenant.id,
      name: tu.tenant.name,
      slug: tu.tenant.slug,
      businessType: tu.tenant.businessType,
      role: tu.role,
    }));
  }

  /**
   * Get a specific tenant by ID (if user has access)
   */
  async getTenantForUser(tenantId: string, userId: string) {
    const tenantUser = await this.prisma.tenantUser.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId,
        },
      },
      include: {
        tenant: true,
      },
    });

    if (!tenantUser || !tenantUser.isActive || !tenantUser.tenant.isActive) {
      return null;
    }

    return {
      ...tenantUser.tenant,
      userRole: tenantUser.role,
    };
  }
}
