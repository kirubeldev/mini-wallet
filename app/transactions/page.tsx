"use client"

import type React from "react"
import { useState } from "react"
import { useWalletStore } from "@/store/wallet-store"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline"
import { truncateText } from "@/lib/utils"

export default function Transactions() {
  const { transactions, accounts, transfer, transferToExternal, user, externalUsers } = useWalletStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [sortField, setSortField] = useState("timestamp")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferData, setTransferData] = useState({
    fromAccount: "",
    toAccount: "",
    externalUser: "",
    transferType: "internal", // "internal" or "external"
    amount: "",
    reason: "",
    password: "",
  })
  const [transferError, setTransferError] = useState("")
  const [transferLoading, setTransferLoading] = useState(false)

  const itemsPerPage = 10

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

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage)

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
        return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20"
      case "failed":
        return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20"
      case "pending":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20"
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20"
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

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    setTransferLoading(true)
    setTransferError("")

    try {
      const amount = Number.parseFloat(transferData.amount)
      if (isNaN(amount) || amount <= 0) {
        setTransferError("Please enter a valid amount")
        return
      }

      let result

      if (transferData.transferType === "external") {
        if (!transferData.externalUser) {
          setTransferError("Please select a recipient")
          return
        }
        result = await transferToExternal(
          transferData.fromAccount,
          transferData.externalUser,
          amount,
          transferData.reason,
          transferData.password,
        )
      } else {
        if (transferData.fromAccount === transferData.toAccount) {
          setTransferError("Cannot transfer to the same account")
          return
        }
        result = await transfer(
          transferData.fromAccount,
          transferData.toAccount,
          amount,
          transferData.reason,
          transferData.password,
        )
      }

      if (result.success) {
        setShowTransferModal(false)
        setTransferData({
          fromAccount: "",
          toAccount: "",
          externalUser: "",
          transferType: "internal",
          amount: "",
          reason: "",
          password: "",
        })
      } else {
        setTransferError(result.message)
      }
    } catch (error) {
      setTransferError("An error occurred during transfer")
    } finally {
      setTransferLoading(false)
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
            <p className="text-gray-600 dark:text-gray-400">View and manage your transaction history</p>
          </div>
          <Button onClick={() => setShowTransferModal(true)} disabled={user?.kycStatus !== "approved"}>
            Transfer Money
          </Button>
        </div>

        {/* KYC Alert */}
        {user?.kycStatus !== "approved" && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
            <p className="text-orange-800 dark:text-orange-200">
              ⚠️ KYC verification required to make transfers. Please complete your verification first.
            </p>
          </div>
        )}

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
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setFilterStatus("all")
                  setFilterType("all")
                  setCurrentPage(1)
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
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
                  </TableHead>
                  <TableHead>From Account</TableHead>
                  <TableHead>To Account</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
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
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.length > 0 ? (
                  paginatedTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{getTypeIcon(transaction.type)}</span>
                          <span className="capitalize">{transaction.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{new Date(transaction.timestamp).toLocaleDateString()}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(transaction.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{transaction.fromAccount ? getAccountName(transaction.fromAccount) : "-"}</TableCell>
                      <TableCell>{transaction.toAccount ? getAccountName(transaction.toAccount) : "-"}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {transaction.amount.toFixed(2)} {transaction.currency}
                          </div>
                          {transaction.serviceCharge > 0 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Fee: {transaction.serviceCharge.toFixed(2)} {transaction.currency}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}
                        >
                          {transaction.status}
                        </span>
                      </TableCell>
                      <TableCell>{transaction.reason ? truncateText(transaction.reason, 20) : "-"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 dark:text-gray-400 py-8">
                      No transactions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredTransactions.length)} of{" "}
                {filteredTransactions.length} results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
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

      {/* Transfer Modal */}
      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer Money</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTransfer} className="space-y-4">
            {/* Transfer Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Transfer Type</label>
              <select
                value={transferData.transferType}
                onChange={(e) => setTransferData({ ...transferData, transferType: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="internal">Between My Accounts</option>
                <option value="external">To Other Users</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">From Account</label>
              <select
                value={transferData.fromAccount}
                onChange={(e) => setTransferData({ ...transferData, fromAccount: e.target.value })}
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

            {transferData.transferType === "internal" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">To Account</label>
                <select
                  value={transferData.toAccount}
                  onChange={(e) => setTransferData({ ...transferData, toAccount: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Select account</option>
                  {accounts
                    .filter((acc) => acc.id !== transferData.fromAccount)
                    .map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} - {account.balance} {account.currency}
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">To User</label>
                <select
                  value={transferData.externalUser}
                  onChange={(e) => setTransferData({ ...transferData, externalUser: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Select recipient</option>
                  {externalUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {user.bankName} ({user.type})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
              <input
                type="number"
                step="0.01"
                value={transferData.amount}
                onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reason</label>
              <input
                type="text"
                value={transferData.reason}
                onChange={(e) => setTransferData({ ...transferData, reason: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
              <input
                type="password"
                value={transferData.password}
                onChange={(e) => setTransferData({ ...transferData, password: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter password123 for demo"
                required
              />
            </div>

            {/* Service Charge Info */}
            {transferData.amount && (
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                <div className="flex justify-between text-sm">
                  <span>Amount:</span>
                  <span>{transferData.amount} ETB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Service Charge ({transferData.transferType === "external" ? "2%" : "1%"}):</span>
                  <span>
                    {(
                      Number.parseFloat(transferData.amount || "0") *
                      (transferData.transferType === "external" ? 0.02 : 0.01)
                    ).toFixed(2)}{" "}
                    ETB
                  </span>
                </div>
                <div className="flex justify-between text-sm font-medium border-t pt-2 mt-2">
                  <span>Total:</span>
                  <span>
                    {(
                      Number.parseFloat(transferData.amount || "0") *
                      (1 + (transferData.transferType === "external" ? 0.02 : 0.01))
                    ).toFixed(2)}{" "}
                    ETB
                  </span>
                </div>
              </div>
            )}

            {transferError && <div className="text-red-600 text-sm">{transferError}</div>}

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => setShowTransferModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={transferLoading}>
                {transferLoading ? "Processing..." : "Transfer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}
