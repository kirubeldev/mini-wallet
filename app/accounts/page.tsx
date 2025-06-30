"use client"

import type React from "react"
import { useState } from "react"
import { useWalletStore } from "@/store/wallet-store"
import Layout from "@/components/LayoutNavs"
import ATMCard from "@/components/ATMCard"
import LowBalanceDialog from "@/components/LowBalanceDialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PlusIcon, EyeIcon, EyeSlashIcon, CreditCardIcon } from "@heroicons/react/24/outline"

export default function Accounts() {
  const { user, accounts, addAccount, balanceVisible, toggleBalanceVisibility } = useWalletStore()
  const [showAddForm, setShowAddForm] = useState(false)
  const [lowBalanceDialog, setLowBalanceDialog] = useState<{
    isOpen: boolean
    account?: any
  }>({ isOpen: false })
  const [formData, setFormData] = useState({
    name: "",
    accountNumber: "",
    balance: "",
    type: "bank" as "bank" | "crypto",
    bankName: "CBE",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const bankOptions = ["CBE", "Dashen", "Zemen", "Awash"]

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = "Account name is required"
    if (formData.type === "bank" && !formData.accountNumber.trim()) {
      newErrors.accountNumber = "Account number is required for bank accounts"
    }

    const balanceNum = Number.parseFloat(formData.balance)
    if (isNaN(balanceNum) || balanceNum < 0) {
      newErrors.balance = "Please enter a valid balance"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      addAccount({
        name: formData.name,
        accountNumber: formData.type === "bank" ? formData.accountNumber : "",
        balance: Number.parseFloat(formData.balance),
        currency: formData.currency,
        type: formData.type,
        bankName: formData.type === "bank" ? formData.bankName : undefined,
      })

      setShowAddForm(false)
      setFormData({
        name: "",
        accountNumber: "",
        balance: "",
        currency: user?.currency || "ETB",
        type: "bank",
        bankName: "CBE",
      })
      setErrors({})
    } catch (error) {
      setErrors({ general: "Failed to add account" })
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Accounts</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your bank and crypto accounts</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={toggleBalanceVisibility}>
              {balanceVisible ? <EyeSlashIcon className="h-4 w-4 mr-2" /> : <EyeIcon className="h-4 w-4 mr-2" />}
              {balanceVisible ? "Hide" : "Show"} Balances
            </Button>
            <Button onClick={() => setShowAddForm(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </div>
        </div>

        {/* Account Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts?.map((account) => {
            const isLowBalance = account.balance < (user?.minBalance || 100)
            return (
              <ATMCard
                key={account.id}
                account={account}
                isLowBalance={isLowBalance}
                balanceVisible={balanceVisible}
                onToggleBalance={toggleBalanceVisibility}
                onLowBalanceAlert={() => setLowBalanceDialog({ isOpen: true, account })}
              />
            )
          })}
        </div>

        {accounts?.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <CreditCardIcon className="h-12 w-12" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No accounts</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by adding your first account.</p>
            <div className="mt-6">
              <Button onClick={() => setShowAddForm(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Account Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Account</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddAccount} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as "bank" | "crypto" })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="bank">Bank Account</option>
                <option value="crypto">Crypto Wallet</option>
              </select>
            </div>

            {formData.type === "bank" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bank Name</label>
                  <select
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {bankOptions?.map((bank) => (
                      <option key={bank} value={bank}>
                        {bank}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Number</label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                  {errors.accountNumber && <p className="mt-1 text-sm text-red-600">{errors.accountNumber}</p>}
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Initial Balance</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
              {errors.balance && <p className="mt-1 text-sm text-red-600">{errors.balance}</p>}
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

            {errors.general && <div className="text-red-600 text-sm text-center">{errors.general}</div>}

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Account</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <LowBalanceDialog
        isOpen={lowBalanceDialog.isOpen}
        onClose={() => setLowBalanceDialog({ isOpen: false })}
        accountName={lowBalanceDialog.account?.name || ""}
        currentBalance={lowBalanceDialog.account?.balance || 0}
        minBalance={user?.minBalance || 100}
        currency={lowBalanceDialog.account?.currency || user?.currency || "ETB"}
      />
    </Layout>
  )
}
