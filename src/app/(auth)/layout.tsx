import type { Metadata } from 'next';

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
        <>
            {children}
        </>
    );
}
