"use client"

import { useState } from "react"
import { useWalletStore } from "@/store/wallet-store"
import Layout from "@/components/Layout"
import { MagnifyingGlassIcon, ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/outline"

export default function Transactions() {
  const { transactions, accounts } = useWalletStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [sortField, setSortField] = useState("timestamp")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const getAccountName = (accountId: string) => {
    const account = accounts.find((acc) => acc.id === accountId)
    return account ? account.name : "Unknown Account"
  }

  const filteredTransactions = transactions
    .filter((transaction) => {
      const matchesSearch =
        transaction.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getAccountName(transaction.fromAccount || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        getAccountName(transaction.toAccount || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())

      const matchesStatus = filterStatus === "all" || transaction.status === filterStatus
      const matchesType = filterType === "all" || transaction.type === filterType

      return matchesSearch && matchesStatus && matchesType
    })
    .sort((a, b) => {
      let aValue: any = a[sortField as keyof typeof a]
      let bValue: any = b[sortField as keyof typeof b]

      if (sortField === "timestamp") {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
          <p className="text-gray-600 dark:text-gray-400">View and manage your transaction history</p>
        </div>

        {/* Filters and Search */}
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
                <option value="pending">Pending</option>
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
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm("")
                  setFilterStatus("all")
                  setFilterType("all")
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
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
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    From Account
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    To Account
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
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
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getTypeIcon(transaction.type)}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                          {transaction.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(transaction.timestamp).toLocaleDateString()} <br />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(transaction.timestamp).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {transaction.fromAccount ? getAccountName(transaction.fromAccount) : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {transaction.toAccount ? getAccountName(transaction.toAccount) : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {transaction.amount.toFixed(2)} {transaction.currency}
                      </div>
                      {transaction.serviceCharge > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Fee: {transaction.serviceCharge.toFixed(2)} {transaction.currency}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {transaction.reason || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTransactions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No transactions found</h3>
              <p className="text-gray-500 dark:text-gray-400">
                {transactions.length === 0
                  ? "You haven't made any transactions yet."
                  : "Try adjusting your search or filter criteria."}
              </p>
            </div>
          )}
        </div>

        {/* Summary Stats */}
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
              <div className="text-sm text-gray-500 dark:text-gray-400">Pending</div>
              <div className="text-2xl font-bold text-yellow-600">
                {filteredTransactions.filter((t) => t.status === "pending").length}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
