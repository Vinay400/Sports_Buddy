// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported as analyticsIsSupported } from 'firebase/analytics';

// Check if environment variables are set
const hasFirebaseConfig = import.meta.env.VITE_FIREBASE_API_KEY && 
                         import.meta.env.VITE_FIREBASE_PROJECT_ID;

const firebaseConfig = hasFirebaseConfig ? {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
} : {
  // Fallback to the project's Firebase config (so the app connects even without .env)
  apiKey: "AIzaSyAUn9v5Fv_FGqXcjJ2KhKyH4hKdcc1lI00",
  authDomain: "sportsbuddy-9597e.firebaseapp.com",
  projectId: "sportsbuddy-9597e",
  storageBucket: "sportsbuddy-9597e.firebasestorage.app",
  messagingSenderId: "1077695106076",
  appId: "1:1077695106076:web:a328ea18b2257f9af7a3d9",
  measurementId: "G-PNSLTE3274"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Analytics is optional and only works in supported browser environments
export const analyticsPromise = analyticsIsSupported()
  .then((supported) => (supported ? getAnalytics(app) : null))
  .catch(() => null);

// Export config status for debugging
export const isFirebaseConfigured = hasFirebaseConfig;

export default app;