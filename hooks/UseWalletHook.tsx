// @/hooks/UseWalletHook.ts
"use client";

import { useCallback, useState, useEffect } from "react";
import axiosInstance from "@/lib/axios-Instance";
import { useAuthStore } from "@/store/AuthStore";
import { v4 as uuidv4 } from "uuid";

interface Wallet {
  id: string;
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
  currency: string;
  theme: "light" | "dark";
  profileImage?: string;
  kycStatus: "not-started" | "approved";
  token?: string;
}

export const useWallets = (transferToUserId?: string) => {
  const { user } = useAuthStore();
  const [walletData, setWalletData] = useState<Wallet[]>([]);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [usersData, setUsersData] = useState<User[]>([]);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [selectedUserWallets, setSelectedUserWallets] = useState<Wallet[]>([]);
  const [selectedUserWalletsError, setSelectedUserWalletsError] = useState<string | null>(null);
  const [isPatching, setIsPatching] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Fetch wallets for the current user
  const fetchWallets = useCallback(async () => {
    if (!user?.id) {
      console.log("fetchWallets: No user ID, skipping fetch");
      setWalletData([]);
      return;
    }
    setIsLoading(true);
    try {
      console.log(`fetchWallets: Fetching /wallets?userId=${user.id}`);
      const response = await axiosInstance.get(`/wallets?userId=${user.id}`);
      console.log(`fetchWallets: Response:`, response.data);
      setWalletData(response.data || []);
      setWalletError(null);
    } catch (error: any) {
      console.error(`fetchWallets: Error:`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      setWalletError(error.message || "Failed to fetch wallets");
      setWalletData([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    setIsUsersLoading(true);
    try {
      console.log(`fetchUsers: Fetching /users`);
      const response = await axiosInstance.get("/users");
      console.log(`fetchUsers: Response:`, response.data);
      setUsersData(response.data || []);
      setUsersError(null);
    } catch (error: any) {
      console.error(`fetchUsers: Error:`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      setUsersError(error.message || "Failed to fetch users");
      setUsersData([]);
    } finally {
      setIsUsersLoading(false);
    }
  }, []);

  // Fetch wallets for another user (for transfer to user)
  const fetchSelectedUserWallets = useCallback(async () => {
    if (!transferToUserId) {
      console.log("fetchSelectedUserWallets: No transferToUserId, skipping fetch");
      setSelectedUserWallets([]);
      return;
    }
    try {
      console.log(`fetchSelectedUserWallets: Fetching /wallets?userId=${transferToUserId}`);
      const response = await axiosInstance.get(`/wallets?userId=${transferToUserId}`);
      console.log(`fetchSelectedUserWallets: Response:`, response.data);
      setSelectedUserWallets(response.data || []);
      setSelectedUserWalletsError(null);
    } catch (error: any) {
      console.error(`fetchSelectedUserWallets: Error:`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      setSelectedUserWalletsError(error.message || "Failed to fetch user wallets");
      setSelectedUserWallets([]);
    }
  }, [transferToUserId]);

  // Fetch data on mount or when user changes
  useEffect(() => {
    fetchWallets();
    fetchUsers();
  }, [fetchWallets, fetchUsers]);

  // Fetch selected user wallets when transferToUserId changes
  useEffect(() => {
    fetchSelectedUserWallets();
  }, [fetchSelectedUserWallets]);

  const getWalletIdByWalletId = async (walletId: string): Promise<string | null> => {
    if (!walletId) {
      console.error("getWalletIdByWalletId: Invalid walletId provided", walletId);
      setToast({ message: "Invalid wallet ID.", type: "error" });
      return null;
    }
    try {
      console.log(`getWalletIdByWalletId: Fetching walletId ${walletId}`);
      const response = await axiosInstance.get(`/wallets?walletId=${walletId}`);
      console.log(`getWalletIdByWalletId: Response for walletId ${walletId}:`, response.data);
      if (!Array.isArray(response.data) || response.data.length === 0) {
        console.error(`getWalletIdByWalletId: No wallet found for walletId ${walletId}`);
        setToast({ message: `No wallet found for walletId ${walletId}.`, type: "error" });
        return null;
      }
      const wallet = response.data[0];
      if (!wallet?.id) {
        console.error(`getWalletIdByWalletId: Wallet has no id for walletId ${walletId}`, wallet);
        setToast({ message: "Wallet ID not found in response.", type: "error" });
        return null;
      }
      console.log(`getWalletIdByWalletId: Found id ${wallet.id} for walletId ${walletId}`);
      return wallet.id;
    } catch (error: any) {
      console.error(`getWalletIdByWalletId: Error for walletId ${walletId}:`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      setToast({ message: "Failed to fetch wallet ID.", type: "error" });
      return null;
    }
  };

  const addWallet = useCallback(
    async (initialBalance: number = 0) => {
      if (!user?.id) {
        console.error("addWallet: No user authenticated");
        setToast({ message: "User not authenticated. Please log in.", type: "error" });
        throw new Error("User not authenticated. Please log in.");
      }
      if (user.kycStatus !== "approved") {
        console.error("addWallet: KYC not approved for user", user.id);
        setToast({ message: "KYC approval required to create a wallet.", type: "error" });
        throw new Error("KYC approval required to create a wallet.");
      }
      if (initialBalance < 0) {
        console.error("addWallet: Initial balance cannot be negative");
        setToast({ message: "Initial balance cannot be negative.", type: "error" });
        throw new Error("Initial balance cannot be negative.");
      }

      try {
        const walletId = uuidv4();
        const accountNumber = uuidv4();
        console.log("addWallet: Sending POST to /wallets with data:", {
          id: uuidv4(),
          walletId,
          userId: user.id,
          accountNumber,
          balance: initialBalance,
          createdAt: new Date().toISOString(),
        });

        const response = await axiosInstance.post("/wallets", {
          id: uuidv4(),
          walletId,
          userId: user.id,
          accountNumber,
          balance: initialBalance,
          createdAt: new Date().toISOString(),
        });

        console.log("addWallet: POST response:", response.data);

        // Refresh wallet data
        await fetchWallets();
        setToast({
          message: `Wallet created successfully with initial balance of ${initialBalance} ${user.currency || "ETB"}!`,
          type: "success",
        });
        return response.data;
      } catch (error: any) {
        console.error("addWallet: Error during wallet creation:", {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        setToast({ message: error.message || "Wallet creation failed. Please try again.", type: "error" });
        throw new Error(error.message || "Wallet creation failed. Please try again.");
      }
    },
    [user, fetchWallets]
  );

  const depositToWallet = useCallback(
    async (walletId: string, amount: number) => {
      console.log("depositToWallet: Starting with", { walletId, amount });
      if (!user?.id) {
        console.error("depositToWallet: No user authenticated");
        setToast({ message: "User not authenticated. Please log in.", type: "error" });
        throw new Error("User not authenticated. Please log in.");
      }
      if (user.kycStatus !== "approved") {
        console.error("depositToWallet: KYC not approved for user", user.id);
        setToast({ message: "KYC approval required to deposit.", type: "error" });
        throw new Error("KYC approval required to deposit.");
      }
      if (amount <= 0) {
        console.error("depositToWallet: Invalid amount", amount);
        setToast({ message: "Deposit amount must be greater than 0.", type: "error" });
        throw new Error("Deposit amount must be greater than 0.");
      }
      if (!walletData.find((wallet: Wallet) => wallet.walletId === walletId)) {
        console.error("depositToWallet: Invalid wallet ID or walletData not loaded", walletId, walletData);
        setToast({ message: "Invalid wallet selected.", type: "error" });
        throw new Error("Invalid wallet selected.");
      }

      try {
        console.log(`depositToWallet: Fetching wallet ID for walletId ${walletId}`);
        const dbWalletId = await getWalletIdByWalletId(walletId);
        if (!dbWalletId) {
          console.error("depositToWallet: Wallet not found for walletId", walletId);
          setToast({ message: "Wallet not found.", type: "error" });
          throw new Error("Wallet not found.");
        }

        console.log(`depositToWallet: Fetching current balance for wallet ${dbWalletId}`);
        const walletResponse = await axiosInstance.get(`/wallets/${dbWalletId}`);
        console.log(`depositToWallet: Response for wallet ${dbWalletId}:`, walletResponse.data);

        if (!walletResponse.data || typeof walletResponse.data.balance === "undefined") {
          console.error("depositToWallet: Invalid wallet data", walletResponse.data);
          setToast({ message: "Invalid wallet data received.", type: "error" });
          throw new Error("Invalid wallet data received.");
        }

        const currentBalance = Number(walletResponse.data.balance) || 0;
        console.log(`depositToWallet: Current balance: ${currentBalance}, adding ${amount}`);

        setIsPatching(true);
        const patchResponse = await axiosInstance.patch(`/wallets/${dbWalletId}`, { balance: currentBalance + amount });
        console.log("depositToWallet: PATCH response:", patchResponse.data);

        await fetchWallets();
        setToast({
          message: `Deposited ${amount} ${user.currency || "ETB"} to wallet successfully!`,
          type: "success",
        });
        return patchResponse.data;
      } catch (error: any) {
        console.error("depositToWallet: Error during deposit:", {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        setToast({ message: error.message || "Deposit failed. Please try again.", type: "error" });
        throw new Error(error.message || "Deposit failed. Please try again.");
      } finally {
        setIsPatching(false);
      }
    },
    [user, walletData, fetchWallets]
  );

  const transferBetweenWallets = useCallback(
    async (fromWalletId: string, toWalletId: string, amount: number) => {
      console.log("transferBetweenWallets: Starting with", { fromWalletId, toWalletId, amount });
      if (!user?.id) {
        console.error("transferBetweenWallets: No user authenticated");
        setToast({ message: "User not authenticated. Please log in.", type: "error" });
        throw new Error("User not authenticated. Please log in.");
      }
      if (user.kycStatus !== "approved") {
        console.error("transferBetweenWallets: KYC not approved for user", user.id);
        setToast({ message: "KYC approval required to transfer.", type: "error" });
        throw new Error("KYC approval required to transfer.");
      }
      if (amount <= 0) {
        console.error("transferBetweenWallets: Invalid amount", amount);
        setToast({ message: "Transfer amount must be greater than 0.", type: "error" });
        throw new Error("Transfer amount must be greater than 0.");
      }
      if (!walletData.find((wallet: Wallet) => wallet.walletId === fromWalletId)) {
        console.error("transferBetweenWallets: Invalid fromWallet ID", fromWalletId, walletData);
        setToast({ message: "Invalid source wallet selected.", type: "error" });
        throw new Error("Invalid source wallet selected.");
      }
      if (!walletData.find((wallet: Wallet) => wallet.walletId === toWalletId)) {
        console.error("transferBetweenWallets: Invalid toWallet ID", toWalletId, walletData);
        setToast({ message: "Invalid destination wallet selected.", type: "error" });
        throw new Error("Invalid destination wallet selected.");
      }

      try {
        console.log(`transferBetweenWallets: Fetching wallet IDs for fromWalletId ${fromWalletId} and toWalletId ${toWalletId}`);
        const fromDbWalletId = await getWalletIdByWalletId(fromWalletId);
        const toDbWalletId = await getWalletIdByWalletId(toWalletId);
        if (!fromDbWalletId || !toDbWalletId) {
          console.error("transferBetweenWallets: Wallet not found", { fromDbWalletId, toDbWalletId });
          setToast({ message: "One or both wallets not found.", type: "error" });
          throw new Error("One or both wallets not found.");
        }

        console.log(`transferBetweenWallets: Fetching current balances`);
        const fromWalletResponse = await axiosInstance.get(`/wallets/${fromDbWalletId}`);
        const toWalletResponse = await axiosInstance.get(`/wallets/${toDbWalletId}`);
        console.log(`transferBetweenWallets: Responses`, {
          fromWallet: fromWalletResponse.data,
          toWallet: toWalletResponse.data,
        });

        if (!fromWalletResponse.data || typeof fromWalletResponse.data.balance === "undefined") {
          console.error("transferBetweenWallets: Invalid fromWallet data", fromWalletResponse.data);
          setToast({ message: "Invalid source wallet data.", type: "error" });
          throw new Error("Invalid source wallet data.");
        }
        if (!toWalletResponse.data || typeof toWalletResponse.data.balance === "undefined") {
          console.error("transferBetweenWallets: Invalid toWallet data", toWalletResponse.data);
          setToast({ message: "Invalid destination wallet data.", type: "error" });
          throw new Error("Invalid destination wallet data.");
        }

        const fromBalance = Number(fromWalletResponse.data.balance) || 0;
        const toBalance = Number(toWalletResponse.data.balance) || 0;
        if (fromBalance < amount) {
          console.error("transferBetweenWallets: Insufficient balance", { fromBalance, amount });
          setToast({ message: "Insufficient balance in source wallet.", type: "error" });
          throw new Error("Insufficient balance in source wallet.");
        }

        console.log(`transferBetweenWallets: Transferring ${amount} from ${fromDbWalletId} to ${toDbWalletId}`);
        setIsPatching(true);
        const fromPatchResponse = await axiosInstance.patch(`/wallets/${fromDbWalletId}`, { balance: fromBalance - amount });
        const toPatchResponse = await axiosInstance.patch(`/wallets/${toDbWalletId}`, { balance: toBalance + amount });
        console.log("transferBetweenWallets: PATCH responses:", { fromPatchResponse, toPatchResponse });

        await fetchWallets();
        setToast({
          message: `Transferred ${amount} ${user.currency || "ETB"} between wallets successfully!`,
          type: "success",
        });
        return { fromPatchResponse, toPatchResponse };
      } catch (error: any) {
        console.error("transferBetweenWallets: Error during transfer:", {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        setToast({ message: error.message || "Transfer failed. Please try again.", type: "error" });
        throw new Error(error.message || "Transfer failed. Please try again.");
      } finally {
        setIsPatching(false);
      }
    },
    [user, walletData, fetchWallets]
  );

  const transferToUserWallet = useCallback(
    async (fromWalletId: string, toUserId: string, toWalletId: string, amount: number) => {
      console.log("transferToUserWallet: Starting with", { fromWalletId, toUserId, toWalletId, amount });
      if (!user?.id) {
        console.error("transferToUserWallet: No user authenticated");
        setToast({ message: "User not authenticated. Please log in.", type: "error" });
        throw new Error("User not authenticated. Please log in.");
      }
      if (user.KycStatus !== "approved") {
        console.error("transferToUserWallet: KYC not approved for user", user.id);
        setToast({ message: "KYC approval required to transfer.", type: "error" });
        throw new Error("KYC approval required to transfer.");
      }
      if (amount <= 0) {
        console.error("transferToUserWallet: Invalid amount", amount);
        setToast({ message: "Transfer amount must be greater than 0.", type: "error" });
        throw new Error("Transfer amount must be greater than 0.");
      }
      if (!walletData.find((wallet: Wallet) => wallet.walletId === fromWalletId)) {
        console.error("transferToUserWallet: Invalid fromWallet ID", fromWalletId, walletData);
        setToast({ message: "Invalid source wallet selected.", type: "error" });
        throw new Error("Invalid source wallet selected.");
      }
      if (!selectedUserWallets.find((wallet: Wallet) => wallet.walletId === toWalletId)) {
        console.error("transferToUserWallet: Invalid toWallet ID", toWalletId, selectedUserWallets);
        setToast({ message: "Invalid destination wallet selected.", type: "error" });
        throw new Error("Invalid destination wallet selected.");
      }

      try {
        console.log(`transferToUserWallet: Fetching wallet IDs for fromWalletId ${fromWalletId} and toWalletId ${toWalletId}`);
        const fromDbWalletId = await getWalletIdByWalletId(fromWalletId);
        const toDbWalletId = await getWalletIdByWalletId(toWalletId);
        if (!fromDbWalletId || !toDbWalletId) {
          console.error("transferToUserWallet: Wallet not found", { fromDbWalletId, toDbWalletId });
          setToast({ message: "One or both wallets not found.", type: "error" });
          throw new Error("One or both wallets not found.");
        }

        console.log(`transferToUserWallet: Fetching current balances`);
        const fromWalletResponse = await axiosInstance.get(`/wallets/${fromDbWalletId}`);
        const toWalletResponse = await axiosInstance.get(`/wallets/${toDbWalletId}`);
        console.log(`transferToUserWallet: Responses`, {
          fromWallet: fromWalletResponse.data,
          toWallet: toWalletResponse.data,
        });

        if (!fromWalletResponse.data || typeof fromWalletResponse.data.balance === "undefined") {
          console.error("transferToUserWallet: Invalid fromWallet data", fromWalletResponse.data);
          setToast({ message: "Invalid source wallet data.", type: "error" });
          throw new Error("Invalid source wallet data.");
        }
        if (!toWalletResponse.data || typeof toWalletResponse.data.balance === "undefined") {
          console.error("transferToUserWallet: Invalid toWallet data", toWalletResponse.data);
          setToast({ message: "Invalid destination wallet data.", type: "error" });
          throw new Error("Invalid destination wallet data.");
        }

        const fromBalance = Number(fromWalletResponse.data.balance) || 0;
        const toBalance = Number(toWalletResponse.data.balance) || 0;
        if (fromBalance < amount) {
          console.error("transferToUserWallet: Insufficient balance", { fromBalance, amount });
          setToast({ message: "Insufficient balance in source wallet.", type: "error" });
          throw new Error("Insufficient balance in source wallet.");
        }

        console.log(`transferToUserWallet: Transferring ${amount} from ${fromDbWalletId} to ${toDbWalletId}`);
        setIsPatching(true);
        const fromPatchResponse = await axiosInstance.patch(`/wallets/${fromDbWalletId}`, { balance: fromBalance - amount });
        const toPatchResponse = await axiosInstance.patch(`/wallets/${toDbWalletId}`, { balance: toBalance + amount });
        console.log("transferToUserWallet: PATCH responses:", { fromPatchResponse, toPatchResponse });

        await fetchWallets();
        setToast({
          message: `Transferred ${amount} ${user.currency || "ETB"} to user wallet successfully!`,
          type: "success",
        });
        return { fromPatchResponse, toPatchResponse };
      } catch (error: any) {
        console.error("transferToUserWallet: Error during transfer:", {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        setToast({ message: error.message || "Transfer failed. Please try again.", type: "error" });
        throw new Error(error.message || "Transfer failed. Please try again.");
      } finally {
        setIsPatching(false);
      }
    },
    [user, walletData, selectedUserWallets, fetchWallets]
  );

  return {
    walletData,
    walletError,
    isLoading,
    addWallet,
    depositToWallet,
    transferBetweenWallets,
    transferToUserWallet,
    usersData,
    usersError,
    isUsersLoading,
    selectedUserWallets,
    selectedUserWalletsError,
    isPatching,
    toast,
    setToast,
  };
};