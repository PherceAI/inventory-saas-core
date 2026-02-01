import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TenantsService, UserTenant } from './tenants.service.js';
import { CurrentUser } from '../auth/decorators/index.js';

interface JwtUser {
  userId: string;
  email: string;
}

@ApiTags('Tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

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
}
