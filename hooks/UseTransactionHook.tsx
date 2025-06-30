import { useCallback, useMemo, useState } from "react";
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
  password?: string;
  kycStatus: "not-started" | "approved";
  currency: string;
  profileImage?: string;
}

interface Wallet {
  id: string;
  walletId: string;
  userId: string;
  accountNumber: string;
  balance: number;
  currency: string;
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
  profileImage?: string;
}

interface Toast {
  message: string;
  type: "success" | "error";
}

const fetcher = async (url: string) => {
  const response = await axiosInstance.get(url);
  return response.data;
};

const fetchWalletsByUserId = async (url: string, { arg }: { arg: string }) => {
  const response = await axiosInstance.get(`${url}?userId=${arg}`);
  return response.data as Wallet[];
};

const fetchTransactionsByUserId = async (url: string, { arg }: { arg: string }) => {
  const response = await axiosInstance.get("/wallets");
  const wallets = response.data as Wallet[];
  const userWalletIds = wallets.filter((w) => w.userId === arg).map((w) => w.walletId);
  const transactionsResponse = await axiosInstance.get("/transactions");
  const transactions = transactionsResponse.data as Transaction[];
  return transactions.filter(
    (t) => userWalletIds.includes(t.fromWallet) || userWalletIds.includes(t.toWallet)
  );
};

const updateWalletBalance = async (walletId: string, newBalance: number) => {
  await axiosInstance.patch(`/wallets/${walletId}`, { balance: newBalance });
};

const transferFetcher = async (
  url: string,
  {
    arg,
  }: {
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

  console.log("transferFetcher: Starting transfer", { fromWallet, toWallet, amount, userId, type });

  // Fetch user to verify password
  const userResponse = await axiosInstance.get(`/users/${userId}`);
  const user = userResponse.data as User;
  if (user.password !== password) {
    console.error("transferFetcher: Incorrect password", { userId, providedPassword: password });
    throw new Error("Incorrect password");
  }

  // Fetch wallets
  const walletsResponse = await axiosInstance.get("/wallets");
  const wallets = walletsResponse.data as Wallet[];
  const fromWalletData = wallets.find((w) => w.walletId === fromWallet);
  const toWalletData = wallets.find((w) => w.walletId === toWallet);

  console.log("transferFetcher: Wallet data", {
    fromWalletData: fromWalletData ? { walletId: fromWalletData.walletId, userId: fromWalletData.userId } : null,
    toWalletData: toWalletData ? { walletId: toWalletData.walletId, userId: toWalletData.userId } : null,
  });

  if (!fromWalletData || !toWalletData) {
    console.error("transferFetcher: Invalid wallet IDs", { fromWallet, toWallet, wallets });
    throw new Error("Invalid wallet IDs");
  }

  if (fromWalletData.userId !== userId) {
    console.error("transferFetcher: Unauthorized sender", { fromWallet, userId });
    throw new Error("Unauthorized: Sender wallet does not belong to user");
  }

  const serviceCharge = amount * 0.002; // 0.2% service charge
  const totalDeduction = amount + serviceCharge;

  if (fromWalletData.balance < totalDeduction) {
    console.error("transferFetcher: Insufficient balance", {
      balance: fromWalletData.balance,
      totalDeduction,
    });
    throw new Error("Insufficient balance");
  }

  // Update wallet balances
  await updateWalletBalance(fromWalletData.id, fromWalletData.balance - totalDeduction);
  await updateWalletBalance(toWalletData.id, toWalletData.balance + amount);

  // Create transaction
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

  // Create receiver-side transaction for external transfers
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

  console.log("transferFetcher: Transfer completed", { transactionId: response.data.id });
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
  } = useSWR<User[]>(userId ? "/users" : null, fetcher, {
    revalidateOnFocus: false,
  });

  console.log("useTransactions: Fetched users", {
    userId,
    usersCount: users.length,
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      kycStatus: u.kycStatus,
      firstname: u.firstname,
      lastname: u.lastname,
    })),
    usersError: usersError?.message,
    isLoadingUsers,
  });

  const {
    data: senderWallets = [],
    error: senderWalletsError,
    isLoading: isLoadingSenderWallets,
    mutate: mutateSenderWallets,
  } = useSWR<Wallet[]>(userId ? ["/wallets", userId] : null, ([url, id]) => fetchWalletsByUserId(url, { arg: id }), {
    revalidateOnFocus: false,
  });

  const {
    data: receiverWallets = [],
    error: receiverWalletsError,
    isLoading: isLoadingReceiverWallets,
    mutate: mutateReceiverWallets,
  } = useSWR<Wallet[]>(externalUserId ? ["/wallets", externalUserId] : null, ([url, id]) =>
    fetchWalletsByUserId(url, { arg: id })
  );

  const {
    data: transactions = [],
    error: transactionsError,
    isLoading: isLoadingTransactions,
    mutate: mutateTransactions,
  } = useSWR<Transaction[]>(userId ? ["/transactions", userId] : null, ([url, id]) =>
    fetchTransactionsByUserId(url, { arg: id })
  );

  const externalUsers = useMemo(
    () =>
      users
        .filter((u) => u.id !== userId && u.kycStatus === "approved")
        .map((u) => ({
          id: u.id,
          name: `${u.firstname} ${u.lastname}`,
          bankName: "Mini Wallet System",
          profileImage: u.profileImage,
        })),
    [users, userId]
  );

  const { trigger: transfer, isMutating } = useSWRMutation(
    "/transactions",
    (url, { arg }: { arg: { fromWallet: string; toWallet: string; amount: number; reason: string; password: string } }) =>
      transferFetcher(url, { arg: { ...arg, userId: userId!, type: "transfer" } })
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
      })
  );

  const mutateAll = useCallback(async () => {
    await Promise.all([mutateSenderWallets(), mutateReceiverWallets(), mutateTransactions()]);
  }, [mutateSenderWallets, mutateReceiverWallets, mutateTransactions]);

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
