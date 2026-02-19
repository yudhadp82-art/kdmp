// Zustand Store for KDMP Sindangjaya POS System
import { create } from 'zustand';
import type { Member, Product, Transaction, Debt, DebtPayment, DashboardStats } from '@/types';

// Navigation tab type
export type TabType = 'dashboard' | 'members' | 'products' | 'pos' | 'debts' | 'reports';

// POS Cart item
export interface CartItem {
  productId: string;
  productName: string;
  kode: string;
  quantity: number;
  hargaBeli: number;
  hargaJual: number;
  stok: number;
}

interface AppState {
  // Navigation
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;

  // Members
  members: Member[];
  setMembers: (members: Member[]) => void;
  addMember: (member: Member) => void;
  updateMember: (id: string, member: Partial<Member>) => void;
  deleteMember: (id: string) => void;

  // Products
  products: Product[];
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Transactions
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;

  // Debts
  debts: Debt[];
  setDebts: (debts: Debt[]) => void;
  addDebt: (debt: Debt) => void;
  updateDebt: (id: string, debt: Partial<Debt>) => void;

  // Debt Payments
  debtPayments: DebtPayment[];
  setDebtPayments: (payments: DebtPayment[]) => void;
  addDebtPayment: (payment: DebtPayment) => void;

  // Dashboard Stats
  dashboardStats: DashboardStats;
  setDashboardStats: (stats: DashboardStats) => void;

  // POS Cart
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  updateCartItem: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Search/Filter
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const initialDashboardStats: DashboardStats = {
  totalPenjualanHariIni: 0,
  totalAnggota: 0,
  totalProduk: 0,
  totalPiutang: 0,
  jumlahTransaksiHariIni: 0,
  produkStokRendah: 0,
};

export const useAppStore = create<AppState>((set) => ({
  // Navigation
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Members
  members: [],
  setMembers: (members) => set({ members }),
  addMember: (member) => set((state) => ({ members: [...state.members, member] })),
  updateMember: (id, member) =>
    set((state) => ({
      members: state.members.map((m) => (m.id === id ? { ...m, ...member } : m)),
    })),
  deleteMember: (id) =>
    set((state) => ({
      members: state.members.filter((m) => m.id !== id),
    })),

  // Products
  products: [],
  setProducts: (products) => set({ products }),
  addProduct: (product) => set((state) => ({ products: [...state.products, product] })),
  updateProduct: (id, product) =>
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? { ...p, ...product } : p)),
    })),
  deleteProduct: (id) =>
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    })),

  // Transactions
  transactions: [],
  setTransactions: (transactions) => set({ transactions }),
  addTransaction: (transaction) =>
    set((state) => ({ transactions: [transaction, ...state.transactions] })),

  // Debts
  debts: [],
  setDebts: (debts) => set({ debts }),
  addDebt: (debt) => set((state) => ({ debts: [...state.debts, debt] })),
  updateDebt: (id, debt) =>
    set((state) => ({
      debts: state.debts.map((d) => (d.id === id ? { ...d, ...debt } : d)),
    })),

  // Debt Payments
  debtPayments: [],
  setDebtPayments: (payments) => set({ debtPayments: payments }),
  addDebtPayment: (payment) =>
    set((state) => ({ debtPayments: [payment, ...state.debtPayments] })),

  // Dashboard Stats
  dashboardStats: initialDashboardStats,
  setDashboardStats: (stats) => set({ dashboardStats: stats }),

  // POS Cart
  cart: [],
  addToCart: (item) =>
    set((state) => {
      const existingItem = state.cart.find((i) => i.productId === item.productId);
      if (existingItem) {
        return {
          cart: state.cart.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          ),
        };
      }
      return { cart: [...state.cart, item] };
    }),
  updateCartItem: (productId, quantity) =>
    set((state) => ({
      cart: state.cart.map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      ),
    })),
  removeFromCart: (productId) =>
    set((state) => ({
      cart: state.cart.filter((i) => i.productId !== productId),
    })),
  clearCart: () => set({ cart: [] }),

  // Loading states
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Search/Filter
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
