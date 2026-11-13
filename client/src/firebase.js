import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const missing = Object.entries(config)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length) {
  console.warn('[firebase] Missing Vite config keys:', missing.join(', '));
}

const app = getApps().length ? getApps()[0] : initializeApp(config);
export const auth = getAuth(app);
export const db = getFirestore(app);

export async function ensureSignedIn() {
  if (auth.currentUser) return;
  try {
    await signInAnonymously(auth);
  } catch (error) {
    const message =
      error?.code === 'auth/operation-not-allowed'
        ? 'Anonymous sign-in is disabled in Firebase Auth. Enable it in Firebase Console > Authentication > Sign-in method.'
        : error?.message || 'Firebase authentication failed.';
    throw new Error(message);
  }
}
