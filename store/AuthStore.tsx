import { create } from "zustand";
// In your AuthStore file (or at the top of this file)
interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  password?: string;
  currency: string;
  theme: "light" | "dark";
  profileImage: string;
  kycStatus: "not-started" | "approved";
  token?: string;
}

interface AuthStore {
  user: User | null;
  setUser: (user: User | null) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setUser: (user: User | null) => set({ user }),
  clearUser: () => set({ user: null }),
}));