'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAudio } from '@/components/AudioProvider';
import { UserPlus, Copy, Check } from 'lucide-react';

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
        if (isOpen && session) {
            setIsLoading(true);
            fetch('/api/user/friends')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setFriends(data);
                })
                .catch(err => console.error(err))
                .finally(() => setIsLoading(false));

            fetch('/api/user/me')
                .then(res => res.json())
                .then(data => {
                    if (data?.inviteCode) setMyInviteCode(data.inviteCode);
                })
                .catch(err => console.error(err));
        }
    }, [isOpen, session]);

    // Handle initial track sharing
    useEffect(() => {
        if (isOpen && initialTrack) {
            setView('friends');
        }
    }, [isOpen, initialTrack]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, view]);

    const handleFriendSelect = (friend: Friend) => {
        setActiveFriend(friend);
        setView('chat');
        // TODO: Load real messages
        setMessages([
            {
                id: 'm1',
                senderId: friend.id,
                receiverId: 'me',
                content: 'Chat functionality coming soon!',
                createdAt: new Date()
            }
        ]);
    };

    const sendMessage = () => {
        // TODO: Implement real messaging via socket or polling
        if (!activeFriend || (!inputValue.trim() && !initialTrack)) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            senderId: 'me',
            receiverId: activeFriend.id,
            content: inputValue,
            createdAt: new Date(),
            ...(initialTrack ? {
                artist: initialTrack.artist,
                title: initialTrack.title,
                thumbnail: initialTrack.thumbnail,
                trackId: initialTrack.id
            } : {})
        };

        setMessages(prev => [...prev, newMessage]);
        setInputValue('');
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
                <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#18181b] to-black relative" ref={scrollRef}>
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

                            {isLoading ? (
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
                            {/* Messages rendering same as before... */}
                            {messages.map((msg) => {
                                const isMe = msg.senderId === 'me';
                                return (
                                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        {/* Shared Music Card logic ... (can keep existing) */}
                                        {msg.trackId && (
                                            <div className="...">Shared Track Placeholder</div>
                                        )}
                                        {msg.content && (
                                            <div className={`px-4 py-2.5 rounded-2xl text-sm max-w-[75%] leading-relaxed shadow-sm ${isMe ? 'bg-primary text-white rounded-br-sm' : 'bg-white/10 text-gray-200 rounded-bl-sm'}`}>
                                                {msg.content}
                                            </div>
                                        )}
                                        <span className="text-[10px] text-gray-600 mt-1 px-1">
                                            {msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Input Area (Only for chat) */}
                {view === 'chat' && (
                    <div className="p-4 bg-[#18181b] border-t border-white/5">
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
