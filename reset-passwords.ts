import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const newPassword = 'password123';
    const passwordHash = await bcrypt.hash(newPassword, 10);

    const emails = [
        'admin@fazt-inventory.com',
        'admin@hotelzeus.com',
        'pherceai@gmail.com'
    ];

    console.log(`🔐 Restableciendo contraseñas a: ${newPassword}\n`);

    for (const email of emails) {
        try {
            await prisma.user.update({
                where: { email },
                data: { passwordHash }
            });
            console.log(`✅ Contraseña actualizada para: ${email}`);
        } catch (error) {
            console.error(`❌ No se pudo actualizar a ${email}: (¿Existe el usuario?)`);
        }
    }

    console.log('\n🎉 Proceso completado.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
