// Dashboard API Route
import { NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firebase';
import type { DashboardStats } from '@/types';

// GET dashboard statistics
export async function GET() {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDayISO = startOfDay.toISOString();

    // Fetch all collections
    const [membersSnapshot, productsSnapshot, transactionsSnapshot, debtsSnapshot] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.MEMBERS)),
      getDocs(collection(db, COLLECTIONS.PRODUCTS)),
      getDocs(collection(db, COLLECTIONS.TRANSACTIONS)),
      getDocs(collection(db, COLLECTIONS.DEBTS)),
    ]);

    const members = membersSnapshot.docs.map((doc) => doc.data());
    const products = productsSnapshot.docs.map((doc) => doc.data());
    const transactions = transactionsSnapshot.docs.map((doc) => doc.data());
    const debts = debtsSnapshot.docs.map((doc) => doc.data());

    // Calculate stats
    const totalAnggota = members.filter((m) => m.status === 'aktif').length;
    const totalProduk = products.length;
    const produkStokRendah = products.filter((p) => p.stok < 10).length;

    // Today's transactions
    const todayTransactions = transactions.filter(
      (t) => t.tanggal >= startOfDayISO
    );
    const jumlahTransaksiHariIni = todayTransactions.length;
    const totalPenjualanHariIni = todayTransactions.reduce(
      (sum, t) => sum + (t.total || 0),
      0
    );

    // Total piutang (unpaid debts)
    const totalPiutang = debts
      .filter((d) => d.status === 'belum_lunas')
      .reduce((sum, d) => sum + (d.sisaHutang || 0), 0);

    const stats: DashboardStats = {
      totalPenjualanHariIni,
      totalAnggota,
      totalProduk,
      totalPiutang,
      jumlahTransaksiHariIni,
      produkStokRendah,
    };

    return NextResponse.json({ success: true, data: stats });
  } catch (error: unknown) {
    console.error('Error fetching dashboard stats:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
