'use client';

import { useState } from 'react';
import { GenreBubbles } from '@/components/GenreBubbles';
import { GenreFilteredView } from '@/components/GenreFilteredView';

export function HomeContent({ children }: { children: React.ReactNode }) {
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [genreQuery, setGenreQuery] = useState('all');

  const handleGenreSelect = (label: string, value: string) => {
    setSelectedGenre(label);
    setGenreQuery(value);
  };

  return (
      <div className="px-4 md:px-8 pb-32 space-y-12 pt-4 md:pt-8 transition-all">
        {/* Genre Bubbles - Full width sticky bar */}
        <div className="-mx-4 md:-mx-8">
          <GenreBubbles selectedGenre={selectedGenre} onGenreSelect={handleGenreSelect} />
        </div>

        {selectedGenre === 'All' ? (
           <div className="space-y-20 animate-in fade-in duration-700 delay-100">
              {children}
           </div>
        ) : (
          <GenreFilteredView query={genreQuery} />
        )}
      </div>
  );
}
