import { Sidebar } from '@/components/Sidebar';
import { PlayerBar } from '@/components/PlayerBar';
import { AudioProvider } from '@/components/AudioProvider';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { AmbientBackground } from '@/components/AmbientBackground';
import { DynamicOverlays } from '@/components/DynamicOverlays';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AudioProvider>
            <AmbientBackground />

            <div className="hidden md:block">
                <Sidebar />
            </div>

            <main className="flex-1 md:ml-64 ml-0 h-full overflow-y-auto relative hide-scrollbar custom-scrollbar pb-[calc(160px+env(safe-area-inset-bottom))] md:pb-28">
                <Header />
                {children}
            </main>

            <PlayerBar />
            <MobileNav />
            <DynamicOverlays />
        </AudioProvider>
    );
}
