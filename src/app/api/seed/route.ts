// Seed API Route - Generate sample data
import { NextResponse } from 'next/server';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firebase';

const sampleMembers = [
  { nama: 'Ahmad Hidayat', alamat: 'Jl. Merdeka No. 10, Sindangjaya', telepon: '081234567890', email: 'ahmad@email.com', status: 'aktif' },
  { nama: 'Siti Nurhaliza', alamat: 'Jl. Sudirman No. 25, Sindangjaya', telepon: '081234567891', email: 'siti@email.com', status: 'aktif' },
  { nama: 'Budi Santoso', alamat: 'Jl. Gatot Subroto No. 5, Sindangjaya', telepon: '081234567892', email: 'budi@email.com', status: 'aktif' },
  { nama: 'Dewi Lestari', alamat: 'Jl. Pahlawan No. 15, Sindangjaya', telepon: '081234567893', email: 'dewi@email.com', status: 'aktif' },
  { nama: 'Rudi Hartono', alamat: 'Jl. Diponegoro No. 8, Sindangjaya', telepon: '081234567894', email: 'rudi@email.com', status: 'tidak aktif' },
];

const sampleProducts = [
  { kode: 'BRG001', nama: 'Beras Premium 5kg', kategori: 'Sembako', hargaBeli: 65000, hargaJual: 75000, stok: 50, satuan: 'karung' },
  { kode: 'BRG002', nama: 'Minyak Goreng 2L', kategori: 'Sembako', hargaBeli: 28000, hargaJual: 32000, stok: 35, satuan: 'botol' },
  { kode: 'BRG003', nama: 'Gula Pasir 1kg', kategori: 'Sembako', hargaBeli: 12000, hargaJual: 15000, stok: 40, satuan: 'kg' },
  { kode: 'BRG004', nama: 'Tepung Terigu 1kg', kategori: 'Sembako', hargaBeli: 10000, hargaJual: 13000, stok: 45, satuan: 'kg' },
  { kode: 'BRG005', nama: 'Garam 500g', kategori: 'Sembako', hargaBeli: 4000, hargaJual: 6000, stok: 60, satuan: 'bungkus' },
  { kode: 'BRG006', nama: 'Aqua 600ml', kategori: 'Minuman', hargaBeli: 2500, hargaJual: 3500, stok: 100, satuan: 'botol' },
  { kode: 'BRG007', nama: 'Teh Botol 350ml', kategori: 'Minuman', hargaBeli: 3000, hargaJual: 4500, stok: 80, satuan: 'botol' },
  { kode: 'BRG008', nama: 'Kopi Kapal Api Sachet', kategori: 'Minuman', hargaBeli: 1500, hargaJual: 2500, stok: 150, satuan: 'sachet' },
  { kode: 'BRG009', nama: 'Indomie Goreng', kategori: 'Makanan', hargaBeli: 2500, hargaJual: 3500, stok: 200, satuan: 'bungkus' },
  { kode: 'BRG010', nama: 'Mie Sedaap Goreng', kategori: 'Makanan', hargaBeli: 2500, hargaJual: 3500, stok: 180, satuan: 'bungkus' },
  { kode: 'BRG011', nama: 'Gudang Garam Surya', kategori: 'Rokok', hargaBeli: 22000, hargaJual: 25000, stok: 30, satuan: 'bungkus' },
  { kode: 'BRG012', nama: 'Sampoerna Mild', kategori: 'Rokok', hargaBeli: 25000, hargaJual: 28000, stok: 25, satuan: 'bungkus' },
  { kode: 'BRG013', nama: 'Sabun Lifebuoy', kategori: 'Kebersihan', hargaBeli: 3000, hargaJual: 4500, stok: 50, satuan: 'buah' },
  { kode: 'BRG014', nama: 'Shampo Sunsachet', kategori: 'Kebersihan', hargaBeli: 2000, hargaJual: 3000, stok: 8, satuan: 'sachet' },
  { kode: 'BRG015', nama: 'Pasta Gigi Pepsodent', kategori: 'Kebersihan', hargaBeli: 8000, hargaJual: 12000, stok: 40, satuan: 'tube' },
];

export async function POST() {
  try {
    const now = new Date().toISOString();

    // Check if data already exists
    const membersSnapshot = await getDocs(collection(db, COLLECTIONS.MEMBERS));
    const productsSnapshot = await getDocs(collection(db, COLLECTIONS.PRODUCTS));

    if (membersSnapshot.docs.length > 0 || productsSnapshot.docs.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Data sudah ada. Hapus data terlebih dahulu untuk melakukan seed ulang.',
      });
    }

    // Seed members
    for (const member of sampleMembers) {
      await addDoc(collection(db, COLLECTIONS.MEMBERS), {
        ...member,
        tanggalDaftar: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Seed products
    for (const product of sampleProducts) {
      await addDoc(collection(db, COLLECTIONS.PRODUCTS), {
        ...product,
        createdAt: now,
        updatedAt: now,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil menambahkan ${sampleMembers.length} anggota dan ${sampleProducts.length} produk.`,
    });
  } catch (error: unknown) {
    console.error('Error seeding data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
