"use client"

import type React from "react"
import { useState } from "react"
import { useWalletStore } from "@/store/wallet-store"
import Layout from "@/components/TopNav"
import ATMCard from "@/components/ATMCard"
import LowBalanceDialog from "@/components/LowBalanceDialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PlusIcon, EyeIcon, EyeSlashIcon, WalletIcon } from "@heroicons/react/24/outline"

export default function Wallets() {
  const { user, wallets, addWallet, balanceVisible, toggleBalanceVisibility } = useWalletStore()
  const [showAddForm, setShowAddForm] = useState(false)
  const [lowBalanceDialog, setLowBalanceDialog] = useState<{
    isOpen: boolean
    wallet?: any
  }>({ isOpen: false })
  const [formData, setFormData] = useState({
    name: "",
    balance: "",
    currency: user?.currency || "ETB",
  })

  const handleAddWallet = (e: React.FormEvent) => {
    e.preventDefault()

    addWallet({
      name: formData.name,
      balance: Number.parseFloat(formData.balance),
      currency: formData.currency,
    })

    setShowAddForm(false)
    setFormData({
      name: "",
      balance: "",
      currency: user?.currency || "ETB",
    })
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Wallets</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your digital wallets</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={toggleBalanceVisibility}>
              {balanceVisible ? <EyeSlashIcon className="h-4 w-4 mr-2" /> : <EyeIcon className="h-4 w-4 mr-2" />}
              {balanceVisible ? "Hide" : "Show"} Balances
            </Button>
            <Button onClick={() => setShowAddForm(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Wallet
            </Button>
          </div>
        </div>

        {/* Wallet Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wallets.map((wallet) => {
            const isLowBalance = wallet.balance < (user?.minBalance || 100)
            return (
              <ATMCard
                key={wallet.id}
                account={wallet}
                isLowBalance={isLowBalance}
                balanceVisible={balanceVisible}
                onToggleBalance={toggleBalanceVisibility}
                onLowBalanceAlert={() => setLowBalanceDialog({ isOpen: true, wallet })}
              />
            )
          })}
        </div>

        {wallets.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <WalletIcon className="h-12 w-12" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No wallets</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by adding your first wallet.</p>
            <div className="mt-6">
              <Button onClick={() => setShowAddForm(true)}>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Wallet Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="My Wallet"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Initial Balance</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="ETB">Ethiopian Birr (ETB)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Wallet</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <LowBalanceDialog
        isOpen={lowBalanceDialog.isOpen}
        onClose={() => setLowBalanceDialog({ isOpen: false })}
        accountName={lowBalanceDialog.wallet?.name || ""}
        currentBalance={lowBalanceDialog.wallet?.balance || 0}
        minBalance={user?.minBalance || 100}
        currency={lowBalanceDialog.wallet?.currency || user?.currency || "ETB"}
      />
    </Layout>
  )
}
