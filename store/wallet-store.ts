
import { create } from "zustand";

export interface User {
  lastname: any;
  firstname: any;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  currency: string;
  theme: "light" | "dark";
  profileImage?: string;
  minBalance: number;
  kycStatus: "not-started" | "approved" | "rejected";
  kycData?: {
    fullName: string;
    documentType: string;
    documentNumber: string;
    gender: string;
    dob: string;
    address: string;
    country: string;
    photoUrl: string;
    initialBalance: number;
  };
}

export interface Wallet {
  id: string;
  name: string;
  balance: number;
  currency: string;
}

export interface Transaction {
  id: string;
  type: "deposit" | "withdraw" | "transfer";
  fromWallet?: string;
  toWallet?: string;
  amount: number;
  currency: string;
  status: "success" | "failed" | "not-started";
  timestamp: string;
  reason?: string;
  serviceCharge: number;
}

export interface ExternalUser {
  id: string;
  name: string;
  email: string;
  accountNumber: string;
  bankName: string;
  type: "bank" | "crypto";
  logo: string;
}

interface WalletState {
  user: User | null;
  wallets: Wallet[];
  transactions: Transaction[];
  externalUsers: ExternalUser[];
  isAuthenticated: boolean;
  balanceVisible: boolean;
  login: (email: string, password: string) => void;
  register: (userData: Omit<User, "id" | "kycStatus">) => void;
  logout: () => void;
  addWallet: (wallet: Omit<Wallet, "id">) => void;
  updateUser: (userData: Partial<User>) => void;
  addTransaction: (transaction: Omit<Transaction, "id" | "timestamp">) => void;
  toggleBalanceVisibility: () => void;
  transfer: (
    fromWalletId: string,
    toWalletId: string,
    amount: number,
    reason: string,
    password: string
  ) => Promise<{ success: boolean; message: string }>;
  transferToExternal: (
    fromWalletId: string,
    externalUserId: string,
    amount: number,
    reason: string,
    password: string
  ) => Promise<{ success: boolean; message: string }>;
}

// Mock external users
const mockExternalUsers: ExternalUser[] = [
  {
    id: "ext_1",
    name: "Alice Johnson",
    email: "alice@example.com",
    accountNumber: "1111222233",
    bankName: "CBE",
    type: "bank",
    logo: "🏛️",
  },
  {
    id: "ext_2",
    name: "Bob Smith",
    email: "bob@example.com",
    accountNumber: "4444555566",
    bankName: "Dashen",
    type: "bank",
    logo: "🏦",
  },
];

export const useWalletStore = create<WalletState>((set, get) => ({
  user: null,
  wallets: [],
  transactions: [],
  externalUsers: mockExternalUsers,
  isAuthenticated: false,
  balanceVisible: false,

  login: (email: string, password: string) => {
    // Mock login - in real app, this would call an API
   

    const mockWallets: Wallet[] = [
      {
        id: "1",
        name: "Main Wallet",
        balance: 5000,
        currency: "USD",
      },
      {
        id: "2",
        name: "Savings Wallet",
        balance: 50,
        currency: "USD",
      },
    ];

    const mockTransactions: Transaction[] = [
      {
        id: "1",
        type: "deposit",
        toWallet: "1",
        amount: 1000,
        currency: "USD",
        status: "success",
        timestamp: new Date().toISOString(),
        serviceCharge: 0,
      },
      {
        id: "2",
        type: "transfer",
        fromWallet: "1",
        toWallet: "2",
        amount: 500,
        currency: "USD",
        status: "success",
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        reason: "Savings",
        serviceCharge: 5,
      },
      {
        id: "3",
        type: "withdraw",
        fromWallet: "1",
        amount: 200,
        currency: "USD",
        status: "failed",
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        reason: "ATM Withdrawal",
        serviceCharge: 2,
      },
    ];

   
  },

  register: (userData) => {
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      kycStatus: "not-started",
    };

    const defaultWallet: Wallet = {
      id: Date.now().toString(),
      name: "Main Wallet",
      balance: 0,
      currency: userData.currency,
    };

    set({
      user: newUser,
      wallets: [defaultWallet],
      transactions: [],
      isAuthenticated: true,
    });
  },

  logout: () => {
    set({
      user: null,
      wallets: [],
      transactions: [],
      isAuthenticated: false,
    });
  },

  addWallet: (walletData) => {
    const newWallet: Wallet = {
      ...walletData,
      id: Date.now().toString(),
    };

    set((state) => ({
      wallets: [...state.wallets, newWallet],
    }));
  },

  updateUser: (userData) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...userData } : null,
    }));
  },

  addTransaction: (transactionData) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      transactions: [newTransaction, ...state.transactions],
    }));
  },

  toggleBalanceVisibility: () => {
    set((state) => ({
      balanceVisible: !state.balanceVisible,
    }));
  },

  transfer: async (fromWalletId: string, toWalletId: string, amount: number, reason: string, password: string) => {
    const { wallets, addTransaction } = get();

    const fromWallet = wallets.find((w) => w.id === fromWalletId);
    const toWallet = wallets.find((w) => w.id === toWalletId);

    if (!fromWallet || !toWallet) {
      return { success: false, message: "Invalid wallet selection." };
    }

    const serviceCharge = amount * 0.01; // 1% service charge
    const totalDeduction = amount + serviceCharge;

    // Update wallet balances
    set((state) => ({
      wallets: state.wallets.map((w) => {
        if (w.id === fromWalletId) {
          return { ...w, balance: w.balance - totalDeduction };
        }
        if (w.id === toWalletId) {
          return { ...w, balance: w.balance + amount };
        }
        return w;
      }),
    }));

    // Add transaction
    addTransaction({
      type: "transfer",
      fromWallet: fromWalletId,
      toWallet: toWalletId,
      amount,
      currency: fromWallet.currency,
      status: "success",
      reason,
      serviceCharge,
    });

    return { success: true, message: "Transfer completed successfully!" };
  },

  transferToExternal: async (
    fromWalletId: string,
    externalUserId: string,
    amount: number,
    reason: string,
    password: string
  ) => {
    const { wallets, addTransaction, externalUsers } = get();

    const fromWallet = wallets.find((w) => w.id === fromWalletId);
    const externalUser = externalUsers.find((user) => user.id === externalUserId);

    if (!fromWallet || !externalUser) {
      return { success: false, message: "Invalid wallet or recipient selection." };
    }

    const serviceCharge = amount * 0.02; // 2% service charge for external transfers
    const totalDeduction = amount + serviceCharge;

    // Update wallet balance
    set((state) => ({
      wallets: state.wallets.map((w) => {
        if (w.id === fromWalletId) {
          return { ...w, balance: w.balance - totalDeduction };
        }
        return w;
      }),
    }));

    // Add transaction
    addTransaction({
      type: "transfer",
      fromWallet: fromWalletId,
      amount,
      currency: fromWallet.currency,
      status: "success",
      reason: `Transfer to ${externalUser.name} (${externalUser.bankName}) - ${reason}`,
      serviceCharge,
    });

    return { success: true, message: `Transfer to ${externalUser.name} completed successfully!` };
  },
}));
