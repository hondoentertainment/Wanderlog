import React, { useState, useEffect } from 'react';
import { TravelLocation, ShareScope, SharedBucketList, SharedTrip } from '../types';
import { shareService } from '../services/shareService';
import { collaborativeListService } from '../services/collaborativeBucketListService';
import { ShareCard } from './ShareCard';
import { Button } from './Button';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    resource: 'trip' | 'bucketList' | 'profile';
    resourceId?: string;
    trip?: TravelLocation;
    userId: string;
    userName: string;
    userAvatar?: string | null;
    stats?: {
        countries: number;
        states: number;
    };
}

export const ShareModal: React.FC<ShareModalProps> = ({
    isOpen,
    onClose,
    resource,
    resourceId,
    trip,
    userId,
    userName,
    userAvatar,
    stats,
}) => {
    const [shareLink, setShareLink] = useState('');
    const [visibility, setVisibility] = useState<ShareScope>('friends');
    const [copied, setCopied] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [sharedTripId, setSharedTripId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'preview' | 'settings'>('preview');

    useEffect(() => {
        if (isOpen && resource === 'trip' && trip) {
            // Generate a temporary share link
            const tempId = crypto.randomUUID();
            setShareLink(`${window.location.origin}/shared/${tempId}`);
        }
    }, [isOpen, resource, trip]);

    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(shareLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShareToSocial = (platform: 'twitter' | 'facebook' | 'linkedin') => {
        const text = trip
            ? `Check out my trip to ${trip.name} on Wanderlog!`
            : 'Check out my travel adventures on Wanderlog!';

        const urls = {
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareLink)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}`,
        };

        window.open(urls[platform], '_blank', 'width=600,height=400');
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: trip ? `My trip to ${trip.name}` : 'My Wanderlog Profile',
                    text: trip
                        ? `Check out my travel experience in ${trip.name}!`
                        : 'Check out my travel adventures!',
                    url: shareLink,
                });
            } catch (err) {
                // User cancelled
            }
        } else {
            handleCopyLink();
        }
    };

    const handleCreateSharedTrip = async () => {
        if (!trip) return;

        setIsSharing(true);
        try {
            const newSharedTripId = await shareService.createSharedTrip(
                trip,
                userId,
                userName,
                userAvatar,
                { scope: visibility }
            );
            setSharedTripId(newSharedTripId);
            setShareLink(shareService.generateShareUrl(newSharedTripId));
        } catch (err) {
            console.error('Failed to create shared trip:', err);
        } finally {
            setIsSharing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div
                className="bg-[#1b2228] border border-[#2c3440] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#2c3440]">
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">
                            Share Your Adventure
                        </h2>
                        <p className="text-[#567] text-xs mt-1">
                            {resource === 'trip' ? 'Share this trip with friends' : 'Share your travel profile'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-[#2c3440] flex items-center justify-center text-[#567] hover:text-white transition-colors"
                    >
                        <i className="fas fa-times" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[#2c3440]">
                    <button
                        onClick={() => setActiveTab('preview')}
                        className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-colors ${activeTab === 'preview'
                                ? 'text-[#00e054] border-b-2 border-[#00e054]'
                                : 'text-[#567] hover:text-white'
                            }`}
                    >
                        Preview
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-colors ${activeTab === 'settings'
                                ? 'text-[#00e054] border-b-2 border-[#00e054]'
                                : 'text-[#567] hover:text-white'
                            }`}
                    >
                        Settings
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {activeTab === 'preview' ? (
                        <div className="space-y-6">
                            {resource === 'trip' && trip && (
                                <ShareCard
                                    trip={trip}
                                    userName={userName}
                                    userAvatar={userAvatar}
                                    stats={stats}
                                    options={{
                                        showStats: true,
                                        showHighlights: true,
                                        theme: 'dark',
                                        size: 'medium',
                                    }}
                                />
                            )}

                            {resource === 'profile' && (
                                <div className="bg-[#14181c] border border-[#2c3440] rounded-lg p-8 text-center">
                                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#2c3440] flex items-center justify-center">
                                        {userAvatar ? (
                                            <img src={userAvatar} alt={userName} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <i className="fas fa-user text-3xl text-[#567]" />
                                        )}
                                    </div>
                                    <h3 className="text-xl font-black text-white">{userName}</h3>
                                    <p className="text-[#567] text-sm mt-2">Travel Profile</p>
                                    {stats && (
                                        <div className="flex justify-center gap-6 mt-6">
                                            <div className="text-center">
                                                <div className="text-2xl font-black text-[#00e054]">{stats.countries}</div>
                                                <div className="text-[10px] text-[#567] uppercase tracking-widest">Countries</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-black text-[#00e054]">{stats.states}</div>
                                                <div className="text-[10px] text-[#567] uppercase tracking-widest">States</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Visibility Selector */}
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#9ab] block mb-3">
                                    Who can see this?
                                </label>
                                <div className="space-y-2">
                                    <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${visibility === 'private'
                                            ? 'border-[#00e054] bg-[#00e054]/10'
                                            : 'border-[#2c3440] hover:border-[#456]'
                                        }`}>
                                        <input
                                            type="radio"
                                            name="visibility"
                                            value="private"
                                            checked={visibility === 'private'}
                                            onChange={(e) => setVisibility(e.target.value as ShareScope)}
                                            className="hidden"
                                        />
                                        <i className={`fas fa-lock ${visibility === 'private' ? 'text-[#00e054]' : 'text-[#567]'}`} />
                                        <div className="flex-1">
                                            <div className="text-sm font-bold">Only me</div>
                                            <div className="text-[10px] text-[#567]">Private to your account</div>
                                        </div>
                                    </label>

                                    <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${visibility === 'friends'
                                            ? 'border-[#00e054] bg-[#00e054]/10'
                                            : 'border-[#2c3440] hover:border-[#456]'
                                        }`}>
                                        <input
                                            type="radio"
                                            name="visibility"
                                            value="friends"
                                            checked={visibility === 'friends'}
                                            onChange={(e) => setVisibility(e.target.value as ShareScope)}
                                            className="hidden"
                                        />
                                        <i className={`fas fa-user-friends ${visibility === 'friends' ? 'text-[#00e054]' : 'text-[#567]'}`} />
                                        <div className="flex-1">
                                            <div className="text-sm font-bold">Friends only</div>
                                            <div className="text-[10px] text-[#567]">Visible to your connections</div>
                                        </div>
                                    </label>

                                    <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${visibility === 'public'
                                            ? 'border-[#00e054] bg-[#00e054]/10'
                                            : 'border-[#2c3440] hover:border-[#456]'
                                        }`}>
                                        <input
                                            type="radio"
                                            name="visibility"
                                            value="public"
                                            checked={visibility === 'public'}
                                            onChange={(e) => setVisibility(e.target.value as ShareScope)}
                                            className="hidden"
                                        />
                                        <i className={`fas fa-globe ${visibility === 'public' ? 'text-[#00e054]' : 'text-[#567]'}`} />
                                        <div className="flex-1">
                                            <div className="text-sm font-bold">Public</div>
                                            <div className="text-[10px] text-[#567]">Anyone with the link can view</div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Share Link */}
                            {sharedTripId && (
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#9ab] block mb-3">
                                        Share Link
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={shareLink}
                                            className="flex-1 bg-[#14181c] border border-[#2c3440] rounded px-4 py-2 text-sm text-[#def] outline-none"
                                        />
                                        <Button
                                            variant={copied ? 'success' : 'primary'}
                                            onClick={handleCopyLink}
                                            className="min-w-[100px]"
                                        >
                                            {copied ? (
                                                <><i className="fas fa-check" /> Copied!</>
                                            ) : (
                                                <><i className="fas fa-copy" /> Copy</>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[#2c3440] space-y-4">
                    {/* Social Share Buttons */}
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => handleShareToSocial('twitter')}
                            className="flex-1"
                        >
                            <i className="fab fa-twitter" /> Twitter
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => handleShareToSocial('facebook')}
                            className="flex-1"
                        >
                            <i className="fab fa-facebook" /> Facebook
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => handleShareToSocial('linkedin')}
                            className="flex-1"
                        >
                            <i className="fab fa-linkedin" /> LinkedIn
                        </Button>
                    </div>

                    {/* Primary Actions */}
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        {!sharedTripId && resource === 'trip' ? (
                            <Button
                                variant="primary"
                                onClick={handleCreateSharedTrip}
                                isLoading={isSharing}
                                className="flex-1"
                            >
                                <i className="fas fa-share-alt" /> Create Share Link
                            </Button>
                        ) : (
                            <Button
                                variant="primary"
                                onClick={handleNativeShare}
                                className="flex-1"
                            >
                                <i className="fas fa-share" /> Share
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

interface CollaborativeShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    listId: string;
    listName: string;
    ownerId: string;
    friends: { id: string; name: string; avatar?: string }[];
    sharedWith: string[];
    onShare: (userIds: string[]) => void;
}

export const CollaborativeShareModal: React.FC<CollaborativeShareModalProps> = ({
    isOpen,
    onClose,
    listId,
    listName,
    ownerId,
    friends,
    sharedWith,
    onShare,
}) => {
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [isSharing, setIsSharing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelectedUsers([]);
        }
    }, [isOpen]);

    const toggleUser = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleShare = async () => {
        if (selectedUsers.length === 0) return;

        setIsSharing(true);
        try {
            await onShare(selectedUsers);
            onClose();
        } finally {
            setIsSharing(false);
        }
    };

    if (!isOpen) return null;

    const availableFriends = friends.filter(f => !sharedWith.includes(f.id) && f.id !== ownerId);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div
                className="bg-[#1b2228] border border-[#2c3440] rounded-2xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#2c3440]">
                    <div>
                        <h2 className="text-lg font-black text-white uppercase tracking-tight">
                            Share List
                        </h2>
                        <p className="text-[#567] text-xs mt-1">{listName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-[#2c3440] flex items-center justify-center text-[#567] hover:text-white transition-colors"
                    >
                        <i className="fas fa-times" />
                    </button>
                </div>

                {/* Friends List */}
                <div className="p-6 max-h-[50vh] overflow-y-auto">
                    {availableFriends.length === 0 ? (
                        <div className="text-center py-8">
                            <i className="fas fa-users text-4xl text-[#2c3440] mb-4" />
                            <p className="text-[#567] text-sm">No friends available to share with</p>
                            <p className="text-[#456] text-xs mt-2">All your friends already have access</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {availableFriends.map(friend => (
                                <label
                                    key={friend.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedUsers.includes(friend.id)
                                            ? 'border-[#00e054] bg-[#00e054]/10'
                                            : 'border-[#2c3440] hover:border-[#456]'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.includes(friend.id)}
                                        onChange={() => toggleUser(friend.id)}
                                        className="hidden"
                                    />
                                    {friend.avatar ? (
                                        <img
                                            src={friend.avatar}
                                            alt={friend.name}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-[#2c3440] flex items-center justify-center">
                                            <i className="fas fa-user text-[#567]" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-white">{friend.name}</div>
                                    </div>
                                    {selectedUsers.includes(friend.id) && (
                                        <i className="fas fa-check text-[#00e054]" />
                                    )}
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[#2c3440] flex gap-2">
                    <Button variant="ghost" onClick={onClose} className="flex-1">
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleShare}
                        isLoading={isSharing}
                        disabled={selectedUsers.length === 0}
                        className="flex-1"
                    >
                        Share with {selectedUsers.length > 0 && `(${selectedUsers.length})`}
                    </Button>
                </div>
            </div>
        </div>
    );
};
