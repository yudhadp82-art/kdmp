'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store';
import { Card, CardContent } from '@/components/ui/card';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  AlertTriangle,
  DollarSign,
  Hash,
} from 'lucide-react';
import type { Product, ProductFormData } from '@/types';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES = [
  'Sembako',
  'Minuman',
  'Makanan',
  'Rokok',
  'Kebersihan',
  'Lainnya',
];

const initialFormData: ProductFormData = {
  kode: '',
  nama: '',
  kategori: 'Sembako',
  hargaBeli: 0,
  hargaJual: 0,
  stok: 0,
  satuan: 'buah',
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function ProductManagement() {
  const { products, setProducts, addProduct, updateProduct, deleteProduct, searchQuery, setSearchQuery } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [editId, setEditId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showLowStock, setShowLowStock] = useState(false);
  const { toast } = useToast();

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (searchQuery) params.append('search', searchQuery);
      if (showLowStock) params.append('lowStock', 'true');

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter, searchQuery, showLowStock]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim() || !formData.kode.trim()) {
      toast({
        title: 'Error',
        description: 'Kode dan nama produk wajib diisi',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editId) {
        const res = await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editId, ...formData }),
        });
        const data = await res.json();
        if (data.success) {
          updateProduct(editId, data.data);
          toast({ title: 'Berhasil', description: 'Produk berhasil diperbarui' });
        }
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          addProduct(data.data);
          toast({ title: 'Berhasil', description: 'Produk berhasil ditambahkan' });
        }
      }
      setShowForm(false);
      setFormData(initialFormData);
      setEditId(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menyimpan data',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (product: Product) => {
    setFormData({
      kode: product.kode,
      nama: product.nama,
      kategori: product.kategori,
      hargaBeli: product.hargaBeli,
      hargaJual: product.hargaJual,
      stok: product.stok,
      satuan: product.satuan,
    });
    setEditId(product.id);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    try {
      const res = await fetch(`/api/products?id=${selectedProduct.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        deleteProduct(selectedProduct.id);
        toast({ title: 'Berhasil', description: 'Produk berhasil dihapus' });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menghapus produk',
        variant: 'destructive',
      });
    } finally {
      setShowDeleteDialog(false);
      setSelectedProduct(null);
    }
  };

  const handleShowDetail = (product: Product) => {
    setSelectedProduct(product);
    setShowDetailSheet(true);
  };

  const getStockBadge = (stok: number) => {
    if (stok === 0) {
      return <Badge className="bg-red-100 text-red-800">Habis</Badge>;
    } else if (stok < 10) {
      return <Badge className="bg-orange-100 text-orange-800">Stok Rendah</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">Tersedia</Badge>;
  };

  const filteredProducts = products.filter((p) => {
    if (categoryFilter !== 'all' && p.kategori !== categoryFilter) return false;
    if (showLowStock && p.stok >= 10) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        p.nama.toLowerCase().includes(query) ||
        p.kode.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="p-4 pb-20 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Manajemen Produk</h1>
        <Button
          onClick={() => {
            setFormData(initialFormData);
            setEditId(null);
            setShowForm(true);
          }}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-4 w-4 mr-1" />
          Tambah
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={showLowStock ? 'default' : 'outline'}
            className={showLowStock ? 'bg-orange-600 hover:bg-orange-700' : ''}
            onClick={() => setShowLowStock(!showLowStock)}
          >
            <AlertTriangle className="h-4 w-4 mr-1" />
            Stok Rendah
          </Button>
        </div>
      </div>

      {/* Products List */}
      <ScrollArea className="h-[calc(100vh-260px)]">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Memuat data...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery || categoryFilter !== 'all' || showLowStock
              ? 'Tidak ada produk yang cocok'
              : 'Belum ada produk. Klik tombol Tambah untuk menambahkan.'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleShowDetail(product)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500">{product.kode}</span>
                        {getStockBadge(product.stok)}
                      </div>
                      <h3 className="font-semibold">{product.nama}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-green-600">
                          {formatCurrency(product.hargaJual)}
                        </span>
                        <span className="text-sm text-gray-500">
                          Stok: {product.stok} {product.satuan}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(product);
                        }}
                      >
                        <Edit2 className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(product);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Add/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editId ? 'Edit Produk' : 'Tambah Produk Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="kode">Kode Produk *</Label>
                <Input
                  id="kode"
                  value={formData.kode}
                  onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                  placeholder="BRG001"
                />
              </div>
              <div>
                <Label htmlFor="satuan">Satuan</Label>
                <Input
                  id="satuan"
                  value={formData.satuan}
                  onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                  placeholder="buah/kg/botol"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="nama">Nama Produk *</Label>
              <Input
                id="nama"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Masukkan nama produk"
              />
            </div>
            <div>
              <Label htmlFor="kategori">Kategori</Label>
              <Select
                value={formData.kategori}
                onValueChange={(value) => setFormData({ ...formData, kategori: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hargaBeli">Harga Beli</Label>
                <Input
                  id="hargaBeli"
                  type="number"
                  value={formData.hargaBeli || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, hargaBeli: parseInt(e.target.value) || 0 })
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="hargaJual">Harga Jual</Label>
                <Input
                  id="hargaJual"
                  type="number"
                  value={formData.hargaJual || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, hargaJual: parseInt(e.target.value) || 0 })
                  }
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="stok">Stok Awal</Label>
              <Input
                id="stok"
                type="number"
                value={formData.stok || ''}
                onChange={(e) =>
                  setFormData({ ...formData, stok: parseInt(e.target.value) || 0 })
                }
                placeholder="0"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                {editId ? 'Simpan' : 'Tambah'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Produk?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus produk &quot;{selectedProduct?.nama}&quot;?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Product Detail Sheet */}
      <Sheet open={showDetailSheet} onOpenChange={setShowDetailSheet}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Detail Produk</SheetTitle>
          </SheetHeader>
          {selectedProduct && (
            <div className="space-y-4 mt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{selectedProduct.kode}</p>
                  <h3 className="font-semibold text-lg">{selectedProduct.nama}</h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline">{selectedProduct.kategori}</Badge>
                {getStockBadge(selectedProduct.stok)}
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Hash className="h-4 w-4" />
                    <span className="text-sm">Stok</span>
                  </div>
                  <span className="font-semibold">
                    {selectedProduct.stok} {selectedProduct.satuan}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">Harga Beli</span>
                  </div>
                  <span className="font-semibold">
                    {formatCurrency(selectedProduct.hargaBeli)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 text-green-600">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">Harga Jual</span>
                  </div>
                  <span className="font-bold text-green-600">
                    {formatCurrency(selectedProduct.hargaJual)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-600">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">Margin</span>
                  </div>
                  <span className="font-semibold text-blue-600">
                    {formatCurrency(selectedProduct.hargaJual - selectedProduct.hargaBeli)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowDetailSheet(false);
                    handleEdit(selectedProduct);
                  }}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-red-600 hover:text-red-700"
                  onClick={() => {
                    setShowDetailSheet(false);
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
