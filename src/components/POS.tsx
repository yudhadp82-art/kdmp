'use client';

import { useEffect, useState } from 'react';
import { useAppStore, type CartItem } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  Printer,
  Check,
} from 'lucide-react';
import type { Product, Member, Transaction } from '@/types';
import { useToast } from '@/hooks/use-toast';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function POS() {
  const {
    products,
    setProducts,
    members,
    setMembers,
    cart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    addTransaction,
  } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCartSheet, setShowCartSheet] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'HUTANG'>('CASH');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [uangDiterima, setUangDiterima] = useState<string>('');
  const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [productsRes, membersRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/members?status=aktif'),
      ]);

      const productsData = await productsRes.json();
      const membersData = await membersRes.json();

      if (productsData.success) setProducts(productsData.data);
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

  const filteredProducts = products.filter((p) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      p.nama.toLowerCase().includes(query) ||
      p.kode.toLowerCase().includes(query)
    );
  });

  const cartTotal = cart.reduce((sum, item) => sum + item.hargaJual * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = (product: Product) => {
    if (product.stok <= 0) {
      toast({
        title: 'Stok Habis',
        description: 'Produk ini sedang tidak tersedia',
        variant: 'destructive',
      });
      return;
    }

    const existingItem = cart.find((item) => item.productId === product.id);
    if (existingItem && existingItem.quantity >= product.stok) {
      toast({
        title: 'Stok Tidak Cukup',
        description: `Stok tersedia: ${product.stok} ${product.satuan}`,
        variant: 'destructive',
      });
      return;
    }

    addToCart({
      productId: product.id,
      productName: product.nama,
      kode: product.kode,
      quantity: 1,
      hargaBeli: product.hargaBeli,
      hargaJual: product.hargaJual,
      stok: product.stok,
    });

    toast({ title: 'Ditambahkan', description: `${product.nama} ditambahkan ke keranjang` });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    const item = cart.find((i) => i.productId === productId);
    if (!item) return;

    if (quantity > item.stok) {
      toast({
        title: 'Stok Tidak Cukup',
        description: `Stok tersedia: ${item.stok}`,
        variant: 'destructive',
      });
      return;
    }

    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      updateCartItem(productId, quantity);
    }
  };

  const handleProcessPayment = async () => {
    if (cart.length === 0) {
      toast({
        title: 'Keranjang Kosong',
        description: 'Tambahkan produk ke keranjang terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }

    if (paymentMethod === 'HUTANG' && !selectedMemberId) {
      toast({
        title: 'Pilih Anggota',
        description: 'Pilih anggota untuk transaksi hutang',
        variant: 'destructive',
      });
      return;
    }

    if (paymentMethod === 'CASH') {
      const paid = parseFloat(uangDiterima) || 0;
      if (paid < cartTotal) {
        toast({
          title: 'Uang Tidak Cukup',
          description: 'Jumlah uang yang diterima kurang',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      const selectedMember = members.find((m) => m.id === selectedMemberId);
      const items = cart.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        kode: item.kode,
        quantity: item.quantity,
        hargaBeli: item.hargaBeli,
        hargaJual: item.hargaJual,
        subtotal: item.hargaJual * item.quantity,
      }));

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          metodePembayaran: paymentMethod,
          memberId: paymentMethod === 'HUTANG' ? selectedMemberId : null,
          memberName: selectedMember?.nama || null,
          uangDiterima: paymentMethod === 'CASH' ? parseFloat(uangDiterima) || cartTotal : null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCompletedTransaction(data.data);
        addTransaction(data.data);
        setShowPaymentDialog(false);
        setShowReceiptDialog(true);
        clearCart();
        setUangDiterima('');
        setSelectedMemberId('');
        setPaymentMethod('CASH');
        fetchData(); // Refresh products to update stock
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memproses transaksi',
        variant: 'destructive',
      });
    }
  };

  const handlePrintReceipt = () => {
    if (!completedTransaction) return;
    
    // Create receipt content for printing
    const receiptContent = `
      <html>
        <head>
          <title>Struk Pembayaran</title>
          <style>
            body { font-family: monospace; font-size: 12px; width: 280px; margin: 0 auto; padding: 10px; }
            .header { text-align: center; margin-bottom: 10px; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { font-weight: bold; font-size: 14px; }
            .footer { text-align: center; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin:0">KDMP SINDANGJAYA</h2>
            <p style="margin:5px 0">Koperasi Desa Sindangjaya</p>
          </div>
          <div class="divider"></div>
          <p>No: ${completedTransaction.nomorTransaksi}</p>
          <p>Tanggal: ${new Date(completedTransaction.tanggal).toLocaleString('id-ID')}</p>
          <p>Kasir: Admin</p>
          <div class="divider"></div>
          ${completedTransaction.items.map(item => `
            <div class="item">
              <span>${item.productName}</span>
              <span>${item.quantity} x ${formatCurrency(item.hargaJual)}</span>
            </div>
          `).join('')}
          <div class="divider"></div>
          <div class="item total">
            <span>TOTAL</span>
            <span>${formatCurrency(completedTransaction.total)}</span>
          </div>
          <div class="item">
            <span>Metode</span>
            <span>${completedTransaction.metodePembayaran}</span>
          </div>
          ${completedTransaction.metodePembayaran === 'CASH' ? `
            <div class="item">
              <span>Bayar</span>
              <span>${formatCurrency(completedTransaction.uangDiterima || 0)}</span>
            </div>
            <div class="item">
              <span>Kembali</span>
              <span>${formatCurrency(completedTransaction.kembalian || 0)}</span>
            </div>
          ` : `
            <div class="item">
              <span>Anggota</span>
              <span>${completedTransaction.memberName}</span>
            </div>
          `}
          <div class="divider"></div>
          <div class="footer">
            <p>Terima kasih atas kunjungan Anda!</p>
            <p>Barang yang sudah dibeli tidak dapat ditukar</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Search Bar */}
      <div className="p-4 border-b bg-white sticky top-0 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Products Grid */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Memuat produk...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? 'Produk tidak ditemukan' : 'Belum ada produk'}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  product.stok <= 0 ? 'opacity-50' : ''
                }`}
                onClick={() => handleAddToCart(product)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-xs text-gray-500">{product.kode}</span>
                    {product.stok <= 0 ? (
                      <Badge className="bg-red-100 text-red-800 text-xs">Habis</Badge>
                    ) : product.stok < 10 ? (
                      <Badge className="bg-orange-100 text-orange-800 text-xs">
                        {product.stok}
                      </Badge>
                    ) : null}
                  </div>
                  <h3 className="font-medium text-sm line-clamp-2 mb-2">{product.nama}</h3>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-red-600 text-sm">
                      {formatCurrency(product.hargaJual)}
                    </span>
                    <Button
                      size="icon"
                      className="h-7 w-7 bg-red-600 hover:bg-red-700"
                      disabled={product.stok <= 0}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Cart Summary Bar */}
      <div className="border-t bg-white p-4 sticky bottom-16 z-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(cartTotal)}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCartSheet(true)}
              className="relative"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-600">
                  {cartItemCount}
                </Badge>
              )}
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 min-w-[120px]"
              disabled={cart.length === 0}
              onClick={() => setShowPaymentDialog(true)}
            >
              Bayar
            </Button>
          </div>
        </div>
      </div>

      {/* Cart Sheet */}
      <Sheet open={showCartSheet} onOpenChange={setShowCartSheet}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Keranjang ({cartItemCount} item)
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 flex flex-col h-[calc(100vh-200px)]">
            <ScrollArea className="flex-1">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Keranjang kosong
                </div>
              ) : (
                <div className="space-y-3 pr-4">
                  {cart.map((item) => (
                    <Card key={item.productId}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-xs text-gray-500">{item.kode}</p>
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-sm text-red-600">
                              {formatCurrency(item.hargaJual)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item.productId)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                handleUpdateQuantity(item.productId, item.quantity - 1)
                              }
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-semibold">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                handleUpdateQuantity(item.productId, item.quantity + 1)
                              }
                              disabled={item.quantity >= item.stok}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <span className="font-bold">
                            {formatCurrency(item.hargaJual * item.quantity)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Cart Footer */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold text-red-600">
                  {formatCurrency(cartTotal)}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => clearCart()}
                  disabled={cart.length === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={() => {
                    setShowCartSheet(false);
                    setShowPaymentDialog(true);
                  }}
                  disabled={cart.length === 0}
                >
                  Bayar
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pembayaran</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Total */}
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-500">Total Pembayaran</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(cartTotal)}
              </p>
            </div>

            {/* Payment Method */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Metode Pembayaran</Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(value: 'CASH' | 'HUTANG') => setPaymentMethod(value)}
                className="grid grid-cols-2 gap-3"
              >
                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                  <RadioGroupItem value="CASH" id="cash" />
                  <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer">
                    <Banknote className="h-4 w-4" />
                    Cash
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                  <RadioGroupItem value="HUTANG" id="hutang" />
                  <Label htmlFor="hutang" className="flex items-center gap-2 cursor-pointer">
                    <CreditCard className="h-4 w-4" />
                    Hutang
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Member Selection for Hutang */}
            {paymentMethod === 'HUTANG' && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Pilih Anggota</Label>
                <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih anggota..." />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Cash Payment Amount */}
            {paymentMethod === 'CASH' && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Uang Diterima</Label>
                <Input
                  type="number"
                  value={uangDiterima}
                  onChange={(e) => setUangDiterima(e.target.value)}
                  placeholder="Masukkan jumlah uang"
                  className="text-lg"
                />
                {uangDiterima && parseFloat(uangDiterima) >= cartTotal && (
                  <p className="text-sm text-red-600 mt-1">
                    Kembalian: {formatCurrency(parseFloat(uangDiterima) - cartTotal)}
                  </p>
                )}
                <div className="flex gap-2 mt-2">
                  {[cartTotal, cartTotal + 10000, cartTotal + 20000, cartTotal + 50000]
                    .filter((v, i, arr) => i === 0 || v !== arr[i - 1])
                    .slice(0, 4)
                    .map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={() => setUangDiterima(amount.toString())}
                      >
                        {formatCurrency(Math.ceil(amount / 1000) * 1000)}
                      </Button>
                    ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Batal
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleProcessPayment}
            >
              <Check className="h-4 w-4 mr-2" />
              Proses
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Transaksi Berhasil!</DialogTitle>
          </DialogHeader>
          {completedTransaction && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                  <Check className="h-8 w-8 text-red-600" />
                </div>
                <p className="text-sm text-gray-500">{completedTransaction.nomorTransaksi}</p>
              </div>

              <div className="border rounded-lg p-3 text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Tanggal</span>
                  <span>{new Date(completedTransaction.tanggal).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Total</span>
                  <span className="font-bold">{formatCurrency(completedTransaction.total)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Metode</span>
                  <Badge
                    variant={completedTransaction.metodePembayaran === 'CASH' ? 'default' : 'secondary'}
                    className={
                      completedTransaction.metodePembayaran === 'CASH'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-orange-100 text-orange-800'
                    }
                  >
                    {completedTransaction.metodePembayaran}
                  </Badge>
                </div>
                {completedTransaction.metodePembayaran === 'CASH' && (
                  <>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-500">Bayar</span>
                      <span>{formatCurrency(completedTransaction.uangDiterima || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Kembali</span>
                      <span className="font-bold text-red-600">
                        {formatCurrency(completedTransaction.kembalian || 0)}
                      </span>
                    </div>
                  </>
                )}
                {completedTransaction.metodePembayaran === 'HUTANG' && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Anggota</span>
                    <span>{completedTransaction.memberName}</span>
                  </div>
                )}
              </div>

              <Button
                className="w-full bg-red-600 hover:bg-red-700"
                onClick={handlePrintReceipt}
              >
                <Printer className="h-4 w-4 mr-2" />
                Cetak Struk
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowReceiptDialog(false)}
            >
              Selesai
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
