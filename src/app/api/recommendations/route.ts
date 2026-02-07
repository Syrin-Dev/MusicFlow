import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismadb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getRecommendations } from '@/lib/recommendations';

// Helper to get user email with dev fallback
async function getUserEmail() {
    const session = await getServerSession(authOptions);
    let email = session?.user?.email;

    if (!email && process.env.NODE_ENV !== 'production') {
        const firstUser = await prisma.user.findFirst();
        if (firstUser?.email) {
            email = firstUser.email;
        }
    }
    return email;
}

// Main recommendation endpoint
export async function GET(request: NextRequest) {
    try {
        const email = await getUserEmail();
        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get('limit') || '20');
        const context = searchParams.get('context') || 'home'; // home, workout, chill, etc.

        let userId: string | null = null;
        if (email) {
            const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
            userId = user?.id || null;
        }

        const results = await getRecommendations(userId, context, limit);

        return NextResponse.json(results);
    } catch (error) {
        console.error('Recommendations error:', error);
        return NextResponse.json({ error: 'Failed to get recommendations' }, { status: 500 });
    }
}
