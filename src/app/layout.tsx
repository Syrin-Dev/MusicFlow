import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';

const font = Plus_Jakarta_Sans({
    subsets: ['latin'],
    display: 'swap',
});
import { Toaster } from 'sonner';

export const metadata: Metadata = {
    title: {
        default: 'Hievly - Premium Music Streaming',
        template: '%s | Hievly'
    },
    description: 'Experience premium music streaming with Hievly. Ad-free, high quality, and personalized for you.',
    manifest: '/manifest.json',
    icons: {
        icon: '/logo.png',
        apple: '/logo.png',
    },
    keywords: ['music', 'streaming', 'hievly', 'premium', 'audio', 'songs', 'playlists'],
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://hievly.com',
        title: 'Hievly - Premium Music Streaming',
        description: 'Experience premium music streaming with Hievly.',
        siteName: 'Hievly',
    },
    twitter: {
        card: 'summary_large_image',
    }
};

export const viewport: Viewport = {
    themeColor: '#0A0A0B',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <meta name="impact-site-verification" content="fdf98f23-909d-454c-af63-486b8614ec38" />
                <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,1,0"
                    rel="stylesheet"
                />
            </head>
            <body className={`${font.className} bg-[#0d0d0f] text-white h-screen overflow-hidden`} suppressHydrationWarning>
                <Providers>
                    {children}
                    <Toaster position="bottom-right" theme="dark" closeButton />
                </Providers>
            </body>
        </html>
    );
}
