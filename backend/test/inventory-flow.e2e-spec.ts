import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/common/database/prisma.service';

describe('Inventory Flow (E2E)', () => {
    jest.setTimeout(60000); // 60s timeout
    let app: INestApplication;
    let jwtToken: string;
    let tenantId: string;
    let supplierId: string;
    let purchaseOrderId: string;
    let productId: string;

    beforeAll(async () => {
        console.log('➡️ [E2E] Starting beforeAll...');
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
                transformOptions: { enableImplicitConversion: true },
            }),
        );
        console.log('➡️ [E2E] Initializing app...');
        await app.init();
        console.log('✅ [E2E] App initialized.');

        // 1. Login to get JWT
        console.log('➡️ [E2E] Logging in...');
        const loginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                email: 'admin@fazt-inventory.com',
                password: 'password123',
            });

        if (loginResponse.status !== 200) {
            console.error('❌ [E2E] Login Failed:', loginResponse.body);
            throw new Error('Login failed');
        }

        jwtToken = loginResponse.body.accessToken;
        console.log('✅ [E2E] Login success.');
    });

    afterAll(async () => {
        console.log('🛑 [E2E] Starting afterAll tear down...');
        try {
            const prisma = app.get(PrismaService);
            console.log('🛑 [E2E] Disconnecting Prisma...');
            await prisma.$disconnect();
            console.log('✅ [E2E] Prisma disconnected.');
        } catch (e) {
            console.warn('⚠️ [E2E] Prisma disconnect failed or not found:', e);
        }
        console.log('🛑 [E2E] Closing App...');
        await app.close();
        console.log('✅ [E2E] App closed.');
    });

    it('should retrieve tenant ID', async () => {
        console.log('🧪 [Test] 1. Get Tenants');
        const response = await request(app.getHttpServer())
            .get('/tenants')
            .set('Authorization', `Bearer ${jwtToken}`)
            .expect(200);

        expect(response.body.length).toBeGreaterThan(0);
        tenantId = response.body[0].id;
        console.log(`✅ [Test] Tenant Found: ${tenantId}`);
    });

    it('should create a supplier', async () => {
        console.log('🧪 [Test] 2. Create Supplier');
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
        console.log(`✅ [Test] Supplier Created: ${supplierId}`);
    });

    it('should get a product (or create one)', async () => {
        console.log('🧪 [Test] 3. Get/Create Product');
        const listResponse = await request(app.getHttpServer())
            .get('/products')
            .set('Authorization', `Bearer ${jwtToken}`)
            .set('x-tenant-id', tenantId)
            .expect(200);

        if (listResponse.body.data && listResponse.body.data.length > 0) {
            productId = listResponse.body.data[0].id;
            console.log(`✅ [Test] Existing Product Found: ${productId}`);
        } else {
            console.log('➡️ [Test] Creating Category...');
            const catRes = await request(app.getHttpServer())
                .post('/categories')
                .set('Authorization', `Bearer ${jwtToken}`)
                .set('x-tenant-id', tenantId)
                .send({ name: 'E2E Cat' })
                .expect(201);

            console.log('➡️ [Test] Creating Product...');
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
            console.log(`✅ [Test] Product Created: ${productId}`);
        }
    });

    it('should create a purchase order', async () => {
        console.log('🧪 [Test] 4. Create Purchase Order');
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
        console.log(`✅ [Test] PO Created: ${purchaseOrderId}`);
    });

    it('should add item to purchase order', async () => {
        console.log('🧪 [Test] 5. Add Item to PO');
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
        console.log('✅ [Test] Item Added');
    });

    it('should send the purchase order', async () => {
        console.log('🧪 [Test] 6. Send PO');
        await request(app.getHttpServer())
            .patch(`/purchase-orders/${purchaseOrderId}/send`)
            .set('Authorization', `Bearer ${jwtToken}`)
            .set('x-tenant-id', tenantId)
            .expect(200);
        console.log('✅ [Test] PO Sent');
    });

    it('should receive goods and validate account payable with tax', async () => {
        console.log('🧪 [Test] 7. Receive Goods');
        const whRes = await request(app.getHttpServer())
            .get('/warehouses')
            .set('Authorization', `Bearer ${jwtToken}`)
            .set('x-tenant-id', tenantId)
            .expect(200);

        let warehouseId = whRes.body[0]?.id;
        if (!warehouseId) {
            console.log('➡️ [Test] Creating Warehouse...');
            const newWh = await request(app.getHttpServer())
                .post('/warehouses')
                .set('Authorization', `Bearer ${jwtToken}`)
                .set('x-tenant-id', tenantId)
                .send({ name: 'E2E Warehouse', code: 'WH-E2E' })
                .expect(201);
            warehouseId = newWh.body.id;
        }

        console.log('➡️ [Test] Receiving...');
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
                        unitCost: 50
                    }
                ],
                invoiceNumber: 'INV-123'
            })
            .expect(201);

        const payable = response.body.payable;
        const totalAmount = parseFloat(payable.totalAmount);
        expect(totalAmount).toBe(550);
        console.log(`✅ [Test] Receiving Complete. Payable: ${totalAmount}`);
    });
});
