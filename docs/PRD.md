# PRD: Sistema de Inventario SaaS Multi-tenant

> **Versión:** 1.0  
> **Fecha:** 2026-01-27  
> **Autor:** Backend Specialist Agent  
> **Estado:** Draft

---

## 1. Resumen Ejecutivo

### 1.1 Visión

> **"El sistema debe ser proactivo, no reactivo."**

Sistema de gestión de inventario SaaS diseñado para empresas de **Hotelería, Restaurantes y Retail** que requieren:
- Control granular de stock por lotes
- Trazabilidad completa de costos
- Alertas proactivas de reabastecimiento
- Integración automática con tesorería

### 1.2 Propuesta de Valor

| Pain Point Actual | Solución |
|-------------------|----------|
| "No sé cuánto me costó realmente cada producto" | **Lotes con costo real al momento del ingreso** |
| "Se me vencen productos sin darme cuenta" | **Alertas proactivas de vencimiento** |
| "No sé cuándo pedir más mercancía" | **Sugerencias automáticas de reabastecimiento** |
| "Tengo productos similares en diferentes presentaciones" | **Familias con conversión de unidades** |
| "Mis inventarios no cuadran" | **Conteos ciegos con ajuste automático** |
| "Olvidé pagar al proveedor" | **Cuentas por pagar automáticas al ingresar mercancía** |

---

## 2. Arquitectura Multi-tenant

### 2.1 Modelo de Aislamiento

```
┌─────────────────────────────────────────────────────────┐
│                    APLICACIÓN                           │
├─────────────────────────────────────────────────────────┤
│  Tenant A          │  Tenant B          │  Tenant C     │
│  (Hotel XYZ)       │  (Restaurante ABC) │  (Retail 123) │
│  ┌───────────────┐ │  ┌───────────────┐ │  ┌───────────┐│
│  │ tenant_id: A  │ │  │ tenant_id: B  │ │  │tenant_id:C││
│  │               │ │  │               │ │  │           ││
│  │ - Warehouses  │ │  │ - Warehouses  │ │  │-Warehouses││
│  │ - Products    │ │  │ - Products    │ │  │- Products ││
│  │ - Movements   │ │  │ - Movements   │ │  │-Movements ││
│  │ - Users       │ │  │ - Users       │ │  │- Users    ││
│  └───────────────┘ │  └───────────────┘ │  └───────────┘│
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────┐
│                   PostgreSQL Database                    │
│              (Shared DB, Row-Level Security)             │
└─────────────────────────────────────────────────────────┘
```

### 2.2 La Regla de Oro

> **TODAS las tablas principales contienen `tenant_id`**

Esto garantiza:
- ✅ Aislamiento completo de datos entre clientes
- ✅ Una sola base de datos (costos reducidos)
- ✅ Queries eficientes con índices compuestos
- ✅ Row-Level Security (RLS) compatible

---

## 3. Módulos del Sistema

### 3.1 Módulo: Productos y Familias

#### Funcionalidad Core

| Feature | Descripción |
|---------|-------------|
| **SKU único por tenant** | Identificación unívoca |
| **Categorías jerárquicas** | Categoría > Subcategoría |
| **Niveles de stock** | `stockMin`, `stockIdeal`, `stockMax` |
| **Flags especiales** | `is_service`, `has_expiry`, `track_batches` |

#### 🌟 Feature Destacado: Familias de Conversión

**Problema:** Un hotel compra "Cocoa" en diferentes presentaciones:
- Bolsa de 400g
- Bolsa de 900g
- Bolsa de 2.5kg

**Solución:** Familias con unidad base.

```
ProductFamily: "Cocoa"
├── baseUnit: GRAM
├── targetStockBase: 10000 (10kg objetivo)
│
├── Product: "Bolsa Cocoa 400g"
│   └── conversionFactor: 400
│
├── Product: "Bolsa Cocoa 900g"
│   └── conversionFactor: 900
│
└── Product: "Bolsa Cocoa 2.5kg"
    └── conversionFactor: 2500
```

**Beneficios:**
- Stock total en gramos = Σ (cantidad × conversionFactor)
- Órdenes de compra pueden agrupar necesidad total
- Reportes unificados por familia

---

### 3.2 Módulo: Inventario y Lotes (Batches)

#### Filosofía: Los Lotes SON el Stock

```
Ingreso de mercancía
        │
        ▼
┌─────────────────────────────────────────────┐
│                 BATCH (Lote)                 │
├─────────────────────────────────────────────┤
│  batchNumber: "LOT-2026-001"                │
│  quantityInitial: 100                       │
│  quantityCurrent: 85 (15 ya salieron)       │
│  unitCost: 4.50 USD (costo REAL)            │
│  receivedAt: 2026-01-15                     │
│  expiresAt: 2026-06-15 (si aplica)          │
│  warehouseId: "uuid-bodega-central"         │
└─────────────────────────────────────────────┘
```

#### Beneficios del Modelo de Lotes

| Aspecto | Beneficio |
|---------|-----------|
| **Costeo** | FIFO, LIFO, Promedio Ponderado real |
| **Trazabilidad** | "¿De dónde vino este producto?" |
| **Vencimientos** | Alertas proactivas por lote específico |
| **Auditoría** | Conciliación exacta por lote |

---

### 3.3 Módulo: Movimientos de Inventario

#### Historial Inmutable (Append-Only)

Cada movimiento registra:

```typescript
interface InventoryMovement {
  type: 'IN' | 'OUT' | 'TRANSFER' | 'AUDIT' | 'SALE' | 'CONSUME';
  
  // Snapshot del estado
  stockBefore: number;
  stockAfter: number;
  
  // Origen y Destino
  warehouseOriginId?: string;
  warehouseDestinationId?: string;
  
  // Destino flexible (Hotel: Cocina/Habitación, Retail: Cliente)
  destinationType?: 'KITCHEN' | 'ROOM' | 'CUSTOMER' | 'INTERNAL';
  destinationRef?: string;
  
  // Responsabilidad
  performedById: string;
  createdAt: DateTime;
}
```

#### Flujos Soportados

| Negocio | Flujo de Salida | Destino |
|---------|-----------------|---------|
| **Hotel** | Bodega → Cocina | `type: CONSUME`, `destinationType: KITCHEN` |
| **Hotel** | Bodega → Habitación | `type: CONSUME`, `destinationType: ROOM`, `destinationRef: "HAB-502"` |
| **Restaurante** | Bodega → Cocina | `type: CONSUME`, `destinationType: KITCHEN` |
| **Retail** | Bodega → Cliente | `type: SALE`, `destinationType: CUSTOMER` |

---

### 3.4 Módulo: Auditorías (Conteos Ciegos)

#### Flujo de Auditoría

```
1. CREAR AUDITORÍA
   └── Seleccionar bodega
   └── Generar lista de productos
   
2. CONTEO CIEGO
   └── Operador cuenta sin ver stock sistema
   └── Registra: countedStock
   
3. COMPARACIÓN
   └── Sistema calcula: variance = countedStock - systemStock
   └── Resalta discrepancias
   
4. AJUSTE AUTOMÁTICO
   └── Genera movimiento tipo: AUDIT
   └── Actualiza stock de lotes afectados
```

#### Tabla: InventoryAuditItem

| Campo | Propósito |
|-------|-----------|
| `systemStock` | Stock según sistema al iniciar auditoría |
| `countedStock` | Stock contado físicamente |
| `variance` | Diferencia (puede ser positiva o negativa) |
| `isAdjusted` | Flag de ajuste aplicado |
| `adjustmentMovementId` | FK al movimiento de ajuste |

---

### 3.5 Módulo: Órdenes de Compra Inteligentes

#### Algoritmo de Sugerencia

```
Para cada producto con stock < stockMin:
│
├── IF producto.familyId IS NULL:
│   └── Sugerir: stockIdeal - stockActual
│
└── IF producto.familyId IS NOT NULL:
    └── Calcular necesidad en unidad base
    └── Agrupar por familia
    └── Sugerir cantidad base total
```

#### Ejemplo Práctico

```
Familia: "Cocoa" (baseUnit: GRAM)
├── Bolsa 400g: stock = 5 → 2000g
├── Bolsa 900g: stock = 3 → 2700g
└── Total actual: 4700g

Target familia: 10000g
Necesidad: 5300g

Sugerencia:
└── "Comprar 5300g de Cocoa (equivalente a ~6 bolsas de 900g o ~13 bolsas de 400g)"
```

---

### 3.6 Módulo: Cuentas por Pagar (Integración Tesorería)

#### Trigger Lógico

```
Evento: Ingreso de mercancía (recepción de PO)
        │
        ▼
┌─────────────────────────────────────┐
│ createGoodsReceipt(purchaseOrderId) │
└──────────────────┬──────────────────┘
                   │
    ┌──────────────┴──────────────┐
    │                             │
    ▼                             ▼
┌───────────────┐         ┌───────────────────┐
│ Crear Batches │         │ Crear AccountPayable│
│ (stock +)     │         │ (deuda +)           │
└───────────────┘         └───────────────────┘
```

**Nota de Implementación:** El trigger está en la capa de aplicación (NestJS service), no como DB trigger, para:
- Facilitar testing unitario
- Mantener lógica de negocio visible
- Permitir manejo de errores granular

#### Estados de Cuenta por Pagar

| Estado | Condición |
|--------|-----------|
| `CURRENT` | `dueDate > now + 7 días` |
| `DUE_SOON` | `dueDate <= now + 7 días AND dueDate > now` |
| `OVERDUE` | `dueDate < now` |
| `PAID` | `balanceAmount = 0` |

---

## 4. Decisiones Técnicas

### 4.1 ¿Por qué UUID como Primary Key?

| Alternativa | Problema |
|-------------|----------|
| Auto-increment | Predecible, información de negocio expuesta |
| Secuencial | Conflictos en sistemas distribuidos |
| **UUID** | ✅ Seguro, distribuido, sin colisiones |

### 4.2 ¿Por qué Decimal para Dinero?

```sql
-- ❌ MAL: Float tiene errores de redondeo
SELECT 0.1 + 0.2;  -- Puede dar 0.30000000000000004

-- ✅ BIEN: Decimal es preciso
-- Usamos Decimal(15, 4) para:
-- - 15 dígitos totales
-- - 4 decimales (centésimas de centavo)
```

### 4.3 ¿Por qué JSONB para Metadata?

```typescript
// Casos de uso:
product.metadata = {
  brand: "Nestlé",
  color: "Marrón oscuro",
  customField1: "...",  // Campos dinámicos por tenant
}

tenant.settings = {
  currency: "USD",
  timezone: "America/Guayaquil",
  fiscalYear: { startMonth: 1 },
  notifications: { email: true, slack: false }
}
```

**Beneficios:**
- Flexibilidad sin migraciones
- Consultas eficientes con índices GIN
- Cada tenant puede tener campos personalizados

### 4.4 ¿Por qué destinationType + destinationRef?

```typescript
// Problema: Diferentes negocios tienen diferentes destinos
// - Hotel: Habitaciones, Cocinas, Spa
// - Restaurante: Cocinas, Barras
// - Retail: Clientes finales

// Solución: Campos flexibles sin FK rígidas
movement.destinationType = 'ROOM';
movement.destinationRef = 'HAB-502';

// Esto permite agregar nuevos tipos de destino sin migraciones
// y sin crear tablas vacías para negocios que no las usan
```

---

## 5. Índices y Performance

### 5.1 Estrategia de Índices

```prisma
// Índice compuesto principal (SIEMPRE tenant_id primero)
@@index([tenantId])
@@index([tenantId, productId])
@@index([tenantId, createdAt])

// Consultas frecuentes
@@index([tenantId, type])  // Filtrar movimientos por tipo
@@index([tenantId, status])  // Estados de PO, auditorías
@@index([tenantId, dueDate])  // Cuentas por pagar próximas
```

### 5.2 Queries Optimizados

```sql
-- ✅ BIEN: Usa índice compuesto
SELECT * FROM products 
WHERE tenant_id = 'uuid' AND category_id = 'uuid';

-- ❌ MAL: No usa índice (tenant_id no está primero)
SELECT * FROM products 
WHERE category_id = 'uuid';  -- Full table scan
```

---

## 6. Seguridad

### 6.1 Row-Level Security (RLS)

```sql
-- Política sugerida para PostgreSQL
CREATE POLICY tenant_isolation ON products
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

### 6.2 Roles y Permisos

| Rol | Permisos |
|-----|----------|
| `OWNER` | Todo |
| `ADMIN` | Todo excepto eliminar tenant |
| `MANAGER` | CRUD productos, órdenes, movimientos |
| `SUPERVISOR` | Crear movimientos, ver reportes |
| `OPERATOR` | Crear egresos, ver stock |
| `AUDITOR` | Solo lectura + realizar conteos |
| `VIEWER` | Solo lectura |

---

## 7. Roadmap de Implementación

### Fase 1: Core (MVP)
- [ ] Tenants y usuarios
- [ ] Productos y categorías
- [ ] Bodegas
- [ ] Movimientos básicos (IN, OUT)

### Fase 2: Trazabilidad
- [ ] Lotes (Batches)
- [ ] Vencimientos
- [ ] Costos por lote

### Fase 3: Compras e Integración
- [ ] Órdenes de compra
- [ ] Cuentas por pagar automáticas
- [ ] Familias de conversión

### Fase 4: Auditoría y Alertas
- [ ] Conteos ciegos
- [ ] Ajustes automáticos
- [ ] Sugerencias de reabastecimiento
- [ ] Alertas proactivas

### Fase 5: Reportería
- [ ] Valorización de inventario (FIFO/LIFO/Promedio)
- [ ] Rotación de productos
- [ ] Análisis de vencimientos
- [ ] Dashboard ejecutivo

---

## 8. Glosario

| Término | Definición |
|---------|------------|
| **Tenant** | Cliente/Empresa que usa el SaaS |
| **Batch** | Lote de producto con costo y vencimiento específico |
| **Familia** | Agrupación de productos con conversión de unidades |
| **Conteo Ciego** | Auditoría donde el operador no ve el stock sistema |
| **Movimiento** | Registro inmutable de cambio de inventario |
| **RLS** | Row-Level Security (seguridad a nivel de fila) |

---

## 9. Referencias Técnicas

- **Stack:** PostgreSQL 16+ / Prisma ORM / NestJS
- **Patrón:** Multi-tenant con Row-Level Security
- **Costos:** Decimal(15,4) para precisión financiera
- **Fechas:** Timestamptz (con zona horaria)
- **IDs:** UUID v4

---

*Documento generado siguiendo los principios de `@backend-specialist` y `@database-design`.*
