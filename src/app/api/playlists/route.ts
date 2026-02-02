import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismadb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Helper to get user email or dev fallback
async function getUserEmail() {
    const session = await getServerSession(authOptions);
    let email = session?.user?.email;

    if (!email && process.env.NODE_ENV !== 'production') {
        // Force create/get dev user
        try {
            const devUser = await prisma.user.upsert({
                where: { email: 'dev@example.com' },
                update: {},
                create: {
                    email: 'dev@example.com',
                    name: 'Dev User',
                    image: '',
                    emailVerified: new Date()
                }
            });
            console.log('✨ [DEV] Using Dev User:', devUser.email);
            return devUser.email;
        } catch (e) {
            console.error('Failed to upsert dev user', e);
            // Try fallback to any first user
            const firstUser = await prisma.user.findFirst();
            if (firstUser?.email) return firstUser.email;
        }
    }
    return email;
}

export async function GET() {
    try {
        const email = await getUserEmail();

        if (!email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const playlists = await prisma.playlist.findMany({
            where: { userId: user.id },
            include: {
                tracks: {
                    orderBy: { addedAt: 'desc' },
                    take: 4
                },
                _count: {
                    select: { tracks: true }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        return NextResponse.json(playlists);
    } catch (error) {
        console.error('Get playlists error:', error);
        return NextResponse.json({ error: 'Failed to get playlists' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const email = await getUserEmail();

        if (!email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { name } = await request.json();

        if (!name || !name.trim()) {
            return NextResponse.json({ error: 'Playlist name required' }, { status: 400 });
        }

        const playlist = await prisma.playlist.create({
            data: {
                userId: user.id,
                name: name.trim()
            }
        });

        return NextResponse.json(playlist);
    } catch (error) {
        console.error('Create playlist error:', error);
        return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 });
    }
}
