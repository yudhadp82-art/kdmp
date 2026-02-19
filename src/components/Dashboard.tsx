'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Wallet,
  Users,
  Package,
  ShoppingCart,
  AlertTriangle,
  RefreshCw,
  DollarSign,
  CreditCard,
} from 'lucide-react';
import type { DashboardStats, Transaction } from '@/types';

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
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function Dashboard() {
  const { setActiveTab, transactions, setTransactions, dashboardStats, setDashboardStats } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [dashboardRes, transactionsRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/transactions'),
      ]);

      const dashboardData = await dashboardRes.json();
      const transactionsData = await transactionsRes.json();

      if (dashboardData.success) {
        setDashboardStats(dashboardData.data);
      }
      if (transactionsData.success) {
        setTransactions(transactionsData.data.slice(0, 10)); // Get latest 10
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = [
    {
      title: 'Penjualan Hari Ini',
      value: formatCurrency(dashboardStats.totalPenjualanHariIni),
      icon: DollarSign,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Total Anggota',
      value: dashboardStats.totalAnggota.toString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Produk',
      value: dashboardStats.totalProduk.toString(),
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Total Piutang',
      value: formatCurrency(dashboardStats.totalPiutang),
      icon: CreditCard,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  const quickActions = [
    { label: 'Transaksi Baru', icon: ShoppingCart, tab: 'pos' as const, color: 'bg-red-600 hover:bg-red-700' },
    { label: 'Tambah Anggota', icon: Users, tab: 'members' as const, color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'Tambah Produk', icon: Package, tab: 'products' as const, color: 'bg-purple-600 hover:bg-purple-700' },
    { label: 'Kelola Piutang', icon: Wallet, tab: 'debts' as const, color: 'bg-orange-600 hover:bg-orange-700' },
  ];

  return (
    <div className="p-4 pb-20 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">KDMP Sindangjaya</h1>
          <p className="text-sm text-gray-500">Sistem POS Koperasi</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={fetchData}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">{stat.title}</p>
                  <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alert for low stock */}
      {dashboardStats.produkStokRendah > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">Peringatan Stok Rendah</p>
                <p className="text-sm text-orange-600">
                  {dashboardStats.produkStokRendah} produk dengan stok di bawah 10 unit
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                className={`${action.color} text-white justify-start`}
                onClick={() => setActiveTab(action.tab)}
              >
                <action.icon className="h-4 w-4 mr-2" />
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Transaksi Terbaru</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600"
              onClick={() => setActiveTab('reports')}
            >
              Lihat Semua
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-64">
            {transactions.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Belum ada transaksi
              </div>
            ) : (
              <div className="divide-y">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="p-3 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">
                        {transaction.nomorTransaksi}
                      </span>
                      <Badge
                        variant={transaction.metodePembayaran === 'CASH' ? 'default' : 'secondary'}
                        className={
                          transaction.metodePembayaran === 'CASH'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-orange-100 text-orange-800'
                        }
                      >
                        {transaction.metodePembayaran}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        {transaction.memberName || 'Umum'}
                      </span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(transaction.total)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(transaction.tanggal)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
