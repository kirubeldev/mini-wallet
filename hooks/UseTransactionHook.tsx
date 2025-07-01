import { useCallback, useState, useMemo } from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import axiosInstance from "@/lib/axios-Instance";
import { useAuthStore } from "@/store/AuthStore";
import { v4 as uuidv4 } from "uuid";

interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  currency: string;
  theme: string;
  profileImage: string;
  kycStatus: "not-started" | "approved";
  kycData: null | object;
  token: string;
  createdAt: string;
}

interface Wallet {
  id: string;
  walletId: string;
  userId: string;
  accountNumber: string;
  balance: number;
  currency: string;
  createdAt: string;
}

interface Transaction {
  id: string;
  userId: string;
  fromWallet: string;
  toWallet: string;
  amount: number;
  currency: string;
  serviceCharge: number;
  type: string;
  status: string;
  reason: string;
  timestamp: string;
}

interface ExternalUser {
  id: string;
  name: string;
  bankName: string;
  profileImage: string;
  kycStatus: string;
}

interface Toast {
  message: string;
  type: "success" | "error";
}

const fetcher = async (url: string) => {
  try {
    const response = await axiosInstance.get(url);
    const data = response.data;
    return Array.isArray(data) ? data : [data];
  } catch (error: any) {
    throw new Error("Failed to fetch data");
  }
};

const fetchWalletsByUserId = async (url: string, { arg }: { arg: string }) => {
  try {
    const response = await axiosInstance.get(`${url}?userId=${arg}`);
    return response.data as Wallet[];
  } catch (error: any) {
    throw new Error("Failed to fetch wallets");
  }
};

const fetchTransactionsByUserId = async (url: string, { arg }: { arg: string }) => {
  try {
    const response = await axiosInstance.get("/wallets");
    const wallets = response.data as Wallet[];
    const userWalletIds = wallets.filter((w) => w.userId === arg).map((w) => w.walletId);
    const transactionsResponse = await axiosInstance.get("/transactions");
    const transactions = transactionsResponse.data as Transaction[];
    return transactions.filter(
      (t) => userWalletIds.includes(t.fromWallet) || userWalletIds.includes(t.toWallet)
    );
  } catch (error: any) {
    throw new Error("Failed to fetch transactions");
  }
};

const updateWalletBalance = async (walletId: string, newBalance: number) => {
  try {
    await axiosInstance.patch(`/wallets/${walletId}`, { balance: newBalance });
  } catch (error: any) {
    throw new Error("Failed to update wallet balance");
  }
};

const transferFetcher = async (
  url: string,
  { arg }: {
    arg: {
      fromWallet: string;
      toWallet: string;
      amount: number;
      reason: string;
      userId: string;
      password: string;
      type?: string;
    };
  }
) => {
  const { fromWallet, toWallet, amount, reason, userId, password, type = "transfer" } = arg;

  const userResponse = await axiosInstance.get(`/users/${userId}`);
  const user = userResponse.data as User;
  if (user.password !== password) {
    throw new Error("Incorrect password");
  }

  const walletsResponse = await axiosInstance.get("/wallets");
  const wallets = walletsResponse.data as Wallet[];
  const fromWalletData = wallets.find((w) => w.walletId === fromWallet);
  const toWalletData = wallets.find((w) => w.walletId === toWallet);

  if (!fromWalletData || !toWalletData) {
    throw new Error("Invalid wallet IDs");
  }

  if (fromWalletData.userId !== userId) {
    throw new Error("Unauthorized: Sender wallet does not belong to user");
  }

  const serviceCharge = amount * 0.002;
  const totalDeduction = amount + serviceCharge;

  if (fromWalletData.balance < totalDeduction) {
    throw new Error("Insufficient balance");
  }

  await updateWalletBalance(fromWalletData.id, fromWalletData.balance - totalDeduction);
  await updateWalletBalance(toWalletData.id, toWalletData.balance + amount);

  const response = await axiosInstance.post(url, {
    id: `tx-${uuidv4()}`,
    userId,
    fromWallet,
    toWallet,
    amount,
    currency: "USD",
    serviceCharge,
    type,
    status: "success",
    reason,
    timestamp: new Date().toISOString(),
  });

  if (type === "receive") {
    await axiosInstance.post(url, {
      id: `tx-${uuidv4()}`,
      userId: toWalletData.userId,
      fromWallet,
      toWallet,
      amount,
      currency: "USD",
      serviceCharge: 0,
      type: "receive",
      status: "success",
      reason,
      timestamp: new Date().toISOString(),
    });
  }

  return response.data;
};

export const useTransactions = () => {
  const { user } = useAuthStore();
  const userId = user?.id;
  const [externalUserId, setExternalUserId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const {
    data: users = [],
    error: usersError,
    isLoading: isLoadingUsers,
  } = useSWR<User[]>("/users", fetcher);

  const {
    data: senderWallets = [],
    error: senderWalletsError,
    isLoading: isLoadingSenderWallets,
    mutate: mutateSenderWallets,
  } = useSWR<Wallet[]>(userId ? ["/wallets", userId] : null, ([url, id]: [string, string]) =>
    fetchWalletsByUserId(url, { arg: id })
  );

  const {
    data: receiverWallets = [],
    error: receiverWalletsError,
    isLoading: isLoadingReceiverWallets,
    mutate: mutateReceiverWallets,
  } = useSWR<Wallet[]>(externalUserId ? ["/wallets", externalUserId] : null, ([url, id]: [string, string]) =>
    fetchWalletsByUserId(url, { arg: id })
  );

  const {
    data: transactions = [],
    error: transactionsError,
    isLoading: isLoadingTransactions,
    mutate: mutateTransactions,
  } = useSWR<Transaction[]>(
    userId ? ["/transactions", userId] : null,
    ([url, id]: [string, string]) => fetchTransactionsByUserId(url, { arg: id })
  );

  const { trigger: transfer, isMutating } = useSWRMutation(
    "/transactions",
    (url, { arg }: { arg: { fromWallet: string; toWallet: string; amount: number; reason: string; password: string } }) =>
      transferFetcher(url, { arg: { ...arg, userId: userId!, type: "transfer" } }),
    {
      onError: (error) => {
        setToast({ message: error.message || "Transfer failed.", type: "error" });
      },
    }
  );

  const { trigger: transferToExternal } = useSWRMutation(
    "/transactions",
    (url, { arg }: { arg: { fromWallet: string; toWallet: string; amount: number; reason: string; password: string } }) =>
      transferFetcher(url, {
        arg: {
          ...arg,
          userId: userId!,
          type: "receive",
        },
      }),
    {
      onError: (error) => {
        setToast({ message: error.message || "External transfer failed.", type: "error" });
      },
    }
  );

  const externalUsers = useMemo(() => {
    if (!users || !Array.isArray(users)) return [];
    
    return users
      .filter((u) => u.id !== userId && u.kycStatus !== "not-started") // Only exclude current user
      .map((u) => ({
        id: u.id,
        name: `${u.firstname || ""} ${u.lastname || ""}`.trim() || u.email,
        profileImage: u.profileImage,
      
      }));
  }, [users, userId]);

  const mutateAll = useCallback(async () => {
    await Promise.all([mutateSenderWallets(), mutateReceiverWallets(), mutateTransactions()]);
  }, [mutateSenderWallets, mutateReceiverWallets, mutateTransactions]);

  return {
    transactions,
    transactionsError: transactionsError?.message,
    isLoadingTransactions,
    senderWallets,
    senderWalletsError: senderWalletsError?.message,
    isLoadingSenderWallets,
    externalUsers,
    usersError: usersError?.message,
    isLoadingUsers,
    receiverWallets,
    receiverWalletsError: receiverWalletsError?.message,
    isLoadingReceiverWallets,
    setExternalUserId,
    transfer: async (fromWallet: string, toWallet: string, amount: number, reason: string, password: string) => {
      await transfer({ fromWallet, toWallet, amount, reason, password });
      await mutateAll();
    },
    transferToExternal: async (
      fromWallet: string,
      toWallet: string,
      amount: number,
      reason: string,
      password: string
    ) => {
      await transferToExternal({ fromWallet, toWallet, amount, reason, password });
      await mutateAll();
    },
    isMutating,
    toast,
    setToast,
  };
};