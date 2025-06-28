"use client"

import type React from "react"

import { useState } from "react"
import { useWalletStore } from "@/store/wallet-store"
import { XMarkIcon } from "@heroicons/react/24/outline"

interface TransferModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  onError: (message: string) => void
}

export default function TransferModal({ isOpen, onClose, onSuccess, onError }: TransferModalProps) {
  const { accounts, transfer, user } = useWalletStore()
  const [formData, setFormData] = useState({
    fromAccount: "",
    toAccount: "",
    amount: "",
    reason: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const amount = Number.parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        onError("Please enter a valid amount")
        return
      }

      if (formData.fromAccount === formData.toAccount) {
        onError("Cannot transfer to the same account")
        return
      }

      const success = await transfer(
        formData.fromAccount,
        formData.toAccount,
        amount,
        formData.reason,
        formData.confirmPassword,
      )

      if (success) {
        onSuccess()
        onClose()
        setFormData({
          fromAccount: "",
          toAccount: "",
          amount: "",
          reason: "",
          confirmPassword: "",
        })
      } else {
        onError("Transfer failed. Please check your password and balance.")
      }
    } catch (error) {
      onError("An error occurred during transfer")
    } finally {
      setLoading(false)
    }
  }

  const selectedFromAccount = accounts.find((acc) => acc.id === formData.fromAccount)
  const serviceCharge = formData.amount ? Number.parseFloat(formData.amount) * 0.01 : 0
  const totalAmount = formData.amount ? Number.parseFloat(formData.amount) + serviceCharge : 0

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="relative w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Transfer Money</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">From Account</label>
              <select
                value={formData.fromAccount}
                onChange={(e) => setFormData({ ...formData, fromAccount: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} - {account.balance} {account.currency}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">To Account</label>
              <select
                value={formData.toAccount}
                onChange={(e) => setFormData({ ...formData, toAccount: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select account</option>
                {accounts
                  .filter((acc) => acc.id !== formData.fromAccount)
                  .map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} - {account.balance} {account.currency}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reason</label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter password123 for demo"
                required
              />
            </div>

            {formData.amount && (
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                <div className="flex justify-between text-sm">
                  <span>Amount:</span>
                  <span>
                    {formData.amount} {selectedFromAccount?.currency}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Service Charge (1%):</span>
                  <span>
                    {serviceCharge.toFixed(2)} {selectedFromAccount?.currency}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-medium border-t pt-2 mt-2">
                  <span>Total:</span>
                  <span>
                    {totalAmount.toFixed(2)} {selectedFromAccount?.currency}
                  </span>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Transfer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
