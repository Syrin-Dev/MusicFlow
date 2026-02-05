'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
    User, Shield, CreditCard, Bell, Camera, Lock, Mail, Smartphone,
    Monitor, Moon, Check, LogOut, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

type Tab = 'profile' | 'security' | 'subscription' | 'notifications';

export default function SettingsPage() {
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Profile State
    const [name, setName] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Security State
    const [currentPass, setCurrentPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [twoFactor, setTwoFactor] = useState(false);

    // Notifications State
    const [notifPrefs, setNotifPrefs] = useState({
        emailUpdates: true,
        newReleases: true,
        securityAlerts: true
    });

    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) {
                    setName(data.name || session?.user?.name || '');
                    setDisplayName(data.displayName || '');
                    setBio(data.bio || '');
                    setTwoFactor(data.twoFactorEnabled || false);
                    setNotifPrefs({
                        emailUpdates: data.emailUpdates ?? true,
                        newReleases: data.newReleases ?? true,
                        securityAlerts: data.securityAlerts ?? true
                    });
                }
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, [session]);

    const saveSettings = async (updates: any) => {
        setIsSaving(true);
        try {
            await fetch('/api/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            toast.success('Settings saved successfully');
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleProfileSave = () => {
        saveSettings({ name, displayName, bio });
    };

    const toggleNotif = (key: keyof typeof notifPrefs) => {
        const newValue = !notifPrefs[key];
        setNotifPrefs(prev => ({ ...prev, [key]: newValue }));
        saveSettings({ [key]: newValue });
    };

    const toggleTwoFactor = () => {
        const newValue = !twoFactor;
        setTwoFactor(newValue);
        saveSettings({ twoFactorEnabled: newValue });
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'subscription', label: 'Subscription', icon: CreditCard },
        { id: 'notifications', label: 'Notifications', icon: Bell },
    ];

    const TabButton = ({ id, label, icon: Icon }: { id: Tab, label: string, icon: any }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl transition-all duration-200 text-left mb-2 group relative overflow-hidden ${activeTab === id
                ? 'bg-[#8B5CF6]/10 text-white shadow-[0_0_20px_rgba(139,92,246,0.1)] border border-[#8B5CF6]/20'
                : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
        >
            <div className={`
                absolute left-0 top-0 bottom-0 w-1 bg-[#8B5CF6] transition-opacity duration-300
                ${activeTab === id ? 'opacity-100' : 'opacity-0'}
            `} />
            <Icon size={20} className={`transition-colors ${activeTab === id ? 'text-[#8B5CF6]' : 'text-slate-500 group-hover:text-slate-300'}`} />
            <span className="font-medium">{label}</span>
        </button>
    );

    if (isLoading) {
        return (
            <div className="flex-1 min-h-screen bg-[#0A0A0B] p-8 flex items-center justify-center">
                <Loader2 size={40} className="text-[#8B5CF6] animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex-1 min-h-screen bg-[#0A0A0B] p-4 md:p-8 pb-32">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8 md:mb-10 text-center md:text-left">
                    <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-2">Account Settings</h1>
                    <p className="text-[10px] md:text-sm font-black uppercase tracking-[0.2em] text-zinc-600">Security • Profile • Subscription</p>
                </header>

                <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
                    {/* Sidebar Tabs */}
                    <aside className="w-full lg:w-72 flex-shrink-0">
                        <nav className="bg-[#121214] p-2 md:p-4 rounded-3xl border border-white/5 flex lg:flex-col overflow-x-auto lg:overflow-visible no-scrollbar gap-2">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as Tab)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 text-left whitespace-nowrap min-w-fit flex-1 lg:flex-none ${activeTab === tab.id
                                        ? 'bg-primary/10 text-white border border-primary/20 shadow-xl'
                                        : 'text-zinc-500 hover:text-white border border-transparent'
                                        }`}
                                >
                                    <tab.icon size={18} className={activeTab === tab.id ? 'text-primary' : 'text-zinc-600'} />
                                    <span className="font-black uppercase text-[10px] tracking-widest">{tab.label}</span>
                                </button>
                            ))}

                            <div className="hidden lg:block mt-8 pt-6 border-t border-white/5">
                                <button
                                    onClick={() => signOut({ callbackUrl: '/login' })}
                                    className="flex items-center gap-3 w-full px-4 py-3 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest"
                                >
                                    <LogOut size={18} />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </nav>

                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="lg:hidden mt-4 flex items-center justify-center gap-3 w-full px-4 py-4 bg-red-500/10 text-red-500 rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest border border-red-500/20"
                        >
                            <LogOut size={18} />
                            <span>Sign Out</span>
                        </button>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 space-y-6">
                        {/* PROFILE TAB */}
                        {activeTab === 'profile' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Profile Card */}
                                <div className="bg-[#121214] border border-white/5 rounded-3xl p-6 md:p-8 relative overflow-hidden">
                                    <div className="flex items-center gap-2 mb-8 text-zinc-500">
                                        <User size={18} className="text-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Profile Details</span>
                                    </div>

                                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                                        {/* Avatar */}
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="relative group">
                                                <div className="w-28 h-28 md:w-32 md:h-32 rounded-full p-1 bg-gradient-to-br from-primary to-fuchsia-600 shadow-2xl">
                                                    <div className="w-full h-full rounded-full bg-[#0A0A0B] overflow-hidden">
                                                        {session?.user?.image ? (
                                                            <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-4xl font-black bg-[#0A0A0B] text-zinc-800">
                                                                {(name || 'U').charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="absolute bottom-1 right-1 p-2.5 bg-primary text-white rounded-full shadow-2xl hover:scale-110 transition-all border-4 border-[#121214]"
                                                >
                                                    <Camera size={16} />
                                                </button>
                                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
                                            </div>
                                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest text-center">MAX 2MB • JPG/PNG</p>
                                        </div>

                                        {/* Inputs */}
                                        <div className="flex-1 w-full space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Full Name</label>
                                                    <input
                                                        type="text"
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-primary transition-all font-bold"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Display Name</label>
                                                    <input
                                                        type="text"
                                                        value={displayName}
                                                        onChange={(e) => setDisplayName(e.target.value)}
                                                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-primary transition-all font-bold"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Bio</label>
                                                <textarea
                                                    value={bio}
                                                    onChange={(e) => setBio(e.target.value)}
                                                    rows={3}
                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-primary transition-all resize-none font-bold"
                                                />
                                            </div>

                                            <div className="pt-2 flex justify-end">
                                                <button
                                                    onClick={handleProfileSave}
                                                    disabled={isSaving}
                                                    className="w-full md:w-auto px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                                >
                                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                                    Save Changes
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SECURITY TAB */}
                        {activeTab === 'security' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-[#121214] border border-white/5 rounded-2xl p-8">
                                    <div className="flex items-center gap-2 mb-6 text-slate-400">
                                        <Lock size={18} className="text-[#8B5CF6]" />
                                        <span className="text-sm font-semibold uppercase tracking-wider text-white">Security Management</span>
                                    </div>

                                    <div className="space-y-5 max-w-2xl">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-300">Current Password</label>
                                                <div className="relative">
                                                    <input
                                                        type="password"
                                                        placeholder="••••••••••••"
                                                        value={currentPass}
                                                        onChange={e => setCurrentPass(e.target.value)}
                                                        className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8B5CF6] transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-300">New Password</label>
                                                <input
                                                    type="password"
                                                    placeholder="Min. 8 characters"
                                                    value={newPass}
                                                    onChange={e => setNewPass(e.target.value)}
                                                    className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8B5CF6] transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end pt-2">
                                            <button className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-medium transition-all">
                                                Update Password
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#121214] border border-white/5 rounded-2xl p-8">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-white">Two-Factor Authentication</h3>
                                            <p className="text-sm text-slate-400 mt-1">Add an extra layer of security to your account</p>
                                        </div>
                                        <button
                                            onClick={toggleTwoFactor}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${twoFactor ? 'bg-[#8B5CF6]' : 'bg-white/10'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${twoFactor ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SUBSCRIPTION TAB */}
                        {activeTab === 'subscription' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-gradient-to-br from-violet-900/50 to-fuchsia-900/50 border border-violet-500/20 rounded-2xl p-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-32 bg-violet-500/20 blur-[100px] rounded-full"></div>

                                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                                        <div>
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/20 text-violet-200 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-violet-500/30">
                                                Current Plan
                                            </div>
                                            <h2 className="text-3xl font-bold text-white mb-2">Hievly Premium</h2>
                                            <p className="text-violet-200/80">Next billing date: <span className="text-white font-medium">March 2, 2026</span></p>
                                        </div>
                                        <div className="text-center md:text-right">
                                            <p className="text-4xl font-bold text-white mb-1">$9.99<span className="text-lg text-white/50 font-normal">/mo</span></p>
                                            <div className="flex gap-3 mt-4">
                                                <button className="px-5 py-2.5 bg-white text-violet-900 font-bold rounded-xl hover:bg-gray-100 transition-colors">
                                                    Manage Plan
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* NOTIFICATIONS TAB */}
                        {activeTab === 'notifications' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-[#121214] border border-white/5 rounded-2xl p-6">
                                    <h3 className="font-bold text-white mb-6 text-lg">Email Preferences</h3>
                                    <div className="space-y-4">
                                        {[
                                            { id: 'emailUpdates', title: 'Product Updates', desc: 'Receive updates about new features and improvements' },
                                            { id: 'newReleases', title: 'New Releases', desc: 'Get notified when your favorite artists release new music' },
                                            { id: 'securityAlerts', title: 'Security Alerts', desc: 'Important notifications about your account security' }
                                        ].map((item, i) => (
                                            <div key={item.id} className="flex items-center justify-between py-2">
                                                <div>
                                                    <p className="font-medium text-white">{item.title}</p>
                                                    <p className="text-sm text-slate-400">{item.desc}</p>
                                                </div>
                                                <button
                                                    onClick={() => toggleNotif(item.id as keyof typeof notifPrefs)}
                                                    className={`w-12 h-6 rounded-full transition-colors relative ${notifPrefs[item.id as keyof typeof notifPrefs] ? 'bg-[#8B5CF6]' : 'bg-white/10'}`}
                                                >
                                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${notifPrefs[item.id as keyof typeof notifPrefs] ? 'left-7' : 'left-1'}`} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                    </main>
                </div>
            </div>
        </div>
    );
}
