import { SetMetadata, applyDecorators, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiHeader,
} from '@nestjs/swagger';

export const REQUIRE_TENANT_KEY = 'requireTenant';

/**
 * Decorator to mark a controller or route as requiring a valid tenant.
 * Adds Swagger documentation for the x-tenant-id header.
 *
 * Usage:
 * @RequireTenant()
 * @Controller('products')
 * export class ProductsController { }
 */
export const RequireTenant = () =>
  applyDecorators(
    SetMetadata(REQUIRE_TENANT_KEY, true),
    ApiHeader({
      name: 'x-tenant-id',
      description: 'ID of the active tenant (UUID)',
      required: true,
      schema: { type: 'string', format: 'uuid' },
    }),
    ApiBadRequestResponse({
      description: 'x-tenant-id header is missing or invalid',
    }),
    ApiForbiddenResponse({
      description: 'User does not have access to this tenant',
    }),
  );
