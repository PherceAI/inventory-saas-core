/**
 * Result of the health check endpoint
 */
export interface HealthCheckResult {
  status: 'ok' | 'error';
  message: string;
  timestamp: string;
  database: {
    status: 'connected' | 'disconnected';
    tenantCount?: number;
    error?: string;
  };
}
