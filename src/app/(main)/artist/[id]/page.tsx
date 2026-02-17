'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAudio } from '@/components/AudioProvider';
import { toUnifiedTrack } from '@/lib/types/music';

interface ArtistData {
    name: string;
    description: string;
    subscribers: string;
    thumbnail: string;
    background: string;
    topSongs: any[];
    albums: any[];
    singles: any[];
    videos: any[];
    related: any[];
    events?: any[];
    merch?: any;
}

export default function ArtistPage() {
    const params = useParams();
    const router = useRouter();
    const artistName = typeof params.id === 'string' ? decodeURIComponent(params.id) : '';
    const [artist, setArtist] = useState<ArtistData | null>(null);
    const [loading, setLoading] = useState(true);
    const { playTrack, addToQueue } = useAudio();
    const [isFollowing, setIsFollowing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'albums' | 'singles' | 'videos'>('all');
    const [showFullBio, setShowFullBio] = useState(false);
    const [visibleSongs, setVisibleSongs] = useState(5);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [songMenuOpen, setSongMenuOpen] = useState<string | null>(null);
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        if (!artistName) return;

        // Reset visible songs on artist change
        setVisibleSongs(5);

        // Check local storage for following status
        const followed = localStorage.getItem('followed_artists');
        if (followed) {
            const followedList = JSON.parse(followed);
            setIsFollowing(followedList.includes(artistName));
        }

        const fetchArtist = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/artist?name=${encodeURIComponent(artistName)}`);
                if (res.ok) {
                    const data = await res.json();
                    setArtist(data);
                }
            } catch (error) {
                console.error('Failed to fetch artist', error);
            }
            setLoading(false);
        };

        fetchArtist();
    }, [artistName]);

    // Parallax & Sticky Header
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setScrollY(e.currentTarget.scrollTop);
    };

    const toggleFollow = () => {
        const newState = !isFollowing;
        setIsFollowing(newState);

        let followed = JSON.parse(localStorage.getItem('followed_artists') || '[]');
        if (newState) {
            if (!followed.includes(artistName)) followed.push(artistName);
        } else {
            followed = followed.filter((name: string) => name !== artistName);
        }
        localStorage.setItem('followed_artists', JSON.stringify(followed));
    };

    const handlePlayTopSongs = () => {
        if (artist?.topSongs && artist.topSongs.length > 0) {
            playTrack(toUnifiedTrack(artist.topSongs[0]));
            artist.topSongs.slice(1).forEach(track => addToQueue(toUnifiedTrack(track)));
        }
    };

    const handlePlayTrack = (track: any) => {
        playTrack(toUnifiedTrack(track));
    };

    // Skeleton loading state
    if (loading) {
        return (
            <div className="flex-1 overflow-y-auto pb-32 animate-pulse bg-background-light dark:bg-background-dark">
                <section className="relative h-[45vh] min-h-[400px] w-full bg-gray-800"></section>
                <div className="p-8 space-y-8">
                    <div className="h-8 bg-gray-800 w-1/3 rounded"></div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 h-64 bg-gray-800 rounded"></div>
                        <div className="h-64 bg-gray-800 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!artist) {
        return <div className="p-8 text-center text-gray-500">Artist not found</div>;
    }

    // Determine Latest Release or Artist Pick (Logic: First Album or First Single)
    const latestRelease = artist.albums[0] || artist.singles[0];

    // Filter Discography
    const discography = filter === 'all'
        ? [...artist.albums, ...artist.singles].sort((a, b) => (b.year || 0) - (a.year || 0))
        : filter === 'albums'
            ? artist.albums
            : filter === 'singles'
                ? artist.singles
                : artist.videos || [];

    return (
        <div
            className="flex-1 flex flex-col h-full relative overflow-hidden bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100"
            onClick={() => {
                setShowMoreMenu(false);
                setSongMenuOpen(null);
            }}
        >
            {/* Sticky Header */}
            <div
                className={`absolute top-0 left-0 right-0 z-50 h-16 md:h-20 bg-[#0A0A0B]/95 backdrop-blur-md flex items-center px-4 md:px-8 transition-all duration-300 border-b border-white/5 ${scrollY > 300 ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}
            >
                <div className="flex items-center gap-3 md:gap-4">
                    <button
                        onClick={handlePlayTopSongs}
                        className="w-10 h-10 md:w-12 md:h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform"
                    >
                        <span className="material-icons-round text-2xl md:text-3xl">play_arrow</span>
                    </button>
                    <h1 className="text-xl md:text-2xl font-bold text-white truncate max-w-[200px] md:max-w-none">{artist.name}</h1>
                </div>
            </div>

            <div
                className="flex-1 overflow-y-auto pb-32 scroll-smooth"
                onScroll={handleScroll}
            >
                {/* Hero Section */}
                <section className="relative h-[40vh] md:h-[45vh] min-h-[350px] md:min-h-[400px] w-full group">
                    <div className="absolute inset-0 overflow-hidden">
                        <div
                            className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform"
                            style={{
                                backgroundImage: `url('${artist.background || artist.thumbnail}')`,
                                transform: `translateY(${scrollY * 0.5}px) scale(${1 + scrollY * 0.0005})` // Parallax effect
                            }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#0A0A0B]"></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/60 to-transparent"></div>
                        </div>
                    </div>

                    <div className="absolute bottom-0 left-0 w-full p-4 md:p-8 flex items-end justify-between z-10">
                        <div className="space-y-4 max-w-4xl" style={{ opacity: Math.max(0, 1 - scrollY / 300) }}>
                            <div className="flex items-center gap-2 text-white/80 text-[10px] md:text-sm font-black tracking-widest uppercase">
                                <span className="material-icons-round text-blue-400 text-sm md:text-base">verified</span> Verified Artist
                            </div>
                            <h1 className="text-4xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter drop-shadow-2xl shadow-black leading-[0.9]">{artist.name}</h1>

                            {artist.description && (
                                <div
                                    className="relative group cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowFullBio(!showFullBio);
                                    }}
                                >
                                    <p className={`text-gray-300 text-lg max-w-2xl drop-shadow-md transition-all duration-300 ${showFullBio ? '' : 'line-clamp-2'}`}>
                                        {artist.description}
                                    </p>
                                    {!showFullBio && (
                                        <span className="text-xs text-primary font-bold uppercase tracking-wider mt-1 block opacity-0 group-hover:opacity-100 transition-opacity">Read Full Bio</span>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center gap-4 pt-4 relative">
                                <button
                                    onClick={handlePlayTopSongs}
                                    className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg shadow-primary/30 transition-all transform hover:scale-105"
                                >
                                    <span className="material-icons-round">play_arrow</span> Play
                                </button>
                                <button
                                    className={`border px-6 py-3 rounded-full font-semibold transition-all ${isFollowing ? 'bg-white text-black border-white' : 'border-white/20 hover:border-white text-white hover:bg-white/10'}`}
                                    onClick={toggleFollow}
                                >
                                    {isFollowing ? 'Following' : 'Follow'}
                                </button>
                                <button
                                    className="text-gray-400 hover:text-white p-2 transition-colors relative"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowMoreMenu(!showMoreMenu);
                                    }}
                                >
                                    <span className="material-icons-round text-3xl">more_horiz</span>

                                    {/* More Menu Popover */}
                                    {showMoreMenu && (
                                        <div className="absolute top-full left-0 mt-2 w-48 bg-[#18181b] border border-white/10 rounded-xl shadow-xl z-[100] overflow-hidden text-left animate-in fade-in slide-in-from-top-2">
                                            <div
                                                className="px-4 py-3 hover:bg-white/5 cursor-pointer flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-colors"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(window.location.href);
                                                    alert("Link copied to clipboard!");
                                                }}
                                            >
                                                <span className="material-icons-round text-lg">share</span> Share
                                            </div>
                                        </div>
                                    )}

                                </button>
                            </div>

                            {artist.subscribers && (
                                <div className="text-sm text-gray-400 font-medium">
                                    {artist.subscribers}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <div className="p-4 md:p-8 space-y-10">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
                        {/* Main Content (2/3 cols) */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Popular Songs */}
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-6">Popular</h2>
                                <div className="space-y-1">
                                    {artist.topSongs.slice(0, visibleSongs).map((track, index) => (
                                        <div
                                            key={track.id}
                                            className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 group transition-colors cursor-pointer relative"
                                            onClick={() => handlePlayTrack(track)}
                                        >
                                            <div className="flex items-center gap-4 overflow-hidden flex-1">
                                                <span className="text-gray-500 w-4 text-center font-medium group-hover:hidden flex-shrink-0">{index + 1}</span>
                                                <span className="material-icons-round text-primary w-4 text-center hidden group-hover:block flex-shrink-0">play_arrow</span>
                                                <img alt={track.title} className="w-12 h-12 rounded shadow-sm object-cover flex-shrink-0" src={track.thumbnail} />
                                                <div className="min-w-0">
                                                    <div className="text-white font-medium truncate pr-4">{track.title}</div>
                                                    <div className="text-xs text-gray-500 truncate">{track.album || 'Single'}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 flex-shrink-0 pl-4">
                                                {track.plays && <span className="text-sm text-gray-400 hidden sm:block">{track.plays}</span>}
                                                <span className="text-sm text-gray-500 w-12 text-right">{track.duration || '3:00'}</span>

                                                {/* Song Context Menu Button */}
                                                <button
                                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors relative"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent playing song
                                                        setSongMenuOpen(songMenuOpen === track.id ? null : track.id);
                                                    }}
                                                >
                                                    <span className="material-icons-round text-xl">more_vert</span>

                                                    {/* Context Menu */}
                                                    {songMenuOpen === track.id && (
                                                        <div className="absolute top-full right-0 mt-1 w-48 bg-[#18181b] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden text-left animate-in fade-in zoom-in-95 origin-top-right">
                                                            <div
                                                                className="px-4 py-2 hover:bg-white/5 cursor-pointer flex items-center gap-2 text-sm text-gray-300 hover:text-white"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    addToQueue(track);
                                                                    setSongMenuOpen(null);
                                                                }}
                                                            >
                                                                <span className="material-icons-round text-base">queue_music</span> Add to Queue
                                                            </div>
                                                            <div
                                                                className="px-4 py-2 hover:bg-white/5 cursor-pointer flex items-center gap-2 text-sm text-gray-300 hover:text-white"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    alert(`Go to album: ${track.album}`);
                                                                    setSongMenuOpen(null);
                                                                }}
                                                            >
                                                                <span className="material-icons-round text-base">album</span> Go to Album
                                                            </div>
                                                            <div
                                                                className="px-4 py-2 hover:bg-white/5 cursor-pointer flex items-center gap-2 text-sm text-gray-300 hover:text-white"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    alert("Add to playlist - to be implemented");
                                                                    setSongMenuOpen(null);
                                                                }}
                                                            >
                                                                <span className="material-icons-round text-base">playlist_add</span> Add to Playlist
                                                            </div>
                                                        </div>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {visibleSongs < artist.topSongs.length && (
                                    <button
                                        className="text-xs font-bold text-gray-400 hover:text-white uppercase tracking-wider mt-6 pl-3 transition-colors flex items-center gap-1"
                                        onClick={() => setVisibleSongs(prev => prev + 5)}
                                    >
                                        Load More <span className="material-icons-round text-sm">expand_more</span>
                                    </button>
                                )}
                            </section>

                            {/* Discography Section */}
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-white">Discography</h2>
                                    <div className="flex gap-2">
                                        <button
                                            className={`px-4 py-1.5 rounded-full text-sm transition ${filter === 'all' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                                            onClick={() => setFilter('all')}
                                        >
                                            All
                                        </button>
                                        <button
                                            className={`px-4 py-1.5 rounded-full text-sm transition ${filter === 'albums' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                                            onClick={() => setFilter('albums')}
                                        >
                                            Albums
                                        </button>
                                        <button
                                            className={`px-4 py-1.5 rounded-full text-sm transition ${filter === 'singles' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                                            onClick={() => setFilter('singles')}
                                        >
                                            Singles
                                        </button>
                                        {artist.videos && artist.videos.length > 0 && (
                                            <button
                                                className={`px-4 py-1.5 rounded-full text-sm transition ${filter === 'videos' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                                                onClick={() => setFilter('videos')}
                                            >
                                                Videos
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-in fade-in duration-500">
                                    {discography.slice(0, 12).map((item) => (
                                        <div
                                            key={item.id}
                                            className="group bg-surface-dark p-4 rounded-xl hover:bg-accent-dark transition duration-300 cursor-pointer"
                                            onClick={() => {
                                                if (item.type === 'Video') {
                                                    // Handle video play logic
                                                    playTrack(toUnifiedTrack({
                                                        id: item.id,
                                                        title: item.title,
                                                        artist: artist.name,
                                                        thumbnail: item.thumbnail
                                                    }));
                                                } else {
                                                    router.push(`/playlist/${item.id}`);
                                                }
                                            }}
                                        >
                                            <div className="relative mb-4">
                                                <img alt={item.title} className={`w-full ${item.type === 'Video' ? 'aspect-video' : 'aspect-square'} object-cover rounded shadow-lg group-hover:shadow-2xl transition`} src={item.thumbnail} />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                                                    <button className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                                        <span className="material-icons-round text-3xl">play_arrow</span>
                                                    </button>
                                                </div>
                                                {item.type === 'Video' && (
                                                    <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded">Video</span>
                                                )}
                                            </div>
                                            <h3 className="text-white font-bold truncate text-base">{item.title}</h3>
                                            <p className="text-sm text-gray-400">{item.year ? item.year + ' • ' : ''}{item.type}</p>
                                            {item.views && <p className="text-xs text-gray-500 mt-0.5">{item.views}</p>}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Sidebar Content (1/3 col) */}
                        <div className="space-y-8">
                            {/* Latest Release */}
                            {latestRelease && (
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-4">Latest Release</h2>
                                    <div
                                        className="bg-surface-dark p-5 rounded-2xl border border-white/5 hover:bg-surface-dark/80 transition cursor-pointer group relative overflow-hidden"
                                        onClick={() => router.push(`/playlist/${latestRelease.id}`)}
                                    >
                                        {/* Play Overlay */}
                                        <button
                                            className="absolute right-4 bottom-4 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-black shadow-lg translate-y-20 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10 hover:scale-110"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/playlist/${latestRelease.id}`);
                                            }}
                                        >
                                            <span className="material-icons-round text-3xl">play_arrow</span>
                                        </button>

                                        <div className="flex gap-5 mb-4 items-center">
                                            <div className="relative">
                                                <img alt="Latest Release" className="w-24 h-24 rounded-lg shadow-lg object-cover group-hover:scale-105 transition-transform" src={latestRelease.thumbnail} />
                                            </div>
                                            <div className="flex flex-col justify-center min-w-0">
                                                <span className="text-xs font-semibold tracking-wider text-gray-400 bg-white/10 px-2 py-1 rounded w-fit mb-2">LATEST</span>
                                                <div className="text-white font-bold text-xl truncate leading-tight group-hover:text-primary transition-colors">{latestRelease.title}</div>
                                                <div className="text-sm text-gray-500 mt-1">{latestRelease.year}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Events / Tour Dates (Affiliate) */}
                            {artist.events && artist.events.length > 0 && (
                                <div className="bg-surface-dark border border-white/5 rounded-3xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-bold text-white">On Tour</h2>
                                        <span className="text-xs font-semibold bg-primary/20 text-primary px-2 py-1 rounded uppercase tracking-wider">Upcoming</span>
                                    </div>
                                    <div className="space-y-4">
                                        {artist.events.map((event: any) => (
                                            <div key={event.id} className="flex items-center gap-4 group">
                                                <div className="flex flex-col items-center bg-white/5 rounded-lg p-2 w-14 group-hover:bg-primary group-hover:text-white transition-colors">
                                                    <span className="text-xs font-bold uppercase">{event.date.split(' ')[0]}</span>
                                                    <span className="text-lg font-black leading-none">{event.date.split(' ')[1]}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-white font-semibold truncate group-hover:text-primary transition-colors">{event.venue}</div>
                                                    <div className="text-xs text-gray-400 truncate">{event.location}</div>
                                                </div>
                                                <a
                                                    href={event.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black hover:border-white transition-all"
                                                >
                                                    <span className="material-icons-round text-sm -rotate-45">arrow_forward</span>
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                    <a
                                        href={`https://www.ticketmaster.com/search?q=${encodeURIComponent(artist.name)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-6 w-full bg-white/5 hover:bg-white text-white hover:text-black py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all border border-white/5 hover:border-white hover:shadow-lg"
                                    >
                                        <span className="material-icons-round text-primary hover:text-black">confirmation_number</span>
                                        Find Tickets
                                    </a>
                                </div>
                            )}

                            {/* Official Merch (Affiliate) */}
                            {artist.merch && artist.merch.items && artist.merch.items.length > 0 && (
                                <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <span className="material-icons-round text-6xl text-white">shopping_bag</span>
                                    </div>
                                    <h2 className="text-xl font-bold text-white mb-4 relative z-10">Official Merch</h2>

                                    <div className="space-y-4 relative z-10">
                                        {artist.merch.items.map((item: any, idx: number) => (
                                            <a
                                                key={idx}
                                                href={item.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-4 bg-black/20 hover:bg-black/40 p-3 rounded-xl transition-colors border border-white/5"
                                            >
                                                <img src={item.image || artist.thumbnail} alt={item.title} className="w-16 h-16 rounded-lg object-cover" />
                                                <div>
                                                    <div className="text-white font-bold">{item.title}</div>
                                                    <div className="text-primary font-bold">{item.price}</div>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {artist.related && artist.related.length > 0 && (
                                <div className="bg-gradient-to-br from-surface-dark to-black p-6 rounded-3xl border border-white/5">
                                    <h3 className="font-bold text-white text-xl mb-6">Fans Also Like</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {artist.related.map((rel) => (
                                            <div
                                                key={rel.id}
                                                className="group cursor-pointer text-center"
                                                onClick={() => router.push(`/artist/${encodeURIComponent(rel.name)}`)}
                                            >
                                                <div className="w-full aspect-square rounded-full overflow-hidden mb-3 border-2 border-transparent group-hover:border-primary transition-colors shadow-lg">
                                                    <img alt={rel.name} src={rel.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                </div>
                                                <div className="text-sm font-medium text-gray-300 group-hover:text-white truncate">{rel.name}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
