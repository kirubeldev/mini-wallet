
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

const patchWalletFetcher = async (url: string, { arg }: { arg: { balance: number } }) => {
  const response = await axiosInstance.patch(url, { balance: arg.balance });
  return response.data;
};

export const useWallets = () => {
  const { user } = useAuthStore();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  console.log("useWallets: user =", user);
  console.log("useWallets: user.kycStatus =", user?.kycStatus);

  const { data: walletData, error: walletError, isLoading, mutate } = useSWR(
    user?.id ? `/wallets?userId=${user.id}` : null,
    fetcher,
    { revalidateOnFocus: false, revalidateOnMount: true }
  );

  const { data: usersData, error: usersError } = useSWR("/users", fetcher, {
    revalidateOnFocus: false,
  });

  const { data: selectedUserWallets, error: selectedUserWalletsError } = useSWR(
    (selectedUserId: string) => (selectedUserId ? `/wallets?userId=${selectedUserId}` : null),
    fetcher,
    { revalidateOnFocus: false }
  );

  const { trigger: patchWalletTrigger, isMutating: isPatching } = useSWRMutation(
    (walletId: string) => `/wallets/${walletId}`,
    patchWalletFetcher,
    { throwOnError: false }
  );

  const addWallet = useCallback(
    async (initialBalance: number = 0) => {
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
      if (initialBalance < 0) {
        console.log("addWallet: Initial balance cannot be negative");
        setToast({ message: "Initial balance cannot be negative.", type: "error" });
        throw new Error("Initial balance cannot be negative.");
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
          balance: initialBalance,
          createdAt: new Date().toISOString(),
        });

        const walletResponse = await axiosInstance.post("/wallets", {
          walletId,
          userId: user.id,
          accountNumber,
          balance: initialBalance,
          createdAt: new Date().toISOString(),
        });

        console.log("addWallet: POST response:", walletResponse.data);

        await mutate(); // Revalidate wallet data

        setToast({
          message: `Wallet created successfully with initial balance of ${initialBalance} ${user.currency || "ETB"}!`,
          type: "success",
        });
        return walletResponse.data;
      } catch (error: any) {
        console.log("addWallet: Error during wallet creation:", error.response?.data || error.message);
        setToast({ message: error.message || "Wallet creation failed. Please try again.", type: "error" });
        throw new Error(error.message || "Wallet creation failed. Please try again.");
      }
    },
    [user, mutate]
  );

  const depositToWallet = useCallback(
    async (walletId: string, amount: number) => {
      if (!user?.id) {
        console.log("depositToWallet: No user authenticated");
        setToast({ message: "User not authenticated. Please log in.", type: "error" });
        throw new Error("User not authenticated. Please log in.");
      }
      if (amount <= 0) {
        console.log("depositToWallet: Invalid amount", amount);
        setToast({ message: "Deposit amount must be greater than 0.", type: "error" });
        throw new Error("Deposit amount must be greater than 0.");
      }
      if (!walletData?.find((wallet: Wallet) => wallet.walletId === walletId)) {
        console.log("depositToWallet: Invalid wallet ID", walletId);
        setToast({ message: "Invalid wallet selected.", type: "error" });
        throw new Error("Invalid wallet selected.");
      }

      try {
        console.log(`depositToWallet: Fetching current balance for wallet ${walletId}`);
        const walletResponse = await axiosInstance.get(`/wallets/${walletId}`);
        const currentBalance = walletResponse.data.balance || 0;
        console.log(`depositToWallet: Current balance: ${currentBalance}, adding ${amount}`);

        const response = await patchWalletTrigger({ walletId, balance: currentBalance + amount });
        console.log("depositToWallet: PATCH response:", response);

        await mutate(
          (currentData: Wallet[] | undefined) => {
            if (!currentData) return currentData;
            return currentData.map((wallet) =>
              wallet.walletId === walletId
                ? { ...wallet, balance: response.balance || currentBalance + amount }
                : wallet
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
    [user, patchWalletTrigger, mutate, walletData]
  );

  const transferBetweenWallets = useCallback(
    async (fromWalletId: string, toWalletId: string, amount: number) => {
      if (!user?.id) {
        console.log("transferBetweenWallets: No user authenticated");
        setToast({ message: "User not authenticated. Please log in.", type: "error" });
        throw new Error("User not authenticated. Please log in.");
      }
      if (!Array.isArray(walletData) || walletData.length < 2) {
        console.log("transferBetweenWallets: Not enough wallets", walletData?.length);
        setToast({ message: "Cannot transfer between 1 wallet, only multiple accounts.", type: "error" });
        throw new Error("Cannot transfer between 1 wallet, only multiple accounts.");
      }
      if (fromWalletId === toWalletId) {
        console.log("transferBetweenWallets: Cannot transfer to the same wallet");
        setToast({ message: "Cannot transfer to the same wallet.", type: "error" });
        throw new Error("Cannot transfer to the same wallet.");
      }
      if (amount <= 0) {
        console.log("transferBetweenWallets: Invalid amount", amount);
        setToast({ message: "Transfer amount must be greater than 0.", type: "error" });
        throw new Error("Transfer amount must be greater than 0.");
      }
      const fromWallet = walletData?.find((wallet: Wallet) => wallet.walletId === fromWalletId);
      const toWallet = walletData?.find((wallet: Wallet) => wallet.walletId === toWalletId);
      if (!fromWallet || !toWallet) {
        console.log("transferBetweenWallets: Invalid wallet IDs", { fromWalletId, toWalletId });
        setToast({ message: "Invalid source or destination wallet.", type: "error" });
        throw new Error("Invalid source or destination wallet.");
      }
      if (fromWallet.userId !== user.id || toWallet.userId !== user.id) {
        console.log("transferBetweenWallets: Wallets do not belong to user", user.id);
        setToast({ message: "Can only transfer between your own wallets.", type: "error" });
        throw new Error("Can only transfer between your own wallets.");
      }
      if (fromWallet.balance < amount) {
        console.log("transferBetweenWallets: Insufficient balance", fromWallet.balance, amount);
        setToast({ message: "Insufficient balance in source wallet.", type: "error" });
        throw new Error("Insufficient balance in source wallet.");
      }

      try {
        console.log(
          `transferBetweenWallets: Fetching balances for wallets ${fromWalletId} and ${toWalletId}`
        );
        const [fromWalletResponse, toWalletResponse] = await Promise.all([
          axiosInstance.get(`/wallets/${fromWalletId}`),
          axiosInstance.get(`/wallets/${toWalletId}`),
        ]);
        const fromBalance = fromWalletResponse.data.balance || 0;
        const toBalance = toWalletResponse.data.balance || 0;

        console.log(
          `transferBetweenWallets: Patching wallets with fromBalance: ${fromBalance - amount}, toBalance: ${toBalance + amount}`
        );
        const [fromPatchResponse, toPatchResponse] = await Promise.all([
          patchWalletTrigger({ walletId: fromWalletId, balance: fromBalance - amount }),
          patchWalletTrigger({ walletId: toWalletId, balance: toBalance + amount }),
        ]);

        await mutate(
          (currentData: Wallet[] | undefined) => {
            if (!currentData) return currentData;
            return currentData.map((wallet) =>
              wallet.walletId === fromWalletId
                ? { ...wallet, balance: fromPatchResponse.balance || fromBalance - amount }
                : wallet.walletId === toWalletId
                ? { ...wallet, balance: toPatchResponse.balance || toBalance + amount }
                : wallet
            );
          },
          { revalidate: true }
        );

        setToast({
          message: `Successfully transferred ${amount} ${user.currency || "ETB"} from wallet ${fromWallet.accountNumber.slice(0, 8)} to ${toWallet.accountNumber.slice(0, 8)}`,
          type: "success",
        });
        return { fromWallet: fromPatchResponse, toWallet: toPatchResponse };
      } catch (error: any) {
        console.log("transferBetweenWallets: Error during transfer:", error.response?.data || error.message);
        setToast({ message: error.message || "Transfer failed. Please try again.", type: "error" });
        throw new Error(error.message || "Transfer failed. Please try again.");
      }
    },
    [user, patchWalletTrigger, mutate, walletData]
  );

  const transferToUserWallet = useCallback(
    async (fromWalletId: string, toUserId: string, toWalletId: string, amount: number) => {
      if (!user?.id) {
        console.log("transferToUserWallet: No user authenticated");
        setToast({ message: "User not authenticated. Please log in.", type: "error" });
        throw new Error("User not authenticated. Please log in.");
      }
      if (amount <= 0) {
        console.log("transferToUserWallet: Invalid amount", amount);
        setToast({ message: "Transfer amount must be greater than 0.", type: "error" });
        throw new Error("Transfer amount must be greater than 0.");
      }
      if (!walletData?.find((wallet: Wallet) => wallet.walletId === fromWalletId)) {
        console.log("transferToUserWallet: Invalid source wallet ID", fromWalletId);
        setToast({ message: "Invalid source wallet selected.", type: "error" });
        throw new Error("Invalid source wallet selected.");
      }
      const toUserWallets: Wallet[] | undefined = selectedUserWallets?.[toUserId];
      if (!toUserWallets?.find((wallet: Wallet) => wallet.walletId === toWalletId)) {
        console.log("transferToUserWallet: Invalid destination wallet ID", toWalletId);
        setToast({ message: "Invalid destination wallet selected.", type: "error" });
        throw new Error("Invalid destination wallet selected.");
      }
      const fromWallet = walletData?.find((wallet: Wallet) => wallet.walletId === fromWalletId);
      if (fromWallet?.balance < amount) {
        console.log("transferToUserWallet: Insufficient balance", fromWallet.balance, amount);
        setToast({ message: "Insufficient balance in source wallet.", type: "error" });
        throw new Error("Insufficient balance in source wallet.");
      }
      if (toUserId === user.id) {
        console.log("transferToUserWallet: Use intra-user transfer for own wallets");
        setToast({ message: "Use intra-user transfer for your own wallets.", type: "error" });
        throw new Error("Use intra-user transfer for your own wallets.");
      }

      try {
        console.log(
          `transferToUserWallet: Fetching balances for wallets ${fromWalletId} (user ${user.id}) and ${toWalletId} (user ${toUserId})`
        );
        const [fromWalletResponse, toWalletResponse] = await Promise.all([
          axiosInstance.get(`/wallets/${fromWalletId}`),
          axiosInstance.get(`/wallets/${toWalletId}`),
        ]);
        const fromBalance = fromWalletResponse.data.balance || 0;
        const toBalance = toWalletResponse.data.balance || 0;

        console.log(
          `transferToUserWallet: Patching wallets with fromBalance: ${fromBalance - amount}, toBalance: ${toBalance + amount}`
        );
        const [fromPatchResponse, toPatchResponse] = await Promise.all([
          patchWalletTrigger({ walletId: fromWalletId, balance: fromBalance - amount }),
          patchWalletTrigger({ walletId: toWalletId, balance: toBalance + amount }),
        ]);

        await mutate(
          (currentData: Wallet[] | undefined) => {
            if (!currentData) return currentData;
            return currentData.map((wallet) =>
              wallet.walletId === fromWalletId
                ? { ...wallet, balance: fromPatchResponse.balance || fromBalance - amount }
                : wallet
            );
          },
          { revalidate: true }
        );

        setToast({
          message: `Successfully transferred ${amount} ${user.currency || "ETB"} to user ${toUserId}'s wallet ${toWalletResponse.data.accountNumber.slice(0, 8)}`,
          type: "success",
        });
        return { fromWallet: fromPatchResponse, toWallet: toPatchResponse };
      } catch (error: any) {
        console.log("transferToUserWallet: Error during transfer:", error.response?.data || error.message);
        setToast({ message: error.message || "Transfer failed. Please try again.", type: "error" });
        throw new Error(error.message || "Transfer failed. Please try again.");
      }
    },
    [user, patchWalletTrigger, mutate, walletData, selectedUserWallets]
  );

  return {
    addWallet,
    depositToWallet,
    transferBetweenWallets,
    transferToUserWallet,
    walletData,
    walletError,
    isLoading,
    isPatching,
    toast,
    setToast,
    usersData,
    usersError,
    selectedUserWallets,
    selectedUserWalletsError,
  };
};
