'use client';

import { useState, useEffect } from 'react';
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
  const { playTrack, addToQueue } = useAudio();

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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[50vh]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 capitalize">{query.replace(' music', '')} Mix</h2>
          <p className="text-zinc-400 text-sm">Top selections for your mood</p>
        </div>
        <button
          onClick={handlePlayAll}
          disabled={loading || tracks.length === 0}
          className="px-6 py-2 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform disabled:opacity-50"
        >
          Play All
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-white/5 rounded-xl mb-3"></div>
              <div className="h-4 bg-white/5 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-white/5 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {tracks.map((track, i) => (
            <div
              key={i}
              onClick={() => playTrack({
                id: track.id,
                title: track.title,
                artist: track.artist,
                thumbnail: track.thumbnail || `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`
              })}
              className="bg-white/5 p-4 rounded-2xl hover:bg-white/10 transition-all duration-300 cursor-pointer group hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20"
            >
              <div className="relative aspect-square mb-4 overflow-hidden rounded-xl bg-black/20 shadow-lg">
                <img
                  src={track.thumbnail || `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`}
                  alt={track.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <p className="font-bold text-white truncate text-lg">{track.title}</p>
              <p className="text-sm text-zinc-400 truncate mt-1 group-hover:text-zinc-300">{track.artist}</p>
            </div>
          ))}
          {tracks.length === 0 && !loading && (
            <div className="col-span-full text-center py-20 text-zinc-500">
              No tracks found for this genre.
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
      {/* 
        Adjusted top padding so content sits nicely below sticky header.
        Removed huge spacing to avoid layout gaps.
      */}
      <div className="px-8 pb-32 space-y-10 pt-8 transition-all">

        {/* Genre Bubbles - Full width sticky bar */}
        <div className="-mx-8">
          <GenreBubbles selectedGenre={selectedGenre} onGenreSelect={handleGenreSelect} />
        </div>

        {selectedGenre === 'All' ? (
          <div className="space-y-16 animate-in fade-in duration-700 delay-100">
            <Hero />
            <DailyMixes />
            <div className="space-y-24">
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
