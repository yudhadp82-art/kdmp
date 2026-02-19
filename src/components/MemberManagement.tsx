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
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  User,
  Calendar,
  X,
} from 'lucide-react';
import type { Member, MemberFormData } from '@/types';
import { useToast } from '@/hooks/use-toast';

const initialFormData: MemberFormData = {
  nama: '',
  alamat: '',
  telepon: '',
  email: '',
  status: 'aktif',
};

export default function MemberManagement() {
  const { members, setMembers, addMember, updateMember, deleteMember, searchQuery, setSearchQuery } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState<MemberFormData>(initialFormData);
  const [editId, setEditId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/members?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setMembers(data.data);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [statusFilter, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      toast({
        title: 'Error',
        description: 'Nama anggota wajib diisi',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editId) {
        const res = await fetch('/api/members', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editId, ...formData }),
        });
        const data = await res.json();
        if (data.success) {
          updateMember(editId, data.data);
          toast({ title: 'Berhasil', description: 'Anggota berhasil diperbarui' });
        }
      } else {
        const res = await fetch('/api/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          addMember(data.data);
          toast({ title: 'Berhasil', description: 'Anggota berhasil ditambahkan' });
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

  const handleEdit = (member: Member) => {
    setFormData({
      nama: member.nama,
      alamat: member.alamat,
      telepon: member.telepon,
      email: member.email,
      status: member.status,
    });
    setEditId(member.id);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!selectedMember) return;
    try {
      const res = await fetch(`/api/members?id=${selectedMember.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        deleteMember(selectedMember.id);
        toast({ title: 'Berhasil', description: 'Anggota berhasil dihapus' });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menghapus anggota',
        variant: 'destructive',
      });
    } finally {
      setShowDeleteDialog(false);
      setSelectedMember(null);
    }
  };

  const handleShowDetail = (member: Member) => {
    setSelectedMember(member);
    setShowDetailSheet(true);
  };

  const filteredMembers = members.filter((m) => {
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        m.nama.toLowerCase().includes(query) ||
        m.telepon.includes(searchQuery) ||
        m.email.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="p-4 pb-20 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Manajemen Anggota</h1>
        <Button
          onClick={() => {
            setFormData(initialFormData);
            setEditId(null);
            setShowForm(true);
          }}
          className="bg-red-600 hover:bg-red-700"
        >
          <Plus className="h-4 w-4 mr-1" />
          Tambah
        </Button>
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
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="aktif">Aktif</SelectItem>
            <SelectItem value="tidak aktif">Tidak Aktif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Members List */}
      <ScrollArea className="h-[calc(100vh-220px)]">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Memuat data...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery || statusFilter !== 'all'
              ? 'Tidak ada anggota yang cocok'
              : 'Belum ada anggota. Klik tombol Tambah untuk menambahkan.'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMembers.map((member) => (
              <Card
                key={member.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleShowDetail(member)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{member.nama}</span>
                        <Badge
                          variant={member.status === 'aktif' ? 'default' : 'secondary'}
                          className={
                            member.status === 'aktif'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {member.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500 space-y-1">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {member.telepon}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{member.alamat}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(member);
                        }}
                      >
                        <Edit2 className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMember(member);
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
              {editId ? 'Edit Anggota' : 'Tambah Anggota Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nama">Nama Lengkap *</Label>
              <Input
                id="nama"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Masukkan nama lengkap"
              />
            </div>
            <div>
              <Label htmlFor="telepon">Nomor Telepon</Label>
              <Input
                id="telepon"
                value={formData.telepon}
                onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                placeholder="08xxxxxxxxxx"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@contoh.com"
              />
            </div>
            <div>
              <Label htmlFor="alamat">Alamat</Label>
              <Textarea
                id="alamat"
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                placeholder="Masukkan alamat lengkap"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'aktif' | 'tidak aktif') =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="tidak aktif">Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-red-600 hover:bg-red-700">
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
            <AlertDialogTitle>Hapus Anggota?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus anggota &quot;{selectedMember?.nama}&quot;?
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

      {/* Member Detail Sheet */}
      <Sheet open={showDetailSheet} onOpenChange={setShowDetailSheet}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Detail Anggota</SheetTitle>
          </SheetHeader>
          {selectedMember && (
            <div className="space-y-4 mt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedMember.nama}</h3>
                  <Badge
                    variant={selectedMember.status === 'aktif' ? 'default' : 'secondary'}
                    className={
                      selectedMember.status === 'aktif'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {selectedMember.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{selectedMember.telepon || '-'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{selectedMember.email || '-'}</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <span>{selectedMember.alamat || '-'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>
                    Terdaftar:{' '}
                    {new Date(selectedMember.tanggalDaftar).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowDetailSheet(false);
                    handleEdit(selectedMember);
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
