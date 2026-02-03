'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock } from 'lucide-react';

const artistImages = [
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200',
    'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1200',
    'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200',
];

// SVG Icons
const MailIcon = () => (
    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const LockIcon = () => (
    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

const EyeIcon = ({ open }: { open: boolean }) => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        ) : (
            <>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </>
        )}
    </svg>
);

const MusicIcon = () => (
    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
);

export default function LoginPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/');
        }
    }, [status, router]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % artistImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const animateGlow = () => {
            const time = Date.now() / 3000;
            setGlowPosition({
                x: 50 + Math.sin(time) * 20,
                y: 50 + Math.cos(time * 0.7) * 20,
            });
        };
        const interval = setInterval(animateGlow, 50);
        return () => clearInterval(interval);
    }, []);

    const handleGoogleSignIn = () => {
        setIsLoading(true);
        signIn('google', { callbackUrl: '/' });
    };

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false
            });

            if (result?.error) {
                setError('Invalid email or password');
                setIsLoading(false);
            } else {
                // Determine redirect URL
                const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl') || '/';
                router.push(callbackUrl);
            }
        } catch (error) {
            setError('Something went wrong');
            setIsLoading(false);
        }
    };

    if (status === 'loading') {
        return (
            <div className="h-screen bg-[#0d0d0f] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full bg-[#0d0d0f] text-white overflow-hidden">
            {/* Left Side - Hero Image */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black items-center justify-center border-r border-white/5">
                <div className="absolute inset-0 z-0">
                    {artistImages.map((img, index) => (
                        <img
                            key={index}
                            src={img}
                            alt="Music"
                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-60' : 'opacity-0'
                                }`}
                            style={{ transform: 'scale(1.1)' }}
                        />
                    ))}

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black"></div>

                    <div
                        className="absolute w-[600px] h-[600px] rounded-full"
                        style={{
                            left: `${glowPosition.x}%`,
                            top: `${glowPosition.y}%`,
                            transform: 'translate(-50%, -50%)',
                            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.5) 0%, rgba(76, 29, 149, 0.3) 40%, transparent 70%)',
                            filter: 'blur(80px)',
                        }}
                    />
                    <div
                        className="absolute w-[400px] h-[400px] rounded-full"
                        style={{
                            left: `${100 - glowPosition.x}%`,
                            top: `${100 - glowPosition.y}%`,
                            transform: 'translate(-50%, -50%)',
                            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, rgba(139, 92, 246, 0.2) 40%, transparent 70%)',
                            filter: 'blur(100px)',
                        }}
                    />
                </div>

                <div className="relative z-10 p-12 max-w-xl">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 overflow-hidden flex items-center justify-center border border-white/10">
                            <img
                                src="/logo.png"
                                alt="Hievly"
                                className="w-full h-full object-contain scale-[3.2] filter invert-[1] hue-rotate-[180deg] brightness-110"
                            />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">Hievly</span>
                    </div>
                    <h2 className="text-5xl font-bold leading-tight mb-6">
                        Experience the future of{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                            sound.
                        </span>
                    </h2>
                    <p className="text-gray-400 text-lg leading-relaxed">
                        Join millions of listeners and creators. High-fidelity audio, personalized discovery,
                        and seamless streaming across all your devices.
                    </p>
                </div>

                <div className="absolute bottom-12 left-12 flex items-center gap-6 text-sm font-medium text-gray-500">
                    <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]"></span>
                        Lossless Audio
                    </span>
                    <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]"></span>
                        3D Spatial Sound
                    </span>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
                <div
                    className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20"
                    style={{
                        background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)',
                        filter: 'blur(60px)',
                    }}
                />

                <div className="w-full max-w-md space-y-8 relative z-10">
                    <div className="flex flex-col items-center mb-8">
                        <span className="text-2xl font-bold tracking-tight">Hievly</span>
                        <span className="text-xs text-zinc-400 tracking-[0.3em] uppercase font-medium">Premium</span>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                            className="w-full py-4 px-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl flex items-center justify-center gap-3 hover:bg-white/5 transition-all text-sm font-semibold disabled:opacity-50"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Continue with Google
                        </button>

                        <div className="relative py-4 flex items-center">
                            <div className="flex-grow border-t border-white/5"></div>
                            <span className="flex-shrink mx-4 text-xs font-bold text-gray-600 uppercase tracking-widest">or email</span>
                            <div className="flex-grow border-t border-white/5"></div>
                        </div>

                        <form onSubmit={handleEmailSignIn} className="space-y-5">
                            {/* Email Field */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1" htmlFor="email">
                                    Email Address
                                </label>
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#8B5CF6] transition-colors z-10 pointer-events-none">
                                        <Mail size={20} />
                                    </div>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@example.com"
                                        required
                                        className="w-full pl-14 pr-6 py-4 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl outline-none text-white placeholder-gray-600 focus:bg-[#8B5CF6]/5 focus:border-[#8B5CF6] focus:shadow-[0_0_0_4px_rgba(139,92,246,0.1)] transition-all relative z-0"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider" htmlFor="password">
                                        Password
                                    </label>
                                    <a href="#" className="text-xs font-bold text-[#8B5CF6] hover:text-violet-400 transition-colors uppercase tracking-wider">
                                        Forgot?
                                    </a>
                                </div>
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#8B5CF6] transition-colors z-10 pointer-events-none">
                                        <Lock size={20} />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="w-full pl-14 pr-14 py-4 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl outline-none text-white placeholder-gray-600 focus:bg-[#8B5CF6]/5 focus:border-[#8B5CF6] focus:shadow-[0_0_0_4px_rgba(139,92,246,0.1)] transition-all relative z-0"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors z-10"
                                    >
                                        <EyeIcon open={showPassword} />
                                    </button>
                                </div>
                            </div>

                            {/* Remember Me */}
                            <div className="flex items-center gap-3 ml-1 pt-1">
                                <input
                                    type="checkbox"
                                    id="remember"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 rounded border-white/10 bg-white/5 text-[#8B5CF6] focus:ring-offset-[#0d0d0f] cursor-pointer accent-[#8B5CF6]"
                                />
                                <label htmlFor="remember" className="text-sm text-gray-400 cursor-pointer select-none">
                                    Keep me logged in
                                </label>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#8B5CF6] hover:bg-violet-600 text-white font-bold py-4 rounded-3xl shadow-lg shadow-violet-500/20 transition-all active:scale-[0.98] mt-4 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                        Signing in...
                                    </span>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Create Account Link */}
                    <div className="text-center pt-4">
                        <p className="text-gray-400 text-sm">
                            Don't have an account?{' '}
                            <a href="/register" className="text-white font-bold hover:text-[#8B5CF6] transition-colors">
                                Create account
                            </a>
                        </p>
                    </div>

                    {/* Footer Links */}
                    <div className="pt-12 text-center">
                        <div className="flex items-center justify-center gap-6 text-[11px] font-bold text-gray-600 uppercase tracking-widest">
                            <a href="#" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
                            <span className="w-1 h-1 rounded-full bg-gray-800"></span>
                            <a href="#" className="hover:text-gray-400 transition-colors">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
