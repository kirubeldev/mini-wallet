import { create } from "zustand";

// I have defined the User interface to match the JSON server.
interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  theme: "light" | "dark";
  token?: string;
  password?: string;
  currency?: string;
  profileImage?: string;
  minBalance?: number;
  kycStatus?: "pending" | "approved" | "rejected";
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

// I have defined the AuthStore interface for Zustand state management.
interface AuthStore {
  user: User | null;
  token: string | null;
  setUser: (user: User | null, token?: string) => void;
}

// I have created the Zustand store for authentication.
export const useLoginAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  // I have implemented setUser to update both user and token in the store.
  setUser: (user, token) => set({ user, token: token || user?.token || null }),
}));