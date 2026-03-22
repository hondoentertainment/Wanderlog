import { cert, getApps, initializeApp, type App, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let app: App | null = null;

function getApp(): App {
  if (app) return app;
  const existing = getApps()[0];
  if (existing) {
    app = existing;
    return app;
  }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured');
  }
  const serviceAccount = JSON.parse(raw) as ServiceAccount;
  app = initializeApp({ credential: cert(serviceAccount) });
  return app;
}

export async function verifyIdToken(token: string): Promise<string> {
  const decoded = await getAuth(getApp()).verifyIdToken(token);
  return decoded.uid;
}
