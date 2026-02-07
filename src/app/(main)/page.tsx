'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Hero } from '@/components/Hero';
import { DailyMixes } from '@/components/DailyMixes';
import { RecommendedGrid } from '@/components/RecommendedGrid';
import { QuickPicks } from '@/components/QuickPicks';
import { MusicVideos } from '@/components/MusicVideos';
import { ListenAgain } from '@/components/ListenAgain';
import { GenreBubbles } from '@/components/GenreBubbles';
import { useAudio } from '@/components/AudioProvider';

// GenreFilteredView Component
function GenreFilteredView({ query }: { query: string }) {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { playTrack, addToQueue, openConnect } = useAudio();

  useEffect(() => {
    const fetchGenreTracks = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (Array.isArray(data)) setTracks(data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchGenreTracks();
  }, [query]);

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      playTrack(tracks[0]);
      tracks.slice(1).forEach(t => addToQueue(t));
    }
  };

  const genreName = query.replace(' music', '').replace(' songs', '').replace(' podcast', '');

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 min-h-[70vh]">
      {/* Genre Header Section */}
      <div className="relative p-8 md:p-16 rounded-[2rem] md:rounded-[3rem] overflow-hidden group border border-white/5 bg-gradient-to-br from-white/5 to-transparent">
        <div className="absolute inset-0 bg-primary/10 blur-[100px] -z-10 animate-pulse"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8">
          <div className="space-y-3 md:space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
              Curated Mix
            </div>
            <h2 className="text-4xl md:text-7xl font-black text-white tracking-tighter capitalize leading-none">
              {genreName}
            </h2>
            <p className="text-zinc-500 text-sm md:text-lg max-w-md font-bold">
              The best of {genreName} music, tailored to your listening habits and mood.
            </p>
            <div className="flex items-center gap-2 text-zinc-600 text-[10px] md:text-sm font-black uppercase tracking-widest">
              <span className="material-icons-round text-lg">audiotrack</span>
              {tracks.length} Songs • 45m of magic
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handlePlayAll}
              disabled={loading || tracks.length === 0}
              className="flex-1 md:flex-none px-8 md:px-10 py-4 md:py-5 bg-white text-black rounded-full font-black text-lg md:text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-white/10 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              <span className="material-icons-round text-2xl md:text-3xl">play_arrow</span>
              PLAY ALL
            </button>
            <button className="p-4 md:p-5 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all">
              <span className="material-icons-round text-2xl">favorite_border</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="animate-pulse space-y-4">
              <div className="aspect-square bg-white/5 rounded-3xl"></div>
              <div className="h-5 bg-white/5 rounded-full w-3/4"></div>
              <div className="h-4 bg-white/5 rounded-full w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-8">
          {tracks.map((track, i) => (
            <div
              key={i}
              className="group relative space-y-3 md:space-y-4"
            >
              <div className="relative aspect-square overflow-hidden rounded-2xl md:rounded-[2rem] bg-zinc-900 border border-white/5 shadow-xl transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:shadow-primary/20">
                <Image
                  src={track.thumbnail || `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`}
                  alt={track.title}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                  unoptimized={!track.thumbnail?.includes('i.ytimg.com')}
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-[2px]">
                  <button
                    onClick={() => playTrack(track)}
                    className="relative z-10 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white shadow-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-300 hover:scale-110 active:scale-95"
                  >
                    <span className="material-icons-round text-3xl">play_arrow</span>
                  </button>
                  <button
                    onClick={() => openConnect(track)}
                    className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75 hover:bg-white/10"
                  >
                    <span className="material-icons-round">share</span>
                  </button>
                </div>
              </div>
              <div className="px-2">
                <h4 className="font-bold text-white truncate text-base group-hover:text-primary transition-colors">{track.title}</h4>
                <p className="text-xs text-zinc-500 truncate mt-1 font-medium">{track.artist}</p>
              </div>
            </div>
          ))}
          {tracks.length === 0 && !loading && (
            <div className="col-span-full text-center py-40 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
              <span className="material-icons-round text-5xl text-zinc-600 mb-4">search_off</span>
              <p className="text-zinc-500 font-bold">No tracks found for this mood.</p>
              <button onClick={() => window.location.reload()} className="text-primary mt-4 hover:underline">Try another genre</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}



export default function Home() {
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [genreQuery, setGenreQuery] = useState('all');

  const handleGenreSelect = (label: string, value: string) => {
    setSelectedGenre(label);
    setGenreQuery(value);
  };

  return (
    <>
      <div suppressHydrationWarning className="px-4 md:px-8 pb-32 space-y-12 pt-4 md:pt-8 transition-all">

        {/* Genre Bubbles - Full width sticky bar */}
        <div className="-mx-4 md:-mx-8">
          <GenreBubbles selectedGenre={selectedGenre} onGenreSelect={handleGenreSelect} />
        </div>

        {selectedGenre === 'All' ? (
          <div className="space-y-20 animate-in fade-in duration-700 delay-100">
            <Hero />

            <div className="space-y-24">
              <DailyMixes />

              <RecommendedGrid />
              <QuickPicks />
              <MusicVideos />
              <ListenAgain />
            </div>
          </div>
        ) : (
          <GenreFilteredView query={genreQuery} />
        )}
      </div>
    </>
  );
}
