// Debt Payments API Route
import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase';
import type { DebtPayment, Debt } from '@/types';

// Helper to check DB connection
function checkDb() {
  if (!db) {
    return { error: 'Firebase not configured. Please set environment variables.' };
  }
  return null;
}

// GET all debt payments
export async function GET(request: NextRequest) {
  const dbError = checkDb();
  if (dbError) return NextResponse.json({ success: false, error: dbError.error }, { status: 500 });

  try {
    const searchParams = request.nextUrl.searchParams;
    const memberId = searchParams.get('memberId');
    const debtId = searchParams.get('debtId');

    const snapshot = await getDocs(collection(db!, COLLECTIONS.DEBT_PAYMENTS));
    
    let payments: DebtPayment[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as DebtPayment[];

    // Filter by member
    if (memberId) {
      payments = payments.filter((p) => p.memberId === memberId);
    }

    // Filter by debt
    if (debtId) {
      payments = payments.filter((p) => p.debtId === debtId);
    }

    // Sort by tanggalBayar desc
    payments.sort((a, b) => new Date(b.tanggalBayar).getTime() - new Date(a.tanggalBayar).getTime());

    return NextResponse.json({ success: true, data: payments });
  } catch (error: unknown) {
    console.error('Error fetching debt payments:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// POST create new debt payment
export async function POST(request: NextRequest) {
  const dbError = checkDb();
  if (dbError) return NextResponse.json({ success: false, error: dbError.error }, { status: 500 });

  try {
    const body = await request.json();
    const { debtId, memberId, memberName, jumlahBayar, keterangan } = body;

    const now = new Date().toISOString();

    // Get current debt
    const debtRef = doc(db!, COLLECTIONS.DEBTS, debtId);
    const debtDoc = await getDoc(debtRef);
    
    if (!debtDoc.exists()) {
      return NextResponse.json({ success: false, error: 'Debt not found' }, { status: 404 });
    }

    const debtData = debtDoc.data() as Debt;
    const newJumlahBayar = debtData.jumlahBayar + jumlahBayar;
    const newSisaHutang = debtData.jumlahAwal - newJumlahBayar;
    const newStatus = newSisaHutang <= 0 ? 'lunas' : 'belum_lunas';

    // Create payment record
    const paymentData = {
      debtId,
      memberId,
      memberName,
      jumlahBayar,
      tanggalBayar: now,
      keterangan: keterangan || '',
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db!, COLLECTIONS.DEBT_PAYMENTS), paymentData);
    
    const newPayment: DebtPayment = {
      id: docRef.id,
      ...paymentData,
    };

    // Update debt
    await updateDoc(debtRef, {
      jumlahBayar: newJumlahBayar,
      sisaHutang: Math.max(0, newSisaHutang),
      status: newStatus,
      updatedAt: now,
    });

    return NextResponse.json({ success: true, data: newPayment });
  } catch (error: unknown) {
    console.error('Error creating debt payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
