# 📊 Análisis: Sistema de Categorías de Productos - SaaS Multi-Tenant

> **Fecha de Análisis**: 2026-02-03  
> **Arquitecto**: Vibe Coding Architect  
> **Objetivo**: Entender la estructura actual de categorías y productos para implementar funcionalidades avanzadas

---

## 🎯 Resumen Ejecutivo

El sistema **Clarigo** (anteriormente Quantora) cuenta con una **arquitectura de categorías jerárquicas** completamente funcional y aislada por tenant. La implementación actual es sólida, pero **básica** en términos de funcionalidad frontend y backend.

### Estado Actual: ✅ Funcional pero Limitado

| Componente | Estado | Completitud |
|------------|--------|-------------|
| **Base de Datos** | ✅ Implementado | 90% |
| **Backend API** | ✅ Implementado | 60% |
| **Frontend Service** | ✅ Implementado | 50% |
| **UI de Gestión** | ⚠️ Parcial | 30% |

---

## 🗄️ Arquitectura de Base de Datos

### Modelo `Category` (Prisma Schema)

```prisma
model Category {
  id          String     @id @default(uuid()) @db.Uuid
  tenantId    String     @db.Uuid
  name        String     @db.VarChar(255)
  description String?
  parentId    String?    @db.Uuid
  sortOrder   Int        @default(0)
  isActive    Boolean    @default(true)
  createdAt   DateTime   @default(now()) @db.Timestamptz(6)
  updatedAt   DateTime   @updatedAt @db.Timestamptz(6)
  
  // Relaciones
  parent      Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryHierarchy")
  tenant      Tenant     @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  products    Product[]

  // Índices y Constraints
  @@unique([tenantId, name, parentId])
  @@index([tenantId])
  @@index([parentId])
  @@map("categories")
}
```

### 🔑 Características Clave del Modelo

#### 1. **Multi-Tenancy Seguro**
- ✅ `tenantId` obligatorio en todas las operaciones
- ✅ Constraint único: `[tenantId, name, parentId]`
  - Permite nombres duplicados en diferentes niveles
  - Ejemplo: "Bebidas" puede existir como categoría raíz Y subcategoría de "Alimentos"

#### 2. **Jerarquía Ilimitada**
- ✅ Relación auto-referencial (`parentId`)
- ✅ Soporte para árbol de categorías de N niveles
- ⚠️ **Sin validación de profundidad máxima** (puede ser problema de UX)

#### 3. **Ordenamiento Manual**
- ✅ Campo `sortOrder` para control de visualización
- ❌ **No implementado en backend actual**

#### 4. **Soft Delete Preparado**
- ✅ Campo `isActive` para desactivación lógica
- ❌ **No implementado en endpoints actuales**

---

## 🔌 Backend API (NestJS)

### Endpoints Disponibles

| Método | Ruta | Descripción | Estado |
|--------|------|-------------|--------|
| `POST` | `/api/v1/categories` | Crear categoría | ✅ Funcional |
| `GET` | `/api/v1/categories` | Listar todas | ✅ Funcional |

### 🚨 Endpoints Faltantes (Críticos)

```typescript
// ❌ NO IMPLEMENTADOS
GET    /api/v1/categories/:id          // Obtener una categoría
PUT    /api/v1/categories/:id          // Actualizar categoría
DELETE /api/v1/categories/:id          // Eliminar categoría
GET    /api/v1/categories/tree         // Obtener árbol jerárquico
PATCH  /api/v1/categories/:id/reorder  // Cambiar sortOrder
```

### Análisis del Servicio Actual

**Archivo**: `backend/src/modules/categories/categories.service.ts`

```typescript
@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // ✅ CREATE: Funcional con validaciones
  async create(tenantId: string, createCategoryDto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({
        data: {
          ...createCategoryDto,
          tenantId,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Category with this name already exists in this level',
          );
        }
      }
      throw new InternalServerErrorException(error);
    }
  }

  // ✅ READ ALL: Funcional pero sin jerarquía
  async findAll(tenantId: string) {
    return this.prisma.category.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' }, // ⚠️ Ignora sortOrder
    });
  }
}
```

### 🔍 Problemas Identificados

1. **Respuesta Plana**: `findAll()` devuelve lista plana, no árbol
2. **Sin Paginación**: Puede ser problema con 1000+ categorías
3. **Sin Filtros**: No permite buscar por `isActive`, `parentId`, etc.
4. **Sin Validación de Jerarquía**: Permite crear ciclos (A → B → A)

---

## 🎨 Frontend (Next.js + TypeScript)

### Service Layer

**Archivo**: `frontend/services/categories.service.ts`

```typescript
export interface Category {
    id: string;
    name: string;
    description?: string;
    // ❌ FALTA: parentId, sortOrder, isActive, createdAt, updatedAt
}

export interface CreateCategoryDto {
    name: string;
    description?: string;
    // ❌ FALTA: parentId, sortOrder
}

export const CategoriesService = {
    getAll: async (): Promise<Category[]> => {
        const response = await api.get('/categories');
        return response.data;
    },

    create: async (data: CreateCategoryDto): Promise<Category> => {
        const response = await api.post('/categories', data);
        return response.data;
    }
    
    // ❌ FALTA: update, delete, getById, getTree
};
```

### 🚨 Problemas del Frontend

1. **Tipos Incompletos**: Interfaz `Category` no refleja el modelo completo
2. **Sin Gestión de Jerarquía**: No hay UI para crear subcategorías
3. **Sin CRUD Completo**: Solo CREATE y READ
4. **Sin Visualización de Árbol**: Lista plana en selector

---

## 🔗 Relación con Productos

### Modelo `Product` (Fragmento Relevante)

```prisma
model Product {
  id          String   @id @default(uuid())
  tenantId    String   @db.Uuid
  categoryId  String   @db.Uuid  // ✅ OBLIGATORIO
  
  // Relación
  category    Category @relation(fields: [categoryId], references: [id])
  
  @@index([tenantId, categoryId])
}
```

### Validación en ProductsService

**Archivo**: `backend/src/modules/products/products.service.ts` (líneas 176-185)

```typescript
// ✅ EXCELENTE: Verifica que la categoría pertenezca al tenant
const category = await this.prisma.category.findFirst({
  where: { id: dto.categoryId, tenantId },
});

if (!category) {
  throw new NotFoundException(
    `Category not found or does not belong to this tenant`,
  );
}
```

### UI de Selección de Categoría

**Archivo**: `frontend/app/(dashboard)/inventory/products/new/page.tsx`

```tsx
// ✅ Carga categorías al montar el componente
useEffect(() => {
    const fetchCategories = async () => {
        try {
            const data = await CategoriesService.getAll()
            setCategories(data)
            // Auto-selecciona primera categoría
            if (data.length > 0) {
                setFormData(prev => ({ ...prev, categoryId: data[0].id }))
            }
        } catch (error) {
            console.error("Error fetching categories:", error)
        }
    }
    fetchCategories()
}, [])

// ✅ Selector de categoría
<Select
    value={formData.categoryId}
    onValueChange={(value) => handleChange('categoryId', value)}
>
    <SelectContent>
        {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
            </SelectItem>
        ))}
    </SelectContent>
</Select>
```

### 🚨 Limitaciones Actuales

1. **Sin Jerarquía Visual**: No muestra "Bebidas > Alcohólicas > Vodka"
2. **Sin Filtros**: No permite filtrar productos por categoría en listado
3. **Sin Breadcrumbs**: No hay navegación por categorías
4. **Sin Contador de Productos**: No muestra cuántos productos tiene cada categoría

---

## 🏗️ Arquitectura Multi-Tenant

### Seguridad Implementada

```typescript
// ✅ EXCELENTE: Decorador @RequireTenant() en controlador
@ApiTags('Categories')
@ApiBearerAuth()
@RequireTenant()  // ← Valida JWT y extrae tenantId
@Controller('categories')
export class CategoriesController {
  @Post()
  create(
    @ActiveTenant() tenant: ActiveTenantData,  // ← tenantId validado
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(tenant.tenantId, createCategoryDto);
  }
}
```

### Aislamiento de Datos

```typescript
// ✅ EXCELENTE: SIEMPRE filtra por tenantId
async findAll(tenantId: string) {
  return this.prisma.category.findMany({
    where: { tenantId },  // ← MANDATORY: Security filter
    orderBy: { name: 'asc' },
  });
}
```

### Constraint de Unicidad

```prisma
@@unique([tenantId, name, parentId])
```

**Permite**:
- Tenant A: "Bebidas" (root)
- Tenant B: "Bebidas" (root)
- Tenant A: "Bebidas" (hijo de "Alimentos")

**Previene**:
- Tenant A: "Bebidas" (root) duplicado

---

## 📈 Casos de Uso Reales

### Ejemplo: Hotel (BusinessType.HOTEL)

```
📁 Alimentos y Bebidas
  ├── 🍺 Bebidas
  │   ├── Alcohólicas
  │   │   ├── Cervezas
  │   │   ├── Vinos
  │   │   └── Licores
  │   └── No Alcohólicas
  │       ├── Refrescos
  │       └── Jugos
  ├── 🍞 Panadería
  └── 🥩 Carnes y Pescados

📁 Amenidades
  ├── Baño
  ├── Ropa de Cama
  └── Limpieza

📁 Mantenimiento
  ├── Herramientas
  └── Repuestos
```

### Ejemplo: Restaurante (BusinessType.RESTAURANT)

```
📁 Ingredientes
  ├── Proteínas
  ├── Vegetales
  └── Lácteos

📁 Bebidas
  ├── Bar
  └── Cocina

📁 Desechables
  ├── Empaques
  └── Utensilios
```

---

## 🎯 Recomendaciones de Implementación

### Prioridad Alta (P0)

1. **Endpoint de Árbol Jerárquico**
   ```typescript
   GET /api/v1/categories/tree
   // Respuesta:
   {
     "data": [
       {
         "id": "uuid-1",
         "name": "Bebidas",
         "children": [
           {
             "id": "uuid-2",
             "name": "Alcohólicas",
             "children": []
           }
         ]
       }
     ]
   }
   ```

2. **CRUD Completo en Backend**
   - `GET /categories/:id`
   - `PUT /categories/:id`
   - `DELETE /categories/:id` (soft delete con `isActive`)

3. **UI de Gestión de Categorías**
   - Página dedicada: `/settings/categories`
   - Árbol expandible/colapsable
   - Drag & drop para reordenar

### Prioridad Media (P1)

4. **Filtros en Productos**
   - Filtrar por categoría en `/inventory`
   - Breadcrumbs de navegación

5. **Validación de Jerarquía**
   - Prevenir ciclos (A → B → A)
   - Límite de profundidad (ej: 5 niveles)

6. **Contador de Productos**
   ```typescript
   interface CategoryWithCount {
     id: string;
     name: string;
     productCount: number;
     children: CategoryWithCount[];
   }
   ```

### Prioridad Baja (P2)

7. **Migración Masiva**
   - Importar categorías desde CSV/Excel
   - Mover productos entre categorías

8. **Analytics**
   - Categorías más usadas
   - Categorías sin productos

---

## 🔒 Consideraciones de Seguridad

### ✅ Implementado Correctamente

1. **Aislamiento por Tenant**: Todas las queries incluyen `tenantId`
2. **Validación de Ownership**: Verifica que categoría pertenezca al tenant antes de asignar a producto
3. **Cascade Delete**: Si se elimina tenant, se eliminan sus categorías

### ⚠️ Pendiente

1. **Validación de Permisos por Rol**
   ```typescript
   // Solo ADMIN/OWNER pueden crear/editar categorías
   @Roles(UserRole.ADMIN, UserRole.OWNER)
   @Post()
   create(...) { }
   ```

2. **Auditoría de Cambios**
   - Registrar quién creó/modificó cada categoría
   - Historial de cambios de nombre

---

## 📊 Métricas de Calidad del Código

| Aspecto | Calificación | Comentario |
|---------|--------------|------------|
| **Type Safety** | 9/10 | Excelente uso de TypeScript y Prisma |
| **Security** | 8/10 | Multi-tenancy sólido, falta RBAC |
| **Scalability** | 7/10 | Funciona bien, pero sin paginación |
| **UX** | 4/10 | Funcionalidad básica, falta jerarquía visual |
| **Completitud** | 5/10 | CRUD incompleto, sin gestión avanzada |

---

## 🚀 Roadmap Sugerido

### Fase 1: Completar CRUD (1-2 días)
- [ ] Endpoints: GET/:id, PUT/:id, DELETE/:id
- [ ] Actualizar DTOs con `parentId` y `sortOrder`
- [ ] Tests unitarios

### Fase 2: UI de Gestión (2-3 días)
- [ ] Página `/settings/categories`
- [ ] Componente de árbol jerárquico
- [ ] Modal de creación/edición con selector de padre

### Fase 3: Integración Avanzada (1-2 días)
- [ ] Filtros por categoría en inventario
- [ ] Breadcrumbs de navegación
- [ ] Contador de productos por categoría

### Fase 4: Optimizaciones (1 día)
- [ ] Paginación en listados
- [ ] Caché de árbol de categorías
- [ ] Validación de ciclos

---

## 🎨 Mockup de UI Sugerida (The Vibe)

### Página de Gestión de Categorías

```
┌─────────────────────────────────────────────────────────────┐
│ 🏷️ Categorías de Productos                    [+ Nueva]    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🔍 Buscar categorías...                                    │
│                                                              │
│  📁 Alimentos y Bebidas (45 productos)          [···]       │
│    ├── 🍺 Bebidas (23)                          [···]       │
│    │   ├── Alcohólicas (12)                     [···]       │
│    │   └── No Alcohólicas (11)                  [···]       │
│    └── 🍞 Panadería (22)                        [···]       │
│                                                              │
│  📁 Amenidades (78 productos)                   [···]       │
│    ├── Baño (34)                                [···]       │
│    └── Ropa de Cama (44)                        [···]       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Características del Diseño**:
- ✨ Glassmorphism en cards
- 🎨 Color coding por nivel (degradado de primary)
- 🔄 Drag & drop para reordenar
- 📊 Contador de productos en tiempo real
- 🎭 Micro-animaciones en expand/collapse

---

## 📝 Conclusión

El sistema de categorías de **Clarigo** tiene una **base sólida** en términos de arquitectura de datos y seguridad multi-tenant. Sin embargo, está **sub-utilizado** debido a la falta de:

1. **CRUD completo** en backend
2. **UI de gestión** dedicada
3. **Visualización jerárquica** en frontend

**Recomendación**: Priorizar la **Fase 1 y 2** del roadmap para desbloquear el potencial completo del sistema y mejorar significativamente la experiencia del usuario.

---

> **Próximos Pasos**: ¿Deseas que implemente alguna de las fases del roadmap? Puedo empezar por:
> - A) Completar endpoints de backend (GET/:id, PUT/:id, DELETE/:id)
> - B) Crear la UI de gestión de categorías
> - C) Implementar el árbol jerárquico en el selector de productos
