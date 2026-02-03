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

  constructor(private readonly prisma: PrismaService) { }

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
  /**
   * Get all users for a specific tenant
   */
  async getTenantUsers(tenantId: string) {
    const tenantUsers = await this.prisma.tenantUser.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            lastLoginAt: true,
          },
        },
      },
      orderBy: {
        user: { firstName: 'asc' },
      },
    });

    return tenantUsers.map((tu) => ({
      userId: tu.userId,
      email: tu.user.email,
      firstName: tu.user.firstName,
      lastName: tu.user.lastName,
      role: tu.role,
      lastLoginAt: tu.user.lastLoginAt,
      joinedAt: tu.createdAt,
    }));
  }

  /**
   * Invite/Add a user to a tenant
   */
  async inviteUser(
    tenantId: string,
    dto: {
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      password?: string;
    },
  ) {
    // 1. Check if user already exists globally
    let user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // 2. If user doesn't exist, create them
    if (!user) {
      if (!dto.password) {
        throw new Error('Password is required for new users');
      }

      // Hack: Import bcrypt dynamically or move to utility to avoid circ dep with AuthService if it was used
      // For now we trust bcrypt is installed as seen in package.json
      const bcrypt = await import('bcrypt');
      const passwordHash = await bcrypt.hash(dto.password, 10);

      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          passwordHash,
          isActive: true,
        },
      });
    }

    // 3. Check if relationship already exists
    const existingRelation = await this.prisma.tenantUser.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId: user.id,
        },
      },
    });

    if (existingRelation) {
      if (!existingRelation.isActive) {
        // Reactivate
        return this.prisma.tenantUser.update({
          where: { id: existingRelation.id },
          data: {
            isActive: true,
            role: dto.role as any, // Cast to enum
          },
        });
      }
      throw new Error('User is already a member of this tenant');
    }

    // 4. Create relationship
    return this.prisma.tenantUser.create({
      data: {
        tenantId,
        userId: user.id,
        role: dto.role as any,
        isActive: true,
      },
    });
  }

  /**
   * Remove user from tenant (soft delete relationship)
   */
  async removeUser(tenantId: string, userId: string) {
    // Prevention: Cannot remove yourself (should be checked in controller, but safe here too)
    // Actually, we don't have current user context here easily without passing it.
    // We will assume controller checks "Don't delete yourself" or we allow "Leave tenant".

    // Check if user is owner of the tenant? 
    // Ideally we shouldn't allow removing the last owner.

    return this.prisma.tenantUser.update({
      where: {
        tenantId_userId: {
          tenantId,
          userId,
        },
      },
      data: {
        isActive: false,
      },
    });
  }
}
