"use client"
import { EyeIcon, EyeSlashIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline"

interface ATMCardProps {
  account: {
    id: string
    name: string
    balance: number
    currency: string
  }
  isLowBalance: boolean
  balanceVisible: boolean
  onToggleBalance: () => void
  onLowBalanceAlert: () => void
}

export default function ATMCard({
  account,
  isLowBalance,
  balanceVisible,
  onToggleBalance,
  onLowBalanceAlert,
}: ATMCardProps) {
  return (
    <div
      className={`relative bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-white shadow-lg transform transition-all duration-200 hover:scale-105 ${
        isLowBalance ? "ring-2 ring-red-400" : ""
      }`}
    >
      {/* Low Balance Warning */}
      {isLowBalance && (
        <div className="absolute -top-2 -right-2">
          <button
            onClick={onLowBalanceAlert}
            className="bg-red-500 rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
          >
            <ExclamationTriangleIcon className="h-4 w-4 text-white" />
          </button>
        </div>
      )}

      {/* Card Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">{account.name}</h3>
          <p className="text-blue-200 text-sm">💰 Digital Wallet</p>
        </div>
        <div className="text-2xl">💳</div>
      </div>

      {/* Balance Section */}
      <div className="mb-6">
        <p className="text-blue-200 text-sm mb-1">Available Balance</p>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">
            {balanceVisible ? `${account.balance.toFixed(2)} ${account.currency}` : "••••••"}
          </div>
          <button
            onClick={onToggleBalance}
            className="p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
          >
            {balanceVisible ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Card Footer */}
      <div className="flex justify-between items-end">
        <div>
          <p className="text-blue-200 text-xs">WALLET ID</p>
          <p className="text-sm font-mono">****{account.id.slice(-4)}</p>
        </div>
        <div className="text-right">
          <p className="text-blue-200 text-xs">CURRENCY</p>
          <p className="text-sm font-semibold">{account.currency}</p>
        </div>
      </div>

      {/* Chip Design */}
      <div className="absolute top-4 right-4 w-8 h-6 bg-yellow-400 rounded-sm opacity-80"></div>
    </div>
  )
}
