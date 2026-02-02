import type { Metadata } from 'next';
import '../globals.css';
import { Sidebar } from '@/components/Sidebar';
import { PlayerBar } from '@/components/PlayerBar';
import { AudioProvider } from '@/components/AudioProvider';
import { Providers } from '@/components/Providers';
import { ExpandedPlayer } from '@/components/ExpandedPlayer';
import { Header } from '@/components/Header';

export const metadata: Metadata = {
    title: 'StreamFlow - Premium Music Streaming',
    description: 'Experience premium music streaming with StreamFlow',
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
                        <Sidebar />
                        <main className="flex-1 ml-64 h-full overflow-y-auto relative hide-scrollbar custom-scrollbar pb-28">
                            <Header />
                            {children}
                        </main>
                        <PlayerBar />
                        <ExpandedPlayer />
                    </AudioProvider>
                </Providers>
            </body>
        </html>
    );
}
