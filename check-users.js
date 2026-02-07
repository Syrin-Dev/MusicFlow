const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany({
            select: { email: true }
        });
        console.log('Users found:', users.map(u => ({ email: u.email })));
    } catch (e) {
        console.error('Prisma test error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
