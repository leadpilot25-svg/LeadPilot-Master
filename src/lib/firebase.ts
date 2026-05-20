import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// We'll load the config dynamically in a provider component once it's available.
// For now, we define the interface.
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
}

let app: any;
export let auth: any;
export let db: any;
export const googleProvider = new GoogleAuthProvider();

export function initFirebase(config: FirebaseConfig) {
  if (!app) {
    app = initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app, config.firestoreDatabaseId);
  }
  return { app, auth, db };
}
