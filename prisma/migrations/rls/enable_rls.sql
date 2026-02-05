-- =====================================================
-- Row-Level Security (RLS) Migration for Clarigo
-- Multi-Tenant Inventory System (CORRECTED VERSION)
-- =====================================================
-- 
-- IMPORTANT: Column names use camelCase, not snake_case
-- Run this BEFORE switching to the non-superuser role.
-- Run as superuser (postgres)
-- =====================================================

-- =====================================================
-- STEP 1: Create Application Role (if not exists)
-- =====================================================

-- Create the application role (no superuser, no bypass RLS)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'clarigo_app') THEN
        CREATE ROLE clarigo_app WITH 
            LOGIN 
            PASSWORD 'clarigo_secure_password_2026'
            NOSUPERUSER 
            NOCREATEDB 
            NOCREATEROLE
            NOREPLICATION;
    END IF;
END
$$;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO clarigo_app;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO clarigo_app;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO clarigo_app;

-- Make grants apply to future tables too
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO clarigo_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO clarigo_app;

-- =====================================================
-- STEP 2: Enable RLS on All Tenant-Scoped Tables
-- =====================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE products FORCE ROW LEVEL SECURITY;

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories FORCE ROW LEVEL SECURITY;

ALTER TABLE product_families ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_families FORCE ROW LEVEL SECURITY;

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers FORCE ROW LEVEL SECURITY;

ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses FORCE ROW LEVEL SECURITY;

ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches FORCE ROW LEVEL SECURITY;

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements FORCE ROW LEVEL SECURITY;

ALTER TABLE inventory_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_audits FORCE ROW LEVEL SECURITY;

ALTER TABLE inventory_audit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_audit_items FORCE ROW LEVEL SECURITY;

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders FORCE ROW LEVEL SECURITY;

ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items FORCE ROW LEVEL SECURITY;

ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_payable FORCE ROW LEVEL SECURITY;

ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records FORCE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 3: Create RLS Policies (using camelCase column names)
-- =====================================================

-- ----- PRODUCTS -----
DROP POLICY IF EXISTS tenant_isolation_select ON products;
DROP POLICY IF EXISTS tenant_isolation_insert ON products;
DROP POLICY IF EXISTS tenant_isolation_update ON products;
DROP POLICY IF EXISTS tenant_isolation_delete ON products;

CREATE POLICY tenant_isolation_select ON products
    FOR SELECT
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_insert ON products
    FOR INSERT
    WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_update ON products
    FOR UPDATE
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid)
    WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_delete ON products
    FOR DELETE
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

-- ----- CATEGORIES -----
DROP POLICY IF EXISTS tenant_isolation_select ON categories;
DROP POLICY IF EXISTS tenant_isolation_insert ON categories;
DROP POLICY IF EXISTS tenant_isolation_update ON categories;
DROP POLICY IF EXISTS tenant_isolation_delete ON categories;

CREATE POLICY tenant_isolation_select ON categories
    FOR SELECT
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_insert ON categories
    FOR INSERT
    WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_update ON categories
    FOR UPDATE
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid)
    WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_delete ON categories
    FOR DELETE
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

-- ----- PRODUCT_FAMILIES -----
DROP POLICY IF EXISTS tenant_isolation_select ON product_families;
DROP POLICY IF EXISTS tenant_isolation_insert ON product_families;
DROP POLICY IF EXISTS tenant_isolation_update ON product_families;
DROP POLICY IF EXISTS tenant_isolation_delete ON product_families;

CREATE POLICY tenant_isolation_select ON product_families
    FOR SELECT
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_insert ON product_families
    FOR INSERT
    WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_update ON product_families
    FOR UPDATE
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid)
    WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_delete ON product_families
    FOR DELETE
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

-- ----- SUPPLIERS -----
DROP POLICY IF EXISTS tenant_isolation_select ON suppliers;
DROP POLICY IF EXISTS tenant_isolation_insert ON suppliers;
DROP POLICY IF EXISTS tenant_isolation_update ON suppliers;
DROP POLICY IF EXISTS tenant_isolation_delete ON suppliers;

CREATE POLICY tenant_isolation_select ON suppliers
    FOR SELECT
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_insert ON suppliers
    FOR INSERT
    WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_update ON suppliers
    FOR UPDATE
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid)
    WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_delete ON suppliers
    FOR DELETE
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

-- ----- WAREHOUSES -----
DROP POLICY IF EXISTS tenant_isolation_select ON warehouses;
DROP POLICY IF EXISTS tenant_isolation_insert ON warehouses;
DROP POLICY IF EXISTS tenant_isolation_update ON warehouses;
DROP POLICY IF EXISTS tenant_isolation_delete ON warehouses;

CREATE POLICY tenant_isolation_select ON warehouses
    FOR SELECT
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_insert ON warehouses
    FOR INSERT
    WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_update ON warehouses
    FOR UPDATE
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid)
    WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_delete ON warehouses
    FOR DELETE
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

-- ----- BATCHES -----
DROP POLICY IF EXISTS tenant_isolation_select ON batches;
DROP POLICY IF EXISTS tenant_isolation_insert ON batches;
DROP POLICY IF EXISTS tenant_isolation_update ON batches;
DROP POLICY IF EXISTS tenant_isolation_delete ON batches;

CREATE POLICY tenant_isolation_select ON batches
    FOR SELECT
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_insert ON batches
    FOR INSERT
    WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_update ON batches
    FOR UPDATE
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid)
    WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_delete ON batches
    FOR DELETE
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

-- ----- INVENTORY_MOVEMENTS -----
DROP POLICY IF EXISTS tenant_isolation_select ON inventory_movements;
DROP POLICY IF EXISTS tenant_isolation_insert ON inventory_movements;
DROP POLICY IF EXISTS tenant_isolation_update ON inventory_movements;
DROP POLICY IF EXISTS tenant_isolation_delete ON inventory_movements;

CREATE POLICY tenant_isolation_select ON inventory_movements
    FOR SELECT
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_insert ON inventory_movements
    FOR INSERT
    WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_update ON inventory_movements
    FOR UPDATE
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid)
    WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_delete ON inventory_movements
    FOR DELETE
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

-- ----- INVENTORY_AUDITS -----
DROP POLICY IF EXISTS tenant_isolation_select ON inventory_audits;
DROP POLICY IF EXISTS tenant_isolation_insert ON inventory_audits;
DROP POLICY IF EXISTS tenant_isolation_update ON inventory_audits;
DROP POLICY IF EXISTS tenant_isolation_delete ON inventory_audits;

CREATE POLICY tenant_isolation_select ON inventory_audits
    FOR SELECT
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_insert ON inventory_audits
    FOR INSERT
    WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_update ON inventory_audits
    FOR UPDATE
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid)
    WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_delete ON inventory_audits
    FOR DELETE
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

-- ----- INVENTORY_AUDIT_ITEMS -----
DROP POLICY IF EXISTS tenant_isolation_select ON inventory_audit_items;
DROP POLICY IF EXISTS tenant_isolation_insert ON inventory_audit_items;
DROP POLICY IF EXISTS tenant_isolation_update ON inventory_audit_items;
DROP POLICY IF EXISTS tenant_isolation_delete ON inventory_audit_items;

CREATE POLICY tenant_isolation_select ON inventory_audit_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM inventory_audits ia 
            WHERE ia.id = inventory_audit_items."auditId" 
            AND ia."tenantId" = current_setting('app.current_tenant_id', true)::uuid
        )
    );

CREATE POLICY tenant_isolation_insert ON inventory_audit_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM inventory_audits ia 
            WHERE ia.id = inventory_audit_items."auditId" 
            AND ia."tenantId" = current_setting('app.current_tenant_id', true)::uuid
        )
    );

CREATE POLICY tenant_isolation_update ON inventory_audit_items
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM inventory_audits ia 
            WHERE ia.id = inventory_audit_items."auditId" 
            AND ia."tenantId" = current_setting('app.current_tenant_id', true)::uuid
        )
    );

CREATE POLICY tenant_isolation_delete ON inventory_audit_items
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM inventory_audits ia 
            WHERE ia.id = inventory_audit_items."auditId" 
            AND ia."tenantId" = current_setting('app.current_tenant_id', true)::uuid
        )
    );

-- ----- PURCHASE_ORDERS -----
DROP POLICY IF EXISTS tenant_isolation_select ON purchase_orders;
DROP POLICY IF EXISTS tenant_isolation_insert ON purchase_orders;
DROP POLICY IF EXISTS tenant_isolation_update ON purchase_orders;
DROP POLICY IF EXISTS tenant_isolation_delete ON purchase_orders;

CREATE POLICY tenant_isolation_select ON purchase_orders
    FOR SELECT
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_insert ON purchase_orders
    FOR INSERT
    WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_update ON purchase_orders
    FOR UPDATE
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid)
    WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_delete ON purchase_orders
    FOR DELETE
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

-- ----- PURCHASE_ORDER_ITEMS -----
DROP POLICY IF EXISTS tenant_isolation_select ON purchase_order_items;
DROP POLICY IF EXISTS tenant_isolation_insert ON purchase_order_items;
DROP POLICY IF EXISTS tenant_isolation_update ON purchase_order_items;
DROP POLICY IF EXISTS tenant_isolation_delete ON purchase_order_items;

CREATE POLICY tenant_isolation_select ON purchase_order_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM purchase_orders po 
            WHERE po.id = purchase_order_items."orderId" 
            AND po."tenantId" = current_setting('app.current_tenant_id', true)::uuid
        )
    );

CREATE POLICY tenant_isolation_insert ON purchase_order_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM purchase_orders po 
            WHERE po.id = purchase_order_items."orderId" 
            AND po."tenantId" = current_setting('app.current_tenant_id', true)::uuid
        )
    );

CREATE POLICY tenant_isolation_update ON purchase_order_items
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM purchase_orders po 
            WHERE po.id = purchase_order_items."orderId" 
            AND po."tenantId" = current_setting('app.current_tenant_id', true)::uuid
        )
    );

CREATE POLICY tenant_isolation_delete ON purchase_order_items
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM purchase_orders po 
            WHERE po.id = purchase_order_items."orderId" 
            AND po."tenantId" = current_setting('app.current_tenant_id', true)::uuid
        )
    );

-- ----- ACCOUNTS_PAYABLE -----
DROP POLICY IF EXISTS tenant_isolation_select ON accounts_payable;
DROP POLICY IF EXISTS tenant_isolation_insert ON accounts_payable;
DROP POLICY IF EXISTS tenant_isolation_update ON accounts_payable;
DROP POLICY IF EXISTS tenant_isolation_delete ON accounts_payable;

CREATE POLICY tenant_isolation_select ON accounts_payable
    FOR SELECT
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_insert ON accounts_payable
    FOR INSERT
    WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_update ON accounts_payable
    FOR UPDATE
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid)
    WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_delete ON accounts_payable
    FOR DELETE
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

-- ----- PAYMENT_RECORDS -----
DROP POLICY IF EXISTS tenant_isolation_select ON payment_records;
DROP POLICY IF EXISTS tenant_isolation_insert ON payment_records;
DROP POLICY IF EXISTS tenant_isolation_update ON payment_records;
DROP POLICY IF EXISTS tenant_isolation_delete ON payment_records;

CREATE POLICY tenant_isolation_select ON payment_records
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM accounts_payable ap 
            WHERE ap.id = payment_records."payableId" 
            AND ap."tenantId" = current_setting('app.current_tenant_id', true)::uuid
        )
    );

CREATE POLICY tenant_isolation_insert ON payment_records
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM accounts_payable ap 
            WHERE ap.id = payment_records."payableId" 
            AND ap."tenantId" = current_setting('app.current_tenant_id', true)::uuid
        )
    );

CREATE POLICY tenant_isolation_update ON payment_records
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM accounts_payable ap 
            WHERE ap.id = payment_records."payableId" 
            AND ap."tenantId" = current_setting('app.current_tenant_id', true)::uuid
        )
    );

CREATE POLICY tenant_isolation_delete ON payment_records
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM accounts_payable ap 
            WHERE ap.id = payment_records."payableId" 
            AND ap."tenantId" = current_setting('app.current_tenant_id', true)::uuid
        )
    );

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'products', 'categories', 'product_families', 'suppliers',
    'warehouses', 'batches', 'inventory_movements', 'inventory_audits',
    'inventory_audit_items', 'purchase_orders', 'purchase_order_items',
    'accounts_payable', 'payment_records'
)
ORDER BY tablename;

SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;
