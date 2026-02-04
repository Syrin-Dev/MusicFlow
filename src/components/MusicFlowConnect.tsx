'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAudio } from '@/components/AudioProvider';
import { UserPlus, Copy, Check, Play } from 'lucide-react';

// Types
interface Friend {
    id: string;
    name: string;
    image: string;
    status: string;
}

interface Message {
    id: string;
    content?: string;
    senderId: string;
    receiverId: string;
    artist?: string;
    title?: string;
    thumbnail?: string;
    trackId?: string;
    createdAt: Date;
}

interface MusicFlowConnectProps {
    isOpen: boolean;
    onClose: () => void;
    initialTrack?: any;
}

export default function MusicFlowConnect({ isOpen, onClose, initialTrack }: MusicFlowConnectProps) {
    const { data: session } = useSession();
    const { playTrack } = useAudio();
    const [view, setView] = useState<'friends' | 'chat' | 'add'>('friends');
    const [activeFriend, setActiveFriend] = useState<Friend | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const [friendCodeInput, setFriendCodeInput] = useState('');

    // Real Data State
    const [friends, setFriends] = useState<Friend[]>([]);
    const [myInviteCode, setMyInviteCode] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Fetch Friends and user info
    useEffect(() => {
        const fetchData = () => {
            if (isOpen && session) {
                fetch('/api/user/friends')
                    .then(res => res.json())
                    .then(data => {
                        if (Array.isArray(data)) setFriends(data);
                    })
                    .catch(err => console.error(err));

                if (!myInviteCode) {
                    fetch('/api/user/me')
                        .then(res => res.json())
                        .then(data => {
                            if (data?.inviteCode) setMyInviteCode(data.inviteCode);
                        })
                        .catch(err => console.error(err));
                }
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 10000); // Polling friends status every 10s
        return () => clearInterval(interval);
    }, [isOpen, session, myInviteCode]);

    // Fetch Messages when active friend changes
    useEffect(() => {
        let interval: any;

        const fetchMessages = () => {
            if (isOpen && activeFriend && view === 'chat') {
                fetch(`/api/messages?friendId=${activeFriend.id}`)
                    .then(res => res.json())
                    .then(data => {
                        if (Array.isArray(data)) {
                            setMessages(data);
                        }
                    })
                    .catch(err => console.error("Chat Error:", err));
            }
        };

        if (activeFriend && view === 'chat') {
            fetchMessages();
            interval = setInterval(fetchMessages, 3000); // Polling messages every 3s
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isOpen, activeFriend, view]);

    // Handle initial track sharing
    useEffect(() => {
        if (isOpen && initialTrack && activeFriend) {
            // If we have an initial track and a friend selected, we stay in chat
            // but we could auto-send or prepopulate
        }
    }, [isOpen, initialTrack, activeFriend]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, view]);

    const handleFriendSelect = (friend: Friend) => {
        setActiveFriend(friend);
        setView('chat');
        setMessages([]); // Clear previous to show loading state if needed
    };

    const sendMessage = async () => {
        if (!activeFriend || (!inputValue.trim() && !initialTrack)) return;

        const content = inputValue;
        const sharedMusic = initialTrack ? {
            id: initialTrack.id,
            title: initialTrack.title,
            artist: initialTrack.artist,
            thumbnail: initialTrack.thumbnail
        } : null;

        // Optimistic update
        const tempMsg: Message = {
            id: 'temp-' + Date.now(),
            senderId: session?.user?.email || 'me', // placeholder
            receiverId: activeFriend.id,
            content: content,
            createdAt: new Date(),
            title: sharedMusic?.title,
            artist: sharedMusic?.artist,
            thumbnail: sharedMusic?.thumbnail,
            trackId: sharedMusic?.id
        };

        setMessages(prev => [...prev, tempMsg]);
        setInputValue('');

        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receiverId: activeFriend.id,
                    content,
                    sharedMusic
                })
            });

            if (res.ok) {
                // The next poll will replace the optimistic UI with real data
            }
        } catch (e) {
            console.error("Failed to send message", e);
        }
    };

    const handleAddFriend = async () => {
        if (!friendCodeInput.trim()) return;
        setFeedback(null);

        try {
            const res = await fetch('/api/friends/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inviteCode: friendCodeInput })
            });
            const data = await res.json();

            if (res.ok) {
                setFeedback({ type: 'success', message: 'Friend request sent!' });
                setFriendCodeInput('');
            } else {
                setFeedback({ type: 'error', message: data.error || 'Failed to add friend' });
            }
        } catch (e) {
            setFeedback({ type: 'error', message: 'Something went wrong' });
        }
    };

    const copyCode = () => {
        if (myInviteCode) {
            navigator.clipboard.writeText(myInviteCode);
            // Could add toast here
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="w-full max-w-md bg-[#18181b] border border-white/10 rounded-3xl shadow-2xl overflow-hidden h-[600px] flex flex-col animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="h-16 border-b border-white/5 flex items-center px-4 justify-between bg-white/5 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        {view !== 'friends' && (
                            <button
                                onClick={() => setView('friends')}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            >
                                <span className="material-icons-round">arrow_back</span>
                            </button>
                        )}
                        <h2 className="text-white font-bold text-lg">
                            {view === 'friends' ? 'Connect' : view === 'add' ? 'Add Friend' : activeFriend?.name}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                        <span className="material-icons-round">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#18181b] to-black relative custom-scrollbar" ref={scrollRef}>
                    {view === 'friends' && (
                        <div className="p-4 space-y-2">
                            <div className="flex justify-between items-center mb-4 px-2">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Friends</h3>
                                <button
                                    onClick={() => setView('add')}
                                    className="flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                                >
                                    <UserPlus size={14} />
                                    ADD NEW
                                </button>
                            </div>

                            {isLoading && friends.length === 0 ? (
                                <div className="text-center text-gray-500 py-10 text-sm">Loading friends...</div>
                            ) : friends.length === 0 ? (
                                <div className="text-center text-zinc-500 py-10">
                                    <p>No friends yet.</p>
                                    <button
                                        onClick={() => setView('add')}
                                        className="text-primary mt-2 text-sm hover:underline"
                                    >
                                        Add someone!
                                    </button>
                                </div>
                            ) : (
                                friends.map(friend => (
                                    <div
                                        key={friend.id}
                                        onClick={() => handleFriendSelect(friend)}
                                        className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-colors group"
                                    >
                                        <div className="relative">
                                            <img src={friend.image || `https://api.dicebear.com/7.x/initials/svg?seed=${friend.name}`} alt={friend.name} className="w-12 h-12 rounded-full object-cover border-2 border-transparent group-hover:border-primary transition-colors" />
                                            <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#18181b] ${friend.status === 'Online' ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-white font-semibold truncate group-hover:text-primary transition-colors">{friend.name}</h4>
                                            <p className="text-xs text-gray-400 flex items-center gap-1.5 truncate">
                                                {friend.status || 'Offline'}
                                            </p>
                                        </div>
                                        <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
                                            <span className="material-icons-round">chat_bubble_outline</span>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {view === 'add' && (
                        <div className="p-6 space-y-8">
                            <div className="space-y-4">
                                <label className="text-sm font-medium text-gray-300">Add by Invite Code</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={friendCodeInput}
                                        onChange={(e) => setFriendCodeInput(e.target.value)}
                                        placeholder="Enter code..."
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none transition-colors"
                                    />
                                    <button
                                        onClick={handleAddFriend}
                                        className="bg-primary hover:bg-primary/80 text-white font-bold px-6 rounded-xl transition-colors"
                                    >
                                        Send
                                    </button>
                                </div>
                                {feedback && (
                                    <div className={`text-sm ${feedback.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                        {feedback.message}
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-white/10 pt-6">
                                <label className="text-sm font-medium text-gray-300 mb-4 block">Your Invite Code</label>
                                <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex items-center justify-between group">
                                    <code className="text-xl font-mono text-primary font-bold tracking-wider">
                                        {myInviteCode || 'Loading...'}
                                    </code>
                                    <button
                                        onClick={copyCode}
                                        className="text-gray-500 hover:text-white transition-colors"
                                        title="Copy to clipboard"
                                    >
                                        <Copy size={20} />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Share this code with friends so they can add you.</p>
                            </div>
                        </div>
                    )}

                    {view === 'chat' && (
                        <div className="p-4 space-y-6 pt-6">
                            {messages.length === 0 ? (
                                <div className="text-center text-zinc-600 py-10 text-sm">
                                    No messages yet. Send a message to start chatting!
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.senderId !== activeFriend?.id;
                                    return (
                                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                            {/* Shared Music Card */}
                                            {msg.trackId && (
                                                <div
                                                    onClick={() => playTrack({ id: msg.trackId!, title: msg.title!, artist: msg.artist!, thumbnail: msg.thumbnail! })}
                                                    className={`mb-2 p-2 rounded-2xl bg-white/5 border border-white/10 w-[80%] hover:bg-white/10 transition-colors cursor-pointer group`}
                                                >
                                                    <div className="flex gap-3">
                                                        <img src={msg.thumbnail} alt="" className="w-14 h-14 rounded-xl object-cover" />
                                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                            <p className="text-xs font-bold text-primary mb-0.5">Shared Music</p>
                                                            <h5 className="text-white text-sm font-bold truncate">{msg.title}</h5>
                                                            <p className="text-xs text-zinc-400 truncate">{msg.artist}</p>
                                                        </div>
                                                        <div className="flex items-center pr-1">
                                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                                                <Play size={16} fill="currentColor" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {msg.content && (
                                                <div className={`px-4 py-2.5 rounded-2xl text-sm max-w-[85%] leading-relaxed shadow-sm ${isMe ? 'bg-primary text-white rounded-br-sm' : 'bg-white/10 text-gray-200 rounded-bl-sm'}`}>
                                                    {msg.content}
                                                </div>
                                            )}
                                            <span className="text-[10px] text-gray-600 mt-1 px-1">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>

                {/* Input Area (Only for chat) */}
                {view === 'chat' && (
                    <div className="p-4 bg-[#18181b] border-t border-white/5">
                        {initialTrack && view === 'chat' && (
                            <div className="mb-3 p-2 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                                        <img src={initialTrack.thumbnail} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold text-primary uppercase">Sharing Track</p>
                                        <p className="text-xs text-white font-bold truncate">{initialTrack.title}</p>
                                    </div>
                                </div>
                                <button className="p-1 px-2 text-[10px] font-black bg-primary text-white rounded-md">ATTACHED</button>
                            </div>
                        )}
                        <div className="flex items-center gap-2 bg-white/5 rounded-full pl-4 pr-2 py-2 border border-white/5 focus-within:border-primary/50 focus-within:bg-white/10 transition-all">
                            <input
                                type="text"
                                placeholder={initialTrack ? "Add a message..." : "Write a message..."}
                                className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-gray-500"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                autoFocus
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!inputValue.trim() && !initialTrack}
                                className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${inputValue.trim() || initialTrack ? 'bg-primary text-white shadow-lg shadow-primary/25 hover:scale-105' : 'bg-transparent text-gray-600 cursor-not-allowed'}`}
                            >
                                <span className="material-icons-round text-lg">send</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

