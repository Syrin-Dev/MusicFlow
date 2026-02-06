'use client';
import { Sidebar } from '@/components/Sidebar';
import { PlayerBar } from '@/components/PlayerBar';
import { Header } from '@/components/Header';
import { GenreBubbles } from '@/components/GenreBubbles';
import { AmbientBackground } from '@/components/AmbientBackground';
import { AudioProvider } from '@/components/AudioProvider';

export default function TestGlassPage() {
  return (
    <AudioProvider>
        <div className="relative min-h-screen bg-transparent">
            <AmbientBackground />

            {/* Mimic MainLayout structure */}
            <div className="fixed left-0 top-0 bottom-0">
                 <Sidebar />
            </div>

            <main className="ml-64 relative">
                <Header />
                <div className="px-6 py-4">
                    <GenreBubbles selectedGenre="All" />
                    <div className="mt-8 text-white p-4 glass-panel rounded-xl">
                        <h1 className="text-4xl font-bold mb-4">Content Area</h1>
                        <p className="text-zinc-400">
                            The ambient glow should flow smoothly behind the sidebar, header, and player bar.
                            The category chips above should float without a dark box container.
                        </p>
                    </div>
                </div>
            </main>

            <PlayerBar />
        </div>
    </AudioProvider>
  );
}
