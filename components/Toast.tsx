"use client"

import { useEffect } from "react"
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from "@heroicons/react/24/outline"

interface ToastProps {
  message: string
  type: "success" | "error"
  onClose: () => void
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed top-4 center z-50 max-w-sm w-full">
      <div
        className={`rounded-lg p-4 shadow-lg ${
          type === "success"
            ? "bg-green-50 border border-green-200 dark:bg-green-900 dark:border-green-700"
            : "bg-red-50 border border-red-200 dark:bg-red-900 dark:border-red-700"
        }`}
      >
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {type === "success" ? (
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
            ) : (
              <XCircleIcon className="h-5 w-5 text-red-400" />
            )}
          </div>
          <div className="ml-3">
            <p
              className={`text-sm font-medium ${
                type === "success" ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"
              }`}
            >
              {message}
            </p>
          </div>
          <div className="ml-auto pl-3">
            <button
              onClick={onClose}
              className={`inline-flex rounded-md p-1.5 ${
                type === "success"
                  ? "text-green-500 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-800"
                  : "text-red-500 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-800"
              }`}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
