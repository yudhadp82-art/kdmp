// Debug API Route - Check Firebase configuration
import { NextResponse } from 'next/server';

export async function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'SET' : 'NOT SET',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'SET' : 'NOT SET',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'SET' : 'NOT SET',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? 'SET' : 'NOT SET',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? 'SET' : 'NOT SET',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? 'SET' : 'NOT SET',
  };

  // Try to initialize Firebase
  let firebaseStatus = 'NOT TESTED';
  let firebaseError = null;
  
  try {
    const { db } = await import('@/lib/firebase');
    if (db) {
      firebaseStatus = 'INITIALIZED';
    } else {
      firebaseStatus = 'FAILED - db is null';
    }
  } catch (error) {
    firebaseStatus = 'ERROR';
    firebaseError = error instanceof Error ? error.message : 'Unknown error';
  }

  return NextResponse.json({
    envVars: config,
    firebaseStatus,
    firebaseError,
    timestamp: new Date().toISOString()
  });
}
