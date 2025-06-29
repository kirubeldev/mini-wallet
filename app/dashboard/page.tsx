"use client"

import { useState } from "react"
import { useWalletStore } from "@/store/wallet-store"
import { useRouter } from "next/navigation"
import Layout from "@/components/TopNav"
import ATMCard from "@/components/ATMCard"
import LowBalanceDialog from "@/components/LowBalanceDialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EyeIcon, EyeSlashIcon, PlusIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"
import { truncateText } from "@/lib/utils"

export default function Dashboard() {
  const { user, wallets, transactions, balanceVisible, toggleBalanceVisibility } = useWalletStore()
  const router = useRouter()
  const [lowBalanceDialog, setLowBalanceDialog] = useState<{
    isOpen: boolean
    wallet?: any
  }>({ isOpen: false })

  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0)
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

  const getWalletName = (walletId: string) => {
    const wallet = wallets.find((w) => w.id === walletId)
    return wallet ? wallet.name : "Unknown Wallet"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-600 dark:text-green-400"
      case "failed":
        return "text-red-600 dark:text-red-400"
      case "pending":
        return "text-yellow-600 dark:text-yellow-400"
      default:
        return "text-gray-600 dark:text-gray-400"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return "⬇️"
      case "withdraw":
        return "⬆️"
      case "transfer":
        return "↔️"
      default:
        return "💰"
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <Button onClick={() => router.push("/wallet")}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Manage Wallets
          </Button>
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
                      {balanceVisible ? `${totalBalance.toFixed(2)} ${user?.currency || "ETB"}` : "••••••"}
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

          {/* Recent Transactions Table */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Recent Transactions</h3>
                <Button variant="outline" size="sm" onClick={() => router.push("/transactions")}>
                  View All
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.length > 0 ? (
                      recentTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <span className="text-lg mr-2">{getTypeIcon(transaction.type)}</span>
                              <span className="capitalize">{transaction.type}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {transaction.amount} {transaction.currency}
                          </TableCell>
                          <TableCell>
                            <span className={`capitalize ${getStatusColor(transaction.status)}`}>
                              {transaction.status}
                            </span>
                          </TableCell>
                          <TableCell>{transaction.reason ? truncateText(transaction.reason, 15) : "-"}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-gray-500 dark:text-gray-400 py-8">
                          No transactions yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Cards */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">Your Wallets</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wallets.map((wallet) => {
                const isWalletLowBalance = wallet.balance < (user?.minBalance || 100)
                return (
                  <ATMCard
                    key={wallet.id}
                    account={wallet}
                    isLowBalance={isWalletLowBalance}
                    balanceVisible={balanceVisible}
                    onToggleBalance={toggleBalanceVisibility}
                    onLowBalanceAlert={() => setLowBalanceDialog({ isOpen: true, wallet })}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </div>

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
