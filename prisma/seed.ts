/**
 * ============================================================================
 * SEED.TS - Script de Datos de Prueba para Sistema de Inventario Multi-tenant
 * ============================================================================
 * 
 * Escenario de Prueba: Hotel California
 * - Super Admin: admin@fazt-inventory.com / password123
 * - Tenant: Hotel California (multi-tenant)
 * - Familia: Coca Cola (MILLILITER)
 * - Productos: Lata 355ml, Botella 2L
 * - Lote de prueba: LOT-2026-A
 * 
 * Ejecutar: npx prisma db seed
 * ============================================================================
 */

import { PrismaClient, BusinessType, UserRole, BaseUnit, MovementType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Hash de contraseña con bcrypt (compatible con el backend)
 */
async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

/**
 * Calcula fecha futura (días desde hoy)
 */
function addDays(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
}

// ============================================================================
// LIMPIEZA DE DATOS (Orden inverso a dependencias FK)
// ============================================================================

async function cleanDatabase() {
    console.log('🧹 Limpiando base de datos...\n');

    // Orden inverso a las dependencias de FK
    await prisma.paymentRecord.deleteMany();
    await prisma.accountPayable.deleteMany();
    await prisma.purchaseOrderItem.deleteMany();
    await prisma.purchaseOrder.deleteMany();
    await prisma.inventoryAuditItem.deleteMany();
    await prisma.inventoryAudit.deleteMany();
    await prisma.inventoryMovement.deleteMany();
    await prisma.batch.deleteMany();
    await prisma.product.deleteMany();
    await prisma.productFamily.deleteMany();
    await prisma.category.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.warehouse.deleteMany();
    await prisma.tenantUser.deleteMany();
    await prisma.user.deleteMany();
    await prisma.tenant.deleteMany();

    console.log('✅ Base de datos limpia\n');
}

// ============================================================================
// SEED PRINCIPAL: HOTEL CALIFORNIA
// ============================================================================

async function main() {
    console.log('🌱 Iniciando seed de base de datos...\n');

    // Limpiar datos existentes
    await cleanDatabase();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏨 ESCENARIO: HOTEL CALIFORNIA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // ========================================
    // 1. CREAR SUPER ADMIN
    // ========================================
    const passwordHash = await hashPassword('password123');

    const superAdmin = await prisma.user.create({
        data: {
            email: 'admin@fazt-inventory.com',
            passwordHash,
            firstName: 'Super',
            lastName: 'Admin'
        }
    });
    console.log(`✅ Usuario Super Admin creado:`);
    console.log(`   → Email: admin@fazt-inventory.com`);
    console.log(`   → Password: password123`);
    console.log(`   → ID: ${superAdmin.id}\n`);

    // ========================================
    // 2. CREAR TENANT: HOTEL CALIFORNIA
    // ========================================
    const tenant = await prisma.tenant.create({
        data: {
            name: 'Hotel California',
            slug: 'hotel-california',
            businessType: BusinessType.HOTEL,
            maxUsers: 10,
            maxWarehouses: 5,
            maxProducts: 500,
            settings: {
                currency: 'USD',
                timezone: 'America/Los_Angeles',
                fiscalYear: { startMonth: 1 }
            }
        }
    });
    console.log(`✅ Tenant creado: ${tenant.name}`);
    console.log(`   → Slug: ${tenant.slug}`);
    console.log(`   → ID: ${tenant.id}\n`);

    // ========================================
    // 3. ASIGNAR USUARIO COMO OWNER DEL TENANT
    // ========================================
    await prisma.tenantUser.create({
        data: {
            tenantId: tenant.id,
            userId: superAdmin.id,
            role: UserRole.OWNER
        }
    });
    console.log(`✅ Usuario asignado como OWNER del tenant\n`);

    // ========================================
    // 4. CREAR BODEGA CENTRAL
    // ========================================
    const warehouse = await prisma.warehouse.create({
        data: {
            tenantId: tenant.id,
            name: 'Bodega Central',
            code: 'BOD-CENTRAL',
            address: 'Área de Servicio, Planta Baja',
            isDefault: true,
            settings: { allowNegativeStock: false }
        }
    });
    console.log(`✅ Bodega creada: ${warehouse.name}`);
    console.log(`   → Código: ${warehouse.code}\n`);

    // ========================================
    // 5. CREAR CATEGORÍA: BEBIDAS
    // ========================================
    const category = await prisma.category.create({
        data: {
            tenantId: tenant.id,
            name: 'Bebidas',
            description: 'Bebidas y refrescos'
        }
    });
    console.log(`✅ Categoría creada: ${category.name}\n`);

    // ========================================
    // 6. CREAR FAMILIA: COCA COLA (MILLILITER)
    // ========================================
    console.log('📦 Creando Familia de Productos con Conversión...\n');

    const familyCocaCola = await prisma.productFamily.create({
        data: {
            tenantId: tenant.id,
            name: 'Coca Cola',
            description: 'Familia de productos Coca Cola en diferentes presentaciones',
            baseUnit: BaseUnit.MILLILITER,
            targetStockBase: new Decimal(50000) // 50 litros objetivo
        }
    });
    console.log(`✅ Familia creada: ${familyCocaCola.name}`);
    console.log(`   → Unidad Base: MILLILITER`);
    console.log(`   → Stock Objetivo: 50,000 ml (50L)\n`);

    // ========================================
    // 7. CREAR PRODUCTOS CON FACTOR DE CONVERSIÓN
    // ========================================

    // Producto 1: Coca Cola Lata 355ml
    const productLata = await prisma.product.create({
        data: {
            tenantId: tenant.id,
            sku: 'COCA-LATA-355',
            barcode: '7501055302235',
            name: 'Coca Cola Lata 355ml',
            description: 'Lata de Coca Cola clásica, 355 mililitros',
            categoryId: category.id,
            familyId: familyCocaCola.id,
            conversionFactor: new Decimal(355), // 355 ml
            stockMin: new Decimal(24),
            stockIdeal: new Decimal(100),
            stockMax: new Decimal(200),
            costAverage: new Decimal(0.50),
            priceDefault: new Decimal(1.00),
            hasExpiry: true,
            trackBatches: true
        }
    });
    console.log(`✅ Producto 1: ${productLata.name}`);
    console.log(`   → SKU: ${productLata.sku}`);
    console.log(`   → conversionFactor: 355 ml\n`);

    // Producto 2: Coca Cola 2L
    const product2L = await prisma.product.create({
        data: {
            tenantId: tenant.id,
            sku: 'COCA-2L',
            barcode: '7501055302242',
            name: 'Coca Cola 2L',
            description: 'Botella de Coca Cola, 2 litros',
            categoryId: category.id,
            familyId: familyCocaCola.id,
            conversionFactor: new Decimal(2000), // 2000 ml = 2L
            stockMin: new Decimal(6),
            stockIdeal: new Decimal(24),
            stockMax: new Decimal(50),
            costAverage: new Decimal(1.50),
            priceDefault: new Decimal(2.50),
            hasExpiry: true,
            trackBatches: true
        }
    });
    console.log(`✅ Producto 2: ${product2L.name}`);
    console.log(`   → SKU: ${product2L.sku}`);
    console.log(`   → conversionFactor: 2000 ml\n`);

    // ========================================
    // 8. CREAR LOTE DE PRUEBA: LOT-2026-A
    // ========================================
    console.log('📦 Creando Lote de Prueba (Trazabilidad)...\n');

    const batch = await prisma.batch.create({
        data: {
            tenantId: tenant.id,
            productId: productLata.id,
            warehouseId: warehouse.id,
            batchNumber: 'LOT-2026-A',
            quantityInitial: new Decimal(100),
            quantityCurrent: new Decimal(100),
            unitCost: new Decimal(0.50),
            currency: 'USD',
            receivedAt: new Date(),
            expiresAt: addDays(180) // Vence en 6 meses
        }
    });
    console.log(`✅ Lote creado: ${batch.batchNumber}`);
    console.log(`   → Producto: ${productLata.name}`);
    console.log(`   → Cantidad: 100 unidades`);
    console.log(`   → Costo Unitario: $0.50`);
    console.log(`   → Vencimiento: ${batch.expiresAt?.toLocaleDateString()}\n`);

    // ========================================
    // 9. REGISTRAR MOVIMIENTO DE INGRESO
    // ========================================
    const movement = await prisma.inventoryMovement.create({
        data: {
            tenantId: tenant.id,
            productId: productLata.id,
            batchId: batch.id,
            type: MovementType.IN,
            quantity: new Decimal(100),
            stockBefore: new Decimal(0),
            stockAfter: new Decimal(100),
            warehouseDestinationId: warehouse.id,
            unitCost: new Decimal(0.50),
            totalCost: new Decimal(50.00),
            performedById: superAdmin.id,
            notes: 'Ingreso inicial de inventario - Lote LOT-2026-A'
        }
    });
    console.log(`✅ Movimiento IN registrado: ${movement.id}\n`);

    // ========================================
    // RESUMEN FINAL
    // ========================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 RESUMEN DEL SEED - IDs PARA PRUEBAS DE API');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🔐 CREDENCIALES DE LOGIN:');
    console.log(`   Email:    admin@fazt-inventory.com`);
    console.log(`   Password: password123\n`);

    console.log('📌 IDs CREADOS:');
    console.log(`   Tenant ID:     ${tenant.id}`);
    console.log(`   User ID:       ${superAdmin.id}`);
    console.log(`   Warehouse ID:  ${warehouse.id}`);
    console.log(`   Category ID:   ${category.id}`);
    console.log(`   Family ID:     ${familyCocaCola.id}`);
    console.log(`   Product Lata:  ${productLata.id}`);
    console.log(`   Product 2L:    ${product2L.id}`);
    console.log(`   Batch ID:      ${batch.id}\n`);

    console.log('✅ VALIDACIONES INCLUIDAS:');
    console.log('   [✓] Password hasheado con bcrypt (compatible con login)');
    console.log('   [✓] Familia con conversión de unidades (MILLILITER)');
    console.log('   [✓] Productos con conversionFactor (355, 2000)');
    console.log('   [✓] Lote con trazabilidad y vencimiento');
    console.log('   [✓] Movimiento de inventario registrado\n');

    console.log('🎉 Seed completado exitosamente!\n');
}

// ============================================================================
// EJECUTAR SEED
// ============================================================================

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('❌ Error durante el seed:', e);
        await prisma.$disconnect();
        process.exit(1);
    });
