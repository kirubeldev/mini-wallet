
"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/AuthStore";
import Layout from "@/components/ui/LayoutNavs";
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
import Toast from "@/components/ui/Toast";
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
  const [showUserSearchModal, setShowUserSearchModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState(["", "", "", "", "", ""]);

  const [transferData, setTransferData] = useState<{
    fromWallet: string;
    toWallet: string;
    externalUser: string;
    transferType: "internal" | "external";
    amount: string;
    reason: string;
  }>({
    fromWallet: "",
    toWallet: "",
    externalUser: "",
    transferType: "internal",
    amount: "",
    reason: "",
  });

  const itemsPerPage = 10;

  useEffect(() => {
    if (user) {
      console.log(`tansacccccccccction: User data - ${JSON.stringify(user)}`);
    }
  }, [user]);

  useEffect(() => {
    console.log("Transactions useEffect: Running", { userId, kycStatus: user?.kycStatus, user });
    if (!userId && !isLoadingTransactions) {
      console.log("Transactions: No userId, redirecting to login");
      setToast({ message: "Please log in to view transactions.", type: "error" });
      router.replace("/auth/login");
      return;
    }
    if (user?.kycStatus !== "approved" && !isLoadingTransactions) {
      console.log("Transactions: KYC not approved, redirecting to KYC");
      setToast({ message: "KYC approval required.", type: "error" });
      router.replace("/kyc");
    }
  }, [userId, user?.kycStatus, setToast, router, isLoadingTransactions]);

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
      case "receive":
        return "⬇️";
      default:
        return "💰";
    }
  };

  const getInitials = (name: string) => {
    const [first, last] = name.split(" ");
    return `${first[0] || ""}${last ? last[0] : ""}`.toUpperCase();
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleTransferClick = () => {
    if (user?.kycStatus !== "approved") {
      setToast({ message: "Please complete KYC to perform transactions.", type: "error" });
      return;
    }
    setShowTransferModal(true);
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
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
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const password = passwordInput.join("");
    const amount = Number.parseFloat(transferData.amount);

    try {
      if (transferData.transferType === "external") {
        await transferToExternal(
          transferData.fromWallet,
          transferData.toWallet, // Use toWallet instead of externalUser
          amount,
          transferData.reason,
          password
        );
      } else {
        await transfer(
          transferData.fromWallet,
          transferData.toWallet,
          amount,
          transferData.reason,
          password
        );
      }
      setToast({ message: "Transfer successful!", type: "success" });
      setShowTransferModal(false);
      setShowPasswordModal(false);
      setTransferData({
        fromWallet: "",
        toWallet: "",
        externalUser: "",
        transferType: "internal",
        amount: "",
        reason: "",
      });
      setPasswordInput(["", "", "", "", "", ""]);
      setUserSearchTerm("");
      setExternalUserId(null);
    } catch (error: any) {
      console.error("handlePasswordSubmit: Error", error.message);
      const errorMessage = error.message || "Transfer failed. Please try again.";
      setToast({ message: errorMessage, type: "error" });
      setPasswordInput(["", "", "", "", "", ""]);
    }
  };

  const handlePasswordInputChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newPasswordInput = [...passwordInput];
      newPasswordInput[index] = value.replace(/\D/g, "");
      setPasswordInput(newPasswordInput);
      if (value && index < 5) {
        const nextInput = document.getElementById(`password-input-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handlePasswordKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !passwordInput[index] && index > 0) {
      const newPasswordInput = [...passwordInput];
      newPasswordInput[index - 1] = "";
      setPasswordInput(newPasswordInput);
      const prevInput = document.getElementById(`password-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleUserSelect = (userId: string) => {
    setTransferData({ ...transferData, externalUser: userId, toWallet: "" });
    setExternalUserId(userId);
    setShowUserSearchModal(false);
    setUserSearchTerm("");
  };

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
      <div className="space-y-6 relative">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
            <p className="text-gray-600 dark:text-gray-400">View and manage your transaction history</p>
          </div>
          <Button
            onClick={handleTransferClick}
            disabled={isMutating || !senderWallets.length || user?.kycStatus !== "approved"}
          >
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
                <option value="receive">Receive</option>
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
                            {transaction.amount.toFixed(2)} USD
                          </div>
                          {transaction.serviceCharge > 0 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Fee: {transaction.serviceCharge.toFixed(2)} USD
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
          <DialogContent className="sm:max-w-md max-h-[70vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Transfer Money</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Transfer Type</label>
                <select
                  value={transferData.transferType}
                  onChange={(e) => {
                    setTransferData({ ...transferData, transferType: e.target.value as "internal" | "external", toWallet: "", externalUser: "" });
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
                      {wallet.accountNumber} - {wallet.balance} USD
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
                    disabled={isLoadingSenderWallets || senderWallets.length <= 1}
                  >
                    {senderWallets.length <= 1 ? (
                      <option value="">No other wallets available</option>
                    ) : (
                      <>
                        <option value="">Select wallet</option>
                        {senderWallets
                          .filter((w) => w.walletId !== transferData.fromWallet)
                          .map((wallet) => (
                            <option key={wallet.walletId} value={wallet.walletId}>
                              {wallet.accountNumber} - {wallet.balance} USD
                            </option>
                          ))}
                      </>
                    )}
                  </select>
                  {senderWallets.length <= 1 && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      You need at least two wallets to transfer between them.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">To User</label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowUserSearchModal(true)}
                      className="mt-1 w-full text-left"
                      disabled={isLoadingUsers || externalUsers.length === 0}
                    >
                      {transferData.externalUser
                        ? externalUsers.find((u) => u.id === transferData.externalUser)?.name || "Select recipient"
                        : "Select recipient"}
                    </Button>
                    {usersError && (
                      <p className="mt-1 text-sm text-red-600">Error: {usersError}</p>
                    )}
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
                          {wallet.accountNumber} - {wallet.balance} USD
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
                    (transferData.transferType === "internal" && (!transferData.toWallet || senderWallets.length <= 1)) ||
                    (transferData.transferType === "external" && (!transferData.externalUser || !transferData.toWallet))
                  }
                >
                  Pay
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={showUserSearchModal} onOpenChange={setShowUserSearchModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Select Recipient</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="max-h-64 overflow-y-auto">
                {isLoadingUsers ? (
                  <p className="text-gray-500 dark:text-gray-400">Loading users...</p>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded flex items-center"
                      onClick={() => handleUserSelect(user.id)}
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center mr-3">
                        {user.profileImage ? (
                          <img
                            src={user.profileImage}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium">{getInitials(user.name)}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.bankName}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No users found</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Enter 6-Digit Password</DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="flex justify-between space-x-2">
                {passwordInput.map((value, index) => (
                  <input
                    key={index}
                    id={`password-input-${index}`}
                    type="text"
                    maxLength={1}
                    value={value}
                    onChange={(e) => handlePasswordInputChange(index, e.target.value)}
                    onKeyDown={(e) => handlePasswordKeyDown(index, e)}
                    className="w-12 h-12 text-center text-lg rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                ))}
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordInput(["", "", "", "", "", ""]);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isMutating || passwordInput.some((val) => !val)}
                >
                  Confirm
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
