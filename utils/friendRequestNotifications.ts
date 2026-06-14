/** Browser notification when a new friend request arrives (no server push required). */
export function notifyNewFriendRequest(fromName: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    new Notification('Travel Muse', {
      body: `${fromName} sent you a friend request`,
      icon: '/favicon.ico',
      tag: 'friend-request',
    });
  } catch {
    // Ignore if notifications blocked
  }
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}
