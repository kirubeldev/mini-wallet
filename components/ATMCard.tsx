"use client"

import type { Account } from "@/store/wallet-store"
import { ExclamationTriangleIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"

interface ATMCardProps {
  account: Account
  isLowBalance: boolean
  balanceVisible: boolean
  onToggleBalance: () => void
  onLowBalanceAlert?: () => void
}

export default function ATMCard({
  account,
  isLowBalance,
  balanceVisible,
  onToggleBalance,
  onLowBalanceAlert,
}: ATMCardProps) {
  const getCardGradient = (bankName?: string) => {
    switch (bankName) {
      case "CBE":
        return "bg-gradient-to-br from-blue-600 to-blue-800"
      case "Dashen":
        return "bg-gradient-to-br from-green-600 to-green-800"
      case "Zemen":
        return "bg-gradient-to-br from-purple-600 to-purple-800"
      case "Awash":
        return "bg-gradient-to-br from-orange-600 to-orange-800"
      default:
        return "bg-gradient-to-br from-gray-600 to-gray-800"
    }
  }

  return (
    <div
      className={`relative w-full h-48 rounded-xl p-6 text-white shadow-lg transform transition-all duration-200 hover:scale-105 ${getCardGradient(account.bankName)} ${
        isLowBalance ? "ring-2 ring-red-400 ring-opacity-75" : ""
      }`}
    >
      {/* Card Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm opacity-80">Account</p>
          <h3 className="text-lg font-semibold">{account.name}</h3>
        </div>
        <div className="flex items-center space-x-2">
          {isLowBalance && (
            <button
              onClick={onLowBalanceAlert}
              className="p-1 rounded-full bg-red-500 bg-opacity-20 hover:bg-opacity-30"
            >
              <ExclamationTriangleIcon className="h-5 w-5 text-red-300" />
            </button>
          )}
          <span className="text-2xl">{account.logo}</span>
        </div>
      </div>

      {/* Account Number */}
      <div className="mb-4">
        <p className="text-xs opacity-60">Account Number</p>
        <p className="font-mono text-sm tracking-wider">
          {account.accountNumber ? `**** **** **** ${account.accountNumber.slice(-4)}` : "N/A"}
        </p>
      </div>

      {/* Balance and Bank Info */}
      <div className="flex justify-between items-end">
        <div>
          <p className="text-xs opacity-60">Balance</p>
          <div className="flex items-center space-x-2">
            <p className="text-xl font-bold">
              {balanceVisible ? `${account.balance.toFixed(2)} ${account.currency}` : "••••••"}
            </p>
            <button onClick={onToggleBalance} className="p-1 rounded-full hover:bg-white hover:bg-opacity-20">
              {balanceVisible ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs opacity-60">Bank</p>
          <p className="text-sm font-medium">{account.bankName || account.type.toUpperCase()}</p>
        </div>
      </div>

      {/* Card Type Badge */}
      <div className="absolute top-4 right-4">
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            account.type === "bank"
              ? "bg-white bg-opacity-20 text-white"
              : "bg-yellow-400 bg-opacity-20 text-yellow-100"
          }`}
        >
          {account.type.toUpperCase()}
        </span>
      </div>

      {/* Low Balance Warning */}
      {isLowBalance && (
        <div className="absolute bottom-2 left-6 right-6">
          <div className="bg-red-500 bg-opacity-20 rounded px-2 py-1">
            <p className="text-xs text-red-200">⚠️ Low Balance Alert</p>
          </div>
        </div>
      )}
    </div>
  )
}
