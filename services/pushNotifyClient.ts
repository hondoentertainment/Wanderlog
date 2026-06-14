import { auth } from './firebaseConfig';

export type PushNotifyType = 'friend_request' | 'friend_accepted' | 'trip_reminder';

export interface PushNotifyPayload {
  targetUserId: string;
  type: PushNotifyType;
  title: string;
  body: string;
  data?: Record<string, string>;
}

/** Sends a server-side FCM notification when FIREBASE_SERVICE_ACCOUNT is configured on Vercel. */
export async function sendPushNotification(payload: PushNotifyPayload): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const token = await user.getIdToken();
    await fetch('/api/push/notify', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Push is best-effort; browser notifications still work offline
  }
}
