/**
 * ============================================================================
 * TEST-FIFO.TS - Script de Prueba E2E para lógica FIFO del InventoryService
 * ============================================================================
 * 
 * Este script valida que la lógica FIFO funcione correctamente:
 * - Inbound de 10 unidades a $5.00 (Lote Viejo)
 * - Inbound de 10 unidades a $8.00 (Lote Nuevo)
 * - Outbound de 15 unidades (debe consumir todo del viejo + 5 del nuevo)
 * 
 * Ejecutar: npm run test:fifo
 * ============================================================================
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { PrismaService } from '../common/database/prisma.service.js';
import { InventoryService } from '../modules/inventory/inventory.service.js';
import { OutboundReason } from '../modules/inventory/dto/create-outbound.dto.js';

async function main() {
    console.log('\n🧪 ═══════════════════════════════════════════════════════════');
    console.log('   TEST FIFO - InventoryService E2E Validation');
    console.log('═══════════════════════════════════════════════════════════\n');

    // ========================================
    // 1. SETUP: Levantar contexto de aplicación
    // ========================================
    console.log('📦 Levantando contexto de aplicación...');
    const app = await NestFactory.createApplicationContext(AppModule, {
        logger: ['error', 'warn'], // Silenciar logs innecesarios
    });

    const prisma = app.get(PrismaService);
    const inventoryService = app.get(InventoryService);

    console.log('✅ Contexto iniciado\n');

    try {
        // ========================================
        // 2. AUTO-DISCOVERY: Buscar datos del seed
        // ========================================
        console.log('🔍 Buscando datos en la base de datos...\n');

        // Buscar Tenant "Hotel California"
        const tenant = await prisma.tenant.findFirst({
            where: { slug: 'hotel-california' },
        });
        if (!tenant) {
            throw new Error('❌ Tenant "Hotel California" no encontrado. Ejecuta: npx prisma db seed');
        }
        console.log(`   ✓ Tenant: ${tenant.name} (${tenant.id})`);

        // Buscar Usuario Owner
        const tenantUser = await prisma.tenantUser.findFirst({
            where: { tenantId: tenant.id, role: 'OWNER' },
            include: { user: true },
        });
        if (!tenantUser) {
            throw new Error('❌ Usuario OWNER no encontrado para este tenant');
        }
        const userId = tenantUser.userId;
        console.log(`   ✓ Usuario: ${tenantUser.user.email} (${userId})`);

        // Buscar Producto "Coca Cola Lata"
        const product = await prisma.product.findFirst({
            where: {
                tenantId: tenant.id,
                name: { contains: 'Coca Cola Lata', mode: 'insensitive' },
            },
        });
        if (!product) {
            throw new Error('❌ Producto "Coca Cola Lata" no encontrado');
        }
        console.log(`   ✓ Producto: ${product.name} (${product.id})`);

        // Buscar Bodega "Bodega Central"
        const warehouse = await prisma.warehouse.findFirst({
            where: {
                tenantId: tenant.id,
                name: { contains: 'Bodega Central', mode: 'insensitive' },
            },
        });
        if (!warehouse) {
            throw new Error('❌ Bodega "Bodega Central" no encontrada');
        }
        console.log(`   ✓ Bodega: ${warehouse.name} (${warehouse.id})`);

        // ========================================
        // 3. LIMPIEZA: Reset de datos existentes
        // ========================================
        console.log('\n🧹 Limpiando datos existentes del producto...');

        // Primero movimientos (FK a batches)
        const deletedMovements = await prisma.inventoryMovement.deleteMany({
            where: { tenantId: tenant.id, productId: product.id },
        });
        console.log(`   → Movimientos eliminados: ${deletedMovements.count}`);

        // Luego batches
        const deletedBatches = await prisma.batch.deleteMany({
            where: { tenantId: tenant.id, productId: product.id },
        });
        console.log(`   → Lotes eliminados: ${deletedBatches.count}`);

        // ========================================
        // 4. ESCENARIO "SANDWICH" (FIFO TEST)
        // ========================================
        console.log('\n🥪 ═══════════════════════════════════════════════════════════');
        console.log('   ESCENARIO FIFO "SANDWICH"');
        console.log('═══════════════════════════════════════════════════════════\n');

        // PASO A: Inbound de 10 unidades a $5.00 (LOTE VIEJO)
        console.log('📥 PASO A: Inbound de 10 unidades a $5.00 (Lote Viejo)');
        const inbound1 = await inventoryService.registerInbound(tenant.id, userId, {
            productId: product.id,
            warehouseId: warehouse.id,
            quantity: 10,
            unitCost: 5.00,
            batchNumber: 'FIFO-TEST-OLD',
        });
        console.log(`   ✓ Lote creado: ${inbound1.batch.batchNumber}`);
        console.log(`   ✓ Cantidad: ${inbound1.batch.quantityInitial}`);
        console.log(`   ✓ Costo: $${inbound1.batch.unitCost}\n`);

        // Simular que el lote viejo llegó antes (hack para FIFO)
        await prisma.batch.update({
            where: { id: inbound1.batch.id },
            data: { receivedAt: new Date('2026-01-01T00:00:00Z') }, // Fecha antigua
        });

        // PASO B: Inbound de 10 unidades a $8.00 (LOTE NUEVO)
        console.log('📥 PASO B: Inbound de 10 unidades a $8.00 (Lote Nuevo)');
        const inbound2 = await inventoryService.registerInbound(tenant.id, userId, {
            productId: product.id,
            warehouseId: warehouse.id,
            quantity: 10,
            unitCost: 8.00,
            batchNumber: 'FIFO-TEST-NEW',
        });
        console.log(`   ✓ Lote creado: ${inbound2.batch.batchNumber}`);
        console.log(`   ✓ Cantidad: ${inbound2.batch.quantityInitial}`);
        console.log(`   ✓ Costo: $${inbound2.batch.unitCost}\n`);

        // PASO C: Outbound de 15 unidades (FIFO debería consumir todo del viejo + 5 del nuevo)
        console.log('📤 PASO C: Outbound de 15 unidades (VENTA)');
        console.log('   → Esperado: Consumir 10 del lote VIEJO ($5) + 5 del lote NUEVO ($8)\n');

        const outbound = await inventoryService.registerOutbound(tenant.id, userId, {
            productId: product.id,
            warehouseId: warehouse.id,
            quantity: 15,
            reason: OutboundReason.SALE,
            notes: 'FIFO Test Sale',
        });

        // ========================================
        // 5. REPORTE DE RESULTADOS
        // ========================================
        console.log('📊 ═══════════════════════════════════════════════════════════');
        console.log('   RESULTADOS DEL TEST FIFO');
        console.log('═══════════════════════════════════════════════════════════\n');

        console.log(`✅ Cantidad total egresada: ${outbound.totalQuantity}`);
        console.log(`✅ Lotes afectados: ${outbound.affectedBatches}`);
        console.log(`✅ Movimientos generados: ${outbound.movements.length}\n`);

        // Tabla de movimientos
        const movementsTable = outbound.movements.map((m, i) => ({
            '#': i + 1,
            'Lote': m.batchNumber,
            'Cantidad': m.quantity.toString(),
            'Stock Antes': m.stockBefore.toString(),
            'Stock Después': m.stockAfter.toString(),
            'Costo Unit': m.batchNumber === 'FIFO-TEST-OLD' ? '$5.00' : '$8.00',
        }));

        console.log('📋 Detalle de Movimientos:');
        console.table(movementsTable);

        // Verificar estado final de los lotes
        console.log('\n📦 Estado Final de Lotes:');
        const finalBatches = await prisma.batch.findMany({
            where: {
                tenantId: tenant.id,
                productId: product.id,
            },
            orderBy: { receivedAt: 'asc' },
            select: {
                batchNumber: true,
                quantityInitial: true,
                quantityCurrent: true,
                isExhausted: true,
                unitCost: true,
            },
        });

        const batchesTable = finalBatches.map((b) => ({
            'Lote': b.batchNumber,
            'Inicial': b.quantityInitial.toString(),
            'Actual': b.quantityCurrent.toString(),
            'Agotado': b.isExhausted ? '✓ SÍ' : '✗ NO',
            'Costo': `$${b.unitCost.toString()}`,
        }));

        console.table(batchesTable);

        // ========================================
        // 6. VALIDACIÓN AUTOMÁTICA
        // ========================================
        console.log('\n🔬 ═══════════════════════════════════════════════════════════');
        console.log('   VALIDACIONES AUTOMÁTICAS');
        console.log('═══════════════════════════════════════════════════════════\n');

        let allPassed = true;

        // Validación 1: Deben ser 2 movimientos
        const test1 = outbound.movements.length === 2;
        console.log(`${test1 ? '✅' : '❌'} Movimientos generados: ${outbound.movements.length} (esperado: 2)`);
        allPassed = allPassed && test1;

        // Validación 2: Primer movimiento debe ser del lote VIEJO
        const test2 = outbound.movements[0]?.batchNumber === 'FIFO-TEST-OLD';
        console.log(`${test2 ? '✅' : '❌'} Primer movimiento del lote VIEJO: ${outbound.movements[0]?.batchNumber}`);
        allPassed = allPassed && test2;

        // Validación 3: Lote viejo debe estar agotado
        const oldBatch = finalBatches.find((b) => b.batchNumber === 'FIFO-TEST-OLD');
        const test3 = oldBatch?.isExhausted === true;
        console.log(`${test3 ? '✅' : '❌'} Lote VIEJO agotado: ${oldBatch?.isExhausted}`);
        allPassed = allPassed && test3;

        // Validación 4: Lote nuevo debe tener 5 unidades
        const newBatch = finalBatches.find((b) => b.batchNumber === 'FIFO-TEST-NEW');
        const test4 = newBatch?.quantityCurrent.toString() === '5';
        console.log(`${test4 ? '✅' : '❌'} Lote NUEVO restante: ${newBatch?.quantityCurrent} (esperado: 5)`);
        allPassed = allPassed && test4;

        // Validación 5: Primer movimiento consumió 10 unidades
        const test5 = outbound.movements[0]?.quantity.toString() === '10';
        console.log(`${test5 ? '✅' : '❌'} Cantidad del primer movimiento: ${outbound.movements[0]?.quantity} (esperado: 10)`);
        allPassed = allPassed && test5;

        // Validación 6: Segundo movimiento consumió 5 unidades
        const test6 = outbound.movements[1]?.quantity.toString() === '5';
        console.log(`${test6 ? '✅' : '❌'} Cantidad del segundo movimiento: ${outbound.movements[1]?.quantity} (esperado: 5)`);
        allPassed = allPassed && test6;

        // Resultado final
        console.log('\n═══════════════════════════════════════════════════════════');
        if (allPassed) {
            console.log('🎉 TODOS LOS TESTS PASARON - LA LÓGICA FIFO FUNCIONA CORRECTAMENTE');
        } else {
            console.log('⚠️  ALGUNOS TESTS FALLARON - REVISAR IMPLEMENTACIÓN');
        }
        console.log('═══════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('\n❌ ERROR DURANTE LA PRUEBA:', error);
        process.exit(1);
    } finally {
        await app.close();
    }
}

main();
