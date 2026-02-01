import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Inventory Flow (E2E)', () => {
    jest.setTimeout(30000); // 30s timeout
    let app: INestApplication;
    let jwtToken: string;
    let tenantId: string;
    let supplierId: string;
    let purchaseOrderId: string;
    let productId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        // Mimic main.ts global pipes
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
                transformOptions: { enableImplicitConversion: true },
            }),
        );
        await app.init();

        // 1. Login to get JWT
        // Assuming 'admin@pherce.com' / 'password123' from seed or user provided context
        const loginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                email: 'admin@fazt-inventory.com',
                password: 'password123',
            })
            .expect(200);

        jwtToken = loginResponse.body.accessToken;
        // Decode JWT to get tenantId is messy without lib, but typically login returns user info
        // Wait, does login return user info with tenants? The auth controller usually does.
        // Let's assume we can fetch profile or lists.
        // Or we can just use the first tenant from a list tenants endpoint.
    });

    afterAll(async () => {
        await app.close();
    });

    it('should retrieve tenant ID', async () => {
        const response = await request(app.getHttpServer())
            .get('/tenants')
            .set('Authorization', `Bearer ${jwtToken}`)
            .expect(200);

        // Assuming at least one tenant exists from seed
        expect(response.body.length).toBeGreaterThan(0);
        tenantId = response.body[0].id;
    });

    it('should create a supplier', async () => {
        const response = await request(app.getHttpServer())
            .post('/suppliers')
            .set('Authorization', `Bearer ${jwtToken}`)
            .set('x-tenant-id', tenantId)
            .send({
                name: 'Test Supplier E2E',
                code: `SUP-${Date.now()}`,
                email: 'test@supplier.com',
                paymentTermDays: 30
            })
            .expect(201);

        supplierId = response.body.id;
        expect(supplierId).toBeDefined();
    });

    it('should get a product (or create one)', async () => {
        // First try to list products
        const listResponse = await request(app.getHttpServer())
            .get('/products')
            .set('Authorization', `Bearer ${jwtToken}`)
            .set('x-tenant-id', tenantId)
            .expect(200);

        if (listResponse.body.data && listResponse.body.data.length > 0) {
            productId = listResponse.body.data[0].id;
        } else {
            // Need category
            const catRes = await request(app.getHttpServer())
                .post('/categories')
                .set('Authorization', `Bearer ${jwtToken}`)
                .set('x-tenant-id', tenantId)
                .send({ name: 'E2E Cat' })
                .expect(201);

            // Create product
            const createResponse = await request(app.getHttpServer())
                .post('/products')
                .set('Authorization', `Bearer ${jwtToken}`)
                .set('x-tenant-id', tenantId)
                .send({
                    name: 'E2E Product',
                    sku: `SKU-${Date.now()}`,
                    categoryId: catRes.body.id,
                    stockMin: 10,
                    priceDefault: 100
                })
                .expect(201);
            productId = createResponse.body.id;
        }
        expect(productId).toBeDefined();
    });

    it('should create a purchase order', async () => {
        const response = await request(app.getHttpServer())
            .post('/purchase-orders')
            .set('Authorization', `Bearer ${jwtToken}`)
            .set('x-tenant-id', tenantId)
            .send({
                supplierId: supplierId,
                paymentTermDays: 30,
                notes: 'E2E Test Order'
            })
            .expect(201);

        purchaseOrderId = response.body.id;
    });

    it('should add item to purchase order', async () => {
        await request(app.getHttpServer())
            .post(`/purchase-orders/${purchaseOrderId}/items`)
            .set('Authorization', `Bearer ${jwtToken}`)
            .set('x-tenant-id', tenantId)
            .send({
                productId: productId,
                quantityOrdered: 10,
                unitPrice: 50,
                taxRate: 0.10 // 10% Tax
            })
            .expect(201);
    });

    it('should send the purchase order', async () => {
        await request(app.getHttpServer())
            .patch(`/purchase-orders/${purchaseOrderId}/send`)
            .set('Authorization', `Bearer ${jwtToken}`)
            .set('x-tenant-id', tenantId)
            .expect(200);
    });

    it('should receive goods and validate account payable with tax', async () => {
        // Need a warehouse first
        const whRes = await request(app.getHttpServer())
            .get('/warehouses')
            .set('Authorization', `Bearer ${jwtToken}`)
            .set('x-tenant-id', tenantId)
            .expect(200);

        let warehouseId = whRes.body[0]?.id;
        if (!warehouseId) {
            const newWh = await request(app.getHttpServer())
                .post('/warehouses')
                .set('Authorization', `Bearer ${jwtToken}`)
                .set('x-tenant-id', tenantId)
                .send({ name: 'E2E Warehouse', code: 'WH-E2E' })
                .expect(201);
            warehouseId = newWh.body.id;
        }

        const response = await request(app.getHttpServer())
            .post(`/purchase-orders/${purchaseOrderId}/receive`)
            .set('Authorization', `Bearer ${jwtToken}`)
            .set('x-tenant-id', tenantId)
            .send({
                warehouseId: warehouseId,
                items: [
                    {
                        productId: productId,
                        quantityReceived: 10,
                        unitCost: 50 // Same as order
                    }
                ],
                invoiceNumber: 'INV-123'
            })
            .expect(201);

        const payable = response.body.payable;
        expect(payable).toBeDefined();

        // Validate Math:
        // Qty: 10
        // Unit Cost: 50
        // Subtotal: 500
        // Tax Rate: 10% (0.10)
        // Tax: 50
        // Expected Total: 550

        // Response might be string or number based on NestJS serialization of Decimal
        const totalAmount = parseFloat(payable.totalAmount);
        expect(totalAmount).toBe(550);
    });
});
