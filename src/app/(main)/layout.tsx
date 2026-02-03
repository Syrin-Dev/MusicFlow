import type { Metadata, Viewport } from 'next';
import '../globals.css';
import { Sidebar } from '@/components/Sidebar';
import { PlayerBar } from '@/components/PlayerBar';
import { AudioProvider } from '@/components/AudioProvider';
import { Providers } from '@/components/Providers';
import { ExpandedPlayer } from '@/components/ExpandedPlayer';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';

export const metadata: Metadata = {
    title: 'Hievly - Premium Music Streaming',
    description: 'Experience premium music streaming with Hievly',
    manifest: '/manifest.json',
};

export const viewport: Viewport = {
    themeColor: '#0A0A0B',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,1,0"
                    rel="stylesheet"
                />
            </head>
            <body className="bg-[#0d0d0f] text-white h-screen overflow-hidden flex" suppressHydrationWarning>
                <Providers>
                    <AudioProvider>
                        <div className="hidden md:block">
                            <Sidebar />
                        </div>

                        <main className="flex-1 md:ml-64 ml-0 h-full overflow-y-auto relative hide-scrollbar custom-scrollbar pb-[calc(160px+env(safe-area-inset-bottom))] md:pb-28">
                            <Header />
                            {children}
                        </main>

                        <PlayerBar />
                        <MobileNav />
                        <ExpandedPlayer />
                    </AudioProvider>
                </Providers>
            </body>
        </html>
    );
}
