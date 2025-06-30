
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
import { useWalletStore } from "@/store/wallet-store";

export default function Wallets() {
  const { user, balanceVisible, toggleBalanceVisibility } = useWalletStore();
  const { addWallet, walletData, walletError, isLoading, toast, setToast } = useWallets();
  const [showAddForm, setShowAddForm] = useState(false);
  const [lowBalanceDialog, setLowBalanceDialog] = useState<{
    isOpen: boolean;
    wallet?: any;
  }>({ isOpen: false });
  const [formData, setFormData] = useState({
    walletBalance: "",
    walletThreshold: "100",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // I have validated form data before submission.
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.walletBalance || Number.parseFloat(formData.walletBalance) < 0) {
      newErrors.walletBalance = "Initial balance must be non-negative";
    }
    if (!formData.walletThreshold || Number.parseFloat(formData.walletThreshold) < 100) {
      newErrors.walletThreshold = "Threshold must be at least 100";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // I have handled wallet addition with validation.
  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setToast({ message: "Please fill all fields correctly.", type: "error" });
      return;
    }
    await addWallet({
      walletBalance: Number.parseFloat(formData.walletBalance),
      walletThreshold: Number.parseFloat(formData.walletThreshold),
    });
    setShowAddForm(false);
    setFormData({ walletBalance: "", walletThreshold: "100" });
  };

  // I have shown skeleton loader during fetch.
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
        {/* Header */}
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
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Wallet
            </Button>
          </div>
        </div>

        {/* Wallet Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {walletData && walletData.length > 0 && walletData[0].userId === user?.id ? (
            <ATMCard
              key={walletData[0].walletId}
              account={{
                id: walletData[0].walletId,
                name: user ? `${user.firstname} ${user.lastname}` : "Wallet",
                balance: walletData[0].walletBalance,
                currency: user?.currency || "ETB",
              }}
              isLowBalance={walletData[0].walletBalance < walletData[0].walletThreshold}
              balanceVisible={balanceVisible}
              onToggleBalance={toggleBalanceVisibility}
              onLowBalanceAlert={() => setLowBalanceDialog({ isOpen: true, wallet: walletData[0] })}
            />
          ) : null}
        </div>

        {(!walletData || walletData.length === 0) && (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <WalletIcon className="h-12 w-12" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No wallets</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by adding your first wallet.</p>
            <div className="mt-6">
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setShowAddForm(true)}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Wallet
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Wallet Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Wallet</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddWallet} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Initial Balance</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.walletBalance}
                  onChange={(e) => setFormData({ ...formData, walletBalance: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-16"
                  placeholder="0.00"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400 sm:text-sm">{user?.currency || "ETB"}</span>
                </div>
              </div>
              {errors.walletBalance && <p className="mt-1 text-sm text-red-600">{errors.walletBalance}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Threshold</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="100"
                  value={formData.walletThreshold}
                  onChange={(e) => setFormData({ ...formData, walletThreshold: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-16"
                  placeholder="100.00"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400 sm:text-sm">{user?.currency || "ETB"}</span>
                </div>
              </div>
              {errors.walletThreshold && <p className="mt-1 text-sm text-red-600">{errors.walletThreshold}</p>}
            </div>
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

      <LowBalanceDialog
        isOpen={lowBalanceDialog.isOpen}
        onClose={() => setLowBalanceDialog({ isOpen: false })}
        accountName={lowBalanceDialog.wallet?.walletId || "Wallet"}
        currentBalance={lowBalanceDialog.wallet?.walletBalance || 0}
        minBalance={lowBalanceDialog.wallet?.walletThreshold || 100}
        currency={user?.currency || "ETB"}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </Layout>
  );
}
