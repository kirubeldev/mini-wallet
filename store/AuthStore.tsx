import { create } from "zustand";

// I have defined the User interface to match the JSON server user structure, including token and kycStatus.
interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  token: string;
  kycStatus:  "not-started" | "approved";
}

// I have created an AuthState interface to manage the current user and token in the Zustand store.
interface AuthState {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
  setToken: (token: string) => void;
}

// I have set up the Zustand store to manage user data, token, and kycStatus in memory for the Mini Wallet System, without persisting to localStorage.
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
setUser: (user: User | null) => set({ user }),
  clearUser: () => set({ user: null }),
  setToken: (token) => set((state) => ({
    user: state.user ? { ...state.user, token } : null,
  })),
}));