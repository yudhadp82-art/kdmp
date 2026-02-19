// Debts API Route
import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase';
import type { Debt } from '@/types';

// Helper to check DB connection
function checkDb() {
  if (!db) {
    return { error: 'Firebase not configured. Please set environment variables.' };
  }
  return null;
}

// GET all debts
export async function GET(request: NextRequest) {
  const dbError = checkDb();
  if (dbError) return NextResponse.json({ success: false, error: dbError.error }, { status: 500 });

  try {
    const searchParams = request.nextUrl.searchParams;
    const memberId = searchParams.get('memberId');
    const status = searchParams.get('status');

    const snapshot = await getDocs(collection(db!, COLLECTIONS.DEBTS));
    
    let debts: Debt[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Debt[];

    // Filter by member
    if (memberId) {
      debts = debts.filter((d) => d.memberId === memberId);
    }

    // Filter by status
    if (status && status !== 'all') {
      debts = debts.filter((d) => d.status === status);
    }

    // Sort by tanggalHutang desc
    debts.sort((a, b) => new Date(b.tanggalHutang).getTime() - new Date(a.tanggalHutang).getTime());

    return NextResponse.json({ success: true, data: debts });
  } catch (error: unknown) {
    console.error('Error fetching debts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// PUT update debt
export async function PUT(request: NextRequest) {
  const dbError = checkDb();
  if (dbError) return NextResponse.json({ success: false, error: dbError.error }, { status: 500 });

  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const debtRef = doc(db!, COLLECTIONS.DEBTS, id);
    await updateDoc(debtRef, {
      ...updateData,
      updatedAt: new Date().toISOString(),
    });

    const updatedDoc = await getDoc(debtRef);
    const updatedDebt = { id, ...updatedDoc.data() };

    return NextResponse.json({ success: true, data: updatedDebt });
  } catch (error: unknown) {
    console.error('Error updating debt:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
