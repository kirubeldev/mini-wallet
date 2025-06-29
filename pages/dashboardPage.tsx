"use client"

import { useState } from "react"
import { useWalletStore } from "@/store/wallet-store"
import Layout from "@/components/Layout"
import TransferModal from "@/components/TransferModal"
import Toast from "@/components/Toast"
import { EyeIcon, EyeSlashIcon, PlusIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"

export default function Dashboard() {
  const { user, accounts, transactions, balanceVisible, toggleBalanceVisibility } = useWalletStore()
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)
  const isLowBalance = totalBalance < (user?.minBalance || 100)

  // Mock expense data for pie chart
  const expenseData = [
    { name: "Food", value: 400, color: "#8884d8" },
    { name: "Transport", value: 300, color: "#82ca9d" },
    { name: "Shopping", value: 200, color: "#ffc658" },
    { name: "Bills", value: 500, color: "#ff7300" },
    { name: "Others", value: 100, color: "#00ff00" },
  ]

  const recentTransactions = transactions.slice(0, 5)

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <button
            onClick={() => setTransferModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Account
          </button>
        </div>

        {/* Balance Summary Card */}
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
                      {balanceVisible ? `${totalBalance.toFixed(2)} ${user?.currency || "ETB"}` : "XXXXXXX"}
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
                ⚠️ Your balance is below the minimum threshold of {user?.minBalance} {user?.currency}
              </div>
            )}
          </div>
        </div>

        {/* Charts and Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expense Chart */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Expense Breakdown</h3>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {expenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Recent Transactions</h3>
              <div className="mt-4">
                {recentTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {recentTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              transaction.status === "success"
                                ? "bg-green-100 dark:bg-green-900"
                                : transaction.status === "failed"
                                  ? "bg-red-100 dark:bg-red-900"
                                  : "bg-yellow-100 dark:bg-yellow-900"
                            }`}
                          >
                            <span className="text-sm">
                              {transaction.type === "deposit" ? "⬇️" : transaction.type === "withdraw" ? "⬆️" : "↔️"}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(transaction.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-sm font-medium ${
                              transaction.status === "success"
                                ? "text-green-600 dark:text-green-400"
                                : transaction.status === "failed"
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-yellow-600 dark:text-yellow-400"
                            }`}
                          >
                            {transaction.amount} {transaction.currency}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{transaction.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No transactions yet</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Account Cards */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">Your Accounts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((account) => {
                const isAccountLowBalance = account.balance < (user?.minBalance || 100)
                return (
                  <div
                    key={account.id}
                    className={`border rounded-lg p-4 ${
                      isAccountLowBalance
                        ? "border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700"
                        : "border-gray-200 dark:border-gray-600"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">{account.logo}</span>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{account.name}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{account.bankName}</p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          account.type === "bank"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                        }`}
                      >
                        {account.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{account.accountNumber}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {balanceVisible ? `${account.balance} ${account.currency}` : "XXXXXXX"}
                      </span>
                      {isAccountLowBalance && <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />}
                    </div>
                    {isAccountLowBalance && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">Low balance alert</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
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
