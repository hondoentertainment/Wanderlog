import { initializeApp, type FirebaseOptions } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAJ-mWoApzs6_VHFa179tPqDbEbTGHN8u4',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'wanderlog-55e55.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'wanderlog-55e55',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'wanderlog-55e55.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '179811177732',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:179811177732:web:3b13d3b066700f933b6c51',
};

const app = initializeApp(firebaseConfig);

const appCheckDebug = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN;
if (import.meta.env.DEV && appCheckDebug) {
  (globalThis as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN: string }).FIREBASE_APPCHECK_DEBUG_TOKEN = appCheckDebug;
}

const recaptchaSiteKey = import.meta.env.VITE_APPCHECK_RECAPTCHA_SITE_KEY;
if (recaptchaSiteKey) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(recaptchaSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
