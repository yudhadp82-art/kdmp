// Firebase Configuration for KDMP Sindangjaya POS System
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';

// Firebase config - API keys are safe to include in client-side code
// Security is handled by Firebase Security Rules
const firebaseConfig = {
  apiKey: "AIzaSyDkIIijVOo5AxqV_ArZvpgsBSYJTRfrbuc",
  authDomain: "appsheet-kdmp.firebaseapp.com",
  projectId: "appsheet-kdmp",
  storageBucket: "appsheet-kdmp.firebasestorage.app",
  messagingSenderId: "409719616331",
  appId: "1:409719616331:web:55962a81ba1cf51e3daece"
};

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db = getFirestore(app);
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

export { app, db };

export const COLLECTIONS = {
  MEMBERS: 'members',
  PRODUCTS: 'products',
  TRANSACTIONS: 'transactions',
  DEBTS: 'debts',
  DEBT_PAYMENTS: 'debtPayments'
} as const;
