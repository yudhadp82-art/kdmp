'use client';

import { useAppStore, type TabType } from '@/store';
import Dashboard from '@/components/Dashboard';
import MemberManagement from '@/components/MemberManagement';
import ProductManagement from '@/components/ProductManagement';
import POS from '@/components/POS';
import DebtManagement from '@/components/DebtManagement';
import { Toaster } from '@/components/ui/toaster';
import Image from 'next/image';
import {
  Home as HomeIcon,
  Users,
  Package,
  ShoppingCart,
  Wallet,
} from 'lucide-react';

const navItems: { id: TabType; label: string; icon: typeof HomeIcon }[] = [
  { id: 'dashboard', label: 'Beranda', icon: HomeIcon },
  { id: 'pos', label: 'Transaksi', icon: ShoppingCart },
  { id: 'members', label: 'Anggota', icon: Users },
  { id: 'products', label: 'Produk', icon: Package },
  { id: 'debts', label: 'Piutang', icon: Wallet },
];

export default function Home() {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-red-600 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden">
            <Image 
              src="/logo.png" 
              alt="KDMP Logo" 
              width={36} 
              height={36}
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">KDMP Sindangjaya</h1>
            <p className="text-xs text-red-100">POS Koperasi</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'members' && <MemberManagement />}
        {activeTab === 'products' && <ProductManagement />}
        {activeTab === 'pos' && <POS />}
        {activeTab === 'debts' && <DebtManagement />}
        {activeTab === 'reports' && <ReportsSection />}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 sticky bottom-0 z-50 safe-area-bottom">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center py-1 px-3 min-w-[60px] transition-all ${
                  isActive ? 'text-red-600' : 'text-gray-500'
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-all ${isActive ? 'bg-red-100' : ''}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-red-600' : 'text-gray-400'}`} />
                </div>
                <span className={`text-xs mt-1 ${isActive ? 'font-semibold text-red-600' : 'text-gray-500'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <Toaster />
    </div>
  );
}

// Simple Reports Section
function ReportsSection() {
  const { transactions } = useAppStore();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Calculate stats
  const today = new Date().toDateString();
  const todayTransactions = transactions.filter(t => new Date(t.tanggal).toDateString() === today);
  const totalToday = todayTransactions.reduce((sum, t) => sum + t.total, 0);
  const totalCash = todayTransactions.filter(t => t.metodePembayaran === 'CASH').reduce((sum, t) => sum + t.total, 0);
  const totalHutang = todayTransactions.filter(t => t.metodePembayaran === 'HUTANG').reduce((sum, t) => sum + t.total, 0);

  return (
    <div className="p-4 pb-20 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Laporan</h1>
      </div>

      {/* Today Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <p className="text-xs text-red-600">Total Hari Ini</p>
          <p className="text-lg font-bold text-red-700">{formatCurrency(totalToday)}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <p className="text-xs text-blue-600">Cash</p>
          <p className="text-lg font-bold text-blue-700">{formatCurrency(totalCash)}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
          <p className="text-xs text-orange-600">Hutang</p>
          <p className="text-lg font-bold text-orange-700">{formatCurrency(totalHutang)}</p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Riwayat Transaksi</h2>
        </div>
        <div className="divide-y max-h-[60vh] overflow-y-auto">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Belum ada transaksi
            </div>
          ) : (
            transactions.map((transaction) => (
              <div key={transaction.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{transaction.nomorTransaksi}</p>
                    <p className="text-sm text-gray-500">{formatDate(transaction.tanggal)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">{formatCurrency(transaction.total)}</p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      transaction.metodePembayaran === 'CASH' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {transaction.metodePembayaran}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {transaction.items.length} item • {transaction.memberName || 'Umum'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
