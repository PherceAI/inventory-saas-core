import { PrismaClient } from '@prisma/client';

// Use superuser connection
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres:postgres@127.0.0.1:5432/inventory_saas?schema=public"
        }
    }
});

async function main() {
    console.log('🔧 Initializing Database Role: clarigo_app ...');
    try {
        // 1. Create Role
        await prisma.$executeRawUnsafe(`
      DO
      $do$
      BEGIN
         IF NOT EXISTS (
            SELECT FROM pg_catalog.pg_roles
            WHERE  rolname = 'clarigo_app') THEN

            CREATE ROLE clarigo_app WITH LOGIN PASSWORD 'clarigo_secure_password_2026';
            RAISE NOTICE 'Role clarigo_app created';
         ELSE
            RAISE NOTICE 'Role clarigo_app already exists';
         END IF;
      END
      $do$;
    `);
        console.log('✅ Role clarigo_app ready.');

        // 2. Grant Permissions
        console.log('🔑 Granting permissions...');
        await prisma.$executeRawUnsafe(`GRANT USAGE, CREATE ON SCHEMA public TO clarigo_app;`);
        await prisma.$executeRawUnsafe(`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO clarigo_app;`);
        await prisma.$executeRawUnsafe(`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO clarigo_app;`);
        await prisma.$executeRawUnsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO clarigo_app;`);
        await prisma.$executeRawUnsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO clarigo_app;`);

        // 3. Grant Superuser (Optional/Risk?) - No, just enough for CRUD.
        // However, RLS might require specific grants.
        // The previous audit report said "Creado rol clarigo_app sin privilegios de superusuario".

        console.log('✅ Permissions granted successfully.');

    } catch (e) {
        console.error('❌ Error initializing role:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
