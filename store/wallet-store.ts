import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  password: string
  currency: string
  theme: "light" | "dark"
  profileImage?: string
  minBalance: number
  kycStatus: "pending" | "approved" | "rejected"
  kycData?: {
    fullName: string
    documentType: string
    documentNumber: string
    gender: string
    dob: string
    address: string
    country: string
    photoUrl: string
  }
}

export interface Account {
  id: string
  name: string
  accountNumber: string
  balance: number
  currency: string
  type: "bank" | "crypto"
  bankName?: string
  logo?: string
}

export interface Transaction {
  id: string
  type: "deposit" | "withdraw" | "transfer"
  fromAccount?: string
  toAccount?: string
  amount: number
  currency: string
  status: "success" | "failed" | "pending"
  timestamp: string
  reason?: string
  serviceCharge: number
}

export interface ExternalUser {
  id: string
  name: string
  email: string
  accountNumber: string
  bankName: string
  type: "bank" | "crypto"
  logo: string
}

interface WalletState {
  user: User | null
  accounts: Account[]
  transactions: Transaction[]
  externalUsers: ExternalUser[]
  isAuthenticated: boolean
  balanceVisible: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (userData: Omit<User, "id" | "kycStatus">) => void
  logout: () => void
  addAccount: (account: Omit<Account, "id">) => void
  updateUser: (userData: Partial<User>) => void
  addTransaction: (transaction: Omit<Transaction, "id" | "timestamp">) => void
  toggleBalanceVisibility: () => void
  transfer: (
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    reason: string,
    password: string,
  ) => Promise<{ success: boolean; message: string }>
  transferToExternal: (
    fromAccountId: string,
    externalUserId: string,
    amount: number,
    reason: string,
    password: string,
  ) => Promise<{ success: boolean; message: string }>
}

const bankLogos = {
  CBE: "🏛️",
  Dashen: "🏦",
  Zemen: "💳",
  Awash: "🏪",
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
]

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      user: null,
      accounts: [],
      transactions: [],
      externalUsers: mockExternalUsers,
      isAuthenticated: false,
      balanceVisible: false,

      login: async (email: string, password: string) => {
        // Mock login - in real app, this would call an API
        const mockUser: User = {
          id: "1",
          firstName: "John",
          lastName: "Doe",
          email,
          password: "password123",
          currency: "ETB",
          theme: "dark",
          minBalance: 100,
          kycStatus: "pending",
          profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        }

        const mockAccounts: Account[] = [
          {
            id: "1",
            name: "Main Account",
            accountNumber: "1234567890",
            balance: 5000,
            currency: "ETB",
            type: "bank",
            bankName: "CBE",
            logo: bankLogos.CBE,
          },
          {
            id: "2",
            name: "Savings",
            accountNumber: "0987654321",
            balance: 50,
            currency: "ETB",
            type: "bank",
            bankName: "Dashen",
            logo: bankLogos.Dashen,
          },
        ]

        const mockTransactions: Transaction[] = [
          {
            id: "1",
            type: "deposit",
            toAccount: "1",
            amount: 1000,
            currency: "ETB",
            status: "success",
            timestamp: new Date().toISOString(),
            serviceCharge: 0,
          },
          {
            id: "2",
            type: "transfer",
            fromAccount: "1",
            toAccount: "2",
            amount: 500,
            currency: "ETB",
            status: "success",
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            reason: "Savings",
            serviceCharge: 5,
          },
          {
            id: "3",
            type: "withdraw",
            fromAccount: "1",
            amount: 200,
            currency: "ETB",
            status: "failed",
            timestamp: new Date(Date.now() - 172800000).toISOString(),
            reason: "ATM Withdrawal",
            serviceCharge: 2,
          },
          {
            id: "4",
            type: "deposit",
            toAccount: "2",
            amount: 300,
            currency: "ETB",
            status: "pending",
            timestamp: new Date(Date.now() - 259200000).toISOString(),
            serviceCharge: 0,
          },
          {
            id: "5",
            type: "transfer",
            fromAccount: "2",
            toAccount: "1",
            amount: 150,
            currency: "ETB",
            status: "success",
            timestamp: new Date(Date.now() - 345600000).toISOString(),
            reason: "Bill Payment",
            serviceCharge: 1.5,
          },
          {
            id: "6",
            type: "deposit",
            toAccount: "1",
            amount: 800,
            currency: "ETB",
            status: "success",
            timestamp: new Date(Date.now() - 432000000).toISOString(),
            serviceCharge: 0,
          },
        ]

        set({
          user: mockUser,
          accounts: mockAccounts,
          transactions: mockTransactions,
          isAuthenticated: true,
        })

        localStorage.setItem("wallet_token", "mock_token_123")
        return true
      },

      register: (userData) => {
        const newUser: User = {
          ...userData,
          id: Date.now().toString(),
          kycStatus: "pending",
        }

        const defaultAccount: Account = {
          id: Date.now().toString(),
          name: "Main Account",
          accountNumber: Math.random().toString().substr(2, 10),
          balance: 0,
          currency: userData.currency,
          type: "bank",
          bankName: "CBE",
          logo: bankLogos.CBE,
        }

        set({
          user: newUser,
          accounts: [defaultAccount],
          transactions: [],
          isAuthenticated: true,
        })

        localStorage.setItem("wallet_token", "mock_token_123")
      },

      logout: () => {
        set({
          user: null,
          accounts: [],
          transactions: [],
          isAuthenticated: false,
        })
        localStorage.removeItem("wallet_token")
      },

      addAccount: (accountData) => {
        const newAccount: Account = {
          ...accountData,
          id: Date.now().toString(),
          logo: accountData.bankName ? bankLogos[accountData.bankName as keyof typeof bankLogos] : "💰",
        }

        set((state) => ({
          accounts: [...state.accounts, newAccount],
        }))
      },

      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }))
      },

      addTransaction: (transactionData) => {
        const newTransaction: Transaction = {
          ...transactionData,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
        }

        set((state) => ({
          transactions: [newTransaction, ...state.transactions],
        }))
      },

      toggleBalanceVisibility: () => {
        set((state) => ({
          balanceVisible: !state.balanceVisible,
        }))
      },

      transfer: async (
        fromAccountId: string,
        toAccountId: string,
        amount: number,
        reason: string,
        password: string,
      ) => {
        const { accounts, addTransaction, user } = get()

        // Check KYC status
        if (user?.kycStatus !== "approved") {
          return { success: false, message: "KYC verification required. Please complete your verification first." }
        }

        // Password validation
        if (password !== user?.password) {
          return { success: false, message: "Incorrect password. Transfer denied." }
        }

        const fromAccount = accounts.find((acc) => acc.id === fromAccountId)
        const toAccount = accounts.find((acc) => acc.id === toAccountId)

        if (!fromAccount || !toAccount) {
          return { success: false, message: "Invalid account selection." }
        }

        const serviceCharge = amount * 0.01 // 1% service charge
        const totalDeduction = amount + serviceCharge
        const remainingBalance = fromAccount.balance - totalDeduction

        // Check minimum balance constraint
        if (remainingBalance < (user?.minBalance || 100)) {
          return {
            success: false,
            message: "Insufficient balance after service charge and threshold.",
          }
        }

        // Update account balances
        set((state) => ({
          accounts: state.accounts.map((acc) => {
            if (acc.id === fromAccountId) {
              return { ...acc, balance: acc.balance - totalDeduction }
            }
            if (acc.id === toAccountId) {
              return { ...acc, balance: acc.balance + amount }
            }
            return acc
          }),
        }))

        // Add transaction
        addTransaction({
          type: "transfer",
          fromAccount: fromAccountId,
          toAccount: toAccountId,
          amount,
          currency: fromAccount.currency,
          status: "success",
          reason,
          serviceCharge,
        })

        return { success: true, message: "Transfer completed successfully!" }
      },

      transferToExternal: async (
        fromAccountId: string,
        externalUserId: string,
        amount: number,
        reason: string,
        password: string,
      ) => {
        const { accounts, addTransaction, user, externalUsers } = get()

        // Check KYC status
        if (user?.kycStatus !== "approved") {
          return { success: false, message: "KYC verification required. Please complete your verification first." }
        }

        // Password validation
        if (password !== user?.password) {
          return { success: false, message: "Incorrect password. Transfer denied." }
        }

        const fromAccount = accounts.find((acc) => acc.id === fromAccountId)
        const externalUser = externalUsers.find((user) => user.id === externalUserId)

        if (!fromAccount || !externalUser) {
          return { success: false, message: "Invalid account or recipient selection." }
        }

        const serviceCharge = amount * 0.02 // 2% service charge for external transfers
        const totalDeduction = amount + serviceCharge
        const remainingBalance = fromAccount.balance - totalDeduction

        // Check minimum balance constraint
        if (remainingBalance < (user?.minBalance || 100)) {
          return {
            success: false,
            message: "Insufficient balance after service charge and threshold.",
          }
        }

        // Update account balance
        set((state) => ({
          accounts: state.accounts.map((acc) => {
            if (acc.id === fromAccountId) {
              return { ...acc, balance: acc.balance - totalDeduction }
            }
            return acc
          }),
        }))

        // Add transaction
        addTransaction({
          type: "transfer",
          fromAccount: fromAccountId,
          amount,
          currency: fromAccount.currency,
          status: "success",
          reason: `Transfer to ${externalUser.name} (${externalUser.bankName}) - ${reason}`,
          serviceCharge,
        })

        return { success: true, message: `Transfer to ${externalUser.name} completed successfully!` }
      },
    }),
    {
      name: "wallet-storage",
    },
  ),
)
