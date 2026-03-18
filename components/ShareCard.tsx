import React, { useRef, useState } from 'react';
import { TravelLocation, SharedTrip, LocationType } from '../types';
import { shareService } from '../services/shareService';
import { Button } from './Button';

interface ShareCardOptions {
    showStats?: boolean;
    showHighlights?: boolean;
    theme?: 'dark' | 'light' | 'auto';
    size?: 'small' | 'medium' | 'large';
}

interface ShareCardProps {
    trip: TravelLocation;
    userName: string;
    userAvatar?: string | null;
    stats?: {
        countries: number;
        states: number;
    };
    options?: ShareCardOptions;
}

export const ShareCard: React.FC<ShareCardProps> = ({
    trip,
    userName,
    userAvatar,
    stats,
    options
}) => {
    const showStats = options?.showStats ?? true;
    const showHighlights = options?.showHighlights ?? true;
    const theme = options?.theme ?? 'dark';
    const size = options?.size ?? 'medium';

    const cardRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const getTypeEmoji = (type: LocationType) => {
        switch (type) {
            case LocationType.COUNTRY: return '🌍';
            case LocationType.STATE: return '📍';
            case LocationType.CITY: return '🏙️';
            case LocationType.LANDMARK: return '🏛️';
            default: return '📍';
        }
    };

    const getSizeClasses = () => {
        switch (size) {
            case 'small': return 'max-w-xs';
            case 'large': return 'max-w-lg';
            default: return 'max-w-md';
        }
    };

    const getThemeClasses = () => {
        switch (theme) {
            case 'light':
                return 'bg-white text-gray-900 border-gray-200';
            case 'auto':
                return 'bg-gradient-to-br from-[#1b2228] to-[#2c3440] text-white border-[#456]';
            default:
                return 'bg-[#14181c] text-white border-[#2c3440]';
        }
    };

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <i
                key={i}
                className={`fas fa-star text-[10px] ${i < rating ? 'text-[#00e054]' : 'text-[#2c3440]'}`}
            />
        ));
    };

    const handleDownload = async () => {
        if (!cardRef.current) return;

        setIsGenerating(true);
        try {
            // Use html2canvas or similar library in production
            // For now, we'll use the native canvas API
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            canvas.width = 600;
            canvas.height = 400;

            // Background
            const gradient = ctx.createLinearGradient(0, 0, 600, 400);
            gradient.addColorStop(0, '#1b2228');
            gradient.addColorStop(1, '#14181c');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 600, 400);

            // Border
            ctx.strokeStyle = '#00e054';
            ctx.lineWidth = 4;
            ctx.strokeRect(10, 10, 580, 380);

            // Logo area
            ctx.fillStyle = '#00e054';
            ctx.font = 'bold 24px sans-serif';
            ctx.fillText('🌍 Wanderlog', 40, 60);

            // Destination
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 48px sans-serif';
            ctx.fillText(trip.name, 40, 140);

            // Type emoji
            ctx.font = '36px sans-serif';
            ctx.fillText(getTypeEmoji(trip.type), 520, 140);

            // Rating
            ctx.font = 'bold 20px sans-serif';
            ctx.fillStyle = '#00e054';
            ctx.fillText('★'.repeat(Math.round(trip.rating)) + '☆'.repeat(5 - Math.round(trip.rating)), 40, 190);

            // Highlights
            if (showHighlights && trip.likes?.length > 0) {
                ctx.fillStyle = '#9ab';
                ctx.font = 'bold 16px sans-serif';
                ctx.fillText('✨ Highlights', 40, 240);

                ctx.fillStyle = '#ffffff';
                ctx.font = '18px sans-serif';
                trip.likes.slice(0, 3).forEach((like, i) => {
                    ctx.fillText(`• ${like}`, 60, 275 + i * 30);
                });
            }

            // Stats
            if (showStats && stats) {
                ctx.fillStyle = '#00e054';
                ctx.font = 'bold 14px sans-serif';
                ctx.fillText(`📊 ${stats.countries} Countries • ${stats.states} States`, 40, 340);
            }

            // VC Pitch: Viral Growth Watermark
            ctx.fillStyle = '#567';
            ctx.font = 'italic 12px sans-serif';
            ctx.fillText('⚡ Get your Travel DNA at wanderlog.io/dna', 40, 380);

            // Download
            const link = document.createElement('a');
            link.download = `wanderlog-${trip.name.toLowerCase().replace(/\s+/g, '-')}.png`;
            link.href = canvas.toDataURL();
            link.click();

            // Track VC Viral Loop Metric
            (window as any).posthog?.capture('share_card_generated', { tripName: trip.name, type: trip.type });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleNativeShare = async () => {
        const shareData = {
            title: `My trip to ${trip.name} on Wanderlog`,
            text: `Check out my travel experience in ${trip.name}! ${trip.likes?.slice(0, 2).join(' • ')}`,
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                // User cancelled or share failed
            }
        } else {
            // Fallback: copy to clipboard
            await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
        }
    };

    return (
        <div className="space-y-4">
            {/* Card Preview */}
            <div
                ref={cardRef}
                className={`${getSizeClasses()} ${getThemeClasses()} rounded-lg border-2 p-6 shadow-2xl relative overflow-hidden`}
            >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#00e054] rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                </div>

                {/* Header */}
                <div className="relative flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#00e054] rounded-full flex items-center justify-center">
                            <i className="fas fa-location-arrow text-[#14181c] text-xs" />
                        </div>
                        <span className="font-black text-sm tracking-wider uppercase">Wanderlog</span>
                    </div>
                    <span className="text-2xl">{getTypeEmoji(trip.type)}</span>
                </div>

                {/* Content */}
                <div className="relative space-y-4">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">{trip.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="flex gap-0.5">{renderStars(trip.rating)}</div>
                            <span className="text-xs text-[#567]">({trip.rating}/5)</span>
                        </div>
                    </div>

                    {showHighlights && trip.likes && trip.likes.length > 0 && (
                        <div className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#9ab]">Highlights</span>
                            <ul className="space-y-1">
                                {trip.likes.slice(0, 3).map((like, i) => (
                                    <li key={i} className="text-sm text-[#def] flex items-center gap-2">
                                        <i className="fas fa-check text-[#00e054] text-[8px]" />
                                        {like}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {showStats && stats && (
                        <div className="flex items-center gap-4 pt-4 border-t border-[#2c3440]">
                            <div className="flex items-center gap-1.5">
                                <i className="fas fa-globe text-[#00e054] text-xs" />
                                <span className="text-xs font-bold">{stats.countries} Countries</span>
                            </div>
                            <div className="w-px h-4 bg-[#2c3440]" />
                            <div className="flex items-center gap-1.5">
                                <i className="fas fa-map-marker-alt text-[#00e054] text-xs" />
                                <span className="text-xs font-bold">{stats.states} States</span>
                            </div>
                        </div>
                    )}

                    {/* User Info */}
                    <div className="flex items-center gap-3 pt-4 border-t border-[#2c3440]">
                        {userAvatar ? (
                            <img src={userAvatar} alt={userName} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                            <div className="w-8 h-8 bg-[#2c3440] rounded-full flex items-center justify-center">
                                <i className="fas fa-user text-[#567] text-xs" />
                            </div>
                        )}
                        <div>
                            <p className="text-xs font-bold">{userName}</p>
                            <p className="text-[10px] text-[#567]">Shared via Wanderlog</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <Button
                    variant="primary"
                    onClick={handleNativeShare}
                    className="flex-1"
                >
                    <i className="fas fa-share-alt" /> Share
                </Button>
                <Button
                    variant="secondary"
                    onClick={handleDownload}
                    isLoading={isGenerating}
                >
                    <i className="fas fa-download" /> Download
                </Button>
            </div>
        </div>
    );
};

interface SharedTripCardProps {
    sharedTrip: SharedTrip;
    currentUserId?: string;
    onLike?: (tripId: string) => void;
    onComment?: (tripId: string) => void;
    onView?: (tripId: string) => void;
}

export const SharedTripCard: React.FC<SharedTripCardProps> = ({
    sharedTrip,
    currentUserId,
    onLike,
    onComment,
    onView,
}) => {
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(sharedTrip.likeCount);

    const handleLike = async () => {
        if (!currentUserId) return;

        try {
            const newLiked = await shareService.toggleLike(sharedTrip.id, currentUserId);
            setLiked(newLiked);
            setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
            onLike?.(sharedTrip.id);
        } catch (err) {
            console.error('Failed to toggle like:', err);
        }
    };

    const getTypeEmoji = (type: LocationType) => {
        switch (type) {
            case LocationType.COUNTRY: return '🌍';
            case LocationType.STATE: return '📍';
            case LocationType.CITY: return '🏙️';
            case LocationType.LANDMARK: return '🏛️';
            default: return '📍';
        }
    };

    return (
        <div
            className="bg-[#1b2228] border border-[#2c3440] rounded-lg overflow-hidden hover:border-[#00e054]/30 transition-all cursor-pointer group"
            onClick={() => onView?.(sharedTrip.id)}
        >
            {/* Header */}
            <div className="p-4 border-b border-[#2c3440] flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {sharedTrip.ownerAvatar ? (
                        <img
                            src={sharedTrip.ownerAvatar}
                            alt={sharedTrip.ownerName}
                            className="w-10 h-10 rounded-full object-cover border-2 border-[#00e054]/30"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-[#2c3440] flex items-center justify-center border-2 border-[#00e054]/30">
                            <i className="fas fa-user text-[#567]" />
                        </div>
                    )}
                    <div>
                        <p className="text-sm font-bold text-white">{sharedTrip.ownerName}</p>
                        <p className="text-[10px] text-[#567]">
                            {new Date(sharedTrip.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <span className="text-2xl">{getTypeEmoji(sharedTrip.type)}</span>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                <div>
                    <h3 className="text-lg font-black text-white group-hover:text-[#00e054] transition-colors">
                        {sharedTrip.name}
                    </h3>
                    <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: 5 }, (_, i) => (
                            <i
                                key={i}
                                className={`fas fa-star text-[10px] ${i < sharedTrip.rating ? 'text-[#00e054]' : 'text-[#2c3440]'}`}
                            />
                        ))}
                    </div>
                </div>

                {sharedTrip.highlights.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {sharedTrip.highlights.map((highlight, i) => (
                            <span
                                key={i}
                                className="text-[10px] bg-[#00e054]/10 text-[#00e054] px-2 py-1 rounded-full"
                            >
                                {highlight}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-[#14181c]/50 border-t border-[#2c3440] flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleLike(); }}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${liked ? 'text-red-500' : 'text-[#567] hover:text-red-500'
                            }`}
                        disabled={!currentUserId}
                    >
                        <i className={`${liked ? 'fas' : 'far'} fa-heart`} />
                        {likeCount}
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onComment?.(sharedTrip.id); }}
                        className="flex items-center gap-1.5 text-xs text-[#567] hover:text-[#00e054] transition-colors"
                    >
                        <i className="far fa-comment" />
                        {sharedTrip.commentCount}
                    </button>
                </div>
                <span className="text-[10px] text-[#567]">
                    {new Date(sharedTrip.visitDate).getFullYear()}
                </span>
            </div>
        </div>
    );
};
