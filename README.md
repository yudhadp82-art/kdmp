# KDMP Sindangjaya - POS Koperasi

Sistem Point of Sale (POS) Koperasi Desa Sindangjaya dengan fitur lengkap untuk mengelola transaksi, anggota, produk, dan piutang.

## ✨ Fitur

- **Dashboard** - Statistik penjualan, total anggota/produk/piutang
- **Transaksi (POS)** - Keranjang belanja, pembayaran Cash & Hutang
- **Manajemen Anggota** - CRUD anggota koperasi
- **Manajemen Produk** - CRUD produk dengan kategori
- **Manajemen Piutang** - Tracking hutang dan pembayaran
- **Laporan** - Riwayat transaksi

## 🛠️ Teknologi

- Next.js 15 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui
- Firebase Firestore
- Zustand (State Management)

## 📱 Tampilan

- Mobile-first responsive design
- Tema merah koperasi
- PWA ready (bisa diinstall di Android)

## 🚀 Cara Menjalankan

### 1. Clone Repository

```bash
git clone https://github.com/yudhadp82-art/kdmp.git
cd kdmp
```

### 2. Install Dependencies

```bash
bun install
# atau
npm install
```

### 3. Setup Firebase

Copy `.env.example` ke `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` dengan konfigurasi Firebase Anda:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Setup Firestore Rules

Di Firebase Console → Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 5. Jalankan Aplikasi

```bash
bun run dev
# atau
npm run dev
```

Buka http://localhost:3000

### 6. Tambah Data Demo (Opsional)

POST request ke `/api/seed` untuk menambah data contoh:

```bash
curl -X POST http://localhost:3000/api/seed
```

## 📦 Deploy ke Vercel

1. Push ke GitHub
2. Buka https://vercel.com/new
3. Import repository
4. Tambah Environment Variables
5. Deploy

## 📄 Lisensi

MIT License

## 👨‍💻 Author

KDMP Sindangjaya
