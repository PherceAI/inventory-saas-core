/**
 * E2E Test: Purchase Order Flow
 * 
 * This script tests the complete purchase order workflow:
 * 1. Create a purchase order (DRAFT)
 * 2. Add items to the order
 * 3. Send the order (ORDERED)
 * 4. Receive goods (creates Batches + AccountPayable)
 * 5. Register partial payment
 * 6. Verify all entities were created correctly
 * 
 * Run with: npx tsx scripts/test-purchase-flow.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test configuration
const TEST_TENANT_ID = process.env.TEST_TENANT_ID || '';
const TEST_USER_ID = process.env.TEST_USER_ID || '';

interface TestContext {
    tenantId: string;
    userId: string;
    supplierId: string;
    warehouseId: string;
    productIds: string[];
}

async function getTestContext(): Promise<TestContext> {
    // 1. Get or Create Tenant
    let tenant = TEST_TENANT_ID
        ? await prisma.tenant.findUnique({ where: { id: TEST_TENANT_ID } })
        : await prisma.tenant.findFirst();

    if (!tenant) {
        console.log('   ⚠️ No tenant found, creating one...');
        tenant = await prisma.tenant.create({
            data: {
                name: 'E2E Test Tenant',
                slug: `test-tenant-${Date.now()}`,
                businessType: 'RETAIL',
            }
        });
    }

    // 2. Get or Create User
    let tenantUser = await prisma.tenantUser.findFirst({
        where: { tenantId: tenant.id },
        include: { user: true },
    });

    let user;
    if (!tenantUser) {
        console.log('   ⚠️ No user found, creating one...');
        user = await prisma.user.create({
            data: {
                email: `test-${Date.now()}@example.com`,
                passwordHash: 'placeholder_hash',
                firstName: 'Test',
                lastName: 'User',
                isActive: true,
                tenants: {
                    create: { tenantId: tenant.id, role: 'ADMIN' }
                }
            }
        });
    } else {
        user = tenantUser.user;
    }

    // 3. Get or Create Supplier
    let supplier = await prisma.supplier.findFirst({
        where: { tenantId: tenant.id },
    });

    if (!supplier) {
        console.log('   ⚠️ No supplier found, creating one...');
        supplier = await prisma.supplier.create({
            data: {
                tenantId: tenant.id,
                name: 'Test Supplier Inc.',
                code: `SUP-${Date.now()}`,
                email: 'supplier@test.com',
                taxId: `TAX-${Date.now()}`,
                paymentTermDays: 30,
            }
        });
    }

    // 4. Get or Create Warehouse
    const warehouseCode = 'WH-TEST';
    let warehouse = await prisma.warehouse.findFirst({
        where: { tenantId: tenant.id },
    });

    if (!warehouse) {
        console.log('   ⚠️ No warehouse found, creating one...');
        warehouse = await prisma.warehouse.create({
            data: {
                tenantId: tenant.id,
                name: 'Test Warehouse',
                code: `WH-${Date.now()}`,
                isDefault: true,
            }
        });
    }

    // 5. Get or Create Products
    let products = await prisma.product.findMany({
        where: { tenantId: tenant.id },
        take: 2,
    });

    if (products.length < 2) {
        console.log('   ⚠️ Not enough products, creating...');
        // Need category first
        let category = await prisma.category.findFirst({ where: { tenantId: tenant.id } });
        if (!category) {
            category = await prisma.category.create({
                data: { tenantId: tenant.id, name: 'Test Category' }
            });
        }

        const productsNeeded = 2 - products.length;
        for (let i = 0; i < productsNeeded; i++) {
            const p = await prisma.product.create({
                data: {
                    tenantId: tenant.id,
                    categoryId: category.id,
                    name: `Test Product ${Date.now()}-${i}`,
                    sku: `SKU-${Date.now()}-${i}`,
                    description: 'Auto-generated for test',
                    stockMin: 10,
                }
            });
            products.push(p);
        }

        // Refresh products list
        products = await prisma.product.findMany({
            where: { tenantId: tenant.id },
            take: 2,
        });
    }

    return {
        tenantId: tenant.id,
        userId: user.id,
        supplierId: supplier.id,
        warehouseId: warehouse.id,
        productIds: products.map((p) => p.id),
    };
}

async function createPurchaseOrder(ctx: TestContext) {
    console.log('\n📝 Step 1: Creating Purchase Order (DRAFT)...');

    const orderNumber = `PO-TEST-${Date.now()}`;

    const order = await prisma.purchaseOrder.create({
        data: {
            tenantId: ctx.tenantId,
            supplierId: ctx.supplierId,
            orderNumber,
            status: 'DRAFT',
            paymentTermDays: 30,
            currency: 'USD',
            notes: 'E2E Test Order',
        },
    });

    console.log(`   ✅ Created order: ${order.orderNumber} (ID: ${order.id})`);
    return order;
}

async function addItemsToOrder(ctx: TestContext, orderId: string) {
    console.log('\n📦 Step 2: Adding items to order...');

    const items: any[] = [];

    for (let i = 0; i < ctx.productIds.length; i++) {
        const item = await prisma.purchaseOrderItem.create({
            data: {
                orderId,
                productId: ctx.productIds[i],
                quantityOrdered: 100 + i * 50, // 100, 150
                unitPrice: 10.00 + i * 5, // 10, 15
                discount: 0,
                taxRate: 0.12, // 12% tax
                total: (100 + i * 50) * (10.00 + i * 5) * 1.12,
            },
        });
        items.push(item);
        console.log(`   ✅ Added item ${i + 1}: Product ${ctx.productIds[i].slice(0, 8)}... qty: ${item.quantityOrdered}`);
    }

    // Recalculate order totals
    const subtotal = items.reduce((sum, item) => sum + (Number(item.quantityOrdered) * Number(item.unitPrice)), 0);
    const taxAmount = subtotal * 0.12;
    const total = subtotal + taxAmount;

    await prisma.purchaseOrder.update({
        where: { id: orderId },
        data: { subtotal, taxAmount, total },
    });

    console.log(`   📊 Order total: $${total.toFixed(2)}`);
    return items;
}

async function sendOrder(orderId: string) {
    console.log('\n📤 Step 3: Sending order to supplier (ORDERED)...');

    const order = await prisma.purchaseOrder.update({
        where: { id: orderId },
        data: {
            status: 'ORDERED',
            orderedAt: new Date(),
        },
    });

    console.log(`   ✅ Order status changed to: ${order.status}`);
    return order;
}

async function receiveGoods(ctx: TestContext, orderId: string, items: any[]) {
    console.log('\n📥 Step 4: Receiving goods (creates Batches + AccountPayable)...');

    const batches: any[] = [];
    const movements: any[] = [];
    let totalAmount = 0;

    // Receive all items
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const quantityReceived = Number(item.quantityOrdered);
        const unitCost = Number(item.unitPrice) * 0.95; // Actual cost 5% less than quoted
        const batchNumber = `BATCH-TEST-${Date.now()}-${i}`;

        // Create batch
        const batch = await prisma.batch.create({
            data: {
                tenantId: ctx.tenantId,
                productId: item.productId,
                warehouseId: ctx.warehouseId,
                supplierId: ctx.supplierId,
                batchNumber,
                quantityInitial: quantityReceived,
                quantityCurrent: quantityReceived,
                unitCost,
                receivedAt: new Date(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            },
        });
        batches.push(batch);

        // Create inventory movement
        const movement = await prisma.inventoryMovement.create({
            data: {
                tenantId: ctx.tenantId,
                productId: item.productId,
                batchId: batch.id,
                type: 'IN',
                quantity: quantityReceived,
                stockBefore: 0,
                stockAfter: quantityReceived,
                warehouseDestinationId: ctx.warehouseId,
                unitCost,
                totalCost: quantityReceived * unitCost,
                referenceType: 'PURCHASE_ORDER',
                referenceId: orderId,
                performedById: ctx.userId,
                notes: 'E2E Test Receipt',
            },
        });
        movements.push(movement);

        // Update order item
        await prisma.purchaseOrderItem.update({
            where: { id: item.id },
            data: { quantityReceived },
        });

        totalAmount += quantityReceived * unitCost;
        console.log(`   ✅ Created batch: ${batchNumber} (qty: ${quantityReceived}, cost: $${unitCost.toFixed(2)})`);
    }

    // Update order status
    await prisma.purchaseOrder.update({
        where: { id: orderId },
        data: {
            status: 'RECEIVED',
            receivedAt: new Date(),
        },
    });

    // Create account payable
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const payable = await prisma.accountPayable.create({
        data: {
            tenantId: ctx.tenantId,
            supplierId: ctx.supplierId,
            purchaseOrderId: orderId,
            invoiceNumber: `INV-TEST-${Date.now()}`,
            totalAmount,
            balanceAmount: totalAmount,
            issueDate: new Date(),
            dueDate,
            notes: 'E2E Test Payable',
        },
    });

    console.log(`   ✅ Created AccountPayable: $${totalAmount.toFixed(2)} due on ${dueDate.toISOString().split('T')[0]}`);
    console.log(`   📊 Created ${batches.length} batches and ${movements.length} movements`);

    return { batches, movements, payable };
}

async function registerPartialPayment(payableId: string, amount: number) {
    console.log('\n💰 Step 5: Registering partial payment...');

    const payable = await prisma.accountPayable.findUnique({
        where: { id: payableId },
    });

    if (!payable) {
        throw new Error('Payable not found');
    }

    // Create payment record
    const payment = await prisma.paymentRecord.create({
        data: {
            payableId,
            amount,
            paymentMethod: 'TRANSFER',
            reference: `PAY-TEST-${Date.now()}`,
            paidAt: new Date(),
            notes: 'E2E Test Payment',
        },
    });

    // Update payable
    const newBalance = Number(payable.balanceAmount) - amount;
    const newPaidAmount = Number(payable.paidAmount || 0) + amount;

    await prisma.accountPayable.update({
        where: { id: payableId },
        data: {
            balanceAmount: newBalance,
            paidAmount: newPaidAmount,
            status: newBalance <= 0 ? 'PAID' : 'CURRENT',
            paidAt: newBalance <= 0 ? new Date() : null,
        },
    });

    console.log(`   ✅ Registered payment: $${amount.toFixed(2)}`);
    console.log(`   📊 Remaining balance: $${newBalance.toFixed(2)}`);

    return payment;
}

async function verifyResults(orderId: string, payableId: string) {
    console.log('\n🔍 Step 6: Verifying results...');

    const order = await prisma.purchaseOrder.findUnique({
        where: { id: orderId },
        include: {
            items: true,
            payables: { include: { payments: true } },
        },
    });

    if (!order) {
        throw new Error('Order not found');
    }

    const batches = await prisma.batch.findMany({
        where: { supplierId: order.supplierId },
        orderBy: { createdAt: 'desc' },
        take: 5,
    });

    const movements = await prisma.inventoryMovement.findMany({
        where: { referenceId: orderId },
    });

    console.log('\n📋 Summary:');
    console.log(`   Order: ${order.orderNumber} - Status: ${order.status}`);
    console.log(`   Items: ${order.items.length}`);
    console.log(`   Batches created: ${batches.length}`);
    console.log(`   Movements created: ${movements.length}`);
    console.log(`   Payables: ${order.payables.length}`);

    if (order.payables[0]) {
        const p = order.payables[0];
        console.log(`   Payable status: ${p.status}`);
        console.log(`   Payable balance: $${Number(p.balanceAmount).toFixed(2)}`);
        console.log(`   Payments: ${p.payments.length}`);
    }

    // Assertions
    const errors: string[] = [];

    if (order.status !== 'RECEIVED') {
        errors.push(`Expected order status RECEIVED, got ${order.status}`);
    }

    if (batches.length < 2) {
        errors.push(`Expected at least 2 batches, got ${batches.length}`);
    }

    if (movements.length < 2) {
        errors.push(`Expected at least 2 movements, got ${movements.length}`);
    }

    if (order.payables.length < 1) {
        errors.push('No payable created');
    }

    if (errors.length > 0) {
        console.log('\n❌ ERRORS:');
        errors.forEach((e) => console.log(`   - ${e}`));
        return false;
    }

    console.log('\n✅ All verifications passed!');
    return true;
}

async function cleanup(orderId: string) {
    console.log('\n🧹 Cleaning up test data...');

    // Delete in reverse order of dependencies
    await prisma.paymentRecord.deleteMany({
        where: { payable: { purchaseOrderId: orderId } },
    });

    await prisma.accountPayable.deleteMany({
        where: { purchaseOrderId: orderId },
    });

    await prisma.inventoryMovement.deleteMany({
        where: { referenceId: orderId },
    });

    // Get batches to delete
    const movements = await prisma.inventoryMovement.findMany({
        where: { referenceId: orderId },
        select: { batchId: true },
    });

    const batchIds = movements.map((m) => m.batchId).filter(Boolean);

    if (batchIds.length > 0) {
        await prisma.batch.deleteMany({
            where: { id: { in: batchIds as string[] } },
        });
    }

    await prisma.purchaseOrderItem.deleteMany({
        where: { orderId },
    });

    await prisma.purchaseOrder.delete({
        where: { id: orderId },
    });

    console.log('   ✅ Test data cleaned up');
}

async function main() {
    console.log('🚀 Starting E2E Purchase Flow Test\n');
    console.log('='.repeat(50));

    let orderId: string | null = null;
    let payableId: string | null = null;

    try {
        // Get test context
        const ctx = await getTestContext();
        console.log(`📌 Using tenant: ${ctx.tenantId.slice(0, 8)}...`);
        console.log(`📌 Using supplier: ${ctx.supplierId.slice(0, 8)}...`);
        console.log(`📌 Using warehouse: ${ctx.warehouseId.slice(0, 8)}...`);

        // Run test flow
        const order = await createPurchaseOrder(ctx);
        orderId = order.id;

        const items = await addItemsToOrder(ctx, order.id);
        await sendOrder(order.id);

        const { payable } = await receiveGoods(ctx, order.id, items);
        payableId = payable.id;

        // Pay 50% of the total
        const paymentAmount = Number(payable.totalAmount) * 0.5;
        await registerPartialPayment(payable.id, paymentAmount);

        // Verify
        const success = await verifyResults(order.id, payable.id);

        console.log('\n' + '='.repeat(50));
        if (success) {
            console.log('🎉 E2E TEST PASSED!');
        } else {
            console.log('❌ E2E TEST FAILED');
            process.exitCode = 1;
        }

    } catch (error) {
        console.error('\n❌ Test failed with error:', error);
        process.exitCode = 1;
    } finally {
        // Optional: cleanup test data
        if (orderId && process.env.CLEANUP !== 'false') {
            await cleanup(orderId);
        }

        await prisma.$disconnect();
    }
}

main();
