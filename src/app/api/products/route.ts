// Products API Route
import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase';
import type { Product } from '@/types';

// Helper to check DB connection
function checkDb() {
  if (!db) {
    return { error: 'Firebase not configured. Please set environment variables.' };
  }
  return null;
}

// GET all products
export async function GET(request: NextRequest) {
  const dbError = checkDb();
  if (dbError) return NextResponse.json({ success: false, error: dbError.error }, { status: 500 });

  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const lowStock = searchParams.get('lowStock');

    const snapshot = await getDocs(collection(db!, COLLECTIONS.PRODUCTS));
    
    let products: Product[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[];

    // Filter by category
    if (category && category !== 'all') {
      products = products.filter((p) => p.kategori === category);
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(
        (p) =>
          p.nama.toLowerCase().includes(searchLower) ||
          p.kode.toLowerCase().includes(searchLower)
      );
    }

    // Filter low stock (less than 10)
    if (lowStock === 'true') {
      products = products.filter((p) => p.stok < 10);
    }

    // Sort by createdAt desc
    products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ success: true, data: products });
  } catch (error: unknown) {
    console.error('Error fetching products:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// POST create new product
export async function POST(request: NextRequest) {
  const dbError = checkDb();
  if (dbError) return NextResponse.json({ success: false, error: dbError.error }, { status: 500 });

  try {
    const body = await request.json();
    const { kode, nama, kategori, hargaBeli, hargaJual, stok, satuan } = body;

    const now = new Date().toISOString();
    const productData = {
      kode,
      nama,
      kategori,
      hargaBeli: Number(hargaBeli),
      hargaJual: Number(hargaJual),
      stok: Number(stok),
      satuan,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db!, COLLECTIONS.PRODUCTS), productData);
    
    const newProduct: Product = {
      id: docRef.id,
      ...productData,
    };

    return NextResponse.json({ success: true, data: newProduct });
  } catch (error: unknown) {
    console.error('Error creating product:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// PUT update product
export async function PUT(request: NextRequest) {
  const dbError = checkDb();
  if (dbError) return NextResponse.json({ success: false, error: dbError.error }, { status: 500 });

  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const productRef = doc(db!, COLLECTIONS.PRODUCTS, id);
    
    const dataToUpdate: Record<string, unknown> = { ...updateData };
    if (updateData.hargaBeli !== undefined) dataToUpdate.hargaBeli = Number(updateData.hargaBeli);
    if (updateData.hargaJual !== undefined) dataToUpdate.hargaJual = Number(updateData.hargaJual);
    if (updateData.stok !== undefined) dataToUpdate.stok = Number(updateData.stok);
    dataToUpdate.updatedAt = new Date().toISOString();

    await updateDoc(productRef, dataToUpdate);

    const updatedDoc = await getDoc(productRef);
    const updatedProduct = { id, ...updatedDoc.data() };

    return NextResponse.json({ success: true, data: updatedProduct });
  } catch (error: unknown) {
    console.error('Error updating product:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// DELETE product
export async function DELETE(request: NextRequest) {
  const dbError = checkDb();
  if (dbError) return NextResponse.json({ success: false, error: dbError.error }, { status: 500 });

  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    await deleteDoc(doc(db!, COLLECTIONS.PRODUCTS, id));

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error: unknown) {
    console.error('Error deleting product:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
