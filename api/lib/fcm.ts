import { GoogleAuth } from 'google-auth-library';

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

function getServiceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ServiceAccount;
  } catch {
    return null;
  }
}

async function getAccessToken(): Promise<{ token: string; projectId: string } | null> {
  const sa = getServiceAccount();
  if (!sa) return null;

  const auth = new GoogleAuth({
    credentials: sa,
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  if (!tokenResponse.token) return null;
  return { token: tokenResponse.token, projectId: sa.project_id };
}

export function isFcmConfigured(): boolean {
  return Boolean(getServiceAccount());
}

export async function sendFcmNotification(
  deviceToken: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<boolean> {
  const auth = await getAccessToken();
  if (!auth) return false;

  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${auth.projectId}/messages:send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          token: deviceToken,
          notification: { title, body },
          data: data ?? {},
        },
      }),
    },
  );

  return res.ok;
}

export async function readPushToken(userId: string): Promise<string | null> {
  const sa = getServiceAccount();
  if (!sa) return null;

  const auth = new GoogleAuth({
    credentials: sa,
    scopes: ['https://www.googleapis.com/auth/datastore'],
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  if (!tokenResponse.token) return null;

  const path = `users/${userId}/settings/push`;
  const url = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents/${path}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${tokenResponse.token}` },
  });

  if (!res.ok) return null;
  const doc = (await res.json()) as { fields?: { token?: { stringValue?: string } } };
  const token = doc.fields?.token?.stringValue;
  return token?.trim() || null;
}
