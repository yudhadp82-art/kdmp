// Members API Route
import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firebase';
import type { Member } from '@/types';

// GET all members
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let membersQuery = collection(db, COLLECTIONS.MEMBERS);
    const snapshot = await getDocs(membersQuery);
    
    let members: Member[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Member[];

    // Filter by status
    if (status && status !== 'all') {
      members = members.filter((m) => m.status === status);
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      members = members.filter(
        (m) =>
          m.nama.toLowerCase().includes(searchLower) ||
          m.telepon.includes(search) ||
          m.email.toLowerCase().includes(searchLower)
      );
    }

    // Sort by createdAt desc
    members.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ success: true, data: members });
  } catch (error: unknown) {
    console.error('Error fetching members:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// POST create new member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nama, alamat, telepon, email, status } = body;

    const now = new Date().toISOString();
    const memberData = {
      nama,
      alamat,
      telepon,
      email,
      tanggalDaftar: now,
      status: status || 'aktif',
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.MEMBERS), memberData);
    
    const newMember: Member = {
      id: docRef.id,
      ...memberData,
    };

    return NextResponse.json({ success: true, data: newMember });
  } catch (error: unknown) {
    console.error('Error creating member:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// PUT update member
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    const memberRef = doc(db, COLLECTIONS.MEMBERS, id);
    await updateDoc(memberRef, {
      ...updateData,
      updatedAt: new Date().toISOString(),
    });

    const updatedDoc = await getDoc(memberRef);
    const updatedMember = { id, ...updatedDoc.data() };

    return NextResponse.json({ success: true, data: updatedMember });
  } catch (error: unknown) {
    console.error('Error updating member:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE member
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    await deleteDoc(doc(db, COLLECTIONS.MEMBERS, id));

    return NextResponse.json({ success: true, message: 'Member deleted successfully' });
  } catch (error: unknown) {
    console.error('Error deleting member:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
