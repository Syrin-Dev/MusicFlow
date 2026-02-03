import type { Metadata } from 'next';
import '../globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
    title: 'Login - Hievly',
    description: 'Sign in to Hievly - Premium Music Streaming',
};

export default function AuthLayout({
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
            <body className="bg-[#0d0d0f] text-white" suppressHydrationWarning>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
