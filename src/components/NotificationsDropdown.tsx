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
            if (!res.ok) return;
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

    const markAllRead = async () => {
        try {
            await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ all: true })
            });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (e) {
            console.error(e);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
            setNotifications(prev => prev.filter(n => n.id !== id));
            setUnreadCount(prev => notifications.find(n => n.id === id)?.read ? prev : Math.max(0, prev - 1));
        } catch (e) {
            console.error(e);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) {
            console.error(e);
        }
    };

    const handleAction = async (notificationId: string, action: 'ACCEPT' | 'REJECT', notificationData: any) => {
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

            // Remove notification after action
            deleteNotification(notificationId);
        } catch (e) {
            console.error(e);
        }
    };

    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'FRIEND_REQUEST': return 'bg-blue-500';
            case 'NEW_RELEASE': return 'bg-violet-500';
            case 'SYSTEM': return 'bg-zinc-500';
            default: return 'bg-primary';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2.5 rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition-all duration-300 relative group focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                title="Notifications"
                aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
                aria-expanded={isOpen}
                aria-haspopup="true"
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
                            <button
                                onClick={markAllRead}
                                className="text-[10px] text-primary hover:underline font-bold uppercase tracking-wider focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded"
                                aria-label="Mark all notifications as read"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500 text-xs flex flex-col items-center gap-2">
                                <Bell size={24} className="opacity-20" />
                                No new notifications.
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`p-4 border-b border-white/5 transition-colors relative group/item ${notification.read ? 'opacity-60' : 'bg-white/[0.02]'}`}
                                    onClick={() => !notification.read && markAsRead(notification.id)}
                                >
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteNotification(notification.id);
                                        }}
                                        className="absolute top-4 right-4 opacity-0 group-hover/item:opacity-100 p-1 hover:bg-white/10 rounded-md text-zinc-500 hover:text-white transition-all focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                                        aria-label="Delete notification"
                                    >
                                        <X size={14} />
                                    </button>

                                    <div className="flex gap-3">
                                        <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${notification.read ? 'bg-zinc-700' : getTypeStyles(notification.type)}`}></div>
                                        <div className="flex-1 pr-4">
                                            <p className="text-white text-sm font-medium">{notification.title}</p>
                                            <p className="text-zinc-400 text-xs mt-0.5 leading-relaxed">{notification.message}</p>

                                            {notification.type === 'FRIEND_REQUEST' && !notification.read && (
                                                <div className="flex gap-2 mt-3">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAction(notification.id, 'ACCEPT', notification);
                                                        }}
                                                        className="flex-1 bg-primary hover:bg-primary/80 text-white text-xs font-bold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                                                        aria-label="Accept friend request"
                                                    >
                                                        <Check size={12} /> Accept
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAction(notification.id, 'REJECT', notification);
                                                        }}
                                                        className="flex-1 bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                                                        aria-label="Decline friend request"
                                                    >
                                                        <X size={12} /> Decline
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-zinc-600 mt-2 block pl-5 uppercase font-medium">
                                        {new Date(notification.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
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
