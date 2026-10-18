import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { FirebaseConnectionConfig } from '../types';

const STORAGE_KEY = 'nahar_firebase_custom_config';

export const DEFAULT_FIREBASE_CONFIG: FirebaseConnectionConfig = {
  apiKey: "AIzaSyC8tKzuhzHE21EFnmYEy1cSmu7cFvMZLAI",
  authDomain: "nahardorjibari-98a7d.firebaseapp.com",
  projectId: "nahardorjibari-98a7d",
  storageBucket: "nahardorjibari-98a7d.firebasestorage.app",
  messagingSenderId: "692580279018",
  appId: "1:692580279018:web:397f30063d099cf94c6d93",
  isConfigured: true,
};

let firebaseApp: FirebaseApp | null = null;
let isSigningIn = false;

export function getFirebaseInstances() {
  if (!firebaseApp) {
    const config = getStoredFirebaseConfig();
    if (!config || !config.isConfigured) return { db: null, auth: null, storage: null, isConfigured: false };
    firebaseApp = initializeApp(config as any);
  }
  const auth = getAuth(firebaseApp);
  if (auth && !auth.currentUser && !isSigningIn) {
    isSigningIn = true;
    signInAnonymously(auth).catch((err) => {
      // If anonymous auth is not enabled on this Firebase project, fail gracefully
      console.warn('Firebase anonymous auth notice:', err?.message || err);
    }).finally(() => {
      isSigningIn = false;
    });
  }
  return {
    db: getFirestore(firebaseApp),
    auth,
    storage: getStorage(firebaseApp),
    isConfigured: true,
  };
}

export function getStoredFirebaseConfig(): FirebaseConnectionConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.projectId && parsed.apiKey) {
        return { ...parsed, isConfigured: true };
      }
    }
  } catch (e) {
    console.error('Error reading stored Firebase config', e);
  }

  // Check Vite environment variables
  const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const envProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (envApiKey && envProjectId) {
    return {
      apiKey: envApiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${envProjectId}.firebaseapp.com`,
      projectId: envProjectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${envProjectId}.appspot.com`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      isConfigured: true,
    };
  }

  // Return the user's provided project configuration
  return DEFAULT_FIREBASE_CONFIG;
}

export function saveFirebaseConfig(config: Omit<FirebaseConnectionConfig, 'isConfigured'>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  window.location.reload();
}

export function clearFirebaseConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
}

export async function testFirestoreConnection(): Promise<{ success: boolean; message: string; }> {
  try {
    const { db } = getFirebaseInstances();
    if (!db) return { success: false, message: 'Firebase not configured' };
    return { success: true, message: 'Firestore connection successful' };
  } catch (e) {
    console.error('Firestore connection test failed', e);
    return { success: false, message: 'Connection test failed: ' + (e as Error).message };
  }
}
