'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User as PersonIcon, Eye, Check } from 'lucide-react';

const artistImages = [
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200',
    'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1200',
    'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200',
];

const EyeIcon = ({ open }: { open: boolean }) => (
    open ? <Eye size={20} /> : <Eye size={20} className="text-gray-500" />
);

const MusicIcon = () => (
    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
);

export default function RegisterPage() {
    const router = useRouter();
    const { status } = useSession();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
        signIn('google', { callbackUrl: '/' });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name, password })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Registration failed');
            }

            // Auto-login after registration
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false
            });

            if (result?.error) {
                router.push('/login');
            } else {
                router.push('/');
            }

        } catch (err: any) {
            setError(err.message || 'Something went wrong');
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
                        Join the{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                            revolution.
                        </span>
                    </h2>
                    <p className="text-gray-400 text-lg leading-relaxed">
                        Create your account and unlock unlimited music streaming, personalized playlists, and more.
                    </p>
                </div>

                <div className="absolute bottom-12 left-12 flex items-center gap-6 text-sm font-medium text-gray-500">
                    <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]"></span>
                        Free Forever
                    </span>
                    <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]"></span>
                        No Credit Card
                    </span>
                </div>
            </div>

            {/* Right Side - Register Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
                <div
                    className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20"
                    style={{
                        background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)',
                        filter: 'blur(60px)',
                    }}
                />

                <div className="w-full max-w-md space-y-6 relative z-10">
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

                        <div className="relative py-3 flex items-center">
                            <div className="flex-grow border-t border-white/5"></div>
                            <span className="flex-shrink mx-4 text-xs font-bold text-gray-600 uppercase tracking-widest">or email</span>
                            <div className="flex-grow border-t border-white/5"></div>
                        </div>

                        <form onSubmit={handleRegister} className="space-y-4">
                            {/* Name Field */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1" htmlFor="name">
                                    Full Name
                                </label>
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#8B5CF6] transition-colors z-10 pointer-events-none">
                                        <PersonIcon size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="John Doe"
                                        required
                                        className="w-full pl-14 pr-6 py-4 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl outline-none text-white placeholder-gray-600 focus:bg-[#8B5CF6]/5 focus:border-[#8B5CF6] focus:shadow-[0_0_0_4px_rgba(139,92,246,0.1)] transition-all relative z-0"
                                    />
                                </div>
                            </div>

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
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1" htmlFor="password">
                                    Password
                                </label>
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

                            {/* Confirm Password Field */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1" htmlFor="confirmPassword">
                                    Confirm Password
                                </label>
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#8B5CF6] transition-colors z-10 pointer-events-none">
                                        <Lock size={20} />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="confirmPassword"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="w-full pl-14 pr-6 py-4 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl outline-none text-white placeholder-gray-600 focus:bg-[#8B5CF6]/5 focus:border-[#8B5CF6] focus:shadow-[0_0_0_4px_rgba(139,92,246,0.1)] transition-all relative z-0"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#8B5CF6] hover:bg-violet-600 text-white font-bold py-4 rounded-3xl shadow-lg shadow-violet-500/20 transition-all active:scale-[0.98] mt-2 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                        Creating account...
                                    </span>
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="text-center pt-2">
                        <p className="text-gray-400 text-sm">
                            Already have an account?{' '}
                            <a href="/login" className="text-white font-bold hover:text-[#8B5CF6] transition-colors">
                                Sign in
                            </a>
                        </p>
                    </div>

                    <div className="pt-8 text-center">
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
