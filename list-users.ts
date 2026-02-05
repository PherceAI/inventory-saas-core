import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        include: {
            tenants: {
                include: {
                    tenant: true
                }
            }
        }
    });

    const summary = users.map(u => ({
        email: u.email,
        name: `${u.firstName} ${u.lastName}`,
        tenants: u.tenants.map(t => t.tenant.name)
    }));

    console.log(JSON.stringify(summary, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
