import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './common/database/index.js';
import { HealthModule } from './modules/health/index.js';
import { AuthModule, JwtAuthGuard } from './modules/auth/index.js';
import { TenantsModule } from './modules/tenants/index.js';
import { ProductsModule } from './modules/products/index.js';
import { SuppliersModule } from './modules/suppliers/index.js';
import { WarehousesModule } from './modules/warehouses/index.js';
import { CategoriesModule } from './modules/categories/index.js';
import { InventoryModule } from './modules/inventory/index.js';
import { PurchaseOrdersModule } from './modules/purchase-orders/index.js';
import { AccountsPayableModule } from './modules/accounts-payable/index.js';
import { FamiliesModule } from './modules/families/index.js';
import { AuditsModule } from './modules/audits/index.js';
import { DashboardModule } from './modules/dashboard/index.js';
import { TenantGuard } from './common/guards/index.js';

@Module({
  imports: [
    // Load .env from parent directory (where prisma schema is)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),

    // Database (Prisma) - Global module
    DatabaseModule,

    // Authentication
    AuthModule,

    // Feature modules
    HealthModule,
    TenantsModule,
    ProductsModule,
    SuppliersModule,
    WarehousesModule,
    CategoriesModule,
    InventoryModule,
    PurchaseOrdersModule,
    AccountsPayableModule,
    FamiliesModule,
    AuditsModule,
    DashboardModule,
  ],
  controllers: [],
  providers: [
    // Global JWT guard - all routes protected by default
    // Use @Public() decorator to make routes public
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global Tenant guard - validates x-tenant-id header
    // Attaches tenant info to request.activeTenant
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
  ],
})
export class AppModule { }
