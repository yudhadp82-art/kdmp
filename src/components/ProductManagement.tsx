'use client';

import { useEffect, useState, useCallback } from 'react';
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

const CATEGORIES = ['Sembako', 'Minuman', 'Makanan', 'Rokok', 'Kebersihan', 'Lainnya'];

const initialFormData: ProductFormData = {
  kode: '', nama: '', kategori: 'Sembako', hargaBeli: 0, hargaJual: 0, stok: 0, satuan: 'buah',
};

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

export default function ProductManagement() {
  const { products, setProducts, addProduct, updateProduct, deleteProduct } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [editId, setEditId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (localSearch) params.append('search', localSearch);
      if (showLowStock) params.append('lowStock', 'true');
      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      if (data.success) setProducts(data.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, localSearch, showLowStock, setProducts]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim() || !formData.kode.trim()) {
      toast({ title: 'Error', description: 'Kode dan nama produk wajib diisi', variant: 'destructive' });
      return;
    }
    try {
      if (editId) {
        const res = await fetch('/api/products', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editId, ...formData }),
        });
        const data = await res.json();
        if (data.success) { updateProduct(editId, data.data); toast({ title: 'Berhasil', description: 'Produk diperbarui' }); }
      } else {
        const res = await fetch('/api/products', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) { addProduct(data.data); toast({ title: 'Berhasil', description: 'Produk ditambahkan' }); }
      }
      setShowForm(false); setFormData(initialFormData); setEditId(null); fetchProducts();
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal menyimpan', variant: 'destructive' });
    }
  };

  const handleEdit = (product: Product) => {
    setFormData({ kode: product.kode, nama: product.nama, kategori: product.kategori, hargaBeli: product.hargaBeli, hargaJual: product.hargaJual, stok: product.stok, satuan: product.satuan });
    setEditId(product.id);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    try {
      const res = await fetch(`/api/products?id=${selectedProduct.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { deleteProduct(selectedProduct.id); toast({ title: 'Berhasil', description: 'Produk dihapus' }); }
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal menghapus', variant: 'destructive' });
    } finally {
      setShowDeleteDialog(false); setSelectedProduct(null);
    }
  };

  const getStockBadge = (stok: number) => {
    if (stok === 0) return <Badge className="bg-red-100 text-red-800">Habis</Badge>;
    if (stok < 10) return <Badge className="bg-orange-100 text-orange-800">Stok Rendah</Badge>;
    return <Badge className="bg-green-100 text-green-800">Tersedia</Badge>;
  };

  const filteredProducts = products.filter((p) => {
    if (categoryFilter !== 'all' && p.kategori !== categoryFilter) return false;
    if (showLowStock && p.stok >= 10) return false;
    if (localSearch) return p.nama.toLowerCase().includes(localSearch.toLowerCase()) || p.kode.toLowerCase().includes(localSearch.toLowerCase());
    return true;
  });

  return (
    <div className="p-4 pb-20 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Manajemen Produk</h1>
        <Button onClick={() => { setFormData(initialFormData); setEditId(null); setShowForm(true); }} className="bg-red-600 hover:bg-red-700">
          <Plus className="h-4 w-4 mr-1" /> Tambah
        </Button>
      </div>

      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Cari produk..." value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="flex-1"><SelectValue placeholder="Kategori" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {CATEGORIES.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
            </SelectContent>
          </Select>
          <Button variant={showLowStock ? 'default' : 'outline'} className={showLowStock ? 'bg-orange-600 hover:bg-orange-700' : ''} onClick={() => setShowLowStock(!showLowStock)}>
            <AlertTriangle className="h-4 w-4 mr-1" /> Stok Rendah
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-260px)]">
        {isLoading ? (<div className="text-center py-8 text-gray-500">Memuat...</div>) :
         filteredProducts.length === 0 ? (<div className="text-center py-8 text-gray-500">Tidak ada produk</div>) :
         (<div className="space-y-3">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="cursor-pointer hover:shadow-md" onClick={() => setSelectedProduct(product)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500">{product.kode}</span>
                        {getStockBadge(product.stok)}
                      </div>
                      <h3 className="font-semibold">{product.nama}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-red-600">{formatCurrency(product.hargaJual)}</span>
                        <span className="text-sm text-gray-500">Stok: {product.stok} {product.satuan}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(product); }}>
                        <Edit2 className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); setShowDeleteDialog(true); }}>
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

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md z-[100]">
          <DialogHeader><DialogTitle>{editId ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Kode Produk *</Label><Input value={formData.kode} onChange={(e) => setFormData({ ...formData, kode: e.target.value })} placeholder="BRG001" /></div>
              <div><Label>Satuan</Label><Input value={formData.satuan} onChange={(e) => setFormData({ ...formData, satuan: e.target.value })} placeholder="buah" /></div>
            </div>
            <div><Label>Nama Produk *</Label><Input value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} placeholder="Nama produk" /></div>
            <div><Label>Kategori</Label>
              <Select value={formData.kategori} onValueChange={(v) => setFormData({ ...formData, kategori: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Harga Beli</Label><Input type="number" value={formData.hargaBeli || ''} onChange={(e) => setFormData({ ...formData, hargaBeli: parseInt(e.target.value) || 0 })} /></div>
              <div><Label>Harga Jual</Label><Input type="number" value={formData.hargaJual || ''} onChange={(e) => setFormData({ ...formData, hargaJual: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <div><Label>Stok</Label><Input type="number" value={formData.stok || ''} onChange={(e) => setFormData({ ...formData, stok: parseInt(e.target.value) || 0 })} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
              <Button type="submit" className="bg-red-600 hover:bg-red-700">{editId ? 'Simpan' : 'Tambah'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="z-[100]">
          <AlertDialogHeader><AlertDialogTitle>Hapus Produk?</AlertDialogTitle>
            <AlertDialogDescription>Hapus "{selectedProduct?.nama}"? Tindakan ini tidak bisa dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail Dialog */}
      <Dialog open={!!selectedProduct && !showDeleteDialog && !showForm} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-md z-[100]">
          <DialogHeader><DialogTitle>Detail Produk</DialogTitle></DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                  <Package className="h-6 w-6 text-red-600" />
                </div>
                <div><p className="text-sm text-gray-500">{selectedProduct.kode}</p><h3 className="font-semibold text-lg">{selectedProduct.nama}</h3></div>
              </div>
              <div className="flex gap-2">{getStockBadge(selectedProduct.stok)}<Badge variant="outline">{selectedProduct.kategori}</Badge></div>
              <div className="space-y-2">
                <div className="flex justify-between p-2 bg-gray-50 rounded"><span>Stok</span><span>{selectedProduct.stok} {selectedProduct.satuan}</span></div>
                <div className="flex justify-between p-2 bg-gray-50 rounded"><span>Harga Beli</span><span>{formatCurrency(selectedProduct.hargaBeli)}</span></div>
                <div className="flex justify-between p-2 bg-red-50 rounded text-red-600"><span>Harga Jual</span><span className="font-bold">{formatCurrency(selectedProduct.hargaJual)}</span></div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { const p = selectedProduct; setSelectedProduct(null); handleEdit(p!); }}>Edit</Button>
                <Button variant="outline" className="flex-1 text-red-600" onClick={() => { setShowDeleteDialog(true); }}>Hapus</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
