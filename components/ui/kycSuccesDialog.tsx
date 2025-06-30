"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { CheckCircleIcon } from "@heroicons/react/24/outline"
import { useEffect } from "react"

interface KYCSuccessDialogProps {
  isOpen: boolean
  onClose: () => void
  onRedirect: () => void
}

export default function KYCSuccessDialog({ isOpen, onClose, onRedirect }: KYCSuccessDialogProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose()
        onRedirect()
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [isOpen, onClose, onRedirect])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-center text-xl">🎉 Congratulations!</DialogTitle>
            <DialogDescription className="text-center">
              Your KYC verification has been approved successfully.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4 text-center">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">✅ Account Verified</h4>
            <p className="text-sm text-green-700 dark:text-green-300">
              You can now access all features including money transfers, account management, and premium services.
            </p>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">Redirecting to dashboard in 3 seconds...</div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
