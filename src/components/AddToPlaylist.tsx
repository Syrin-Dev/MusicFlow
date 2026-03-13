import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Check, Music, ListPlus } from 'lucide-react';
import { toast } from 'sonner';

interface Track {
    id: string;
    title: string;
    artist: string;
    thumbnail: string;
}

interface Playlist {
    id: string;
    name: string;
    thumbnail: string | null;
}

interface AddToPlaylistProps {
    track: Track;
    children?: React.ReactNode;
    className?: string;
    dropdownPosition?: 'top' | 'bottom';
}

export function AddToPlaylist({ track, children, className, dropdownPosition = 'top' }: AddToPlaylistProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(false);
    const [addedTo, setAddedTo] = useState<Set<string>>(new Set());
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleScroll = () => {
            if (isOpen) setIsOpen(false); // Close on scroll to avoid floating issues
        };

        window.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);
        return () => {
            window.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [isOpen]);

    const fetchPlaylists = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/playlists');
            if (res.ok) {
                const data = await res.json();
                setPlaylists(data);
            }
        } catch (error) {
            console.error('Failed to fetch playlists:', error);
        }
        setLoading(false);
    };

    const handleOpen = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            // Default to aligning right edge of dropdown with right edge of button
            // If dropdownPosition is 'top', place it above, else below
            const x = rect.right; // Will calculate exact left in CSS or here. Let's align right edge.
            const y = dropdownPosition === 'top' ? rect.top : rect.bottom;

            setCoords({ x, y });
            fetchPlaylists();
        }
        setIsOpen(!isOpen);
    };

    const addToPlaylist = async (playlistId: string) => {
        // ... (keep existing logic)
        try {
            const res = await fetch(`/api/playlists/${playlistId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    videoId: track.id,
                    title: track.title,
                    artist: track.artist,
                    thumbnail: track.thumbnail
                })
            });

            if (res.ok) {
                toast.success('Added to playlist');
                setAddedTo(prev => new Set([...prev, playlistId]));
                setTimeout(() => {
                    setAddedTo(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(playlistId);
                        return newSet;
                    });
                }, 2000);
            }
        } catch (error) {
            console.error('Failed to add to playlist:', error);
            toast.error('Failed to add to playlist');
        }
    };

    const createAndAdd = async () => {
        // ... (keep existing logic)
        if (!newName.trim()) return;

        try {
            const res = await fetch('/api/playlists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName })
            });

            if (res.ok) {
                const playlist = await res.json();
                setPlaylists(prev => [playlist, ...prev]);
                await addToPlaylist(playlist.id);
                setNewName('');
                setShowCreate(false);
                window.dispatchEvent(new Event('playlist-change'));
            }
        } catch (error) {
            console.error('Failed to create playlist:', error);
            toast.error('Failed to create playlist');
        }
    };

    return (
        <>
            <button
                ref={buttonRef}
                onClick={handleOpen}
                aria-label="Add to playlist"
                className={className || "p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white focus-visible:ring-2 focus-visible:ring-[#8B5CF6] focus-visible:outline-none"}
            >
                {children || <ListPlus size={18} />}
            </button>

            {isOpen && typeof document !== 'undefined' && createPortal(
                <div
                    ref={dropdownRef}
                    className="fixed w-64 bg-[#1A1A1E] rounded-xl shadow-2xl border border-white/10 overflow-hidden z-[9999]"
                    style={{
                        left: coords.x - 256, // Align right edge (256 is width)
                        top: dropdownPosition === 'top' ? coords.y - 8 : coords.y + 8,
                        transform: dropdownPosition === 'top' ? 'translateY(-100%)' : 'none'
                    }}
                >
                    <div className="p-3 border-b border-white/5">
                        <p className="text-xs text-slate-400 uppercase tracking-wider">Add to playlist</p>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-slate-500">Loading...</div>
                        ) : (
                            <>
                                {/* Create New */}
                                {showCreate ? (
                                    <div className="p-2">
                                        <input
                                            type="text"
                                            placeholder="Playlist name..."
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && createAndAdd()}
                                            className="w-full px-3 py-2 bg-[#0A0A0B] border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500"
                                            autoFocus
                                        />
                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={() => setShowCreate(false)}
                                                className="flex-1 px-3 py-1.5 text-xs bg-white/5 rounded-lg hover:bg-white/10"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={createAndAdd}
                                                className="flex-1 px-3 py-1.5 text-xs bg-violet-600 rounded-lg hover:bg-violet-500"
                                            >
                                                Create & Add
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowCreate(true)}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-violet-600/20 flex items-center justify-center">
                                            <Plus size={20} className="text-violet-500" />
                                        </div>
                                        <span className="text-white font-medium">New Playlist</span>
                                    </button>
                                )}

                                {/* Existing Playlists */}
                                {playlists.map(playlist => (
                                    <button
                                        key={playlist.id}
                                        onClick={() => addToPlaylist(playlist.id)}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                                    >
                                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#0A0A0B] flex items-center justify-center">
                                            {playlist.thumbnail ? (
                                                <img src={playlist.thumbnail} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Music size={16} className="text-slate-600" />
                                            )}
                                        </div>
                                        <span className="text-white font-medium flex-1 truncate">{playlist.name}</span>
                                        {addedTo.has(playlist.id) && (
                                            <Check size={16} className="text-green-500" />
                                        )}
                                    </button>
                                ))}

                                {playlists.length === 0 && !loading && (
                                    <div className="p-4 text-center text-slate-500 text-sm">
                                        No playlists yet
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
