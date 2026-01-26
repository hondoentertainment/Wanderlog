import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// TODO: Replace these placeholders with your actual Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAJ-mWoApzs6_VHFa179tPqDbEbTGHN8u4",
    authDomain: "wanderlog-55e55.firebaseapp.com",
    projectId: "wanderlog-55e55",
    storageBucket: "wanderlog-55e55.firebasestorage.app",
    messagingSenderId: "179811177732",
    appId: "1:179811177732:web:3b13d3b066700f933b6c51"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
