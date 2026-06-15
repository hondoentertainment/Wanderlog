import React, { useEffect, useState } from 'react';
import { fetchFriendActivities, SocialActivity } from '../services/activityFeedService';

interface SocialActivityFeedProps {
  friendIds: string[];
}

function activityIcon(type: SocialActivity['type']): string {
  switch (type) {
    case 'friend_accepted':
      return 'fa-user-check';
    case 'trip_logged':
      return 'fa-camera';
    case 'squad_joined':
      return 'fa-users';
    default:
      return 'fa-user-plus';
  }
}

export const SocialActivityFeed: React.FC<SocialActivityFeedProps> = ({ friendIds }) => {
  const [activities, setActivities] = useState<SocialActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (friendIds.length === 0) {
      setActivities([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchFriendActivities(friendIds, 15)
      .then(setActivities)
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, [friendIds.join(',')]);

  if (loading) {
    return <p className="text-[10px] text-[#567] uppercase tracking-widest">Loading activity…</p>;
  }

  if (activities.length === 0) {
    return (
      <p className="text-xs text-[#567]">
        Friend activity will appear here when friends log trips or connect.
      </p>
    );
  }

  return (
    <ul className="space-y-3" data-testid="social-activity-feed">
      {activities.map((activity) => (
        <li
          key={activity.id}
          className="flex items-start gap-3 p-3 rounded-lg bg-[#1b2228]/60 border border-[#2c3440]"
        >
          <span className="w-8 h-8 rounded-full bg-[#00e054]/10 flex items-center justify-center shrink-0">
            <i className={`fas ${activityIcon(activity.type)} text-[#00e054] text-xs`} />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-[#def] font-bold truncate">{activity.actorName}</p>
            <p className="text-[11px] text-[#9ab] leading-snug">{activity.summary}</p>
            <p className="text-[10px] text-[#567] mt-1">
              {new Date(activity.createdAt).toLocaleDateString()}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
};
