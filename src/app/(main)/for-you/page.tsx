import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prismadb';
import { getRecommendations } from '@/lib/recommendations';
import { ForYouClient } from './ForYouClient';
import { searchMusic } from '@/lib/ytmusic';

export default async function ForYouPage({ searchParams }: { searchParams: Promise<{ context?: string }> }) {
    const sp = await searchParams;
    const context = sp.context || 'home';
    const limit = 24;

    const session = await getServerSession(authOptions);
    let userId: string | null = null;
    if (session?.user?.email) {
        const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
        userId = user?.id || null;
    }

    let recommendations: any[] = [];
    let personalized = false;

    try {
        const result = await getRecommendations(userId, context, limit);
        recommendations = result.recommendations;
        personalized = result.personalized;

        if (recommendations.length === 0) {
             // Fallback
             const fallbackData = await fetchTrendingFallback(context);
             recommendations = fallbackData;
             personalized = false;
        }
    } catch (e) {
        console.error("Recs failed", e);
        const fallbackData = await fetchTrendingFallback(context);
        recommendations = fallbackData;
        personalized = false;
    }

    return <ForYouClient recommendations={recommendations} personalized={personalized} context={context} />;
}

async function fetchTrendingFallback(ctx: string) {
    try {
        let query = 'Global Top 50';
        if (ctx === 'workout') query = 'Workout Motivation';
        if (ctx === 'chill') query = 'Chill Vibes';
        if (ctx === 'focus') query = 'Focus & Study';
        if (ctx === 'party') query = 'Party Hits 2024';

        const results = await searchMusic(query);
        return results.slice(0, 24).map(track => ({
            ...track,
            reason: 'Trending based on selection'
        }));
    } catch (e) {
        return [];
    }
}
