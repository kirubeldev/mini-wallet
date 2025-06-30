
import { useCallback, useState } from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import axiosInstance from "@/lib/axios-Instance";
import { useAuthStore } from "@/store/AuthStore";
import { v4 as uuidv4 } from "uuid";

interface Wallet {
  walletId: string;
  userId: string;
  accountNumber: string;
  balance: number;
  createdAt: string;
}

interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  password?: string;
  currency: string;
  theme: "light" | "dark";
  profileImage?: string;
  kycStatus: "not-started" | "approved";
  token?: string;
}

const fetcher = async (url: string) => {
  const response = await axiosInstance.get(url);
  return response.data;
};

const depositFetcher = async (url: string, { arg }: { arg: { amount: number } }) => {
  const response = await axiosInstance.post(url, { amount });
  return response.data;
};

export const useWallets = () => {
  const { user } = useAuthStore();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: walletData, error: walletError, isLoading, mutate } = useSWR(
    user?.id ? `/wallets?userId=${user.id}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { trigger: depositTrigger, isMutating: isDepositing } = useSWRMutation(
    (walletId: string) => `/wallets/${walletId}/deposit`,
    depositFetcher,
    { throwOnError: false }
  );

  const addWallet = useCallback(async () => {
    if (!user?.id) {
      console.log("addWallet: No user authenticated");
      setToast({ message: "User not authenticated. Please log in.", type: "error" });
      throw new Error("User not authenticated. Please log in.");
    }
    if (user.kycStatus !== "approved") {
      console.log("addWallet: KYC not approved for user", user.id);
      setToast({ message: "KYC approval required to create a wallet.", type: "error" });
      throw new Error("KYC approval required to create a wallet.");
    }

    try {
      const walletId = uuidv4();
      const accountNumber = uuidv4();

      const checkAccountResponse = await axiosInstance.get(`/wallets?accountNumber=${accountNumber}`);
      if (checkAccountResponse.data.length > 0) {
        console.log("addWallet: Account number already exists:", accountNumber);
        setToast({ message: "Account number already exists. Please try again.", type: "error" });
        throw new Error("Account number already exists. Please try again.");
      }

      console.log("addWallet: Sending POST to /wallets with data:", {
        walletId,
        userId: user.id,
        accountNumber,
        balance: 0,
        createdAt: new Date().toISOString(),
      });

      const walletResponse = await axiosInstance.post("/wallets", {
        walletId,
        userId: user.id,
        accountNumber,
        balance: 0,
        createdAt: new Date().toISOString(),
      });

      console.log("addWallet: POST response:", walletResponse.data);

      // Revalidate wallet data to ensure new wallet appears
      await mutate();

      setToast({ message: "Wallet created successfully!", type: "success" });
      return walletResponse.data;
    } catch (error: any) {
      console.log("addWallet: Error during wallet creation:", error.response?.data || error.message);
      setToast({ message: error.message || "Wallet creation failed. Please try again.", type: "error" });
      throw new Error(error.message || "Wallet creation failed. Please try again.");
    }
  }, [user, mutate]);

  const depositToWallet = useCallback(
    async (walletId: string, amount: number) => {
      if (!user?.id) {
        setToast({ message: "User not authenticated. Please log in.", type: "error" });
        throw new Error("User not authenticated. Please log in.");
      }
      if (amount <= 0) {
        setToast({ message: "Deposit amount must be greater than 0.", type: "error" });
        throw new Error("Deposit amount must be greater than 0.");
      }

      try {
        console.log(`depositToWallet: Depositing ${amount} to wallet ${walletId}`);
        const response = await depositTrigger({ walletId, amount });

        // Optimistically update wallet data
        await mutate(
          (currentData: Wallet[] | undefined) => {
            if (!currentData) return currentData;
            return currentData.map((wallet) =>
              wallet.walletId === walletId ? { ...wallet, balance: wallet.balance + amount } : wallet
            );
          },
          { revalidate: true }
        );

        setToast({ message: `Successfully deposited ${amount} ${user.currency || "ETB"}`, type: "success" });
        return response;
      } catch (error: any) {
        console.log("depositToWallet: Error during deposit:", error.response?.data || error.message);
        setToast({ message: error.message || "Deposit failed. Please try again.", type: "error" });
        throw new Error(error.message || "Deposit failed. Please try again.");
      }
    },
    [user, depositTrigger, mutate]
  );

  return { addWallet, depositToWallet, walletData, walletError, isLoading, isDepositing, toast, setToast };
};
