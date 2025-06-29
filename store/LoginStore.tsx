import { create } from "zustand";

// I have defined the User interface to match the JSON server.
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  currency: string;
  theme: "light" | "dark";
  profileImage?: string;
  minBalance: number;
  kycStatus: "pending" | "approved" | "rejected";
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
  token?: string;
}

// I have created a Zustand store to manage the authenticated user and token.
interface AuthState {
  user: User | null;
  token: string | null;
  setUser: (user: User | null, token: string | null) => void;
  logout: () => void;
}

export const useLoginAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setUser: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
}));