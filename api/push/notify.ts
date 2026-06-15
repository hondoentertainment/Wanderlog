export const config = {
  runtime: 'nodejs',
};

import { isFcmConfigured, readPushToken, sendFcmNotification } from '../lib/fcm';

type NotifyType = 'friend_request' | 'friend_accepted' | 'trip_reminder';

interface NotifyBody {
  targetUserId?: string;
  type?: NotifyType;
  title?: string;
  body?: string;
  data?: Record<string, string>;
}

async function verifyFirebaseIdToken(idToken: string): Promise<string | null> {
  const apiKey = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    },
  );

  if (!res.ok) return null;
  const data = (await res.json()) as { users?: { localId?: string }[] };
  return data.users?.[0]?.localId ?? null;
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (!isFcmConfigured()) {
    return new Response(JSON.stringify({ error: 'Push notifications not configured on server.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const authHeader = request.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const callerUid = idToken ? await verifyFirebaseIdToken(idToken) : null;

  if (!callerUid) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload = (await request.json()) as NotifyBody;
    const { targetUserId, type, title, body, data } = payload;

    if (!targetUserId || !type || !title?.trim() || !body?.trim()) {
      return new Response(JSON.stringify({ error: 'targetUserId, type, title, and body required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (type === 'friend_request' && callerUid !== data?.fromUserId) {
      return new Response(JSON.stringify({ error: 'Invalid friend_request sender' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const deviceToken = await readPushToken(targetUserId);
    if (!deviceToken) {
      return new Response(JSON.stringify({ sent: false, reason: 'no_token' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const sent = await sendFcmNotification(deviceToken, title, body, {
      type,
      ...data,
    });

    return new Response(JSON.stringify({ sent }), {
      status: sent ? 200 : 502,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
