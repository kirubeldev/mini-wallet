"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
          <DialogTitle className="flex items-center gap-2">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />
            Low Balance Alert
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-yellow-800 dark:text-yellow-200">
              Your <strong>{accountName}</strong> balance is below the minimum threshold.
            </p>
            <div className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Current Balance:</span>
                <span className="font-medium">
                  {currentBalance.toFixed(2)} {currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Minimum Threshold:</span>
                <span className="font-medium">
                  {minBalance.toFixed(2)} {currency}
                </span>
              </div>
              <div className="flex justify-between border-t pt-1">
                <span>Difference:</span>
                <span className="font-medium text-red-600">
                  -{(minBalance - currentBalance).toFixed(2)} {currency}
                </span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Consider adding funds to your wallet to maintain your desired minimum balance.
          </p>
          <div className="flex justify-end">
            <Button onClick={onClose}>Got it</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
