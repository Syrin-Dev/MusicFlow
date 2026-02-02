import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismadb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

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

        // Create the listening event
        const event = await prisma.listeningEvent.create({
            data: {
                userId: user.id,
                videoId,
                title,
                artist,
                playDuration: Math.round(playDuration),
                totalDuration: Math.round(totalDuration),
                completionRate,
                skipped: skipped || false,
                liked: liked || false,
                hourOfDay,
                dayOfWeek,
                endedAt: now
            }
        });

        // Update artist affinity scores
        await updateArtistAffinity(user.id, artist, {
            playDuration: Math.round(playDuration),
            completionRate,
            skipped: skipped || false,
            liked: liked || false
        });

        return NextResponse.json({ success: true, eventId: event.id });
    } catch (error) {
        console.error('Listening event error:', error);
        return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
    }
}

// Update or create artist affinity scores
async function updateArtistAffinity(
    userId: string,
    artist: string,
    metrics: { playDuration: number; completionRate: number; skipped: boolean; liked: boolean }
) {
    const existing = await prisma.artistAffinity.findUnique({
        where: { userId_artist: { userId, artist } }
    });

    if (existing) {
        // Update existing affinity
        const newPlayCount = existing.playCount + 1;
        const newTotalListenTime = existing.totalListenTime + metrics.playDuration;
        const newLikeCount = existing.likeCount + (metrics.liked ? 1 : 0);
        const newSkipCount = existing.skipCount + (metrics.skipped ? 1 : 0);

        // Running average for completion rate
        const newAvgCompletion = (existing.avgCompletion * existing.playCount + metrics.completionRate) / newPlayCount;

        // Calculate affinity score using weighted formula
        // Based on the document: engagement + satisfaction - negative signals
        const affinityScore = calculateAffinityScore({
            playCount: newPlayCount,
            totalListenTime: newTotalListenTime,
            likeCount: newLikeCount,
            skipCount: newSkipCount,
            avgCompletion: newAvgCompletion
        });

        await prisma.artistAffinity.update({
            where: { id: existing.id },
            data: {
                playCount: newPlayCount,
                totalListenTime: newTotalListenTime,
                likeCount: newLikeCount,
                skipCount: newSkipCount,
                avgCompletion: newAvgCompletion,
                affinityScore
            }
        });
    } else {
        // Create new affinity record
        const affinityScore = calculateAffinityScore({
            playCount: 1,
            totalListenTime: metrics.playDuration,
            likeCount: metrics.liked ? 1 : 0,
            skipCount: metrics.skipped ? 1 : 0,
            avgCompletion: metrics.completionRate
        });

        await prisma.artistAffinity.create({
            data: {
                userId,
                artist,
                playCount: 1,
                totalListenTime: metrics.playDuration,
                likeCount: metrics.liked ? 1 : 0,
                skipCount: metrics.skipped ? 1 : 0,
                avgCompletion: metrics.completionRate,
                affinityScore
            }
        });
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

        // Get top artists by affinity
        const topArtists = await prisma.artistAffinity.findMany({
            where: { userId: user.id },
            orderBy: { affinityScore: 'desc' },
            take: 20
        });

        // Get recent listening events
        const recentEvents = await prisma.listeningEvent.findMany({
            where: { userId: user.id },
            orderBy: { startedAt: 'desc' },
            take: 50
        });

        // Calculate listening patterns
        const hourlyDistribution = new Array(24).fill(0);
        recentEvents.forEach(event => {
            hourlyDistribution[event.hourOfDay]++;
        });

        return NextResponse.json({
            topArtists,
            recentEventsCount: recentEvents.length,
            hourlyDistribution,
            totalListeningTime: topArtists.reduce((sum, a) => sum + a.totalListenTime, 0)
        });
    } catch (error) {
        console.error('Get listening stats error:', error);
        return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 });
    }
}
