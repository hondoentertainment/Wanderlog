import { getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

/** Values from `.env`; must be defined for production builds used without dev server */
const firebaseConfigFromEnv: FirebaseOptions = {
    apiKey: import.meta.env.VITE_CUSTOM_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** True when no real Firebase project is wired and we fall back to a placeholder (dev/test/CI). Backing network calls will not succeed, so callers should short-circuit reads. */
export let usingPlaceholderFirebase = false;

function resolveFirebaseConfig(): FirebaseOptions {
    const configured =
        firebaseConfigFromEnv.apiKey &&
        firebaseConfigFromEnv.projectId;

    if (configured) {
        return firebaseConfigFromEnv;
    }

    /** Production builds in CI (`npm run build`) need a valid-shaped config unless secrets are wired; set via workflow only for automated checks — not on real deploy pipelines. */
    const allowOfflinePlaceholder =
        import.meta.env.DEV ||
        import.meta.env.MODE === 'test' ||
        import.meta.env.VITE_CI_USE_FIREBASE_PLACEHOLDER === 'true';

    if (allowOfflinePlaceholder) {
        // Valid shape for the client SDK so the app renders; backing calls fail gracefully until `.env` is set.
        console.warn('[firebase] VITE_FIREBASE_* not fully set — using placeholder for dev/test.');
        usingPlaceholderFirebase = true;
        return {
            apiKey: 'local-dev-placeholder-not-a-secret',
            authDomain: 'placeholder.firebaseapp.com',
            projectId: 'wanderlog-local-placeholder',
            storageBucket: 'wanderlog-local-placeholder.appspot.com',
            messagingSenderId: '000000000000',
            appId: '1:000000000000:web:e2ep000000000000000001',
        };
    }

    throw new Error(
        'Missing Firebase configuration. Copy .env.example to .env and set VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID (plus other VITE_FIREBASE_* values).'
    );
}

const app = getApps()[0] ?? initializeApp(resolveFirebaseConfig());
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');
export const db = getFirestore(app);
export const storage = getStorage(app);
