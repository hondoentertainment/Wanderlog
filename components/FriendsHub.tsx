import React, { useEffect, useRef, useState } from 'react';
import { friendService } from '../services/friendService';
import { searchUsersByName } from '../services/userSearchService';
import { FriendConnection, FriendRequest, StatComparison } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import { Button } from './Button';
import { FriendStatsComparison } from './FriendStatsComparison';
import { SocialActivityFeed } from './SocialActivityFeed';
import {
  ensureNotificationPermission,
  notifyNewFriendRequest,
} from '../utils/friendRequestNotifications';

export const FriendsHub: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [friends, setFriends] = useState<FriendConnection[]>([]);
  const [friendLabels, setFriendLabels] = useState<Record<string, { name: string; avatar?: string }>>({});
  const [pending, setPending] = useState<FriendRequest[]>([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<{ id: string; name: string; avatar?: string }[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [comparingId, setComparingId] = useState<string | null>(null);
  const [comparison, setComparison] = useState<StatComparison | null>(null);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const seenRequestIds = useRef(new Set<string>());
  const pendingInitialized = useRef(false);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubFriends = friendService.subscribeToFriends(user.uid, setFriends);
    const unsubPending = friendService.subscribeToPendingRequests(user.uid, setPending);
    return () => {
      unsubFriends();
      unsubPending();
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || friends.length === 0) {
      setFriendLabels({});
      return;
    }
    friendService
      .getDirectoryProfiles(friends.map((f) => f.friendId))
      .then(setFriendLabels)
      .catch(() => undefined);
  }, [user?.uid, friends]);

  useEffect(() => {
    if (!pendingInitialized.current) {
      pending.forEach((r) => seenRequestIds.current.add(r.id));
      pendingInitialized.current = true;
      return;
    }
    for (const req of pending) {
      if (!seenRequestIds.current.has(req.id)) {
        seenRequestIds.current.add(req.id);
        notifyNewFriendRequest(req.fromUserName || 'Someone');
      }
    }
  }, [pending]);

  const handleSearch = async () => {
    if (!user?.uid || search.trim().length < 2) return;
    setLoadingSearch(true);
    try {
      const found = await searchUsersByName(search.trim(), user.uid);
      setResults(found);
    } catch {
      showToast('Search failed', 'error');
    } finally {
      setLoadingSearch(false);
    }
  };

  const sendRequest = async (toUserId: string, name: string) => {
    if (!user) return;
    try {
      await friendService.sendRequest(
        user.uid,
        user.displayName || 'Traveler',
        user.photoURL,
        toUserId,
      );
      showToast(`Request sent to ${name}`, 'success');
      setResults((r) => r.filter((x) => x.id !== toUserId));
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Could not send request', 'error');
    }
  };

  const accept = async (requestId: string) => {
    if (!user) return;
    try {
      await friendService.acceptRequest(requestId, user.uid);
      showToast('Friend added', 'success');
    } catch {
      showToast('Could not accept request', 'error');
    }
  };

  const reject = async (requestId: string) => {
    if (!user) return;
    try {
      await friendService.rejectRequest(requestId, user.uid);
    } catch {
      showToast('Could not reject request', 'error');
    }
  };

  const compareWithFriend = async (friendId: string) => {
    if (!user?.uid) return;
    setComparingId(friendId);
    setLoadingCompare(true);
    setComparison(null);
    try {
      const stats = await friendService.compareStats(user.uid, friendId);
      setComparison(stats);
    } catch {
      showToast('Could not load comparison (friend may need to enable sharing)', 'error');
      setComparingId(null);
    } finally {
      setLoadingCompare(false);
    }
  };

  if (!user) {
    return (
      <p className="text-[#567] text-sm text-center py-12">Sign in to connect with other travelers.</p>
    );
  }

  const comparingName = comparingId
    ? friendLabels[comparingId]?.name || 'Friend'
    : '';

  return (
    <div data-testid="friends-hub" className="space-y-10 max-w-2xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Friends</h2>
          <p className="text-[#567] text-sm font-bold uppercase tracking-widest mt-1">
            Find travelers and compare stats
          </p>
        </div>
        <Button
          variant="ghost"
          className="!text-[9px] border border-[#2c3440]"
          data-testid="enable-friend-notifications"
          onClick={() =>
            ensureNotificationPermission().then((ok) =>
              showToast(ok ? 'Notifications enabled' : 'Notifications blocked', ok ? 'success' : 'info'),
            )
          }
        >
          Enable alerts
        </Button>
      </div>

      {comparison && comparingId && (
        <FriendStatsComparison
          friendName={comparingName}
          comparison={comparison}
          onClose={() => {
            setComparison(null);
            setComparingId(null);
          }}
        />
      )}

      <section className="space-y-3 border border-[#2c3440] rounded-xl p-6 bg-[#1b2228]/50">
        <h3 className="text-[10px] font-black text-[#9ab] uppercase tracking-widest">Friend activity</h3>
        <SocialActivityFeed friendIds={friends.map((f) => f.friendId)} />
      </section>

      {pending.length > 0 && (
        <section className="space-y-3 border border-[#00e054]/30 rounded-xl p-6 bg-[#00e054]/5">
          <h3 className="text-[10px] font-black text-[#00e054] uppercase tracking-widest">
            Pending requests ({pending.length})
          </h3>
          {pending.map((req) => (
            <div
              key={req.id}
              className="flex items-center justify-between gap-4 bg-[#14181c] p-4 rounded-lg border border-[#2c3440]"
            >
              <span className="text-sm font-bold text-white">
                {req.fromUserName || 'Traveler'}
              </span>
              <div className="flex gap-2">
                <Button variant="primary" className="!text-[9px]" onClick={() => accept(req.id)}>
                  Accept
                </Button>
                <Button variant="ghost" className="!text-[9px]" onClick={() => reject(req.id)}>
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="space-y-4 border border-[#2c3440] rounded-xl p-6 bg-[#1b2228]/50">
        <h3 className="text-[10px] font-black text-[#9ab] uppercase tracking-widest">Find friends</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search by display name…"
            data-testid="friend-search-input"
            className="flex-1 bg-[#2c3440] px-4 py-2 rounded-sm text-sm text-white outline-none"
          />
          <Button variant="secondary" onClick={handleSearch} isLoading={loadingSearch}>
            Search
          </Button>
        </div>
        <p className="text-[10px] text-[#567]">Uses indexed name search (min 2 characters).</p>
        <ul className="space-y-2">
          {results.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-3 p-3 bg-[#14181c] rounded-lg border border-[#2c3440]"
            >
              <span className="text-sm font-bold text-white">{r.name}</span>
              <Button variant="ghost" className="!text-[9px]" onClick={() => sendRequest(r.id, r.name)}>
                Add
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-[10px] font-black text-[#9ab] uppercase tracking-widest">
          Your friends ({friends.length})
        </h3>
        {friends.length === 0 ? (
          <p className="text-[#567] text-xs">No friends yet. Search above to connect.</p>
        ) : (
          friends.map((f) => {
            const label = friendLabels[f.friendId];
            const name = label?.name || 'Traveler';
            return (
              <div
                key={f.id}
                className="flex items-center justify-between gap-3 p-4 bg-[#1b2228] border border-[#2c3440] rounded-lg"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {label?.avatar ? (
                    <img src={label.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#2c3440] flex items-center justify-center text-[10px] font-black text-[#9ab]">
                      {name.charAt(0)}
                    </div>
                  )}
                  <span className="text-sm font-bold text-[#def] truncate">{name}</span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    className="!text-[9px]"
                    data-testid={`compare-friend-${f.friendId}`}
                    isLoading={loadingCompare && comparingId === f.friendId}
                    onClick={() => compareWithFriend(f.friendId)}
                  >
                    Compare
                  </Button>
                  <Button
                    variant="ghost"
                    className="!text-[9px] text-red-400"
                    onClick={() =>
                      friendService.removeFriend(user.uid, f.friendId).then(() =>
                        showToast('Friend removed', 'info'),
                      )
                    }
                  >
                    Remove
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
};
