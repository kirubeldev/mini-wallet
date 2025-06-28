"use client"

import type React from "react"
import { useState } from "react"
import { useWalletStore } from "@/store/wallet-store"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Login() {
  const { login } = useWalletStore()
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const success = await login(formData.email, formData.password)
      if (success) {
        router.push("/dashboard")
      } else {
        setError("Invalid credentials")
      }
    } catch (error) {
      setError("Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            💰 Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">Welcome back to Mini Wallet</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full px-3 py-3 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1 block w-full px-3 py-3 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {error && <div className="text-red-600 text-sm text-center">{error}</div>}

          <div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </div>

          <div className="text-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
              <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Sign up
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}
