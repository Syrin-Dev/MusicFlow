import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismadb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Add track to playlist
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id: playlistId } = await params;

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Verify playlist belongs to user
        const playlist = await prisma.playlist.findFirst({
            where: { id: playlistId, userId: user.id }
        });

        if (!playlist) {
            return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
        }

        const { videoId, title, artist, thumbnail } = await request.json();

        if (!videoId || !title) {
            return NextResponse.json({ error: 'Track data required' }, { status: 400 });
        }

        // 1. Ensure Track exists (Normalization)
        await prisma.track.upsert({
            where: { id: videoId },
            update: { title, artist, thumbnail },
            create: { id: videoId, title, artist, thumbnail }
        });

        // 2. Add track to playlist
        const track = await prisma.playlistTrack.upsert({
            where: {
                playlistId_videoId: {
                    playlistId,
                    videoId
                }
            },
            create: {
                playlistId,
                videoId,
                trackId: videoId
            },
            update: {}
        });

        // 3. Log Activity
        await prisma.activity.create({
            data: {
                userId: user.id,
                type: 'TRACK_PLAYED', // Could use a custom type but let's stick to these for now
                trackId: videoId,
                playlistId
            }
        });

        // Update playlist thumbnail if first track
        if (!playlist.thumbnail) {
            await prisma.playlist.update({
                where: { id: playlistId },
                data: { thumbnail: thumbnail || '' }
            });
        }

        return NextResponse.json(track);
    } catch (error) {
        console.error('Add to playlist error:', error);
        return NextResponse.json({ error: 'Failed to add track' }, { status: 500 });
    }
}

// Get playlist tracks
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: playlistId } = await params;

        const playlist = await prisma.playlist.findUnique({
            where: { id: playlistId },
            include: {
                tracks: {
                    orderBy: { addedAt: 'desc' }
                },
                user: {
                    select: { name: true }
                }
            }
        });

        if (!playlist) {
            return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
        }

        return NextResponse.json(playlist);
    } catch (error) {
        console.error('Get playlist error:', error);
        return NextResponse.json({ error: 'Failed to get playlist' }, { status: 500 });
    }
}

// Delete playlist
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id: playlistId } = await params;

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Delete only if belongs to user
        await prisma.playlist.deleteMany({
            where: { id: playlistId, userId: user.id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete playlist error:', error);
        return NextResponse.json({ error: 'Failed to delete playlist' }, { status: 500 });
    }
}
