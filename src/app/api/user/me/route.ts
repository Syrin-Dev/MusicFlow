
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prismadb';
import { authOptions } from '@/lib/auth';
import { nanoid } from 'nanoid';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        let user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, name: true, email: true, image: true, inviteCode: true }
        });

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Generate invite code if missing
        if (!user.inviteCode) {
            const newCode = nanoid(10); // 10 chars
            user = await prisma.user.update({
                where: { email: session.user.email },
                data: { inviteCode: newCode },
                select: { id: true, name: true, email: true, image: true, inviteCode: true }
            });
        }

        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
