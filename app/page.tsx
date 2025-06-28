"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWalletStore } from "@/store/wallet-store"

export default function Home() {
  const { isAuthenticated } = useWalletStore()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard")
    } else {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="text-6xl mb-4">💰</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Mini Wallet System</h1>
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  )
}
