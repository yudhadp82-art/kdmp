'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  Wallet,
  DollarSign,
  User,
  Calendar,
  Check,
  History,
  Plus,
} from 'lucide-react';
import type { Debt, DebtPayment, Member } from '@/types';
import { useToast } from '@/hooks/use-toast';

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

export default function DebtManagement() {
  const { debts, setDebts, updateDebt, debtPayments, setDebtPayments, addDebtPayment, members, setMembers } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentNote, setPaymentNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [debtsRes, paymentsRes, membersRes] = await Promise.all([
        fetch('/api/debts'),
        fetch('/api/debt-payments'),
        fetch('/api/members?status=aktif'),
      ]);

      const debtsData = await debtsRes.json();
      const paymentsData = await paymentsRes.json();
      const membersData = await membersRes.json();

      if (debtsData.success) setDebts(debtsData.data);
      if (paymentsData.success) setDebtPayments(paymentsData.data);
      if (membersData.success) setMembers(membersData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleShowDetail = (debt: Debt) => {
    setSelectedDebt(debt);
    setShowDetailSheet(true);
  };

  const handleOpenPayment = (debt: Debt) => {
    setSelectedDebt(debt);
    setPaymentAmount('');
    setPaymentNote('');
    setShowPaymentDialog(true);
  };

  const handleProcessPayment = async () => {
    if (!selectedDebt) return;

    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast({
        title: 'Error',
        description: 'Masukkan jumlah pembayaran yang valid',
        variant: 'destructive',
      });
      return;
    }

    if (amount > selectedDebt.sisaHutang) {
      toast({
        title: 'Error',
        description: 'Jumlah pembayaran melebihi sisa hutang',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('/api/debt-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debtId: selectedDebt.id,
          memberId: selectedDebt.memberId,
          memberName: selectedDebt.memberName,
          jumlahBayar: amount,
          keterangan: paymentNote,
        }),
      });

      const data = await res.json();
      if (data.success) {
        addDebtPayment(data.data);
        
        // Update debt in store
        const newJumlahBayar = selectedDebt.jumlahBayar + amount;
        const newSisaHutang = selectedDebt.jumlahAwal - newJumlahBayar;
        updateDebt(selectedDebt.id, {
          jumlahBayar: newJumlahBayar,
          sisaHutang: newSisaHutang,
          status: newSisaHutang <= 0 ? 'lunas' : 'belum_lunas',
        });

        toast({
          title: 'Berhasil',
          description: `Pembayaran ${formatCurrency(amount)} berhasil dicatat`,
        });
        setShowPaymentDialog(false);
        fetchData();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memproses pembayaran',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Group debts by member
  const debtsByMember = debts.reduce((acc, debt) => {
    if (!acc[debt.memberId]) {
      acc[debt.memberId] = {
        memberName: debt.memberName,
        debts: [],
        totalHutang: 0,
        totalBayar: 0,
        totalSisa: 0,
      };
    }
    acc[debt.memberId].debts.push(debt);
    acc[debt.memberId].totalHutang += debt.jumlahAwal;
    acc[debt.memberId].totalBayar += debt.jumlahBayar;
    acc[debt.memberId].totalSisa += debt.sisaHutang;
    return acc;
  }, {} as Record<string, { memberName: string; debts: Debt[]; totalHutang: number; totalBayar: number; totalSisa: number }>);

  // Filter debts
  const filteredDebts = debts.filter((debt) => {
    if (statusFilter !== 'all' && debt.status !== statusFilter) return false;
    if (searchQuery) {
      return debt.memberName.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  // Get payments for selected debt
  const debtPaymentHistory = selectedDebt
    ? debtPayments.filter((p) => p.debtId === selectedDebt.id)
    : [];

  return (
    <div className="p-4 pb-20 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Manajemen Piutang</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-100">
                <Wallet className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-orange-600">Total Piutang</p>
                <p className="text-lg font-bold text-orange-700">
                  {formatCurrency(debts.reduce((sum, d) => sum + d.sisaHutang, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-100">
                <Check className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-red-600">Sudah Dibayar</p>
                <p className="text-lg font-bold text-red-700">
                  {formatCurrency(debts.reduce((sum, d) => sum + d.jumlahBayar, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari anggota..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="belum_lunas">Belum Lunas</SelectItem>
            <SelectItem value="lunas">Lunas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Debts List by Member */}
      <ScrollArea className="h-[calc(100vh-340px)]">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Memuat data...</div>
        ) : filteredDebts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery || statusFilter !== 'all'
              ? 'Tidak ada piutang yang cocok'
              : 'Belum ada data piutang'}
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(debtsByMember)
              .filter(([_, data]) => {
                if (statusFilter === 'belum_lunas' && data.totalSisa === 0) return false;
                if (statusFilter === 'lunas' && data.totalSisa > 0) return false;
                if (searchQuery && !data.memberName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                return true;
              })
              .map(([memberId, data]) => (
                <Card key={memberId}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <CardTitle className="text-base">{data.memberName}</CardTitle>
                      </div>
                      <Badge
                        variant={data.totalSisa > 0 ? 'default' : 'secondary'}
                        className={
                          data.totalSisa > 0
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {data.totalSisa > 0 ? 'Belum Lunas' : 'Lunas'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Total Hutang</span>
                        <span>{formatCurrency(data.totalHutang)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Sudah Bayar</span>
                        <span className="text-red-600">{formatCurrency(data.totalBayar)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Sisa Hutang</span>
                        <span className="text-orange-600">{formatCurrency(data.totalSisa)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleShowDetail(data.debts[0])}
                      >
                        <History className="h-4 w-4 mr-1" />
                        Detail
                      </Button>
                      {data.totalSisa > 0 && (
                        <Button
                          size="sm"
                          className="flex-1 bg-red-600 hover:bg-red-700"
                          onClick={() => handleOpenPayment(data.debts.find(d => d.sisaHutang > 0) || data.debts[0])}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Bayar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </ScrollArea>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pembayaran Hutang</DialogTitle>
          </DialogHeader>
          {selectedDebt && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{selectedDebt.memberName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">No. Transaksi</span>
                  <span>{selectedDebt.nomorTransaksi}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-500">Sisa Hutang</span>
                  <span className="font-bold text-orange-600">
                    {formatCurrency(selectedDebt.sisaHutang)}
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="amount">Jumlah Pembayaran</Label>
                <Input
                  id="amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Masukkan jumlah"
                  className="mt-1"
                />
                <div className="flex gap-2 mt-2">
                  {[
                    Math.min(50000, selectedDebt.sisaHutang),
                    Math.min(100000, selectedDebt.sisaHutang),
                    selectedDebt.sisaHutang,
                  ]
                    .filter((v, i, arr) => v > 0 && (i === 0 || v !== arr[i - 1]))
                    .map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={() => setPaymentAmount(amount.toString())}
                      >
                        {formatCurrency(amount)}
                      </Button>
                    ))}
                </div>
              </div>

              <div>
                <Label htmlFor="note">Keterangan (Opsional)</Label>
                <Textarea
                  id="note"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Catatan pembayaran..."
                  rows={2}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Batal
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleProcessPayment}
              disabled={isProcessing}
            >
              {isProcessing ? 'Memproses...' : 'Proses Pembayaran'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Sheet */}
      <Sheet open={showDetailSheet} onOpenChange={setShowDetailSheet}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Detail Piutang</SheetTitle>
          </SheetHeader>
          {selectedDebt && (
            <div className="mt-4 space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-5 w-5 text-gray-400" />
                  <span className="font-semibold text-lg">{selectedDebt.memberName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>Tanggal Hutang: {formatDate(selectedDebt.tanggalHutang)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">No. Transaksi</span>
                  <span className="font-medium">{selectedDebt.nomorTransaksi}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Jumlah Awal</span>
                  <span>{formatCurrency(selectedDebt.jumlahAwal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Sudah Bayar</span>
                  <span className="text-red-600">{formatCurrency(selectedDebt.jumlahBayar)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Sisa Hutang</span>
                  <span className="text-orange-600">{formatCurrency(selectedDebt.sisaHutang)}</span>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Riwayat Pembayaran
                </h3>
                {debtPaymentHistory.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Belum ada pembayaran
                  </p>
                ) : (
                  <ScrollArea className="h-48">
                    <div className="space-y-2 pr-4">
                      {debtPaymentHistory.map((payment) => (
                        <Card key={payment.id}>
                          <CardContent className="p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-red-600">
                                  {formatCurrency(payment.jumlahBayar)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatDate(payment.tanggalBayar)}
                                </p>
                                {payment.keterangan && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    {payment.keterangan}
                                  </p>
                                )}
                              </div>
                              <Check className="h-4 w-4 text-red-600" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>

              {selectedDebt.sisaHutang > 0 && (
                <Button
                  className="w-full bg-red-600 hover:bg-red-700"
                  onClick={() => {
                    setShowDetailSheet(false);
                    setShowPaymentDialog(true);
                  }}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Input Pembayaran
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
