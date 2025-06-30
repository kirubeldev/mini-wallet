
"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Layout from "@/components/LayoutNavs";
import ATMCard from "@/components/ATMCard";
import LowBalanceDialog from "@/components/LowBalanceDialog";
import Toast from "@/components/Toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlusIcon, WalletIcon, ArrowDownTrayIcon, ArrowsRightLeftIcon, UserIcon } from "@heroicons/react/24/outline";
import { useWallets } from "@/hooks/UseWalletHook";
import { useAuthStore } from "@/store/AuthStore";

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

interface Wallet {
  walletId: string;
  userId: string;
  accountNumber: string;
  balance: number;
  createdAt: string;
}

export default function Wallets() {
  const { user: authUser } = useAuthStore();
  const {
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
  } = useWallets();
  const [showAddForm, setShowAddForm] = useState(false);
  const [cardDepositDialog, setCardDepositDialog] = useState<{
    isOpen: boolean;
    walletId?: string;
  }>({ isOpen: false });
  const [headerDepositDialog, setHeaderDepositDialog] = useState(false);
  const [intraUserTransferDialog, setIntraUserTransferDialog] = useState(false);
  const [userTransferDialog, setUserTransferDialog] = useState(false);
  const [depositWalletId, setDepositWalletId] = useState("");
  const [transferFromWalletId, setTransferFromWalletId] = useState("");
  const [transferToWalletId, setTransferToWalletId] = useState("");
  const [transferToUserId, setTransferToUserId] = useState("");
  const [transferToUserWalletId, setTransferToUserWalletId] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [depositError, setDepositError] = useState("");
  const [transferError, setTransferError] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  const [initialBalanceError, setInitialBalanceError] = useState("");
  const [lowBalanceDialog, setLowBalanceDialog] = useState<{
    isOpen: boolean;
    wallet?: Wallet;
  }>({ isOpen: false });
  const [balanceVisibility, setBalanceVisibility] = useState<{ [key: string]: boolean }>({});

  const user = authUser;
  console.log("Wallets: user =", user);
  console.log("Wallets: user.kycStatus =", user?.kycStatus);
  console.log("Wallets: walletData =", walletData);
  console.log("Wallets: usersData =", usersData);

  useEffect(() => {
    console.log("Wallets: user state changed, kycStatus =", user?.kycStatus);
  }, [user]);

  const toggleBalanceVisibility = (walletId: string) => {
    setBalanceVisibility((prev) => ({
      ...prev,
      [walletId]: !prev[walletId],
    }));
  };

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.kycStatus !== "approved") {
      setToast({ message: "KYC approval required to create a wallet.", type: "error" });
      setShowAddForm(false);
      return;
    }
    const balance = parseFloat(initialBalance) || 0;
    if (balance < 0) {
      setInitialBalanceError("Initial balance cannot be negative.");
      return;
    }
    try {
      await addWallet(balance);
      setShowAddForm(false);
      setInitialBalance("");
      setInitialBalanceError("");
    } catch (error: any) {
      // Toast is set in useWallets hook
    }
  };

  const handleCardDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardDepositDialog.walletId) {
      setDepositError("No wallet selected.");
      return;
    }
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      setDepositError("Please enter a valid deposit amount greater than 0.");
      return;
    }
    try {
      await depositToWallet(cardDepositDialog.walletId, amount);
      setCardDepositDialog({ isOpen: false });
      setDepositAmount("");
      setDepositError("");
    } catch (error: any) {
      setDepositError(error.message || "Deposit failed. Please try again.");
    }
  };

  const handleHeaderDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositWalletId) {
      setDepositError("Please select a wallet.");
      return;
    }
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      setDepositError("Please enter a valid deposit amount greater than 0.");
      return;
    }
    try {
      await depositToWallet(depositWalletId, amount);
      setHeaderDepositDialog(false);
      setDepositWalletId("");
      setDepositAmount("");
      setDepositError("");
    } catch (error: any) {
      setDepositError(error.message || "Deposit failed. Please try again.");
    }
  };

  const handleIntraUserTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!Array.isArray(walletData) || walletData.length < 2) {
      setTransferError("Cannot transfer between 1 wallet, only multiple accounts.");
      return;
    }
    if (!transferFromWalletId || !transferToWalletId) {
      setTransferError("Please select both source and destination wallets.");
      return;
    }
    if (transferFromWalletId === transferToWalletId) {
      setTransferError("Cannot transfer to the same wallet.");
      return;
    }
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      setTransferError("Please enter a valid transfer amount greater than 0.");
      return;
    }
    try {
      await transferBetweenWallets(transferFromWalletId, transferToWalletId, amount);
      setIntraUserTransferDialog(false);
      setTransferFromWalletId("");
      setTransferToWalletId("");
      setTransferAmount("");
      setTransferError("");
    } catch (error: any) {
      setTransferError(error.message || "Transfer failed. Please try again.");
    }
  };

  const handleUserTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferFromWalletId || !transferToUserId || !transferToUserWalletId) {
      setTransferError("Please select source wallet, destination user, and destination wallet.");
      return;
    }
    if (transferToUserId === user?.id) {
      setTransferError("Use intra-user transfer for your own wallets.");
      return;
    }
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      setTransferError("Please enter a valid transfer amount greater than 0.");
      return;
    }
    try {
      await transferToUserWallet(transferFromWalletId, transferToUserId, transferToUserWalletId, amount);
      setUserTransferDialog(false);
      setTransferFromWalletId("");
      setTransferToUserId("");
      setTransferToUserWalletId("");
      setTransferAmount("");
      setTransferError("");
    } catch (error: any) {
      setTransferError(error.message || "Transfer failed. Please try again.");
    }
  };

  const openCardDepositDialog = (walletId: string) => {
    setCardDepositDialog({ isOpen: true, walletId });
    setDepositAmount("");
    setDepositError("");
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded mt-2" />
            </div>
            <div className="flex space-x-3">
              <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (walletError) {
    setToast({ message: "Failed to load wallet data.", type: "error" });
  }
  if (usersError) {
    setToast({ message: "Failed to load users data.", type: "error" });
  }

  return (
    <Layout>
      <div className="space-y-6 p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Wallets</h1>
            <p className="text-gray-600 text-sm dark:text-gray-400 mt-2">Manage your digital wallets</p>
          </div>
          <div className="flex space-x-3">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setHeaderDepositDialog(true)}
              disabled={!Array.isArray(walletData) || walletData.length === 0}
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Deposit
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setIntraUserTransferDialog(true)}
              disabled={!Array.isArray(walletData) || walletData.length < 2}
            >
              <ArrowsRightLeftIcon className="h-4 w-4 mr-2" />
              Transfer (My Wallets)
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setUserTransferDialog(true)}
              disabled={!Array.isArray(walletData) || walletData.length === 0}
            >
              <UserIcon className="h-4 w-4 mr-2" />
              Transfer to User
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setShowAddForm(true)}
              disabled={user?.kycStatus !== "approved"}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Wallet
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.isArray(walletData) && walletData.length > 0 ? (
            walletData.map((wallet: Wallet) => (
              <ATMCard
                key={wallet.walletId}
                account={{
                  id: wallet.walletId,
                  name: user ? `${user.firstname} ${user.lastname}` : "Wallet",
                  balance: wallet.balance,
                  currency: user?.currency || "ETB",
                }}
                isLowBalance={false}
                balanceVisible={balanceVisibility[wallet.walletId] || false}
                onToggleBalance={() => toggleBalanceVisibility(wallet.walletId)}
                onLowBalanceAlert={() => setLowBalanceDialog({ isOpen: true, wallet })}
                onCardClick={() => openCardDepositDialog(wallet.walletId)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <WalletIcon className="h-12 w-12" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No wallets</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {user?.kycStatus === "approved"
                  ? "Get started by adding your first wallet."
                  : "Complete KYC approval to create a wallet."}
              </p>
              <div className="mt-6">
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => setShowAddForm(true)}
                  disabled={user?.kycStatus !== "approved"}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Wallet
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Wallet</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddWallet} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Initial Balance ({user?.currency || "ETB"})
              </label>
              <input
                type="number"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter initial balance (optional)"
                min="0"
                step="0.01"
              />
              {initialBalanceError && <p className="mt-1 text-sm text-red-600">{initialBalanceError}</p>}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              A new wallet will be created with the specified initial balance.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                Add Wallet
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={cardDepositDialog.isOpen} onOpenChange={() => setCardDepositDialog({ isOpen: false })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deposit to Wallet</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCardDeposit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Deposit Amount ({user?.currency || "ETB"})
              </label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter amount"
                min="0.01"
                step="0.01"
                disabled={isPatching}
              />
              {depositError && <p className="mt-1 text-sm text-red-600">{depositError}</p>}
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setCardDepositDialog({ isOpen: false })}
                disabled={isPatching}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isPatching}
              >
                {isPatching ? "Depositing..." : "Deposit"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={headerDepositDialog} onOpenChange={setHeaderDepositDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deposit to Wallet</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleHeaderDeposit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Wallet</label>
              <select
                value={depositWalletId}
                onChange={(e) => setDepositWalletId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={isPatching}
              >
                <option value="">Select a wallet</option>
                {Array.isArray(walletData) &&
                  walletData.map((wallet: Wallet) => (
                    <option key={wallet.walletId} value={wallet.walletId}>
                      {user ? `${user.firstname} ${user.lastname}` : "Wallet"} - {wallet.accountNumber.slice(0, 8)}...
                      (Balance: {wallet.balance} {user?.currency || "ETB"})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Deposit Amount ({user?.currency || "ETB"})
              </label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter amount"
                min="0.01"
                step="0.01"
                disabled={isPatching}
              />
              {depositError && <p className="mt-1 text-sm text-red-600">{depositError}</p>}
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setHeaderDepositDialog(false)}
                disabled={isPatching}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isPatching}
              >
                {isPatching ? "Depositing..." : "Deposit"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={intraUserTransferDialog} onOpenChange={setIntraUserTransferDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer Between My Wallets</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleIntraUserTransfer} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">From Wallet</label>
              <select
                value={transferFromWalletId}
                onChange={(e) => setTransferFromWalletId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={isPatching}
              >
                <option value="">Select source wallet</option>
                {Array.isArray(walletData) &&
                  walletData.map((wallet: Wallet) => (
                    <option key={wallet.walletId} value={wallet.walletId}>
                      {user ? `${user.firstname} ${user.lastname}` : "Wallet"} - {wallet.accountNumber.slice(0, 8)}...
                      (Balance: {wallet.balance} {user?.currency || "ETB"})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">To Wallet</label>
              <select
                value={transferToWalletId}
                onChange={(e) => setTransferToWalletId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={isPatching}
              >
                <option value="">Select destination wallet</option>
                {Array.isArray(walletData) &&
                  walletData
                    .filter((wallet: Wallet) => wallet.walletId !== transferFromWalletId)
                    .map((wallet: Wallet) => (
                      <option key={wallet.walletId} value={wallet.walletId}>
                        {user ? `${user.firstname} ${user.lastname}` : "Wallet"} - {wallet.accountNumber.slice(0, 8)}...
                        (Balance: {wallet.balance} {user?.currency || "ETB"})
                      </option>
                    ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Transfer Amount ({user?.currency || "ETB"})
              </label>
              <input
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter amount"
                min="0.01"
                step="0.01"
                disabled={isPatching}
              />
              {transferError && <p className="mt-1 text-sm text-red-600">{transferError}</p>}
              {(!Array.isArray(walletData) || walletData.length < 2) && (
                <p className="mt-1 text-sm text-red-600">Cannot transfer between 1 wallet, only multiple accounts.</p>
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setIntraUserTransferDialog(false)}
                disabled={isPatching}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isPatching || !Array.isArray(walletData) || walletData.length < 2}
              >
                {isPatching ? "Transferring..." : "Transfer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={userTransferDialog} onOpenChange={setUserTransferDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer to Another User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUserTransfer} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">From Wallet</label>
              <select
                value={transferFromWalletId}
                onChange={(e) => setTransferFromWalletId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={isPatching}
              >
                <option value="">Select source wallet</option>
                {Array.isArray(walletData) &&
                  walletData.map((wallet: Wallet) => (
                    <option key={wallet.walletId} value={wallet.walletId}>
                      {user ? `${user.firstname} ${user.lastname}` : "Wallet"} - {wallet.accountNumber.slice(0, 8)}...
                      (Balance: {wallet.balance} {user?.currency || "ETB"})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">To User</label>
              <select
                value={transferToUserId}
                onChange={(e) => setTransferToUserId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={isPatching}
              >
                <option value="">Select destination user</option>
                {Array.isArray(usersData) &&
                  usersData
                    .filter((u: User) => u.id !== user?.id)
                    .map((u: User) => (
                      <option key={u.id} value={u.id}>
                        {u.firstname} {u.lastname} ({u.email})
                      </option>
                    ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">To Wallet</label>
              <select
                value={transferToUserWalletId}
                onChange={(e) => setTransferToUserWalletId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={isPatching || !transferToUserId}
              >
                <option value="">Select destination wallet</option>
                {Array.isArray(selectedUserWallets?.[transferToUserId]) &&
                  selectedUserWallets[transferToUserId].map((wallet: Wallet) => (
                    <option key={wallet.walletId} value={wallet.walletId}>
                      {wallet.accountNumber.slice(0, 8)}... (Balance: {wallet.balance} {user?.currency || "ETB"})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Transfer Amount ({user?.currency || "ETB"})
              </label>
              <input
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter amount"
                min="0.01"
                step="0.01"
                disabled={isPatching}
              />
              {transferError && <p className="mt-1 text-sm text-red-600">{transferError}</p>}
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setUserTransferDialog(false)}
                disabled={isPatching}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isPatching}
              >
                {isPatching ? "Transferring..." : "Transfer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <LowBalanceDialog
        isOpen={lowBalanceDialog.isOpen}
        onClose={() => setLowBalanceDialog({ isOpen: false })}
        accountName={lowBalanceDialog.wallet?.walletId || "Wallet"}
        currentBalance={lowBalanceDialog.wallet?.balance || 0}
        minBalance={0}
        currency={user?.currency || "ETB"}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </Layout>
  );
}
