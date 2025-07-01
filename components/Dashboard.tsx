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

const getWalletName = async (walletId: string) => {
  try {
    const walletsResponse = await axiosInstance.get(`/wallets?walletId=${walletId}`);
    const wallet = walletsResponse.data[0];
    if (!wallet) {
      return { display: "Unknown Wallet", image: null, initials: "??" };
    }

    const userResponse = await axiosInstance.get(`/users/${wallet.userId}`);
    const user = userResponse.data;
    if (!user) {
      return { display: "Unknown User", image: null, initials: "??" };
    }

    const kycResponse = await axiosInstance.get(`/kyc?userId=${wallet.userId}`);
    const kyc = kycResponse.data[0];
    const display = kyc?.fullName || `${user.firstname} ${user.lastname}`;
    const initials = user.firstname && user.lastname ? `${user.firstname[0]}${user.lastname[0]}` : "??";
    const image = kyc?.photoUrl || user.profileImage || null;

    return { display, image: image ? `${image}?t=${Date.now()}` : null, initials };
  } catch (error) {
    console.error("Error fetching wallet name:", error);
    return { display: "Unknown Wallet", image: null, initials: "??" };
  }
};

export default function Dashboard() {
  const { user, balanceVisible, toggleBalanceVisibility } = useWalletStore();
  const { transactions, senderWallets, receiverWallets, isLoadingTransactions, transactionsError } = useTransactions();
  const router = useRouter();
  const [lowBalanceDialog, setLowBalanceDialog] = useState<{
    isOpen: boolean;
    wallet?: any;
  }>({ isOpen: false });
  const [walletNames, setWalletNames] = useState<{
    [key: string]: { display: string; image: string | null; initials: string | null };
  }>({});
  const [isLoadingWalletNames, setIsLoadingWalletNames] = useState(true);

  // Memoize recentTransactions to prevent unnecessary re-renders
  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);

  // Memoize balanceData to ensure stable reference
  const balanceData = useMemo(
    () =>
      transactions
        .filter((t) => t.fromWallet === senderWallets[0]?.walletId || t.toWallet === senderWallets[0]?.walletId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .reduce(
          (acc, t) => {
            const date = new Date(t.timestamp).toLocaleDateString("en-US", { month: "short", year: "numeric" });
            const lastEntry = acc[acc.length - 1];
            let newBalance = lastEntry ? lastEntry.balance : 200; // Assume initial balance of 200 USD

            if (t.type === "transfer" && t.fromWallet === senderWallets[0]?.walletId) {
              newBalance -= t.amount + (t.serviceCharge || 0);
            } else if (t.type === "receive" && t.toWallet === senderWallets[0]?.walletId) {
              newBalance += t.amount;
            }

            if (!acc.some((entry) => entry.date === date)) {
              acc.push({ date, balance: newBalance });
            } else {
              acc[acc.length - 1].balance = newBalance;
            }

            return acc;
          },
          [] as { date: string; balance: number }[]
        ),
    [transactions, senderWallets]
  );

  const totalBalance = useMemo(() => senderWallets.reduce((sum, wallet) => sum + wallet.balance, 0), [senderWallets]);
  const isLowBalance = totalBalance <  200

  useEffect(() => {
    const fetchWalletNames = async () => {
      setIsLoadingWalletNames(true);
      const names: { [key: string]: { display: string; image: string | null; initials: string | null } } = {};
      for (const transaction of recentTransactions) {
        if (transaction.toWallet && !names[transaction.toWallet]) {
          names[transaction.toWallet] = await getWalletName(transaction.toWallet);
        }
      }
      setWalletNames(names);
      setIsLoadingWalletNames(false);
    };
    fetchWalletNames();
  }, [recentTransactions]);

  // Fixed color for LineChart to avoid randomness
  const lineColor = "#8884d8";

  const wallets = useMemo(
    () =>
      senderWallets.map((wallet) => ({
        ...wallet,
        name: user?.firstname ? `${user.firstname} ${user.lastname}` : "Wallet",
      })),
    [senderWallets, user]
  );

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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return "⬇️";
      case "withdraw":
        return "⬆️";
      case "transfer":
        return "↔️";
      default:
        return "💰";
    }
  };

  if (isLoadingTransactions || isLoadingWalletNames) {
    return <Layout><div>Loading dashboard...</div></Layout>;
  }

  if (transactionsError) {
    return <Layout><div>Error loading dashboard: {transactionsError.message}</div></Layout>;
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
                ⚠️ Your balance is below the minimum threshold of {user?.minBalance} USD
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
                      name="Wallet Balance (USD)"
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
                      <TableHead>To Wallet</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.length > 0 ? (
                      recentTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <span className="text-lg mr-2">{getTypeIcon(transaction.type)}</span>
                              <span className="capitalize">{transaction.type}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {transaction.toWallet ? (
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center mr-3">
                                  {walletNames[transaction.toWallet]?.image ? (
                                    <img
                                      src={walletNames[transaction.toWallet].image!}
                                      alt={walletNames[transaction.toWallet].display}
                                      className="w-8 h-8 rounded-full object-cover"
                                      onError={(e) => (e.currentTarget.src = "")}
                                    />
                                  ) : (
                                    <span className="text-sm font-medium">
                                      {walletNames[transaction.toWallet]?.initials || "??"}
                                    </span>
                                  )}
                                </div>
                                <span>{walletNames[transaction.toWallet]?.display || "Unknown Wallet"}</span>
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {transaction.amount} {transaction.currency}
                          </TableCell>
                          <TableCell>
                            <span className={`capitalize ${getStatusColor(transaction.status)}`}>
                              {transaction.status}
                            </span>
                          </TableCell>
                          <TableCell>{transaction.reason ? truncateText(transaction.reason, 15) : "-"}</TableCell>
                        </TableRow>
                      ))
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
              isLowBalance={wallet.balance < (user?.minBalance || 100)}
              balanceVisible={balanceVisible}
              onToggleBalance={toggleBalanceVisibility}
              onLowBalanceAlert={() => setLowBalanceDialog({ isOpen: true, wallet })}
            />
          ))}
        </div>

        <LowBalanceDialog
          isOpen={lowBalanceDialog.isOpen}
          onClose={() => setLowBalanceDialog({ isOpen: false })}
          accountName={lowBalanceDialog.wallet?.name || ""}
          currentBalance={lowBalanceDialog.wallet?.balance || 0}
          minBalance={user?.minBalance || 100}
          currency={lowBalanceDialog.wallet?.currency || user?.currency || "USD"}
        />
      </div>
    </Layout>
  );
}