import { useCallback } from "react";
import useSWRMutation from "swr/mutation";
import axiosInstance from "@/lib/axios-Instance";
import { useLoginAuthStore } from "@/store/LoginStore";

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

// I have created a fetcher function for SWR mutation to get user by email.
const fetcher = async (url: string, { arg }: { arg: string }) => {
  try {
    const response = await axiosInstance.get(`${url}?email=${(arg)}`);
    return response.data as User[];
  } catch (error: any) {
    throw new Error("Failed to fetch user data: " + (error.message || "Unknown error"));
  }
};

// I have created a function to generate a fake token.
const generateFakeToken = () => {
  return `token-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
};

// I have used useSWRMutation to fetch user data and simulate POST /login.
export const useLogin = () => {
  const { setUser } = useLoginAuthStore();
  const { trigger, isMutating, error } = useSWRMutation(
    "/users", // Base key
    fetcher,
    {
      revalidate: false,
      populateCache: false,
      throwOnError: false, // Prevent SWR from throwing uncaught errors
    }
  );

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        // I have used trigger to fetch user data, simulating POST /login.
        const data = await trigger(email);

        if (!data || data.length === 0) {
          throw new Error("User not found");
        }

        const user = data[0];
        if (user.password !== password) {
          throw new Error("Invalid password");
        }

        // I have generated a token and stored it in Zustand store.
        const token = generateFakeToken();
        setUser({ ...user, token }, token);

        return { user: { ...user, token }, kycStatus: user.kycStatus };
      } catch (err: any) {
        console.error("Login error:", err.message);
        throw new Error(err.message || "Login failed. Please try again.");
      }
    },
    [trigger, setUser]
  );

  return { login, isLoading: isMutating, error };
};