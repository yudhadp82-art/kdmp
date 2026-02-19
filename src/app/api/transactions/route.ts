// Transactions API Route
import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase';
import type { Transaction, Debt } from '@/types';

// Helper to check DB connection
function checkDb() {
  if (!db) {
    return { error: 'Firebase not configured. Please set environment variables.' };
  }
  return null;
}

// Generate transaction number
function generateTransactionNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TRX${year}${month}${day}${random}`;
}

// GET all transactions
export async function GET(request: NextRequest) {
  const dbError = checkDb();
  if (dbError) return NextResponse.json({ success: false, error: dbError.error }, { status: 500 });

  try {
    const searchParams = request.nextUrl.searchParams;
    const memberId = searchParams.get('memberId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const metode = searchParams.get('metode');

    const snapshot = await getDocs(collection(db!, COLLECTIONS.TRANSACTIONS));
    
    let transactions: Transaction[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Transaction[];

    // Filter by member
    if (memberId) {
      transactions = transactions.filter((t) => t.memberId === memberId);
    }

    // Filter by date range
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      transactions = transactions.filter((t) => new Date(t.tanggal) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      transactions = transactions.filter((t) => new Date(t.tanggal) <= end);
    }

    // Filter by payment method
    if (metode && metode !== 'all') {
      transactions = transactions.filter((t) => t.metodePembayaran === metode);
    }

    // Sort by tanggal desc
    transactions.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

    return NextResponse.json({ success: true, data: transactions });
  } catch (error: unknown) {
    console.error('Error fetching transactions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// POST create new transaction
export async function POST(request: NextRequest) {
  const dbError = checkDb();
  if (dbError) return NextResponse.json({ success: false, error: dbError.error }, { status: 500 });

  try {
    const body = await request.json();
    const { items, metodePembayaran, memberId, memberName, uangDiterima } = body;

    const now = new Date().toISOString();
    const total = items.reduce((sum: number, item: { subtotal: number }) => sum + item.subtotal, 0);
    const kembalian = metodePembayaran === 'CASH' && uangDiterima ? uangDiterima - total : 0;

    const transactionData = {
      nomorTransaksi: generateTransactionNumber(),
      items,
      total,
      metodePembayaran,
      memberId: memberId || null,
      memberName: memberName || null,
      uangDiterima: metodePembayaran === 'CASH' ? uangDiterima || total : null,
      kembalian: metodePembayaran === 'CASH' ? kembalian : null,
      tanggal: now,
      createdAt: now,
      updatedAt: now,
    };

    // Create transaction
    const docRef = await addDoc(collection(db!, COLLECTIONS.TRANSACTIONS), transactionData);
    
    const newTransaction: Transaction = {
      id: docRef.id,
      ...transactionData,
    } as Transaction;

    // Update product stock
    for (const item of items) {
      const productRef = doc(db!, COLLECTIONS.PRODUCTS, item.productId);
      const productDoc = await getDoc(productRef);
      if (productDoc.exists()) {
        const currentStock = productDoc.data().stok || 0;
        await updateDoc(productRef, {
          stok: Math.max(0, currentStock - item.quantity),
          updatedAt: now,
        });
      }
    }

    // Create debt if payment method is HUTANG
    if (metodePembayaran === 'HUTANG' && memberId) {
      const debtData: Omit<Debt, 'id'> = {
        memberId,
        memberName: memberName || '',
        transactionId: docRef.id,
        nomorTransaksi: transactionData.nomorTransaksi,
        jumlahAwal: total,
        jumlahBayar: 0,
        sisaHutang: total,
        tanggalHutang: now,
        status: 'belum_lunas',
        createdAt: now,
        updatedAt: now,
      };

      await addDoc(collection(db!, COLLECTIONS.DEBTS), debtData);
    }

    return NextResponse.json({ success: true, data: newTransaction });
  } catch (error: unknown) {
    console.error('Error creating transaction:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
