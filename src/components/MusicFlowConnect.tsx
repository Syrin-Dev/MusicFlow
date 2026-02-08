
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useAudio } from '@/components/AudioProvider';
import { toUnifiedTrack } from '@/lib/types/music';
import { UserPlus, Copy, Check, Play, Reply, Trash2, X, Music, Send, ArrowLeft, MoreVertical, Ban, UserMinus, ShieldAlert, RefreshCw, Radio } from 'lucide-react';
import { toast } from 'sonner';

// Types
interface Friend {
    id: string;
    name: string;
    image: string;
    status: string;
    lastTrack?: any;
    hostingRoom?: any;
}

interface Message {
    id: string;
    content?: string;
    senderId: string;
    receiverId: string;
    sharedMusicId?: string;
    sharedMusicTitle?: string;
    sharedMusicArtist?: string;
    sharedMusicThumbnail?: string;
    replyToId?: string;
    replyTo?: {
        id: string;
        content: string;
        senderId: string;
        sharedMusicTitle?: string;
    };
    isDeleted?: boolean;
    createdAt: string;
    isOptimistic?: boolean;
    error?: boolean;
}

interface MusicFlowConnectProps {
    isOpen: boolean;
    onClose: () => void;
    initialTrack?: any;
}

export default function MusicFlowConnect({ isOpen, onClose, initialTrack: externallySharedTrack }: MusicFlowConnectProps) {
    const { data: session } = useSession();
    const { playTrack, joinRoom } = useAudio();
    const [view, setView] = useState<'friends' | 'chat' | 'add'>('friends');
    const [activeFriendId, setActiveFriendId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [friendCodeInput, setFriendCodeInput] = useState('');
    const [friends, setFriends] = useState<Friend[]>([]);
    const [myInviteCode, setMyInviteCode] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isFriendTyping, setIsFriendTyping] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    const activeFriend = useMemo(() => friends.find(f => f.id === activeFriendId) || null, [friends, activeFriendId]);
    const myId = (session?.user as any)?.id;

    // Fetch Friends & Code
    const fetchFriendsData = async () => {
        if (!isOpen || !session) return;
        try {
            const res = await fetch('/api/user/friends');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) setFriends(data);
            }

            if (!myInviteCode) {
                const meRes = await fetch('/api/user/me');
                if (meRes.ok) {
                    const meData = await meRes.json();
                    if (meData?.inviteCode) setMyInviteCode(meData.inviteCode);
                }
            }
        } catch (e) { }
    };

    useEffect(() => {
        if (isOpen) {
            fetchFriendsData();
            const interval = setInterval(fetchFriendsData, 5000);
            return () => clearInterval(interval);
        }
    }, [isOpen, session, myInviteCode]);

    // Fetch Messages
    const fetchMessages = async () => {
        if (!isOpen || !activeFriendId || view !== 'chat') return;
        try {
            const res = await fetch(`/api/messages?friendId=${activeFriendId}`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setMessages(prev => {
                        const serverIds = new Set(data.map(m => m.id));
                        const optimistic = prev.filter(m => m.isOptimistic && !m.error && !serverIds.has(m.id));

                        const combined = [...data, ...optimistic].sort((a, b) =>
                            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                        );

                        const unique = Array.from(new Map(combined.map(m => [m.id, m])).values());
                        return unique;
                    });
                }
            }
        } catch (e) { }
    };

    useEffect(() => {
        if (isOpen && activeFriendId && view === 'chat') {
            fetchMessages();
            const interval = setInterval(fetchMessages, 2000);
            return () => clearInterval(interval);
        }
    }, [isOpen, activeFriendId, view]);

    // Typing Status
    useEffect(() => {
        if (!isOpen || !activeFriendId || view !== 'chat') return;
        const checkTyping = async () => {
            try {
                const res = await fetch(`/api/chat/typing?friendId=${activeFriendId}`);
                if (res.ok) {
                    const data = await res.json();
                    setIsFriendTyping(!!data.isTyping);
                }
            } catch (e) { }
        };
        const interval = setInterval(checkTyping, 3000);
        return () => clearInterval(interval);
    }, [isOpen, activeFriendId, view]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            const { scrollHeight, scrollTop, clientHeight } = scrollRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 250;
            if (isNearBottom || messages.some(m => m.isOptimistic)) {
                scrollRef.current.scrollTo({ top: scrollHeight, behavior: 'smooth' });
            }
        }
    }, [messages, isFriendTyping]);

    const handleFriendSelect = (friend: Friend) => {
        setActiveFriendId(friend.id);
        setView('chat');
        setMessages([]);
        setReplyingTo(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
        if (activeFriendId) {
            fetch('/api/chat/typing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiverId: activeFriendId })
            }).catch(() => { });
        }
    };

    const sendMessage = async () => {
        if (!activeFriendId || (!inputValue.trim() && !externallySharedTrack) || isSending) return;
        setIsSending(true);

        const content = inputValue;
        const sharedMusic = externallySharedTrack ? {
            id: externallySharedTrack.id,
            title: externallySharedTrack.title,
            artist: externallySharedTrack.artist,
            thumbnail: externallySharedTrack.thumbnail
        } : null;

        const optimisticId = 'opt-' + Date.now();
        const optimisticMsg: Message = {
            id: optimisticId,
            content,
            senderId: myId || 'me',
            receiverId: activeFriendId,
            sharedMusicId: sharedMusic?.id,
            sharedMusicTitle: sharedMusic?.title,
            sharedMusicArtist: sharedMusic?.artist,
            sharedMusicThumbnail: sharedMusic?.thumbnail,
            replyToId: replyingTo?.id,
            replyTo: replyingTo ? {
                id: replyingTo.id,
                content: replyingTo.content || '',
                senderId: replyingTo.senderId,
                sharedMusicTitle: replyingTo.sharedMusicTitle
            } : undefined,
            createdAt: new Date().toISOString(),
            isOptimistic: true
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setInputValue('');
        setReplyingTo(null);

        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receiverId: activeFriendId,
                    content,
                    sharedMusic,
                    replyToId: optimisticMsg.replyToId
                })
            });

            if (res.ok) {
                const actual = await res.json();
                setMessages(prev => prev.map(m => m.id === optimisticId ? actual : m));
            } else {
                setMessages(prev => prev.map(m => m.id === optimisticId ? { ...m, error: true } : m));
                toast.error("Failed to send");
            }
        } catch (e) {
            setMessages(prev => prev.map(m => m.id === optimisticId ? { ...m, error: true } : m));
            toast.error("Network error");
        } finally {
            setIsSending(false);
            fetch('/api/chat/typing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiverId: null })
            }).catch(() => { });
        }
    };

    const deleteMessage = async (msgId: string) => {
        try {
            const res = await fetch(`/api/messages?id=${msgId}`, { method: 'DELETE' });
            if (res.ok) {
                setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isDeleted: true, content: "Message deleted" } : m));
                toast.success("Message deleted");
            }
        } catch (e) {
            toast.error("Failed to delete");
        }
    };

    const handleAddFriend = async () => {
        if (!friendCodeInput.trim()) return;
        setIsLoading(true);
        try {
            const res = await fetch('/api/friends/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inviteCode: friendCodeInput })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Friend request sent!");
                setFriendCodeInput('');
            } else {
                toast.error(data.error || "Failed to add friend");
            }
        } catch (e) {
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const unfriend = async (friendId: string) => {
        if (!confirm("Remove this friend?")) return;
        try {
            const res = await fetch(`/api/friends/remove?friendId=${friendId}`, { method: 'DELETE' });
            if (res.ok) {
                setFriends(prev => prev.filter(f => f.id !== friendId));
                setActiveMenuId(null);
                toast.success("Removed");
            }
        } catch (e) {
            toast.error("Failed");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-3xl animate-in fade-in duration-300" onClick={onClose}>
            <div
                className="w-full max-w-xl bg-[#0a0a0b]/80 border border-white/10 rounded-[2.5rem] md:rounded-[2.5rem] rounded-t-[2.5rem] rounded-b-none md:rounded-b-[2.5rem] shadow-2xl overflow-hidden h-full md:max-h-[750px] max-h-screen flex flex-col animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 backdrop-blur-3xl relative mt-auto md:mt-0"
                onClick={e => { e.stopPropagation(); setActiveMenuId(null); }}
            >
                {/* visual accents */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 blur-[100px] pointer-events-none"></div>

                {/* Header */}
                <div className="h-24 border-b border-white/5 flex items-center px-8 justify-between bg-white/[0.02] backdrop-blur-md z-20">
                    <div className="flex items-center gap-5">
                        {view !== 'friends' ? (
                            <button
                                onClick={() => setView('friends')}
                                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all active:scale-95"
                            >
                                <ArrowLeft size={22} />
                            </button>
                        ) : (
                            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/10">
                                <Music size={22} />
                            </div>
                        )}
                        <div>
                            <h2 className="text-white font-black text-xl md:text-2xl tracking-tight leading-none">
                                {view === 'friends' ? 'Connect' : view === 'add' ? 'Add Friend' : activeFriend?.name}
                            </h2>
                            {view === 'chat' && (
                                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.25em] mt-2 ml-0.5">
                                    {isFriendTyping ? <span className="text-primary animate-pulse">Typing now...</span> : <span className="text-gray-500">{activeFriend?.status || 'Offline'}</span>}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={(e) => { e.stopPropagation(); fetchFriendsData(); toast.success("Synced Circle"); }} className="w-11 h-11 flex items-center justify-center rounded-2xl hover:bg-white/5 text-gray-500 hover:text-white transition-all">
                            <RefreshCw size={18} />
                        </button>
                        <button
                            onClick={onClose}
                            className="w-11 h-11 flex items-center justify-center rounded-2xl hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-all active:scale-95"
                        >
                            <X size={22} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col relative">
                    <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 custom-scrollbar scroll-smooth" ref={scrollRef}>

                        {/* Chat Banner (Tune In) */}
                        {view === 'chat' && activeFriend?.hostingRoom && (
                            <div className="sticky top-0 z-30 mb-8 mx-1 animate-in slide-in-from-top-4 duration-500">
                                <div className="bg-primary/20 border border-primary/30 rounded-3xl p-6 backdrop-blur-3xl flex items-center justify-between group overflow-hidden relative shadow-2xl">
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-transparent animate-pulse pointer-events-none"></div>
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className="relative">
                                            <div className="w-14 h-14 rounded-2xl bg-primary/30 flex items-center justify-center text-white border border-primary/40 shadow-xl shadow-primary/20">
                                                <Radio size={28} className="animate-pulse" />
                                            </div>
                                            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary rounded-full animate-ping"></div>
                                            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary rounded-full border-[3px] border-[#0a0a0b]"></div>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] leading-none">On Air Now</p>
                                            </div>
                                            <p className="text-white font-black text-lg truncate max-w-[180px] leading-tight mt-1">Listening Live</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { joinRoom(activeFriend.id); toast.success(`Tuned in to ${activeFriend.name}`); }}
                                        className="bg-primary hover:bg-white hover:text-primary text-white text-[11px] font-black px-10 py-4 rounded-2xl transition-all shadow-xl shadow-primary/30 tracking-[0.2em] uppercase relative z-10 border border-transparent hover:border-primary/50 active:scale-95"
                                    >
                                        Tune In
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Friends List */}
                        {view === 'friends' && (
                            <div className="space-y-8">
                                <div className="flex items-center justify-between px-2">
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Direct Messages</span>
                                    <button onClick={() => setView('add')} className="text-[10px] font-black text-primary flex items-center gap-2 hover:opacity-80 tracking-widest uppercase bg-primary/10 px-4 py-2 rounded-xl transition-all active:scale-95">
                                        <UserPlus size={14} /> New Friend
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {friends.length === 0 ? (
                                        <div className="text-center py-24 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex flex-col items-center gap-6">
                                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-gray-600">
                                                <UserPlus size={40} />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-white font-bold text-lg">Your circle is empty</p>
                                                <p className="text-gray-500 text-sm max-w-[200px] mx-auto leading-relaxed">Add friends to start sharing music and listening together.</p>
                                            </div>
                                            <button onClick={() => setView('add')} className="text-[10px] text-primary font-black uppercase tracking-[0.2em] border-2 border-primary/30 px-10 py-4 rounded-full hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-95">Add Someone</button>
                                        </div>
                                    ) : friends.map(friend => (
                                        <div
                                            key={friend.id}
                                            onClick={() => handleFriendSelect(friend)}
                                            className="flex items-center gap-5 p-5 hover:bg-white/5 rounded-[2rem] cursor-pointer transition-all border border-transparent hover:border-white/5 group active:scale-[0.98] relative"
                                        >
                                            <div className="relative flex-shrink-0">
                                                <div className="w-16 h-16 rounded-3xl overflow-hidden ring-2 ring-transparent group-hover:ring-primary/50 transition-all duration-300 shadow-2xl">
                                                    <img src={friend.image || `https://api.dicebear.com/7.x/initials/svg?seed=${friend.name}`} alt="" className="w-full h-full object-cover" onError={(e) => e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${friend.name}`} />
                                                </div>
                                                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-[4px] border-[#0a0a0b] ${friend.status === 'Online' ? 'bg-green-500' : 'bg-zinc-600 shadow-xl'}`}></div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-white font-bold text-lg truncate flex items-center gap-2">
                                                    {friend.name}
                                                    {friend.hostingRoom && <span className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(255,0,0,0.5)]"></span>}
                                                </h4>
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1.5">
                                                    {friend.hostingRoom ? <span className="text-primary italic flex items-center gap-1.5"><Radio size={10} /> Listening Now</span> : friend.status || 'Offline'}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {friend.hostingRoom && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); joinRoom(friend.id); toast.success(`Tuning in to ${friend.name}`); }}
                                                        className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/10"
                                                        title="Tune In"
                                                    >
                                                        <Radio size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveMenuId(activeMenuId === friend.id ? null : friend.id);
                                                    }}
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                                                >
                                                    <MoreVertical size={20} />
                                                </button>
                                            </div>

                                            {activeMenuId === friend.id && (
                                                <div className="absolute right-6 top-20 bg-[#18181b]/95 backdrop-blur-xl border border-white/10 rounded-3xl py-3 shadow-2xl z-50 w-56 animate-in fade-in zoom-in-95 duration-200">
                                                    <button onClick={(e) => { e.stopPropagation(); setView('chat'); setActiveFriendId(friend.id); }} className="w-full flex items-center gap-4 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-gray-300 hover:bg-white/5 transition-colors">
                                                        <ShieldAlert size={18} className="text-primary" /> View Identity
                                                    </button>
                                                    <div className="h-px bg-white/5 my-2 mx-3" />
                                                    <button onClick={(e) => { e.stopPropagation(); unfriend(friend.id); }} className="w-full flex items-center gap-4 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-colors">
                                                        <UserMinus size={18} /> Disconnect
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Add Friend */}
                        {view === 'add' && (
                            <div className="space-y-12 p-2">
                                <div className="space-y-6">
                                    <div className="p-6 md:p-10 bg-white/[0.02] border border-white/5 rounded-[2rem] md:rounded-[3rem] text-center space-y-6">
                                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary mx-auto shadow-2xl shadow-primary/5">
                                            <UserPlus size={32} />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-white font-black text-xl md:text-2xl tracking-tight">Expand Your Circle</h3>
                                            <p className="text-xs md:text-sm text-gray-500 leading-relaxed font-medium px-2 md:px-6">Connect with fellow audiophiles using their unique digital signature.</p>
                                        </div>
                                        <div className="flex flex-col md:flex-row gap-3 mt-8">
                                            <input
                                                type="text"
                                                value={friendCodeInput}
                                                onChange={(e) => setFriendCodeInput(e.target.value)}
                                                placeholder="Enter invite code..."
                                                className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 md:py-5 text-white font-bold text-base focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-zinc-800"
                                            />
                                            <button
                                                onClick={handleAddFriend}
                                                disabled={isLoading}
                                                className="bg-primary hover:bg-white hover:text-primary disabled:opacity-50 text-white font-black py-4 md:py-0 px-10 rounded-2xl transition-all shadow-2xl shadow-primary/30 active:scale-95 uppercase tracking-widest text-xs"
                                            >
                                                {isLoading ? '...' : 'Add'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 px-4">
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] ml-2">My Digital Identity</span>
                                    <div className="p-6 md:p-8 bg-primary/5 border border-primary/10 rounded-[2.5rem] md:rounded-[3rem] flex flex-col items-center gap-6">
                                        <div className="flex items-center gap-4 md:gap-6 bg-black/50 px-6 md:px-10 py-4 md:py-6 rounded-2xl md:rounded-3xl border border-white/10 w-full justify-center group active:scale-[0.98] transition-all cursor-pointer shadow-2xl"
                                            onClick={() => {
                                                if (myInviteCode) {
                                                    navigator.clipboard.writeText(myInviteCode);
                                                    toast.success("Identity Signature Copied");
                                                }
                                            }}>
                                            <code className="text-2xl md:text-4xl font-mono text-white font-black tracking-[0.3em]">{myInviteCode || '------'}</code>
                                            <Copy size={20} className="text-primary group-hover:scale-110 transition-transform" />
                                        </div>
                                        <p className="text-[10px] font-black text-primary/50 uppercase tracking-[0.3em]">Click to copy signature</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Chat Messages */}
                        {view === 'chat' && (
                            <div className="space-y-8 pb-4">
                                {messages.length === 0 ? (
                                    <div className="text-center py-28 opacity-20 flex flex-col items-center gap-6">
                                        <div className="w-24 h-24 rounded-full border-2 border-primary/30 flex items-center justify-center">
                                            <Send size={44} className="text-primary animate-bounce" />
                                        </div>
                                        <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white">Break the silence</p>
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => {
                                        const isMe = msg.senderId === myId || msg.senderId === 'me' || msg.isOptimistic;
                                        const prevMsg = messages[idx - 1];
                                        const showAvatar = !isMe && prevMsg?.senderId !== msg.senderId;

                                        return (
                                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group/msg relative px-2 ${msg.isOptimistic ? 'opacity-50' : ''}`}>

                                                {msg.replyTo && (
                                                    <div className={`text-[10px] bg-white/5 border-l-2 border-primary/80 px-4 py-2 rounded-t-2xl mb-[-6px] opacity-60 flex items-center gap-2 max-w-[70%] truncate ${isMe ? 'mr-3' : 'ml-12'}`}>
                                                        <Reply size={12} className="text-primary flex-shrink-0" />
                                                        <span className="font-black text-gray-500 uppercase tracking-tighter">{msg.replyTo.senderId === myId ? 'You' : activeFriend?.name?.split(' ')[0] || 'Friend'}:</span>
                                                        <span className="truncate italic">"{msg.replyTo.content || 'Shared track'}"</span>
                                                    </div>
                                                )}

                                                <div className={`flex items-end gap-4 max-w-[85%] ${isMe ? 'flex-row-reverse' : ''}`}>
                                                    {!isMe && (
                                                        <div className="w-10 h-10 flex-shrink-0">
                                                            {showAvatar && (
                                                                <img src={activeFriend?.image} className="w-full h-full rounded-2xl object-cover shadow-2xl border border-white/5" alt="" onError={(e) => e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${activeFriend?.name}`} />
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="flex flex-col space-y-3">
                                                        {msg.sharedMusicId && (
                                                            <div
                                                                onClick={() => !msg.isDeleted && playTrack(toUnifiedTrack({
                                                                    id: msg.sharedMusicId!,
                                                                    title: msg.sharedMusicTitle!,
                                                                    artist: msg.sharedMusicArtist!,
                                                                    thumbnail: msg.sharedMusicThumbnail!
                                                                }))}
                                                                className={`p-4 rounded-3xl bg-[#121214]/80 border border-white/5 backdrop-blur-3xl hover:bg-white/[0.04] transition-all cursor-pointer group/card flex gap-5 ${msg.isDeleted ? 'opacity-30 line-through grayscale' : 'shadow-2xl'}`}
                                                            >
                                                                <div className="relative flex-shrink-0">
                                                                    <img src={msg.sharedMusicThumbnail} className="w-16 h-16 rounded-2xl object-cover shadow-2xl group-hover/card:scale-105 transition-transform" alt="" />
                                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover/card:opacity-100 transition-all rounded-2xl">
                                                                        <Play size={24} fill="white" className="text-white scale-75 group-hover/card:scale-100 transition-transform" />
                                                                    </div>
                                                                </div>
                                                                <div className="min-w-0 flex flex-col justify-center">
                                                                    <p className="text-[9px] font-black text-primary uppercase tracking-[0.25em] mb-1.5 opacity-80">Shared Soundtrack</p>
                                                                    <h5 className="text-white font-bold text-base truncate leading-tight">{msg.sharedMusicTitle}</h5>
                                                                    <p className="text-[11px] text-gray-500 truncate mt-1">{msg.sharedMusicArtist}</p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {msg.content && (
                                                            <div className={`relative px-6 py-4 rounded-[2rem] text-sm leading-relaxed ${msg.isDeleted
                                                                ? 'bg-transparent border border-white/10 text-zinc-700 italic font-medium'
                                                                : isMe
                                                                    ? 'bg-gradient-to-br from-primary to-violet-700 text-white shadow-2xl shadow-primary/20 rounded-tr-md font-medium'
                                                                    : 'bg-white/[0.03] border border-white/10 text-gray-200 backdrop-blur-3xl rounded-tl-md font-medium'
                                                                }`}>
                                                                {msg.content}

                                                                <div className={`absolute top-0 opacity-0 group-msg:opacity-100 transition-all duration-300 flex gap-1.5 ${isMe ? 'right-full mr-3' : 'left-full ml-3'}`}>
                                                                    <button onClick={() => setReplyingTo(msg)} className="w-9 h-9 rounded-2xl bg-black/50 hover:bg-primary/30 hover:text-primary backdrop-blur-2xl flex items-center justify-center text-gray-500 transition-all"><Reply size={16} /></button>
                                                                    {isMe && !msg.isDeleted && !msg.isOptimistic && (
                                                                        <button onClick={() => deleteMessage(msg.id)} className="w-9 h-9 rounded-2xl bg-black/50 hover:bg-red-500/20 hover:text-red-500 backdrop-blur-2xl flex items-center justify-center text-gray-500 transition-all"><Trash2 size={16} /></button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {msg.error && <span className="text-[9px] text-red-500 font-black uppercase tracking-[0.2em] px-4 animate-pulse">Failed to send</span>}
                                                    </div>
                                                </div>

                                                <span className="text-[10px] font-black text-gray-800 uppercase tracking-widest mt-2.5 block px-6 opacity-40">
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {msg.isOptimistic && !msg.error && " •••"}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>

                    {/* Chat Footer */}
                    {view === 'chat' && (
                        <div className="p-6 bg-white/[0.01] border-t border-white/5 backdrop-blur-2xl relative z-40">

                            {replyingTo && (
                                <div className="mb-5 p-5 pr-12 bg-white/5 border border-white/10 rounded-[2rem] flex flex-col relative animate-in slide-in-from-bottom-6 duration-300">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Reply size={14} className="text-primary" />
                                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Replying to {replyingTo.senderId === myId ? 'Yourself' : activeFriend?.name?.split(' ')[0] || 'Friend'}</p>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate italic font-medium leading-relaxed">"{replyingTo.content || 'Shared soundtrack'}"</p>
                                    <button onClick={() => setReplyingTo(null)} className="absolute top-5 right-5 text-gray-600 hover:text-white transition-all"><X size={20} /></button>
                                </div>
                            )}

                            {externallySharedTrack && (
                                <div className="mb-5 p-5 bg-primary/10 border border-primary/20 rounded-[2.5rem] flex items-center justify-between animate-in slide-in-from-bottom-6 duration-300 shadow-xl">
                                    <div className="flex items-center gap-5">
                                        <img src={externallySharedTrack.thumbnail} className="w-14 h-14 rounded-2xl object-cover shadow-2xl" alt="" />
                                        <div>
                                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1.5 opacity-80">Attaching Sound</p>
                                            <p className="text-sm text-white font-black truncate max-w-[200px]">{externallySharedTrack.title}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black bg-primary text-white px-6 py-2.5 rounded-full uppercase tracking-[0.2em] shadow-xl shadow-primary/20">Ready</span>
                                </div>
                            )}

                            <div className="flex items-center gap-3 md:gap-4 bg-white/[0.03] border border-white/10 rounded-3xl md:rounded-[2.5rem] pl-6 md:pl-8 pr-2 md:pr-3 py-2 md:py-3 focus-within:border-primary/50 focus-within:bg-white/[0.06] transition-all group shadow-2xl">
                                <input
                                    type="text"
                                    placeholder={externallySharedTrack ? "Add a note..." : replyingTo ? "Type your reply..." : "Write a message..."}
                                    className="flex-1 bg-transparent text-white text-sm md:text-base font-medium focus:outline-none placeholder-zinc-800"
                                    value={inputValue}
                                    onChange={handleInputChange}
                                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                    autoFocus
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={(!inputValue.trim() && !externallySharedTrack) || isSending}
                                    className={`w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-2xl md:rounded-[1.5rem] transition-all shadow-2xl active:scale-95 ${(inputValue.trim() || externallySharedTrack) && !isSending
                                        ? 'bg-primary text-white shadow-primary/40 hover:scale-105'
                                        : 'bg-white/5 text-zinc-800 cursor-not-allowed'
                                        }`}
                                >
                                    {isSending ? <RefreshCw size={20} className="animate-spin" /> : <Send size={24} fill={(inputValue.trim() || externallySharedTrack) ? "currentColor" : "none"} />}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
