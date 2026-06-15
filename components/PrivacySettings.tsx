import React, { useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { friendService } from '../services/friendService';
import { useAuth } from '../contexts/AuthContext';
import { isPushConfigured, registerPushNotifications, unregisterPushToken } from '../services/pushService';
import { unpublishAllForUser } from '../services/publicLocationService';

interface PrivacySettingsProps {
  profile: UserProfile;
  onProfileChange: (profile: UserProfile) => void;
}

export const PrivacySettings: React.FC<PrivacySettingsProps> = ({ profile, onProfileChange }) => {
  const { user } = useAuth();
  const [shareStats, setShareStats] = useState(false);
  const [shareLocations, setShareLocations] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const pushAvailable = isPushConfigured();

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getDoc(doc(db, 'users', user.uid, 'settings', 'publicProfile')),
      getDoc(doc(db, 'users', user.uid, 'settings', 'push')),
    ])
      .then(([publicSnap, pushSnap]) => {
        if (publicSnap.exists()) {
          const d = publicSnap.data();
          setShareStats(Boolean(d.shareStats));
          setShareLocations(Boolean(d.shareLocations));
        }
        if (pushSnap.exists()) {
          setPushEnabled(Boolean(pushSnap.data()?.token));
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [user]);

  const persistPublic = async (stats: boolean, locations: boolean) => {
    if (!user) return;
    await friendService.updatePublicProfile(user.uid, {
      userId: user.uid,
      displayName: profile.name,
      shareStats: stats,
      shareLocations: locations,
      totalCountries: 0,
      totalStates: 0,
      favoriteDestinations: [],
    });
  };

  if (loading) return null;

  return (
    <div className="space-y-4 border border-[#2c3440] rounded-lg p-6 bg-[#14181c]/50">
      <h3 className="text-[10px] font-black text-[#9ab] uppercase tracking-widest">Privacy & sharing</h3>

      <label className="flex items-center justify-between gap-4 cursor-pointer">
        <span className="text-xs text-[#def] font-bold">Publish photo logs to discovery feed</span>
        <input
          type="checkbox"
          checked={profile.publishToDiscoveryFeed !== false}
          onChange={async (e) => {
            const enabled = e.target.checked;
            onProfileChange({ ...profile, publishToDiscoveryFeed: enabled });
            if (!enabled && user) {
              await unpublishAllForUser(user.uid).catch(() => undefined);
            }
          }}
          className="accent-[#00e054] w-5 h-5"
        />
      </label>
      <p className="text-[10px] text-[#567]">Only logs with photos are published when enabled.</p>

      <label className="flex items-center justify-between gap-4 cursor-pointer">
        <span className="text-xs text-[#def] font-bold">Share travel stats with friends</span>
        <input
          type="checkbox"
          checked={shareStats}
          onChange={async (e) => {
            const v = e.target.checked;
            setShareStats(v);
            await persistPublic(v, shareLocations);
          }}
          className="accent-[#00e054] w-5 h-5"
        />
      </label>

      <label className="flex items-center justify-between gap-4 cursor-pointer">
        <span className="text-xs text-[#def] font-bold">Share location list with friends</span>
        <input
          type="checkbox"
          checked={shareLocations}
          onChange={async (e) => {
            const v = e.target.checked;
            setShareLocations(v);
            await persistPublic(shareStats, v);
          }}
          className="accent-[#00e054] w-5 h-5"
        />
      </label>

      {pushAvailable && (
        <label className="flex items-center justify-between gap-4 cursor-pointer">
          <span className="text-xs text-[#def] font-bold">Trip reminders (push)</span>
          <input
            type="checkbox"
            checked={pushEnabled}
            data-testid="push-notifications-toggle"
            onChange={async (e) => {
              if (!user) return;
              const v = e.target.checked;
              if (v) {
                const ok = await registerPushNotifications(user.uid);
                setPushEnabled(ok);
              } else {
                await unregisterPushToken(user.uid);
                setPushEnabled(false);
              }
            }}
            className="accent-[#00e054] w-5 h-5"
          />
        </label>
      )}
    </div>
  );
};
