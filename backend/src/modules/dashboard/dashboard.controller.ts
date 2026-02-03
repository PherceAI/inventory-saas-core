import { Controller, Get } from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { DashboardService, DashboardStats } from './dashboard.service.js';
import { ActiveTenant, RequireTenant } from '../../common/decorators/index.js';
import type { ActiveTenantData } from '../../common/decorators/index.js';

@ApiTags('Dashboard')
@ApiBearerAuth()
@RequireTenant()
@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('stats')
    @ApiOperation({
        summary: 'Get dashboard statistics',
        description:
            'Returns aggregated statistics for the active tenant including products, suppliers, orders, and inventory value.',
    })
    @ApiResponse({
        status: 200,
        description: 'Dashboard statistics',
        schema: {
            type: 'object',
            properties: {
                products: {
                    type: 'object',
                    properties: {
                        total: { type: 'number', example: 0 },
                        lowStock: { type: 'number', example: 0 },
                        outOfStock: { type: 'number', example: 0 },
                    },
                },
                suppliers: {
                    type: 'object',
                    properties: {
                        total: { type: 'number', example: 0 },
                        active: { type: 'number', example: 0 },
                    },
                },
                purchaseOrders: {
                    type: 'object',
                    properties: {
                        total: { type: 'number', example: 0 },
                        pending: { type: 'number', example: 0 },
                        received: { type: 'number', example: 0 },
                    },
                },
                inventory: {
                    type: 'object',
                    properties: {
                        totalValue: { type: 'number', example: 0 },
                        totalItems: { type: 'number', example: 0 },
                        movements: { type: 'number', example: 0 },
                    },
                },
                warehouses: {
                    type: 'object',
                    properties: {
                        total: { type: 'number', example: 1 },
                    },
                },
                recentActivity: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            type: { type: 'string', enum: ['movement', 'order', 'product'] },
                            description: { type: 'string' },
                            amount: { type: 'number' },
                            createdAt: { type: 'string', format: 'date-time' },
                        },
                    },
                },
            },
        },
    })
    async getStats(
        @ActiveTenant() tenant: ActiveTenantData,
    ): Promise<DashboardStats> {
        return this.dashboardService.getStats(tenant.tenantId);
    }
}
