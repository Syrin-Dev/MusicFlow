import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismadb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

// POST: Record a listening event
export async function POST(request: NextRequest) {
    try {
        const email = await getUserEmail();
        if (!email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const body = await request.json();
        const {
            videoId,
            title,
            artist,
            playDuration,
            totalDuration,
            skipped,
            liked
        } = body;

        // Calculate metrics
        const completionRate = totalDuration > 0 ? Math.min(playDuration / totalDuration, 1) : 0;
        const now = new Date();
        const hourOfDay = now.getHours();
        const dayOfWeek = now.getDay();

        // 1. Ensure Track exists (Normalization)
        await prisma.track.upsert({
            where: { id: videoId },
            update: { title, artist, thumbnail: body.thumbnail || '' },
            create: { id: videoId, title, artist, thumbnail: body.thumbnail || '' }
        });

        // 2. Create the listening event
        const event = await prisma.listeningEvent.create({
            data: {
                userId: user.id,
                videoId,
                trackId: videoId,
                playDuration: Math.round(playDuration),
                totalDuration: Math.round(totalDuration),
                completionRate,
                skipped: skipped || false,
                liked: liked || false,
                hourOfDay,
                dayOfWeek,
                startedAt: now
            }
        });

        return NextResponse.json({ success: true, eventId: event.id });
    } catch (error) {
        console.error('Listening event error:', error);
        return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
    }
}

// Multi-objective affinity score calculation
// Inspired by the "Valued Watch Time" concept from the document
function calculateAffinityScore(metrics: {
    playCount: number;
    totalListenTime: number;
    likeCount: number;
    skipCount: number;
    avgCompletion: number;
}): number {
    // Weights for different objectives (tunable)
    const WEIGHTS = {
        engagement: 0.3,      // Play count and listen time
        satisfaction: 0.4,    // Likes and completion rate
        negative: 0.3         // Skip penalty
    };

    // Normalize metrics
    const engagementScore = Math.log1p(metrics.playCount) * 0.5 + Math.log1p(metrics.totalListenTime / 60) * 0.5;
    const satisfactionScore = (metrics.likeCount / Math.max(metrics.playCount, 1)) * 0.6 + metrics.avgCompletion * 0.4;
    const skipRate = metrics.skipCount / Math.max(metrics.playCount, 1);
    const negativePenalty = skipRate;

    // Final weighted score
    const score =
        WEIGHTS.engagement * engagementScore +
        WEIGHTS.satisfaction * satisfactionScore * 10 - // Scale up satisfaction
        WEIGHTS.negative * negativePenalty * 5;         // Penalize skips

    return Math.max(0, score); // Ensure non-negative
}

// GET: Retrieve user's listening stats
export async function GET() {
    try {
        const email = await getUserEmail();
        if (!email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Get recent listening events with track data
        const recentEvents = await prisma.listeningEvent.findMany({
            where: { userId: user.id },
            orderBy: { startedAt: 'desc' },
            include: { track: true },
            take: 50
        });

        // Calculate listening patterns
        const hourlyDistribution = new Array(24).fill(0);
        recentEvents.forEach((event: any) => {
            hourlyDistribution[event.hourOfDay]++;
        });

        return NextResponse.json({
            topArtists: [], // Calculated dynamically later or from Activity feed
            recentEventsCount: recentEvents.length,
            hourlyDistribution,
            totalListeningTime: 0
        });
    } catch (error) {
        console.error('Get listening stats error:', error);
        return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 });
    }
}
