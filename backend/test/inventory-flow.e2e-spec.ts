import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/common/database/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

describe('Inventory Critical Flow (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let tenantId: string;
  let supplierId: string;
  let productId: string;
  let warehouseId: string;
  let purchaseOrderId: string;
  let itemId: string;

  const adminEmail = 'admin@pherce.com';
  const adminPassword = 'password123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Enable global validation pipe as in main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();
    prisma = app.get(PrismaService);

    // 1. Login
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(200);

    accessToken = loginResponse.body.accessToken;
    const userId = loginResponse.body.user.id;

    // 2. Get Tenant ID from DB
    const tenantUser = await prisma.tenantUser.findFirst({
      where: { userId },
    });

    if (!tenantUser) {
      throw new Error('Admin user has no tenant assigned');
    }
    tenantId = tenantUser.tenantId;
    console.log(`Using Tenant ID: ${tenantId}`);
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. Should create a Supplier', async () => {
    const dto = {
      name: `Test Supplier ${Date.now()}`,
      taxId: `TAX-${Date.now()}`,
      email: `supplier-${Date.now()}@test.com`,
    };

    const response = await request(app.getHttpServer())
      .post('/suppliers')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-tenant-id', tenantId)
      .send(dto)
      .expect(201);

    supplierId = response.body.id;
    expect(supplierId).toBeDefined();
  });

  it('2. Should get or create a Product and Warehouse', async () => {
    // Get Warehouse
    const warehouses = await request(app.getHttpServer())
      .get('/warehouses')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-tenant-id', tenantId)
      .expect(200);

    if (warehouses.body.data && warehouses.body.data.length > 0) {
      warehouseId = warehouses.body.data[0].id;
    } else {
        // Create one if none exists (fallback)
        const whDto = { name: 'Test Warehouse' };
        const whRes = await request(app.getHttpServer())
            .post('/warehouses')
            .set('Authorization', `Bearer ${accessToken}`)
            .set('x-tenant-id', tenantId)
            .send(whDto)
            .expect(201);
        warehouseId = whRes.body.id;
    }
    expect(warehouseId).toBeDefined();

    // Get Product
    const products = await request(app.getHttpServer())
      .get('/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-tenant-id', tenantId)
      .expect(200);

    if (products.body.data && products.body.data.length > 0) {
      productId = products.body.data[0].id;
    } else {
        // Fallback: If no products, we can't easily create one without category.
        // Assuming seed has products. If this fails, we need to inspect seed.
        throw new Error('No products found in seed. Cannot proceed with test.');
    }
    expect(productId).toBeDefined();
  });

  it('3. Should create a Purchase Order', async () => {
    const dto = {
      supplierId,
      notes: 'E2E Test Order',
    };

    const response = await request(app.getHttpServer())
      .post('/purchase-orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-tenant-id', tenantId)
      .send(dto)
      .expect(201);

    purchaseOrderId = response.body.id;
    expect(purchaseOrderId).toBeDefined();
    expect(response.body.status).toBe('DRAFT');
  });

  it('4. Should add an item with Tax', async () => {
    const dto = {
      productId,
      quantityOrdered: 10,
      unitPrice: 100, // $100
      taxRate: 0.15, // 15% Tax
      notes: 'Item with tax',
    };

    // Expected: 10 * 100 = 1000 Subtotal. 1000 * 0.15 = 150 Tax. Total = 1150.

    const response = await request(app.getHttpServer())
      .post(`/purchase-orders/${purchaseOrderId}/items`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-tenant-id', tenantId)
      .send(dto)
      .expect(201);

    itemId = response.body.id;
    expect(itemId).toBeDefined();
  });

  it('5. Should send the Purchase Order', async () => {
    const response = await request(app.getHttpServer())
      .post(`/purchase-orders/${purchaseOrderId}/send`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-tenant-id', tenantId)
      .expect(200);

    expect(response.body.status).toBe('ORDERED');
  });

  it('6. Should receive goods and verify Account Payable Amount (Critical Check)', async () => {
    const dto = {
      warehouseId,
      items: [
        {
          productId,
          quantityReceived: 10,
          unitCost: 100, // Matches unit price
        },
      ],
      invoiceNumber: `INV-${Date.now()}`,
    };

    const response = await request(app.getHttpServer())
      .post(`/purchase-orders/${purchaseOrderId}/receive`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-tenant-id', tenantId)
      .send(dto)
      .expect(200);

    const payable = response.body.payable;
    expect(payable).toBeDefined();

    // Validation Logic
    // Subtotal = 10 * 100 = 1000
    // Tax = 1000 * 0.15 = 150
    // Total = 1150

    const totalAmount = new Decimal(payable.totalAmount).toNumber();
    expect(totalAmount).toBe(1150);

    console.log('Account Payable Total Amount Verified:', totalAmount);
  });
});
