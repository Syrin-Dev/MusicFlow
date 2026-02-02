import { Header } from '@/components/Header';
import { RecommendedGrid } from '@/components/RecommendedGrid';
import { QuickPicks } from '@/components/QuickPicks';
import { MusicVideos } from '@/components/MusicVideos';
import { ListenAgain } from '@/components/ListenAgain';

export default function Home() {
  return (
    <>
      <div className="px-8 pb-32 space-y-10 pt-6">
        <RecommendedGrid />
        <QuickPicks />
        <MusicVideos />
        <ListenAgain />
      </div>
    </>
  );
}
