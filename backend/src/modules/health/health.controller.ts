import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service.js';
import { HealthCheckResult } from './health.types.js';
import { Public } from '../auth/decorators/index.js';

@ApiTags('Health')
@Public() // Health check should be publicly accessible
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Check API and database health' })
  @ApiResponse({
    status: 200,
    description: 'API and database are healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        message: { type: 'string', example: 'API Online' },
        timestamp: { type: 'string', example: '2026-01-27T19:30:00.000Z' },
        database: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'connected' },
            tenantCount: { type: 'number', example: 1 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Database connection failed',
  })
  async check(): Promise<HealthCheckResult> {
    return this.healthService.check();
  }
}
