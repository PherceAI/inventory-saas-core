import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Patch,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TenantsService, UserTenant } from './tenants.service.js';
import { InviteUserDto } from './dto/users.dto.js';
import { UpdateTenantSettingsDto } from './dto/update-settings.dto.js';
import { CurrentUser } from '../auth/decorators/index.js';

interface JwtUser {
  userId: string;
  email: string;
}

@ApiTags('Tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) { }

  @Get('my-tenants')
  @ApiOperation({
    summary: 'Get user tenants',
    description:
      'Returns all tenants the authenticated user has access to. Used for tenant selector.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of tenants',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Hotel Demo' },
          slug: { type: 'string', example: 'hotel-demo' },
          businessType: { type: 'string', example: 'HOTEL' },
          role: { type: 'string', example: 'ADMIN' },
          isDefault: { type: 'boolean' },
        },
      },
    },
  })
  async getMyTenants(@CurrentUser() user: JwtUser): Promise<UserTenant[]> {
    return this.tenantsService.getUserTenants(user.userId);
  }

  @Get(':tenantId')
  @ApiOperation({ summary: 'Get tenant details' })
  @ApiResponse({ status: 200, description: 'Tenant details' })
  async getTenant(
    @CurrentUser() user: JwtUser,
    @Param('tenantId') tenantId: string,
  ) {
    const membership = await this.tenantsService.getTenantForUser(
      tenantId,
      user.userId,
    );
    if (!membership) throw new ForbiddenException('Access denied');
    return membership;
  }

  @Get(':tenantId/users')
  @ApiOperation({ summary: 'Get all users in a tenant' })
  @ApiResponse({ status: 200, description: 'List of tenant users' })
  async getTenantUsers(
    @CurrentUser() user: JwtUser,
    @Param('tenantId') tenantId: string,
  ) {
    // Auth check
    const membership = await this.tenantsService.getTenantForUser(
      tenantId,
      user.userId,
    );
    if (!membership) throw new ForbiddenException('Access denied to this tenant');

    return this.tenantsService.getTenantUsers(tenantId);
  }

  @Post(':tenantId/users')
  @ApiOperation({ summary: 'Invite/Add user to tenant' })
  @ApiResponse({ status: 201, description: 'User added successfully' })
  async inviteUser(
    @CurrentUser() user: JwtUser,
    @Param('tenantId') tenantId: string,
    @Body() dto: InviteUserDto,
  ) {
    // Auth check (Admin/Owner only)
    const membership = await this.tenantsService.getTenantForUser(
      tenantId,
      user.userId,
    );
    if (
      !membership ||
      !['OWNER', 'ADMIN'].includes(membership.userRole as string)
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.tenantsService.inviteUser(tenantId, dto);
  }

  @Delete(':tenantId/users/:userId')
  @ApiOperation({ summary: 'Remove user from tenant' })
  @ApiResponse({ status: 200, description: 'User removed successfully' })
  async removeUser(
    @CurrentUser() user: JwtUser,
    @Param('tenantId') tenantId: string,
    @Param('userId') targetUserId: string,
  ) {
    // Auth check (Admin/Owner only)
    const membership = await this.tenantsService.getTenantForUser(
      tenantId,
      user.userId,
    );
    if (
      !membership ||
      !['OWNER', 'ADMIN'].includes(membership.userRole as string)
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (user.userId === targetUserId) {
      throw new BadRequestException('Cannot remove yourself');
    }

    return this.tenantsService.removeUser(tenantId, targetUserId);
  }

  @Patch(':tenantId/settings')
  @ApiOperation({ summary: 'Update tenant profile & settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  async updateSettings(
    @CurrentUser() user: JwtUser,
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateTenantSettingsDto,
  ) {
    // Auth check (Admin/Owner only)
    const membership = await this.tenantsService.getTenantForUser(
      tenantId,
      user.userId,
    );
    if (
      !membership ||
      !['OWNER', 'ADMIN'].includes(membership.userRole as string)
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.tenantsService.updateSettings(tenantId, dto);
  }
}
