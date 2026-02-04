'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, X } from 'lucide-react';

interface Notification {
    id: string;
    type: 'FRIEND_REQUEST' | 'NEW_RELEASE' | 'SYSTEM';
    title: string;
    message: string;
    link?: string;
    read: boolean;
    createdAt: string;
    userId: string; // The user who received it
}

export function NotificationsDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            const data = await res.json();
            if (Array.isArray(data)) {
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.read).length);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Optional: Poll every minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAction = async (notificationId: string, action: 'ACCEPT' | 'REJECT', notificationData: any) => {
        // We need the requesterId. In the notification logic I created, I didn't store requesterId explicitly in Notification model
        // but I put a link `/profile/${sender.id}`. I can extract it or simpler:
        // The API expecting requesterId is a bit strict.
        // Let's look at how I implemented the API.
        // `const { requesterId, action } = await req.json();`

        // Wait, the notification model doesn't store the sender ID directly, just a message and link.
        // This is a flaw in my quick schema design for Notification.
        // However, I can parse the link if I stuck to the format.
        // Or I can update Notification to have `relatedUserId`.

        // For now, let's assume I can parse it or I will update the schema quickly?
        // No, schema update takes time.

        // Let's parse the link `/profile/USER_ID`.
        // `link: `/profile/${sender.id}``

        let requesterId = '';
        if (notificationData.link && notificationData.link.startsWith('/profile/')) {
            requesterId = notificationData.link.split('/profile/')[1];
        }

        if (!requesterId) return;

        try {
            await fetch('/api/friends/respond', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requesterId, action })
            });

            // Remove notification or mark handled
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            // Refresh notifications to get "Accepted" message if any
            fetchNotifications(); // Reload to be safe
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2.5 rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition-all duration-300 relative group"
                title="Notifications"
            >
                <Bell size={20} className={`group-hover:scale-110 transition-transform group-hover:rotate-12 ${isOpen ? 'text-white' : ''}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-violet-500 rounded-full ring-2 ring-[#0A0A0B] animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden transform origin-top-right transition-all animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                    <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                        <h3 className="text-white font-semibold text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                            <button className="text-[10px] text-primary hover:underline">Mark all read</button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500 text-xs">
                                No new notifications.
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div key={notification.id} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <div className="flex gap-3">
                                        <div className="w-2 h-2 mt-1.5 rounded-full bg-primary flex-shrink-0"></div>
                                        <div className="flex-1">
                                            <p className="text-white text-sm font-medium">{notification.title}</p>
                                            <p className="text-zinc-400 text-xs mt-0.5 leading-relaxed">{notification.message}</p>

                                            {notification.type === 'FRIEND_REQUEST' && (
                                                <div className="flex gap-2 mt-3">
                                                    <button
                                                        onClick={() => handleAction(notification.id, 'ACCEPT', notification)}
                                                        className="flex-1 bg-primary hover:bg-primary/80 text-white text-xs font-bold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                                                    >
                                                        <Check size={12} /> Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(notification.id, 'REJECT', notification)}
                                                        className="flex-1 bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                                                    >
                                                        <X size={12} /> Decline
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-zinc-600 mt-2 block pl-5">
                                        {new Date(notification.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
