
"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/AuthStore";
import Layout from "@/components/LayoutNavs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { truncateText } from "@/lib/utils";
import Toast from "@/components/Toast";
import Skeleton from "react-loading-skeleton";
import { useTransactions } from "@/hooks/UseTransactionHook";

export default function Transactions() {
  const router = useRouter();
  const { user } = useAuthStore();
  const userId = useMemo(() => user?.id || null, [user?.id]);
  const {
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
  } = useTransactions();

  const [searchTerm, setSearchTerm] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortField, setSortField] = useState("timestamp");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({
    fromWallet: "",
    toWallet: "",
    externalUser: "",
    transferType: "internal",
    amount: "",
    reason: "",
    password: "",
  });

  const itemsPerPage = 10;

  useEffect(() => {
    console.log("Transactions useEffect: Running", { userId, kycStatus: user?.kycStatus, user });
    if (!userId) {
      console.log("Transactions: No userId, redirecting to login");
      setToast({ message: "Please log in to view transactions.", type: "error" });
      if (router.pathname !== "/login") {
        router.replace("/login");
      }
      return;
    }
    if (user?.kycStatus !== "approved") {
      console.log("Transactions: KYC not approved, redirecting to KYC");
      setToast({ message: "KYC approval required.", type: "error" });
      if (router.pathname !== "/kyc") {
        router.replace("/kyc");
      }
      return;
    }
  }, [userId, user?.kycStatus, setToast, router]);

  const filteredTransactions = useMemo(
    () =>
      transactions
        .filter((transaction) => {
          const fromWalletName =
            transaction.fromWallet &&
            (senderWallets.find((w) => w.walletId === transaction.fromWallet)?.accountNumber || "Unknown Wallet");
          const toWalletName =
            transaction.toWallet &&
            (senderWallets.find((w) => w.walletId === transaction.toWallet)?.accountNumber ||
              receiverWallets.find((w) => w.walletId === transaction.toWallet)?.accountNumber ||
              "Unknown Wallet");
          const matchesSearch =
            (transaction.reason?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
            (fromWalletName && fromWalletName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (toWalletName && toWalletName.toLowerCase().includes(searchTerm.toLowerCase()));

          const matchesStatus = filterStatus === "all" || transaction.status === filterStatus;
          const matchesType = filterType === "all" || transaction.type === filterType;

          return matchesSearch && matchesStatus && matchesType;
        })
        .sort((a, b) => {
          let aValue: any = a[sortField as keyof typeof a];
          let bValue: any = b[sortField as keyof typeof b];
          if (sortField === "timestamp") {
            aValue = new Date(aValue).getTime();
            bValue = new Date(bValue).getTime();
          }
          return sortDirection === "asc" ? (aValue > bValue ? 1 : -1) : aValue < bValue ? 1 : -1;
        }),
    [transactions, searchTerm, filterStatus, filterType, sortField, sortDirection, senderWallets, receiverWallets]
  );

  const filteredUsers = useMemo(
    () => externalUsers.filter((u) => u.name.toLowerCase().includes(userSearchTerm.toLowerCase())),
    [externalUsers, userSearchTerm]
  );

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  const getWalletName = (walletId: string) => {
    const wallet = senderWallets.find((w) => w.walletId === walletId) || receiverWallets.find((w) => w.walletId === walletId);
    return wallet ? wallet.accountNumber : "Unknown Wallet";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20";
      case "failed":
        return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20";
      case "not-started":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20";
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

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number.parseFloat(transferData.amount);
    if (!transferData.fromWallet || amount <= 0 || isNaN(amount)) {
      console.error("handleTransfer: Invalid input", { fromWallet: transferData.fromWallet, amount });
      setToast({ message: "Select a wallet and valid amount.", type: "error" });
      return;
    }
    if (transferData.transferType === "internal" && !transferData.toWallet) {
      console.error("handleTransfer: No toWallet");
      setToast({ message: "Select a destination wallet.", type: "error" });
      return;
    }
    if (transferData.transferType === "external" && (!transferData.externalUser || !transferData.toWallet)) {
      console.error("handleTransfer: No externalUser or toWallet");
      setToast({ message: "Select a recipient and wallet.", type: "error" });
      return;
    }
    if (!transferData.password) {
      console.error("handleTransfer: No password");
      setToast({ message: "Enter your password.", type: "error" });
      return;
    }

    try {
      if (transferData.transferType === "external") {
        await transferToExternal(
          transferData.fromWallet,
          transferData.externalUser,
          amount,
          transferData.reason,
          transferData.password
        );
      } else {
        await transfer(
          transferData.fromWallet,
          transferData.toWallet,
          amount,
          transferData.reason,
          transferData.password
        );
      }
      setShowTransferModal(false);
      setTransferData({
        fromWallet: "",
        toWallet: "",
        externalUser: "",
        transferType: "internal",
        amount: "",
        reason: "",
        password: "",
      });
      setUserSearchTerm("");
      setExternalUserId(null);
    } catch (error: any) {
      console.error("handleTransfer: Error", error.message);
      setToast({ message: error.message || "Transfer failed.", type: "error" });
    }
  };

  if (!userId) {
    return null;
  }

  if (isLoadingTransactions || isLoadingSenderWallets || isLoadingUsers) {
    return (
      <Layout>
        <div className="space-y-6 p-6">
          <Skeleton height={32} width={200} />
          <Skeleton height={16} width={300} />
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <Skeleton count={3} height={40} />
          </div>
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <Skeleton count={5} height={50} />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
            <p className="text-gray-600 dark:text-gray-400">View and manage your transaction history</p>
          </div>
          <Button onClick={() => setShowTransferModal(true)} disabled={isMutating || !senderWallets.length}>
            Transfer Money
          </Button>
        </div>

        {transactionsError && (
          <p className="text-red-600 dark:text-red-400">Error: {transactionsError}</p>
        )}
        {senderWalletsError && (
          <p className="text-red-600 dark:text-red-400">Error: {senderWalletsError}</p>
        )}
        {usersError && <p className="text-red-600 dark:text-red-400">Error: {usersError}</p>}
        {receiverWalletsError && (
          <p className="text-red-600 dark:text-red-400">Error: {receiverWalletsError}</p>
        )}

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="not-started">Not Started</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="deposit">Deposit</option>
                <option value="withdraw">Withdraw</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setFilterStatus("all");
                  setFilterType("all");
                  setCurrentPage(1);
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort("timestamp")}
                  >
                    <div className="flex items-center">
                      Date
                      {sortField === "timestamp" &&
                        (sortDirection === "asc" ? (
                          <ArrowUpIcon className="ml-1 h-4 w-4" />
                        ) : (
                          <ArrowDownIcon className="ml-1 h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead>From Wallet</TableHead>
                  <TableHead>To Wallet</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort("amount")}
                  >
                    <div className="flex items-center">
                      Amount
                      {sortField === "amount" &&
                        (sortDirection === "asc" ? (
                          <ArrowUpIcon className="ml-1 h-4 w-4" />
                        ) : (
                          <ArrowDownIcon className="ml-1 h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.length > 0 ? (
                  paginatedTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{getTypeIcon(transaction.type)}</span>
                          <span className="capitalize">{transaction.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{new Date(transaction.timestamp).toLocaleDateString()}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(transaction.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{transaction.fromWallet ? getWalletName(transaction.fromWallet) : "-"}</TableCell>
                      <TableCell>{transaction.toWallet ? getWalletName(transaction.toWallet) : "-"}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {transaction.amount.toFixed(2)} {transaction.currency}
                          </div>
                          {transaction.serviceCharge > 0 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Fee: {transaction.serviceCharge.toFixed(2)} {transaction.currency}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            transaction.status
                          )}`}
                        >
                          {transaction.status}
                        </span>
                      </TableCell>
                      <TableCell>{transaction.reason ? truncateText(transaction.reason, 20) : "-"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 dark:text-gray-400 py-8">
                      No transactions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredTransactions.length)} of{" "}
                {filteredTransactions.length} results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {filteredTransactions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Transactions</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{filteredTransactions.length}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="text-sm text-gray-500 dark:text-gray-400">Successful</div>
              <div className="text-2xl font-bold text-green-600">
                {filteredTransactions.filter((t) => t.status === "success").length}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="text-sm text-gray-500 dark:text-gray-400">Failed</div>
              <div className="text-2xl font-bold text-red-600">
                {filteredTransactions.filter((t) => t.status === "failed").length}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="text-sm text-gray-500 dark:text-gray-400">Not Started</div>
              <div className="text-2xl font-bold text-yellow-600">
                {filteredTransactions.filter((t) => t.status === "not-started").length}
              </div>
            </div>
          </div>
        )}

        <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Transfer Money</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Transfer Type</label>
                <select
                  value={transferData.transferType}
                  onChange={(e) => {
                    setTransferData({ ...transferData, transferType: e.target.value, toWallet: "", externalUser: "" });
                    setUserSearchTerm("");
                    setExternalUserId(null);
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="internal">Between My Wallets</option>
                  <option value="external">To Other Users</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">From Wallet</label>
                <select
                  value={transferData.fromWallet}
                  onChange={(e) => setTransferData({ ...transferData, fromWallet: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  disabled={isLoadingSenderWallets || senderWallets.length === 0}
                >
                  <option value="">Select wallet</option>
                  {senderWallets.map((wallet) => (
                    <option key={wallet.walletId} value={wallet.walletId}>
                      {wallet.accountNumber} - {wallet.balance} {wallet.currency}
                    </option>
                  ))}
                </select>
                {senderWalletsError && (
                  <p className="mt-1 text-sm text-red-600">Error: {senderWalletsError}</p>
                )}
              </div>
              {transferData.transferType === "internal" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">To Wallet</label>
                  <select
                    value={transferData.toWallet}
                    onChange={(e) => setTransferData({ ...transferData, toWallet: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    disabled={isLoadingSenderWallets || senderWallets.length < 2}
                  >
                    <option value="">Select wallet</option>
                    {senderWallets
                      .filter((w) => w.walletId !== transferData.fromWallet)
                      .map((wallet) => (
                        <option key={wallet.walletId} value={wallet.walletId}>
                          {wallet.accountNumber} - {wallet.balance} {wallet.currency}
                        </option>
                      ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Search User</label>
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        disabled={isLoadingUsers}
                      />
                    </div>
                    {usersError && (
                      <p className="mt-1 text-sm text-red-600">Error: {usersError}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">To User</label>
                    <select
                      value={transferData.externalUser}
                      onChange={(e) => {
                        setTransferData({ ...transferData, externalUser: e.target.value, toWallet: "" });
                        setExternalUserId(e.target.value || null);
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      disabled={isLoadingUsers || externalUsers.length === 0}
                    >
                      <option value="">Select recipient</option>
                      {filteredUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} - {user.bankName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">To Wallet</label>
                    <select
                      value={transferData.toWallet}
                      onChange={(e) => setTransferData({ ...transferData, toWallet: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      disabled={isLoadingReceiverWallets || !transferData.externalUser || receiverWallets.length === 0}
                    >
                      <option value="">Select wallet</option>
                      {receiverWallets.map((wallet) => (
                        <option key={wallet.walletId} value={wallet.walletId}>
                          {wallet.accountNumber} - {wallet.balance} {wallet.currency}
                        </option>
                      ))}
                    </select>
                    {receiverWalletsError && (
                      <p className="mt-1 text-sm text-red-600">Error: {receiverWalletsError}</p>
                    )}
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={transferData.amount}
                  onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reason</label>
                <input
                  type="text"
                  value={transferData.reason}
                  onChange={(e) => setTransferData({ ...transferData, reason: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                <input
                  type="password"
                  value={transferData.password}
                  onChange={(e) => setTransferData({ ...transferData, password: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowTransferModal(false);
                    setUserSearchTerm("");
                    setExternalUserId(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isMutating ||
                    !transferData.fromWallet ||
                    (transferData.transferType === "internal" && !transferData.toWallet) ||
                    (transferData.transferType === "external" && (!transferData.externalUser || !transferData.toWallet)) ||
                    !transferData.password
                  }
                >
                  Transfer
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
