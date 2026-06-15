import { doc, setDoc } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { db } from './firebaseConfig';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

export function isPushConfigured(): boolean {
  return Boolean(VAPID_KEY?.trim());
}

export async function registerPushNotifications(userId: string): Promise<boolean> {
  if (!isPushConfigured()) return false;

  try {
    const supported = await isSupported();
    if (!supported) return false;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const messaging = getMessaging(getApp());
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY!,
      serviceWorkerRegistration: registration,
    });

    await setDoc(
      doc(db, 'users', userId, 'settings', 'push'),
      { token, updatedAt: new Date().toISOString() },
      { merge: true },
    );
    return true;
  } catch (err) {
    console.warn('[push] Registration skipped:', err);
    return false;
  }
}

export async function unregisterPushToken(userId: string): Promise<void> {
  await setDoc(
    doc(db, 'users', userId, 'settings', 'push'),
    { token: null, updatedAt: new Date().toISOString() },
    { merge: true },
  ).catch(() => undefined);
}
