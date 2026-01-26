import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// TODO: Replace these placeholders with your actual Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAJ-mWoApzs6_VHFa179tPqDbEbTGHN8u4",
    authDomain: "wanderlog-55e55.firebaseapp.com",
    projectId: "wanderlog-55e55",
    storageBucket: "wanderlog-55e55.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
