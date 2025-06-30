import { useCallback } from "react";
import useSWRMutation from "swr/mutation";
import axiosInstance from "@/lib/axios-Instance";
import { useAuthStore } from "@/store/AuthStore";

interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  createdAt: string;
}

const postWalletFetcher = async (url: string, { arg }: { arg: { userId: string; balance: number; currency: string } }) => {
  try {
    const response = await axiosInstance.post(url, {
      id: crypto.randomUUID(),
      userId: arg.userId,
      balance: arg.balance,
      currency: arg.currency,
      createdAt: new Date().toISOString(),
    });
    return response.data as Wallet;
  } catch (error: any) {
    throw new Error("Failed to create wallet: " + (error.message || "Unknown error"));
  }
};

export const useCreateWallet = () => {
  const { user } = useAuthStore();
  const { trigger, isMutating, error } = useSWRMutation("/wallets", postWalletFetcher, {
    revalidate: false,
    populateCache: false,
    throwOnError: false,
  });

  const createWallet = useCallback(
    async (balance: number, currency: string) => {
      if (!user?.id) {
        throw new Error("User not authenticated. Please log in.");
      }
      try {
        console.log(`useCreateWallet: Creating wallet for user ${user.id} - Balance: ${balance}, Currency: ${currency}`);
        const walletData = await trigger({ userId: user.id, balance, currency });
        console.log(`useCreateWallet: Wallet created - ${JSON.stringify(walletData)}`);
        return walletData;
      } catch (err: any) {
        console.error(`useCreateWallet: Error - ${err.message}`);
        throw new Error(err.message || "Failed to create wallet.");
      }
    },
    [user, trigger]
  );

  return { createWallet, isLoading: isMutating, error };
};