
"use client";

import type React from "react";
import { useState } from "react";
import Layout from "@/components/LayoutNavs";
import ATMCard from "@/components/ATMCard";
import LowBalanceDialog from "@/components/LowBalanceDialog";
import Toast from "@/components/Toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlusIcon, EyeIcon, EyeSlashIcon, WalletIcon } from "@heroicons/react/24/outline";
import { useWalletStore } from "@/store/wallet-store";
import { useWallets } from "@/hooks/UseWalletHook";

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
  const { user, balanceVisible, toggleBalanceVisibility } = useWalletStore();
  const { addWallet, depositToWallet, walletData, walletError, isLoading, isDepositing, toast, setToast } = useWallets();
  const [showAddForm, setShowAddForm] = useState(false);
  const [lowBalanceDialog, setLowBalanceDialog] = useState<{
    isOpen: boolean;
    wallet?: Wallet;
  }>({ isOpen: false });
  const [depositDialog, setDepositDialog] = useState<{
    isOpen: boolean;
    walletId?: string;
  }>({ isOpen: false });
  const [depositAmount, setDepositAmount] = useState("");
  const [depositError, setDepositError] = useState("");

  console.log("Wallets: user.kycStatus =", user?.kycStatus); // Debug KYC status
  console.log("Wallets: walletData =", walletData); // Debug wallet data

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.kycStatus !== "approved") {
      setToast({ message: "KYC approval required to create a wallet.", type: "error" });
      setShowAddForm(false);
      return;
    }
    try {
      await addWallet();
      setShowAddForm(false);
    } catch (error: any) {
      // Toast is set in useWallets hook
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositDialog.walletId) {
      setDepositError("No wallet selected.");
      return;
    }
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      setDepositError("Please enter a valid deposit amount greater than 0.");
      return;
    }
    try {
      await depositToWallet(depositDialog.walletId, amount);
      setDepositDialog({ isOpen: false });
      setDepositAmount("");
      setDepositError("");
    } catch (error: any) {
      setDepositError(error.message || "Deposit failed. Please try again.");
    }
  };

  const openDepositDialog = (walletId: string) => {
    setDepositDialog({ isOpen: true, walletId });
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
              <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
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

  return (
    <Layout>
      <div className="space-y-6 p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Wallets</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your digital wallets</p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={toggleBalanceVisibility}
            >
              {balanceVisible ? <EyeSlashIcon className="h-4 w-4 mr-2" /> : <EyeIcon className="h-4 w-4 mr-2" />}
              {balanceVisible ? "Hide" : "Show"} Balances
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(walletData) && walletData.length > 0 ? (
            walletData.map((wallet: Wallet) => (
              <ATMCard
                key={wallet.walletId}
                account={{
                  id: wallet.walletId,
                  name: user ? `${user.firstname} ${user.lastname}` : "Wallet",
                  balance: wallet.balance,
                  currency: user?.currency || "USD",
                }}
                isLowBalance={false}  
                balanceVisible={balanceVisible}
                onToggleBalance={toggleBalanceVisibility}
                onLowBalanceAlert={() => setLowBalanceDialog({ isOpen: true, wallet })}
                onCardClick={() => openDepositDialog(wallet.walletId)}
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
            <p className="text-sm text-gray-500 dark:text-gray-400">
              A new wallet will be created with a balance of 0 {user?.currency || "USD"}.
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
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={user?.kycStatus !== "approved"}
              >
                Add Wallet
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={depositDialog.isOpen} onOpenChange={() => setDepositDialog({ isOpen: false })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deposit to Wallet</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Deposit Amount ({user?.currency || "USD"})</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter amount"
                min="0.01"
                step="0.01"
                disabled={isDepositing}
              />
              {depositError && <p className="mt-1 text-sm text-red-600">{depositError}</p>}
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setDepositDialog({ isOpen: false })}
                disabled={isDepositing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isDepositing}
              >
                {isDepositing ? "Depositing..." : "Deposit"}
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
        currency={user?.currency || "USD"}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </Layout>
  );
}
