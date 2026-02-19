// Firebase Configuration for KDMP Sindangjaya POS System
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if all required config is present
const isConfigValid = firebaseConfig.apiKey && firebaseConfig.projectId;

// Initialize Firebase
let app: FirebaseApp | undefined;
let db: Firestore | undefined;

if (isConfigValid) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
  } catch (error) {
    console.error('Firebase init error:', error);
  }
}

export { app, db };

export const COLLECTIONS = {
  MEMBERS: 'members',
  PRODUCTS: 'products',
  TRANSACTIONS: 'transactions',
  DEBTS: 'debts',
  DEBT_PAYMENTS: 'debtPayments'
} as const;
