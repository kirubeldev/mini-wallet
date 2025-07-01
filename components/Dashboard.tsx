"use client";

import { useState, useEffect, useMemo } from "react";
import { useWalletStore } from "@/store/wallet-store";
import { useTransactions } from "@/hooks/UseTransactionHook";
import { useRouter } from "next/navigation";
import Layout from "@/components/ui/LayoutNavs";
import ATMCard from "@/components/ui/ATMCard";
import LowBalanceDialog from "@/components/ui/LowBalanceDialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EyeIcon, EyeSlashIcon, PlusIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { truncateText } from "@/lib/utils";
import axiosInstance from "@/lib/axios-Instance";

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

interface Kyc {
  userId: string;
  fullName: string;
  photoUrl: string | null;
}

export default function Dashboard() {
  const { user, balanceVisible, toggleBalanceVisibility } = useWalletStore();
  const {
    transactions,
    senderWallets,
    allWallets,
    isLoadingTransactions,
    isLoadingAllWallets,
    transactionsError,
    walletsError,
  } = useTransactions();
  const router = useRouter();
  const [lowBalanceDialog, setLowBalanceDialog] = useState<{
    isOpen: boolean;
    wallet?: any;
  }>({ isOpen: false });
  const [users, setUsers] = useState<User[]>([]);
  const [kycData, setKycData] = useState<Kyc[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  // Fetch users and KYC data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingUsers(true);
      try {
        const usersResponse = await axiosInstance.get("/users");
        const usersData = Array.isArray(usersResponse.data) ? usersResponse.data : [usersResponse.data];
        setUsers(usersData);

        const kycResponse = await axiosInstance.get("/kyc");
        const kycData = Array.isArray(kycResponse.data) ? kycResponse.data : [kycResponse.data];
        setKycData(kycData);

        setUsersError(null);
      } catch (error: any) {
        console.error("Error fetching users or KYC data:", error);
        setUsersError(error.message || "Failed to fetch users");
        setUsers([]);
        setKycData([]);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchData();
  }, []);

  // Calculate total balance
  const totalBalance = useMemo(() => senderWallets.reduce((sum, wallet) => sum + wallet.balance, 0), [senderWallets]);
  const minBalanceThreshold = 200;
  const isLowBalance = totalBalance < minBalanceThreshold;

  // Show low balance dialog on load if total balance is below threshold
  useEffect(() => {
    if (!isLoadingTransactions && !isLoadingAllWallets && !isLoadingUsers && isLowBalance) {
      setLowBalanceDialog({ isOpen: true, wallet: null });
    }
  }, [isLoadingTransactions, isLoadingAllWallets, isLoadingUsers, isLowBalance]);

  // Memoize recentTransactions
  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);

  // Calculate balance history for all sender wallets
  const balanceData = useMemo(() => {
    const userWalletIds = senderWallets.map((w) => w.walletId);
    const relevantTransactions = transactions
      .filter((t) => userWalletIds.includes(t.fromWallet) || userWalletIds.includes(t.toWallet))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let currentBalance = totalBalance;
    const balanceHistory: { date: string; balance: number }[] = [];

    const transactionsByDate = relevantTransactions.reduce((acc, t) => {
      const date = new Date(t.timestamp).toLocaleDateString("en-US", { month: "short", year: "numeric" });
      if (!acc[date]) acc[date] = [];
      acc[date].push(t);
      return acc;
    }, {} as { [key: string]: any[] });

    const dates = Object.keys(transactionsByDate).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    for (const date of dates) {
      const transactionsForDate = transactionsByDate[date].reverse();
      for (const t of transactionsForDate) {
        if (t.type === "transfer" && userWalletIds.includes(t.fromWallet)) {
          currentBalance += t.amount + (t.serviceCharge || 0);
        } else if (t.type === "receive" && userWalletIds.includes(t.toWallet)) {
          currentBalance -= t.amount;
        }
      }
      balanceHistory.unshift({ date, balance: currentBalance });
    }

    const currentDate = new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" });
    if (!balanceHistory.some((entry) => entry.date === currentDate)) {
      balanceHistory.push({ date: currentDate, balance: totalBalance });
    }

    return balanceHistory;
  }, [transactions, senderWallets, totalBalance]);

  // Get wallet name
  const getWalletName = (walletId: string) => {
    const wallet = allWallets.find((w) => w.walletId === walletId);
    if (!wallet) {
      return { display: "Unknown Wallet", initials: "??" };
    }
    const user = users.find((u) => u.id === wallet.userId);
    const kyc = kycData.find((k) => k.userId === wallet.userId);
    const display = kyc?.fullName || (user ? `${user.firstname} ${user.lastname}`.trim() : "Unknown User");
    const initials = kyc?.fullName
      ? kyc.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
      : user && user.firstname && user.lastname
      ? `${user.firstname[0]}${user.lastname[0]}`.toUpperCase()
      : "??";
    return { display: display || wallet.accountNumber, initials };
  };

  // Get transaction type icon and label
  const getTypeIcon = (transaction: any) => {
    const userWalletIds = senderWallets.map((w) => w.walletId);
    const fromWallet = allWallets.find((w) => w.walletId === transaction.fromWallet);
    const toWallet = allWallets.find((w) => w.walletId === transaction.toWallet);

    const isSender = fromWallet && userWalletIds.includes(fromWallet.walletId);
    const isReceiver = toWallet && userWalletIds.includes(toWallet.walletId);

    if (isSender) {
      return { icon: "⬆️", type: "send" };
    } else if (isReceiver) {
      return { icon: "⬇️", type: "receive" };
    } else {
      switch (transaction.type) {
        case "deposit":
          return { icon: "⬇️", type: "deposit" };
        case "withdraw":
          return { icon: "⬆️", type: "withdraw" };
        case "transfer":
          return { icon: "↔️", type: "transfer" };
        default:
          return { icon: "💰", type: transaction.type };
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-600 dark:text-green-400";
      case "failed":
        return "text-red-600 dark:text-red-400";
      case "not-started":
        return "text-yellow-600 dark:text-yellow-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const wallets = useMemo(
    () =>
      senderWallets.map((wallet) => ({
        ...wallet,
        name: user?.firstname ? `${user.firstname} ${user.lastname}` : "Wallet",
      })),
    [senderWallets, user]
  );

  const lineColor = "#8884d8";

  if (isLoadingTransactions || isLoadingAllWallets || isLoadingUsers) {
    return (
      <Layout>
        <div>Loading dashboard...</div>
      </Layout>
    );
  }

  if (transactionsError || walletsError || usersError) {
    return (
      <Layout>
        <div>
          Error loading dashboard: {transactionsError || walletsError || usersError}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => router.push("/wallet")}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Manage Wallets
          </Button>
        </div>

        <div
          className={`bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border-l-4 ${
            isLowBalance ? "border-red-400" : "border-blue-400"
          }`}
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isLowBalance ? "bg-red-100 dark:bg-red-900" : "bg-blue-100 dark:bg-blue-900"
                  }`}
                >
                  {isLowBalance ? (
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                  ) : (
                    <span className="text-blue-600 dark:text-blue-400">💰</span>
                  )}
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Wallet Balance
                  </dt>
                  <dd className="flex items-center">
                    <div className="text-lg font-medium text-gray-900 dark:text-white">
                      {balanceVisible ? `${totalBalance.toFixed(2)} ${user?.currency || "USD"}` : "••••••"}
                    </div>
                    <button
                      onClick={toggleBalanceVisibility}
                      className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {balanceVisible ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </dd>
                </dl>
              </div>
            </div>
            {isLowBalance && (
              <div className="mt-3 text-sm text-red-600 dark:text-red-400">
                ⚠️ Your total balance is below the minimum threshold of {minBalanceThreshold} USD
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Balance History</h3>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={balanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke={lineColor}
                      activeDot={{ r: 8 }}
                      name="Total Wallet Balance (USD)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Recent Transactions</h3>
                <Button variant="outline" size="sm" onClick={() => router.push("/transactions")}>
                  View All
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.length > 0 ? (
                      recentTransactions.map((transaction) => {
                        const { icon, type } = getTypeIcon(transaction);
                        const walletName = getWalletName(transaction.toWallet);
                        return (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              <div className="flex items-center">
                                <span className="text-lg mr-2">{icon}</span>
                                <span className="capitalize">{type}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {transaction.toWallet ? walletName.display : "-"}
                            </TableCell>
                            <TableCell className="font-medium">
                              {transaction.amount.toFixed(2)} {transaction.currency}
                            </TableCell>
                            <TableCell>
                              <span className={`capitalize ${getStatusColor(transaction.status)}`}>
                                {transaction.status}
                              </span>
                            </TableCell>
                            <TableCell>{transaction.reason ? truncateText(transaction.reason, 15) : "-"}</TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500 dark:text-gray-400 py-8">
                          No transactions yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {wallets.map((wallet) => (
            <ATMCard
              key={wallet.id}
              account={wallet}
              isLowBalance={wallet.balance < (user?.minBalance || minBalanceThreshold)}
              balanceVisible={balanceVisible}
              onToggleBalance={toggleBalanceVisibility}
              onLowBalanceAlert={() => setLowBalanceDialog({ isOpen: true, wallet })}
            />
          ))}
        </div>

        <LowBalanceDialog
          isOpen={lowBalanceDialog.isOpen}
          onClose={() => setLowBalanceDialog({ isOpen: false })}
          accountName={lowBalanceDialog.wallet?.name || "All Wallets"}
          currentBalance={lowBalanceDialog.wallet?.balance || totalBalance}
          minBalance={minBalanceThreshold}
          currency={lowBalanceDialog.wallet?.currency || user?.currency || "USD"}
        />
      </div>
    </Layout>
  );
}