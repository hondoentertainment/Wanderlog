import React, { useState, useEffect, useCallback } from 'react';
import { SharedBucketList, SharedBucketItem, LocationType } from '../types';
import { collaborativeListService } from '../services/collaborativeBucketListService';
import { Button } from './Button';
import { CollaborativeShareModal } from './ShareModal';

type SortOption = 'votes' | 'date' | 'priority';
type FilterOption = 'all' | 'pending' | 'planned' | 'visited';

interface CollaborativeListProps {
    listId: string;
    userId: string;
    userName: string;
    friends: { id: string; name: string; avatar?: string }[];
    onBack?: () => void;
}

export const CollaborativeList: React.FC<CollaborativeListProps> = ({
    listId,
    userId,
    userName,
    friends,
    onBack,
}) => {
    const [list, setList] = useState<SharedBucketList | null>(null);
    const [items, setItems] = useState<SharedBucketItem[]>([]);
    const [sortBy, setSortBy] = useState<SortOption>('votes');
    const [filter, setFilter] = useState<FilterOption>('all');
    const [newItemName, setNewItemName] = useState('');
    const [newItemType, setNewItemType] = useState<LocationType>(LocationType.CITY);
    const [newItemNotes, setNewItemNotes] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showShareModal, setShowShareModal] = useState(false);
    const [userVotes, setUserVotes] = useState<{ [itemId: string]: 'want' | 'pass' }>({});

    const isOwner = list?.ownerId === userId;
    const canEdit = list?.sharedWith.includes(userId) || isOwner;

    // Subscribe to list data
    useEffect(() => {
        setIsLoading(true);

        const unsubscribeMeta = collaborativeListService.subscribeToListMeta(listId, (listData) => {
            setList(listData);
        });

        const unsubscribeItems = collaborativeListService.subscribeToList(listId, (listItems) => {
            setItems(listItems);
            setIsLoading(false);

            // Update user votes tracking
            const votes: { [itemId: string]: 'want' | 'pass' } = {};
            listItems.forEach(item => {
                if (item.votes[userId]) {
                    votes[item.id] = item.votes[userId];
                }
            });
            setUserVotes(votes);
        });

        return () => {
            unsubscribeMeta();
            unsubscribeItems();
        };
    }, [listId, userId]);

    const handleAddItem = async () => {
        if (!newItemName.trim() || !canEdit) return;

        try {
            await collaborativeListService.addItem(
                listId,
                userId,
                userName,
                newItemName.trim(),
                newItemType,
                newItemNotes.trim() || undefined
            );

            setNewItemName('');
            setNewItemNotes('');
            setIsAdding(false);
        } catch (err) {
            console.error('Failed to add item:', err);
        }
    };

    const handleVote = async (itemId: string, vote: 'want' | 'pass') => {
        try {
            await collaborativeListService.vote(listId, itemId, userId, vote);
        } catch (err) {
            console.error('Failed to vote:', err);
        }
    };

    const handleMarkVisited = async (itemId: string) => {
        try {
            await collaborativeListService.markVisited(listId, itemId, userId);
        } catch (err) {
            console.error('Failed to mark visited:', err);
        }
    };

    const handleMarkPlanned = async (itemId: string) => {
        try {
            await collaborativeListService.markPlanned(listId, itemId);
        } catch (err) {
            console.error('Failed to mark planned:', err);
        }
    };

    const handleRemoveItem = async (itemId: string) => {
        if (!window.confirm('Remove this destination?')) return;

        try {
            await collaborativeListService.removeItem(listId, itemId);
        } catch (err) {
            console.error('Failed to remove item:', err);
        }
    };

    const handleShare = async (userIds: string[]) => {
        if (!list) return;
        await collaborativeListService.shareWithUsers(listId, userIds, list.ownerId);
    };

    const getSortedAndFilteredItems = useCallback(() => {
        let result = [...items];

        // Filter
        if (filter !== 'all') {
            result = result.filter(item => item.status === filter);
        }

        // Sort
        switch (sortBy) {
            case 'votes':
                result.sort((a, b) => b.priorityScore - a.priorityScore);
                break;
            case 'priority':
                result.sort((a, b) => b.priorityScore - a.priorityScore);
                break;
            case 'date':
                result.sort((a, b) => a.id.localeCompare(b.id));
                break;
        }

        return result;
    }, [items, filter, sortBy]);

    const getVoteCounts = (item: SharedBucketItem) => {
        return collaborativeListService.getVoteCounts(item.votes);
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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'visited':
                return <span className="text-[10px] bg-[#00e054]/20 text-[#00e054] px-2 py-0.5 rounded-full">Visited</span>;
            case 'planned':
                return <span className="text-[10px] bg-[#40bcf4]/20 text-[#40bcf4] px-2 py-0.5 rounded-full">Planned</span>;
            default:
                return <span className="text-[10px] bg-[#2c3440] text-[#567] px-2 py-0.5 rounded-full">Pending</span>;
        }
    };

    const sortedItems = getSortedAndFilteredItems();

    if (isLoading) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex items-center justify-between">
                    <div className="h-8 w-48 bg-[#2c3440] rounded animate-pulse" />
                    <div className="h-10 w-32 bg-[#2c3440] rounded animate-pulse" />
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-[#1b2228] border border-[#2c3440] rounded-lg animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (!list) {
        return (
            <div className="text-center py-16">
                <i className="fas fa-exclamation-circle text-4xl text-[#2c3440] mb-4" />
                <p className="text-[#567]">List not found or you don't have access</p>
                {onBack && (
                    <Button variant="primary" onClick={onBack} className="mt-4">
                        Go Back
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2c3440] pb-4">
                <div>
                    <div className="flex items-center gap-3">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="w-8 h-8 rounded-full bg-[#2c3440] flex items-center justify-center text-[#567] hover:text-white transition-colors"
                            >
                                <i className="fas fa-arrow-left" />
                            </button>
                        )}
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                                <i className="fas fa-users text-[#00e054]" />
                                {list.name}
                            </h2>
                            <p className="text-[10px] text-[#567] mt-1">
                                {items.length} destinations • {list.sharedWith.length} members
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isOwner && (
                        <Button variant="secondary" onClick={() => setShowShareModal(true)}>
                            <i className="fas fa-user-plus" /> Share
                        </Button>
                    )}
                    {canEdit && (
                        <Button variant="primary" onClick={() => setIsAdding(true)}>
                            <i className="fas fa-plus" /> Add Destination
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters & Sort */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-[#567]">Sort:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="bg-[#2c3440] text-white text-xs px-3 py-1.5 rounded border border-[#2c3440] outline-none focus:border-[#00e054]"
                    >
                        <option value="votes">Most Votes</option>
                        <option value="priority">Priority</option>
                        <option value="date">Date Added</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-[#567]">Filter:</span>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as FilterOption)}
                        className="bg-[#2c3440] text-white text-xs px-3 py-1.5 rounded border border-[#2c3440] outline-none focus:border-[#00e054]"
                    >
                        <option value="all">All</option>
                        <option value="pending">Pending</option>
                        <option value="planned">Planned</option>
                        <option value="visited">Visited</option>
                    </select>
                </div>
            </div>

            {/* Add Item Form */}
            {isAdding && canEdit && (
                <div className="bg-[#1b2228] border border-[#00e054]/30 rounded-lg p-4 animate-in slide-in-from-top-2">
                    <h3 className="text-sm font-black text-white uppercase mb-4">Add New Destination</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <input
                            type="text"
                            placeholder="Destination name..."
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            className="bg-[#14181c] border border-[#2c3440] rounded px-4 py-2 text-sm text-white outline-none focus:border-[#00e054]"
                        />
                        <select
                            value={newItemType}
                            onChange={(e) => setNewItemType(e.target.value as LocationType)}
                            className="bg-[#14181c] border border-[#2c3440] rounded px-4 py-2 text-sm text-white outline-none focus:border-[#00e054]"
                        >
                            <option value={LocationType.CITY}>City</option>
                            <option value={LocationType.COUNTRY}>Country</option>
                            <option value={LocationType.STATE}>State</option>
                            <option value={LocationType.LANDMARK}>Landmark</option>
                        </select>
                    </div>
                    <textarea
                        placeholder="Notes (optional)..."
                        value={newItemNotes}
                        onChange={(e) => setNewItemNotes(e.target.value)}
                        className="w-full bg-[#14181c] border border-[#2c3440] rounded px-4 py-2 text-sm text-white outline-none focus:border-[#00e054] resize-none h-20 mb-3"
                    />
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setIsAdding(false)} className="flex-1">
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleAddItem}
                            disabled={!newItemName.trim()}
                            className="flex-1"
                        >
                            Add Destination
                        </Button>
                    </div>
                </div>
            )}

            {/* Items List */}
            <div className="space-y-3">
                {sortedItems.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-[#2c3440] rounded-lg">
                        <i className="fas fa-map-marked-alt text-4xl text-[#2c3440] mb-4" />
                        <p className="text-[#567] text-sm">No destinations yet</p>
                        <p className="text-[#456] text-xs mt-2">
                            {canEdit ? 'Add your first destination above!' : 'Waiting for items to be added...'}
                        </p>
                    </div>
                ) : (
                    sortedItems.map((item) => {
                        const voteCounts = getVoteCounts(item);
                        const userVote = userVotes[item.id];

                        return (
                            <div
                                key={item.id}
                                className={`bg-[#1b2228] border rounded-lg p-4 transition-all ${item.status === 'visited'
                                        ? 'border-[#00e054]/30'
                                        : item.status === 'planned'
                                            ? 'border-[#40bcf4]/30'
                                            : 'border-[#2c3440] hover:border-[#456]'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-lg">{getTypeEmoji(item.type)}</span>
                                            <h3 className="text-white font-bold">{item.destination}</h3>
                                            {getStatusBadge(item.status)}
                                        </div>

                                        <p className="text-[10px] text-[#567] mb-2">
                                            Added by {item.addedByName}
                                        </p>

                                        {item.notes && (
                                            <p className="text-xs text-[#9ab] italic mb-3">"{item.notes}"</p>
                                        )}

                                        {/* Voting Panel */}
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => handleVote(item.id, 'want')}
                                                disabled={!canEdit}
                                                className={`flex items-center gap-1.5 text-xs transition-colors ${userVote === 'want'
                                                        ? 'text-[#00e054]'
                                                        : 'text-[#567] hover:text-[#00e054]'
                                                    } ${!canEdit && 'opacity-50 cursor-not-allowed'}`}
                                            >
                                                <i className={`${userVote === 'want' ? 'fas' : 'far'} fa-thumbs-up`} />
                                                {voteCounts.want}
                                            </button>

                                            <button
                                                onClick={() => handleVote(item.id, 'pass')}
                                                disabled={!canEdit}
                                                className={`flex items-center gap-1.5 text-xs transition-colors ${userVote === 'pass'
                                                        ? 'text-red-500'
                                                        : 'text-[#567] hover:text-red-500'
                                                    } ${!canEdit && 'opacity-50 cursor-not-allowed'}`}
                                            >
                                                <i className={`${userVote === 'pass' ? 'fas' : 'far'} fa-thumbs-down`} />
                                                {voteCounts.pass}
                                            </button>

                                            <span className="text-[10px] text-[#567]">
                                                Score: {item.priorityScore}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-1">
                                        {item.status !== 'visited' && canEdit && (
                                            <>
                                                {item.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleMarkPlanned(item.id)}
                                                        className="w-8 h-8 rounded bg-[#40bcf4]/10 text-[#40bcf4] hover:bg-[#40bcf4]/20 flex items-center justify-center transition-colors"
                                                        title="Mark as planned"
                                                    >
                                                        <i className="fas fa-calendar text-xs" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleMarkVisited(item.id)}
                                                    className="w-8 h-8 rounded bg-[#00e054]/10 text-[#00e054] hover:bg-[#00e054]/20 flex items-center justify-center transition-colors"
                                                    title="Mark as visited"
                                                >
                                                    <i className="fas fa-check text-xs" />
                                                </button>
                                            </>
                                        )}
                                        {(isOwner || item.addedBy === userId) && (
                                            <button
                                                onClick={() => handleRemoveItem(item.id)}
                                                className="w-8 h-8 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 flex items-center justify-center transition-colors"
                                                title="Remove"
                                            >
                                                <i className="fas fa-trash text-xs" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Share Modal */}
            <CollaborativeShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                listId={listId}
                listName={list.name}
                ownerId={list.ownerId}
                friends={friends}
                sharedWith={list.sharedWith}
                onShare={handleShare}
            />
        </div>
    );
};

// Component to display list of collaborative lists
interface CollaborativeListsOverviewProps {
    userId: string;
    onSelectList: (listId: string) => void;
    onCreateList: () => void;
}

export const CollaborativeListsOverview: React.FC<CollaborativeListsOverviewProps> = ({
    userId,
    onSelectList,
    onCreateList,
}) => {
    const [ownedLists, setOwnedLists] = useState<SharedBucketList[]>([]);
    const [sharedLists, setSharedLists] = useState<SharedBucketList[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadLists = async () => {
            setIsLoading(true);
            try {
                const [owned, shared] = await Promise.all([
                    collaborativeListService.getOwnedLists(userId),
                    collaborativeListService.getSharedWithMe(userId),
                ]);
                setOwnedLists(owned);
                setSharedLists(shared);
            } catch (err) {
                console.error('Failed to load lists:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadLists();
    }, [userId]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-[#1b2228] border border-[#2c3440] rounded-lg animate-pulse" />
                ))}
            </div>
        );
    }

    const allLists = [...ownedLists, ...sharedLists];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-white uppercase tracking-tight">
                    Collaborative Lists
                </h2>
                <Button variant="primary" onClick={onCreateList}>
                    <i className="fas fa-plus" /> New List
                </Button>
            </div>

            {allLists.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-[#2c3440] rounded-lg">
                    <i className="fas fa-users text-4xl text-[#2c3440] mb-4" />
                    <p className="text-[#567] text-sm">No collaborative lists yet</p>
                    <p className="text-[#456] text-xs mt-2">Create a list and invite friends to collaborate!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allLists.map(list => {
                        const isOwner = list.ownerId === userId;
                        const itemCount = list.items?.length || 0;
                        const visitedCount = list.items?.filter(i => i.status === 'visited').length || 0;

                        return (
                            <button
                                key={list.id}
                                onClick={() => onSelectList(list.id)}
                                className="bg-[#1b2228] border border-[#2c3440] rounded-lg p-4 text-left hover:border-[#00e054]/30 transition-all group"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="text-white font-bold group-hover:text-[#00e054] transition-colors">
                                        {list.name}
                                    </h3>
                                    {isOwner && (
                                        <span className="text-[9px] bg-[#00e054]/10 text-[#00e054] px-2 py-0.5 rounded-full">
                                            Owner
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-4 text-[10px] text-[#567]">
                                    <span>{itemCount} destinations</span>
                                    <span>{list.sharedWith.length} members</span>
                                    {visitedCount > 0 && (
                                        <span className="text-[#00e054]">{visitedCount} visited</span>
                                    )}
                                </div>

                                <div className="mt-3 flex -space-x-2">
                                    {list.sharedWith.slice(0, 4).map((memberId, i) => (
                                        <div
                                            key={i}
                                            className="w-6 h-6 rounded-full bg-[#2c3440] border-2 border-[#1b2228] flex items-center justify-center text-[8px] text-white"
                                        >
                                            {memberId.charAt(0).toUpperCase()}
                                        </div>
                                    ))}
                                    {list.sharedWith.length > 4 && (
                                        <div className="w-6 h-6 rounded-full bg-[#2c3440] border-2 border-[#1b2228] flex items-center justify-center text-[8px] text-[#567]">
                                            +{list.sharedWith.length - 4}
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
