"use client"

import type React from "react"

import { useState } from "react"
import { useWalletStore } from "@/store/wallet-store"
import Layout from "@/components/Layout"
import TransferModal from "@/components/TransferModel"
import Toast from "@/components/Toast"
import {
  PlusIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  ArrowsRightLeftIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline"

export default function Accounts() {
  const { user, accounts, addAccount, balanceVisible, toggleBalanceVisibility } = useWalletStore()
  const [showAddForm, setShowAddForm] = useState(false)
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    accountNumber: "",
    balance: "",
    currency: user?.currency || "ETB",
    type: "bank" as "bank" | "crypto",
    bankName: "CBE",
  })

  const bankOptions = ["CBE", "Dashen", "Zemen", "Awash"]

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault()

    try {
      addAccount({
        name: formData.name,
        accountNumber: formData.accountNumber,
        balance: Number.parseFloat(formData.balance),
        currency: formData.currency,
        type: formData.type,
        bankName: formData.type === "bank" ? formData.bankName : undefined,
      })

      setToast({ message: "Account added successfully!", type: "success" })
      setShowAddForm(false)
      setFormData({
        name: "",
        accountNumber: "",
        balance: "",
        currency: user?.currency || "ETB",
        type: "bank",
        bankName: "CBE",
      })
    } catch (error) {
      setToast({ message: "Failed to add account", type: "error" })
    }
  }

  const handleTransferSuccess = () => {
    setToast({ message: "Transfer completed successfully!", type: "success" })
  }

  const handleTransferError = (message: string) => {
    setToast({ message, type: "error" })
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
            <button
              onClick={toggleBalanceVisibility}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              {balanceVisible ? <EyeSlashIcon className="h-4 w-4 mr-2" /> : <EyeIcon className="h-4 w-4 mr-2" />}
              {balanceVisible ? "Hide" : "Show"} Balances
            </button>
            <button
              onClick={() => setTransferModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              <ArrowsRightLeftIcon className="h-4 w-4 mr-2" />
              Transfer
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Account
            </button>
          </div>
        </div>

        {/* Add Account Form */}
        {showAddForm && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add New Account</h3>
            <form onSubmit={handleAddAccount} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Initial Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bank Name</label>
                    <select
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      {bankOptions.map((bank) => (
                        <option key={bank} value={bank}>
                          {bank}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Add Account
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Account Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => {
            const isLowBalance = account.balance < (user?.minBalance || 100)
            return (
              <div
                key={account.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border-l-4 ${
                  isLowBalance ? "border-red-400" : "border-blue-400"
                }`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <span className="text-3xl mr-3">{account.logo}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{account.name}</h3>
                        {account.bankName && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{account.bankName}</p>
                        )}
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        account.type === "bank"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                      }`}
                    >
                      {account.type.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Account Number</p>
                      <p className="font-mono text-gray-900 dark:text-white">{account.accountNumber}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Balance</p>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {balanceVisible ? `${account.balance.toFixed(2)} ${account.currency}` : "XXXXXXX"}
                        </p>
                        {isLowBalance && <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />}
                      </div>
                      {isLowBalance && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">⚠️ Balance below minimum threshold</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {accounts.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <CreditCardIcon className="h-12 w-12" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No accounts</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by adding your first account.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Account
              </button>
            </div>
          </div>
        )}
      </div>

      <TransferModal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        onSuccess={handleTransferSuccess}
        onError={handleTransferError}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </Layout>
  )
}
