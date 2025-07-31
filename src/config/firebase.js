// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
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

export default app;