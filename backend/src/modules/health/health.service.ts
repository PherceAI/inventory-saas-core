import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/database/index.js';
import { HealthCheckResult } from './health.types.js';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthCheckResult> {
    const timestamp = new Date().toISOString();

    try {
      // Verify database connection with a real query
      const tenantCount = await this.prisma.tenant.count();

      this.logger.log(`Health check passed. Tenants in DB: ${tenantCount}`);

      return {
        status: 'ok',
        message: 'API Online',
        timestamp,
        database: {
          status: 'connected',
          tenantCount,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Health check failed: ${errorMessage}`);

      return {
        status: 'error',
        message: 'API Online - Database Error',
        timestamp,
        database: {
          status: 'disconnected',
          error: errorMessage,
        },
      };
    }
  }
}
