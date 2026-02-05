const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.user.count();
        console.log('User count:', count);
    } catch (e) {
        console.error('Prisma test error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
