import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup } from 'firebase/auth';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { auth, db, googleProvider, initFirebase, FirebaseConfig } from './firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { Client } from '../types';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  client: Client | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isOwner: boolean;
  refreshClient: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<Client | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const fetchClientData = async (email: string) => {
    try {
      const clientsRef = collection(db, 'clients');
      const q = query(clientsRef, where('users', 'array-contains', email), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const clientDoc = querySnapshot.docs[0];
        const clientData = { id: clientDoc.id, ...clientDoc.data() } as Client;
        setClient(clientData);
        setIsOwner(clientData.ownerEmail === email);
      } else {
        setClient(null);
        setIsOwner(false);
      }
    } catch (err) {
      console.error("Error fetching client data:", err);
    }
  };

  useEffect(() => {
    // Priority: Environment variables (Vercel/Local) > local JSON config (AI Studio)
    // We only fallback to platform config if the specific environment variable is missing
    const activeConfig: FirebaseConfig = {
      apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || firebaseConfig.apiKey || '',
      authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || firebaseConfig.authDomain || '',
      projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || firebaseConfig.projectId || '',
      storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || firebaseConfig.storageBucket || '',
      messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || firebaseConfig.messagingSenderId || '',
      appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || firebaseConfig.appId || '',
      // Note: If the user provides a project ID but NO database ID, we should NOT fallback 
      // to the platform's specific database ID, as that will likely fail.
      firestoreDatabaseId: (import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID as string) || 
                           (import.meta.env.VITE_FIREBASE_PROJECT_ID ? undefined : firebaseConfig.firestoreDatabaseId),
    };

    initFirebase(activeConfig);

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser?.email) {
        setUser(authUser);
        await fetchClientData(authUser.email);
      } else {
        setUser(null);
        setClient(null);
        setIsOwner(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    await auth.signOut();
  };

  const refreshClient = async () => {
    if (user?.email) await fetchClientData(user.email);
  };

  return (
    <FirebaseContext.Provider value={{ user, loading, client, login, logout, isOwner, refreshClient }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}
