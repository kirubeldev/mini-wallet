
"use client";

import { useCallback, useState, useEffect, useMemo } from "react";
import axiosInstance from "@/lib/axios-Instance";
import { useAuthStore } from "@/store/AuthStore";
import { v4 as uuidv4 } from "uuid";

interface Wallet {
  id: string;
  walletId: string;
  userId: string;
  accountNumber: string;
  balance: number;
  currency: string;
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
  password: string;
}

interface Transaction {
  id: string;
  userId: string;
  fromWallet?: string;
  toWallet?: string;
  amount: number;
  currency: string;
  serviceCharge: number;
  type: "deposit" | "withdraw" | "transfer";
  status: "success" | "failed" | "not-started";
  reason?: string;
  timestamp: string;
}

interface ExternalUser {
  id: string;
  name: string;
  bankName: string;
}

export const useTransactions = () => {
  const { user } = useAuthStore();
  const userId = useMemo(() => user?.id || null, [user?.id]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [senderWallets, setSenderWallets] = useState<Wallet[]>([]);
  const [senderWalletsError, setSenderWalletsError] = useState<string | null>(null);
  const [isLoadingSenderWallets, setIsLoadingSenderWallets] = useState(false);
  const [usersData, setUsersData] = useState<User[]>([]);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [receiverWallets, setReceiverWallets] = useState<Wallet[]>([]);
  const [receiverWalletsError, setReceiverWalletsError] = useState<string | null>(null);
  const [isLoadingReceiverWallets, setIsLoadingReceiverWallets] = useState(false);
  const [externalUserId, setExternalUserId] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [fetched, setFetched] = useState({ transactions: false, wallets: false, users: false });

  const fetchTransactions = useCallback(async () => {
    if (!userId || isLoadingTransactions || fetched.transactions) {
      console.log("fetchTransactions: Skipping", { userId, isLoading: isLoadingTransactions, fetched: fetched.transactions });
      return;
    }
    setIsLoadingTransactions(true);
    try {
      console.log(`fetchTransactions: Fetching /transactions?userId=${userId}`);
      const response = await axiosInstance.get(`/transactions?userId=${userId}`);
      console.log(`fetchTransactions: Response:`, { status: response.status, data: response.data });
      if (!Array.isArray(response.data)) {
        throw new Error("Invalid transactions data format");
      }
      setTransactions(response.data);
      setTransactionsError(null);
      setFetched((prev) => ({ ...prev, transactions: true }));
    } catch (error: any) {
      console.error(`fetchTransactions: Error:`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      setTransactionsError(error.message || "Failed to fetch transactions");
      setTransactions([]);
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [userId, isLoadingTransactions, fetched.transactions]);

  const fetchSenderWallets = useCallback(async () => {
    if (!userId || isLoadingSenderWallets || fetched.wallets) {
      console.log("fetchSenderWallets: Skipping", { userId, isLoading: isLoadingSenderWallets, fetched: fetched.wallets });
      return;
    }
    setIsLoadingSenderWallets(true);
    try {
      console.log(`fetchSenderWallets: Fetching /wallets?userId=${userId}`);
      const response = await axiosInstance.get(`/wallets?userId=${userId}`);
      console.log(`fetchSenderWallets: Response:`, { status: response.status, data: response.data });
      if (!Array.isArray(response.data)) {
        throw new Error("Invalid wallet data format");
      }
      setSenderWallets(response.data);
      setSenderWalletsError(null);
      setFetched((prev) => ({ ...prev, wallets: true }));
    } catch (error: any) {
      console.error(`fetchSenderWallets: Error:`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      setSenderWalletsError(error.message || "Failed to fetch wallets");
      setSenderWallets([]);
    } finally {
      setIsLoadingSenderWallets(false);
    }
  }, [userId, isLoadingSenderWallets, fetched.wallets]);

  const fetchUsers = useCallback(async () => {
    if (isLoadingUsers || fetched.users) {
      console.log("fetchUsers: Skipping", { isLoading: isLoadingUsers, fetched: fetched.users });
      return;
    }
    setIsLoadingUsers(true);
    try {
      console.log(`fetchUsers: Fetching /users`);
      const response = await axiosInstance.get("/users");
      console.log(`fetchUsers: Response:`, { status: response.status, data: response.data });
      if (!Array.isArray(response.data)) {
        throw new Error("Invalid users data format");
      }
      setUsersData(response.data);
      setUsersError(null);
      setFetched((prev) => ({ ...prev, users: true }));
    } catch (error: any) {
      console.error(`fetchUsers: Error:`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      setUsersError(error.message || "Failed to fetch users");
      setUsersData([]);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [isLoadingUsers, fetched.users]);

  const fetchReceiverWallets = useCallback(async () => {
    if (!externalUserId || isLoadingReceiverWallets) {
      console.log("fetchReceiverWallets: Skipping", { externalUserId, isLoading: isLoadingReceiverWallets });
      return;
    }
    setIsLoadingReceiverWallets(true);
    try {
      console.log(`fetchReceiverWallets: Fetching /wallets?userId=${externalUserId}`);
      const response = await axiosInstance.get(`/wallets?userId=${externalUserId}`);
      console.log(`fetchReceiverWallets: Response:`, { status: response.status, data: response.data });
      if (!Array.isArray(response.data)) {
        throw new Error("Invalid receiver wallets data format");
      }
      setReceiverWallets(response.data);
      setReceiverWalletsError(null);
    } catch (error: any) {
      console.error(`fetchReceiverWallets: Error:`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      setReceiverWalletsError(error.message || "Failed to fetch receiver wallets");
      setReceiverWallets([]);
    } finally {
      setIsLoadingReceiverWallets(false);
    }
  }, [externalUserId, isLoadingReceiverWallets]);

  useEffect(() => {
    if (!userId) {
      console.log("useTransactions: No userId, skipping fetches");
      return;
    }
    setFetched({ transactions: false, wallets: false, users: false });
    fetchTransactions();
    fetchSenderWallets();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (externalUserId) {
      fetchReceiverWallets();
    } else {
      setReceiverWallets([]);
      setReceiverWalletsError(null);
    }
  }, []);

  const getWalletByWalletId = async (walletId: string): Promise<Wallet | null> => {
    if (!walletId) {
      console.error("getWalletByWalletId: Invalid walletId", walletId);
      setToast({ message: "Invalid wallet ID.", type: "error" });
      return null;
    }
    try {
      console.log(`getWalletByWalletId: Fetching /wallets?walletId=${walletId}`);
      const response = await axiosInstance.get(`/wallets?walletId=${walletId}`);
      console.log(`getWalletByWalletId: Response:`, { status: response.status, data: response.data });
      if (!Array.isArray(response.data) || response.data.length === 0) {
        console.error(`getWalletByWalletId: No wallet found for walletId ${walletId}`);
        setToast({ message: `No wallet found for wallet ID ${walletId}.`, type: "error" });
        return null;
      }
      return response.data[0];
    } catch (error: any) {
      console.error(`getWalletByWalletId: Error:`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      setToast({ message: "Failed to fetch wallet.", type: "error" });
      return null;
    }
  };

  const transfer = useCallback(
    async (fromWalletId: string, toWalletId: string, amount: number, reason: string, password: string) => {
      console.log("transfer: Starting", { fromWalletId, toWalletId, amount, reason });
      if (!userId || !user) {
        console.error("transfer: No user");
        setToast({ message: "Please log in.", type: "error" });
        throw new Error("Please log in.");
      }
      if (user.kycStatus !== "approved") {
        console.error("transfer: KYC not approved");
        setToast({ message: "KYC approval required.", type: "error" });
        throw new Error("KYC approval required.");
      }
      if (amount <= 0 || isNaN(amount)) {
        console.error("transfer: Invalid amount", amount);
        setToast({ message: "Amount must be greater than 0.", type: "error" });
        throw new Error("Amount must be greater than 0.");
      }
      if (fromWalletId === toWalletId) {
        console.error("transfer: Same wallet selected", { fromWalletId, toWalletId });
        setToast({ message: "Cannot transfer to the same wallet.", type: "error" });
        throw new Error("Cannot transfer to the same wallet.");
      }
      const fromWallet = senderWallets.find((w) => w.walletId === fromWalletId);
      const toWallet = senderWallets.find((w) => w.walletId === toWalletId);
      if (!fromWallet || !toWallet) {
        console.error("transfer: Invalid wallet", { fromWalletId, toWalletId });
        setToast({ message: "Invalid source or destination wallet.", type: "error" });
        throw new Error("Invalid source or destination wallet.");
      }
      if (fromWallet.userId !== userId || toWallet.userId !== userId) {
        console.error("transfer: Wallet does not belong to user", { fromWalletId, toWalletId, userId });
        setToast({ message: "Wallet does not belong to you.", type: "error" });
        throw new Error("Wallet does not belong to you.");
      }

      try {
        // Verify password
        console.log(`transfer: Fetching /users/${userId}`);
        const userResponse = await axiosInstance.get(`/users/${userId}`);
        console.log(`transfer: User response:`, { status: userResponse.status, data: userResponse.data });
        if (userResponse.data.password !== password) {
          console.error("transfer: Incorrect password");
          setToast({ message: "Incorrect password.", type: "error" });
          throw new Error("Incorrect password.");
        }

        // Fetch wallet data to ensure latest balance
        const fromWalletData = await getWalletByWalletId(fromWalletId);
        const toWalletData = await getWalletByWalletId(toWalletId);
        if (!fromWalletData || !toWalletData) {
          console.error("transfer: Wallet not found", { fromWalletData, toWalletData });
          setToast({ message: "Wallet not found.", type: "error" });
          throw new Error("Wallet not found.");
        }
        if (fromWalletData.balance < amount) {
          console.error("transfer: Insufficient balance", { balance: fromWalletData.balance, amount });
          setToast({ message: "Insufficient balance.", type: "error" });
          throw new Error("Insufficient balance.");
        }

        setIsMutating(true);
        const transaction = {
          id: uuidv4(),
          userId,
          fromWallet: fromWalletId,
          toWallet: toWalletId,
          amount,
          currency: user.currency || "USD",
          serviceCharge: 0,
          type: "transfer",
          status: "success",
          reason,
          timestamp: new Date().toISOString(),
        };
        console.log("transfer: Creating transaction", transaction);
        await axiosInstance.post("/transactions", transaction);
        await axiosInstance.patch(`/wallets/${fromWalletData.id}`, { balance: fromWalletData.balance - amount });
        await axiosInstance.patch(`/wallets/${toWalletData.id}`, { balance: toWalletData.balance + amount });

        setFetched((prev) => ({ ...prev, transactions: false, wallets: false }));
        await Promise.all([fetchTransactions(), fetchSenderWallets()]);
        setToast({ message: `Transferred ${amount} ${user.currency || "USD"} successfully!`, type: "success" });
      } catch (error: any) {
        console.error("transfer: Error", error.message);
        setToast({ message: error.message || "Transfer failed.", type: "error" });
        throw error;
      } finally {
        setIsMutating(false);
      }
    },
    [userId, user, senderWallets, fetchTransactions, fetchSenderWallets]
  );

  const transferToExternal = useCallback(
    async (fromWalletId: string, externalUserId: string, amount: number, reason: string, password: string) => {
      console.log("transferToExternal: Starting", { fromWalletId, externalUserId, amount, reason });
      if (!userId || !user) {
        console.error("transferToExternal: No user");
        setToast({ message: "Please log in.", type: "error" });
        throw new Error("Please log in.");
      }
      if (user.kycStatus !== "approved") {
        console.error("transferToExternal: KYC not approved");
        setToast({ message: "KYC approval required.", type: "error" });
        throw new Error("KYC approval required.");
      }
      if (amount <= 0 || isNaN(amount)) {
        console.error("transferToExternal: Invalid amount", amount);
        setToast({ message: "Amount must be greater than 0.", type: "error" });
        throw new Error("Amount must be greater than 0.");
      }
      const fromWallet = senderWallets.find((w) => w.walletId === fromWalletId);
      if (!fromWallet) {
        console.error("transferToExternal: Invalid fromWallet", fromWalletId);
        setToast({ message: "Invalid source wallet.", type: "error" });
        throw new Error("Invalid source wallet.");
      }
      if (fromWallet.userId !== userId) {
        console.error("transferToExternal: Wallet does not belong to user", { fromWalletId, userId });
        setToast({ message: "Source wallet does not belong to you.", type: "error" });
        throw new Error("Source wallet does not belong to you.");
      }
      if (!receiverWallets.length) {
        console.error("transferToExternal: No receiver wallets");
        setToast({ message: "Recipient has no wallets.", type: "error" });
        throw new Error("Recipient has no wallets.");
      }

      try {
        // Verify password
        console.log(`transferToExternal: Fetching /users/${userId}`);
        const userResponse = await axiosInstance.get(`/users/${userId}`);
        console.log(`transferToExternal: User response:`, { status: userResponse.status, data: userResponse.data });
        if (userResponse.data.password !== password) {
          console.error("transferToExternal: Incorrect password");
          setToast({ message: "Incorrect password.", type: "error" });
          throw new Error("Incorrect password.");
        }

        // Fetch wallet data to ensure latest balance
        const fromWalletData = await getWalletByWalletId(fromWalletId);
        const toWalletData = await getWalletByWalletId(receiverWallets[0].walletId);
        if (!fromWalletData || !toWalletData) {
          console.error("transferToExternal: Wallet not found", { fromWalletData, toWalletData });
          setToast({ message: "Wallet not found.", type: "error" });
          throw new Error("Wallet not found.");
        }
        if (fromWalletData.balance < amount) {
          console.error("transferToExternal: Insufficient balance", { balance: fromWalletData.balance, amount });
          setToast({ message: "Insufficient balance.", type: "error" });
          throw new Error("Insufficient balance.");
        }

        setIsMutating(true);
        const transaction = {
          id: uuidv4(),
          userId,
          fromWallet: fromWalletId,
          toWallet: receiverWallets[0].walletId,
          amount,
          currency: user.currency || "USD",
          serviceCharge: 0,
          type: "transfer",
          status: "success",
          reason,
          timestamp: new Date().toISOString(),
        };
        console.log("transferToExternal: Creating transaction", transaction);
        await axiosInstance.post("/transactions", transaction);
        await axiosInstance.patch(`/wallets/${fromWalletData.id}`, { balance: fromWalletData.balance - amount });
        await axiosInstance.patch(`/wallets/${toWalletData.id}`, { balance: toWalletData.balance + amount });

        setFetched((prev) => ({ ...prev, transactions: false, wallets: false }));
        await Promise.all([fetchTransactions(), fetchSenderWallets(), fetchReceiverWallets()]);
        setToast({ message: `Transferred ${amount} ${user.currency || "USD"} to user successfully!`, type: "success" });
      } catch (error: any) {
        console.error("transferToExternal: Error", error.message);
        setToast({ message: error.message || "Transfer failed.", type: "error" });
        throw error;
      } finally {
        setIsMutating(false);
      }
    },
    [userId, user, senderWallets, receiverWallets, fetchTransactions, fetchSenderWallets, fetchReceiverWallets]
  );

  const externalUsers: ExternalUser[] = useMemo(
    () =>
      usersData
        .filter((u) => u.id !== userId && u.kycStatus === "approved")
        .map((u) => ({
          id: u.id,
          name: `${u.firstname} ${u.lastname}`.trim(),
          bankName: u.email,
        })),
    [usersData, userId]
  );

  return {
    transactions,
    transactionsError,
    isLoadingTransactions,
    senderWallets,
    senderWalletsError,
    isLoadingSenderWallets,
    externalUsers,
    usersError,
    isLoadingUsers,
    receiverWallets,
    receiverWalletsError,
    isLoadingReceiverWallets,
    setExternalUserId,
    transfer,
    transferToExternal,
    isMutating,
    toast,
    setToast,
  };
};
