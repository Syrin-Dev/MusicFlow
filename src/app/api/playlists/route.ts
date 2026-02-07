import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismadb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Helper to get user email or dev fallback
async function getUserEmail() {
    const session = await getServerSession(authOptions);
    return session?.user?.email;
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
            where: {
                OR: [
                    { userId: user.id },
                    { members: { some: { userId: user.id } } }
                ]
            },
            include: {
                tracks: {
                    orderBy: { addedAt: 'desc' },
                    take: 4,
                    include: { track: true }
                },
                _count: {
                    select: { tracks: true }
                },
                members: {
                    include: { user: { select: { name: true, image: true } } }
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
                name: name.trim(),
                members: {
                    create: {
                        userId: user.id,
                        role: 'OWNER'
                    }
                }
            }
        });

        // Activity log
        await prisma.activity.create({
            data: {
                userId: user.id,
                type: 'PLAYLIST_CREATED',
                playlistId: playlist.id
            }
        });

        return NextResponse.json(playlist);
    } catch (error) {
        console.error('Create playlist error:', error);
        return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 });
    }
}
