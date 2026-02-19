'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit2, Trash2, Phone, Mail, MapPin, User, Calendar } from 'lucide-react';
import type { Member, MemberFormData } from '@/types';
import { useToast } from '@/hooks/use-toast';

const initialFormData: MemberFormData = { nama: '', alamat: '', telepon: '', email: '', status: 'aktif' };

export default function MemberManagement() {
  const { members, setMembers, addMember, updateMember, deleteMember } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState<MemberFormData>(initialFormData);
  const [editId, setEditId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (localSearch) params.append('search', localSearch);
      const res = await fetch(`/api/members?${params.toString()}`);
      const data = await res.json();
      if (data.success) setMembers(data.data);
    } catch (error) { console.error('Error:', error); }
    finally { setIsLoading(false); }
  }, [statusFilter, localSearch, setMembers]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) { toast({ title: 'Error', description: 'Nama wajib diisi', variant: 'destructive' }); return; }
    try {
      if (editId) {
        const res = await fetch('/api/members', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editId, ...formData }) });
        const data = await res.json();
        if (data.success) { updateMember(editId, data.data); toast({ title: 'Berhasil', description: 'Anggota diperbarui' }); }
      } else {
        const res = await fetch('/api/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
        const data = await res.json();
        if (data.success) { addMember(data.data); toast({ title: 'Berhasil', description: 'Anggota ditambahkan' }); }
      }
      setShowForm(false); setFormData(initialFormData); setEditId(null); fetchMembers();
    } catch (error) { toast({ title: 'Error', description: 'Gagal menyimpan', variant: 'destructive' }); }
  };

  const handleEdit = (member: Member) => {
    setFormData({ nama: member.nama, alamat: member.alamat, telepon: member.telepon, email: member.email, status: member.status });
    setEditId(member.id); setShowForm(true);
  };

  const handleDelete = async () => {
    if (!selectedMember) return;
    try {
      const res = await fetch(`/api/members?id=${selectedMember.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { deleteMember(selectedMember.id); toast({ title: 'Berhasil', description: 'Anggota dihapus' }); }
    } catch (error) { toast({ title: 'Error', description: 'Gagal menghapus', variant: 'destructive' }); }
    finally { setShowDeleteDialog(false); setSelectedMember(null); }
  };

  const filteredMembers = members.filter((m) => {
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    if (localSearch) return m.nama.toLowerCase().includes(localSearch.toLowerCase()) || m.telepon.includes(localSearch);
    return true;
  });

  return (
    <div className="p-4 pb-20 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Manajemen Anggota</h1>
        <Button onClick={() => { setFormData(initialFormData); setEditId(null); setShowForm(true); }} className="bg-red-600 hover:bg-red-700">
          <Plus className="h-4 w-4 mr-1" /> Tambah
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Cari anggota..." value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="aktif">Aktif</SelectItem>
            <SelectItem value="tidak aktif">Tidak Aktif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="h-[calc(100vh-220px)]">
        {isLoading ? (<div className="text-center py-8 text-gray-500">Memuat...</div>) :
         filteredMembers.length === 0 ? (<div className="text-center py-8 text-gray-500">Tidak ada anggota</div>) :
         (<div className="space-y-3">
            {filteredMembers.map((member) => (
              <Card key={member.id} className="cursor-pointer hover:shadow-md" onClick={() => setSelectedMember(member)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{member.nama}</span>
                        <Badge className={member.status === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>{member.status}</Badge>
                      </div>
                      <div className="text-sm text-gray-500 space-y-1">
                        <div className="flex items-center gap-1"><Phone className="h-3 w-3" />{member.telepon}</div>
                        <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /><span className="truncate">{member.alamat}</span></div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(member); }}><Edit2 className="h-4 w-4 text-blue-600" /></Button>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(true); }}><Trash2 className="h-4 w-4 text-red-600" /></Button>
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
          <DialogHeader><DialogTitle>{editId ? 'Edit Anggota' : 'Tambah Anggota'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Nama Lengkap *</Label><Input value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} /></div>
            <div><Label>Telepon</Label><Input value={formData.telepon} onChange={(e) => setFormData({ ...formData, telepon: e.target.value })} /></div>
            <div><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
            <div><Label>Alamat</Label><Textarea value={formData.alamat} onChange={(e) => setFormData({ ...formData, alamat: e.target.value })} rows={2} /></div>
            <div><Label>Status</Label>
              <Select value={formData.status} onValueChange={(v: 'aktif' | 'tidak aktif') => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="tidak aktif">Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
          <AlertDialogHeader><AlertDialogTitle>Hapus Anggota?</AlertDialogTitle>
            <AlertDialogDescription>Hapus "{selectedMember?.nama}"? Tidak bisa dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail Dialog */}
      <Dialog open={!!selectedMember && !showDeleteDialog && !showForm} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="max-w-md z-[100]">
          <DialogHeader><DialogTitle>Detail Anggota</DialogTitle></DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedMember.nama}</h3>
                  <Badge className={selectedMember.status === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>{selectedMember.status}</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-gray-400" /><span>{selectedMember.telepon || '-'}</span></div>
                <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-gray-400" /><span>{selectedMember.email || '-'}</span></div>
                <div className="flex items-start gap-2 text-sm"><MapPin className="h-4 w-4 text-gray-400 mt-0.5" /><span>{selectedMember.alamat || '-'}</span></div>
                <div className="flex items-center gap-2 text-sm"><Calendar className="h-4 w-4 text-gray-400" /><span>Terdaftar: {new Date(selectedMember.tanggalDaftar).toLocaleDateString('id-ID')}</span></div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { const m = selectedMember; setSelectedMember(null); handleEdit(m!); }}>Edit</Button>
                <Button variant="outline" className="flex-1 text-red-600" onClick={() => setShowDeleteDialog(true)}>Hapus</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
