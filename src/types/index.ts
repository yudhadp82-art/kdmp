// TypeScript interfaces for KDMP Sindangjaya POS System

// Member/Anggota interface
export interface Member {
  id: string;
  nama: string;
  alamat: string;
  telepon: string;
  email: string;
  tanggalDaftar: string; // ISO date string
  status: 'aktif' | 'tidak aktif';
  createdAt: string;
  updatedAt: string;
}

// Product/Produk interface
export interface Product {
  id: string;
  kode: string;
  nama: string;
  kategori: string;
  hargaBeli: number;
  hargaJual: number;
  stok: number;
  satuan: string;
  createdAt: string;
  updatedAt: string;
}

// Transaction item interface
export interface TransactionItem {
  productId: string;
  productName: string;
  kode: string;
  quantity: number;
  hargaBeli: number;
  hargaJual: number;
  subtotal: number;
}

// Transaction/Transaksi interface
export interface Transaction {
  id: string;
  nomorTransaksi: string;
  items: TransactionItem[];
  total: number;
  metodePembayaran: 'CASH' | 'HUTANG';
  memberId?: string;
  memberName?: string;
  uangDiterima?: number;
  kembalian?: number;
  tanggal: string; // ISO date string
  createdAt: string;
  updatedAt: string;
}

// Debt/Piutang interface
export interface Debt {
  id: string;
  memberId: string;
  memberName: string;
  transactionId: string;
  nomorTransaksi: string;
  jumlahAwal: number;
  jumlahBayar: number;
  sisaHutang: number;
  tanggalHutang: string;
  tanggalJatuhTempo?: string;
  status: 'belum_lunas' | 'lunas';
  createdAt: string;
  updatedAt: string;
}

// Debt Payment/Pembayaran Hutang interface
export interface DebtPayment {
  id: string;
  debtId: string;
  memberId: string;
  memberName: string;
  jumlahBayar: number;
  tanggalBayar: string;
  keterangan?: string;
  createdAt: string;
  updatedAt: string;
}

// Dashboard statistics interface
export interface DashboardStats {
  totalPenjualanHariIni: number;
  totalAnggota: number;
  totalProduk: number;
  totalPiutang: number;
  jumlahTransaksiHariIni: number;
  produkStokRendah: number;
}

// Product category
export type ProductCategory = 
  | 'Sembako'
  | 'Minuman'
  | 'Makanan'
  | 'Rokok'
  | 'Kebersihan'
  | 'Lainnya';

// Report types
export interface DailySalesReport {
  tanggal: string;
  jumlahTransaksi: number;
  totalPenjualan: number;
  totalCash: number;
  totalHutang: number;
}

export interface MemberPurchaseReport {
  memberId: string;
  memberName: string;
  jumlahTransaksi: number;
  totalPembelian: number;
  totalHutang: number;
}

export interface DebtReport {
  memberId: string;
  memberName: string;
  totalHutang: number;
  totalBayar: number;
  sisaHutang: number;
  status: 'belum_lunas' | 'lunas' | 'sebagian';
}

// Form data types
export interface MemberFormData {
  nama: string;
  alamat: string;
  telepon: string;
  email: string;
  status: 'aktif' | 'tidak aktif';
}

export interface ProductFormData {
  kode: string;
  nama: string;
  kategori: string;
  hargaBeli: number;
  hargaJual: number;
  stok: number;
  satuan: string;
}

export interface TransactionFormData {
  items: TransactionItem[];
  metodePembayaran: 'CASH' | 'HUTANG';
  memberId?: string;
  uangDiterima?: number;
}

export interface DebtPaymentFormData {
  debtId: string;
  jumlahBayar: number;
  keterangan?: string;
}
