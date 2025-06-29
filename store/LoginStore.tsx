import { create } from "zustand";

// I have defined the User interface here to match the registration form and JSON server user structure, including a token for authentication.
interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  token: string;
}

// I have created an AuthState interface here to manage the current user and token in the Zustand store.
interface AuthState {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
  setToken: (token: string) => void;
}

// I have set up the Zustand store here to manage the user data and token in memory for the Mini Wallet System, without persisting to localStorage.
export const useLoginAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
  setToken: (token) => set((state) => ({
    user: state.user ? { ...state.user, token } : null,
  })),
}));


