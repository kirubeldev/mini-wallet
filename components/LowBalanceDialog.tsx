"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline"

interface LowBalanceDialogProps {
  isOpen: boolean
  onClose: () => void
  accountName: string
  currentBalance: number
  minBalance: number
  currency: string
}

export default function LowBalanceDialog({
  isOpen,
  onClose,
  accountName,
  currentBalance,
  minBalance,
  currency,
}: LowBalanceDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
            <DialogTitle>Low Balance Alert</DialogTitle>
          </div>
          <DialogDescription>Your account balance is below the minimum threshold.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Account: {accountName}</h4>
            <div className="space-y-1 text-sm text-red-700 dark:text-red-300">
              <p>
                Current Balance:{" "}
                <span className="font-medium">
                  {currentBalance.toFixed(2)} {currency}
                </span>
              </p>
              <p>
                Minimum Threshold:{" "}
                <span className="font-medium">
                  {minBalance.toFixed(2)} {currency}
                </span>
              </p>
              <p>
                Deficit:{" "}
                <span className="font-medium text-red-600 dark:text-red-400">
                  {(minBalance - currentBalance).toFixed(2)} {currency}
                </span>
              </p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">💡 Recommendations</h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Add funds to your account</li>
              <li>• Transfer money from another account</li>
              <li>• Adjust your minimum balance threshold in Settings</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Dismiss
          </Button>
          <Button onClick={onClose}>Got it</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
