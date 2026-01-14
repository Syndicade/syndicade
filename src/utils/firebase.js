import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// REPLACE these values with YOUR Firebase config from the console
const firebaseConfig = {
  apiKey: "AIzaSyA0vkCZGw-aphAMxFM_lphI5Xn4o7CwnO4",
  authDomain: "syndicade-be933.firebaseapp.com",
  projectId: "syndicade-be933",
  storageBucket: "syndicade-be933.firebasestorage.app",
  messagingSenderId: "774513040084",
  appId: "1:774513040084:web:98977cef36ffd7e7577941"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);