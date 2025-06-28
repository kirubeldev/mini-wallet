"use client"

import type React from "react"
import { useState } from "react"
import { useWalletStore } from "@/store/wallet-store"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Info } from "lucide-react"

export default function Register() {
  const { register } = useWalletStore()
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    currency: "ETB",
    theme: "dark" as "light" | "dark",
    minBalance: "100",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
    if (!formData.email.trim()) newErrors.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid"
    if (!formData.password) newErrors.password = "Password is required"
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters"

    const minBalanceNum = Number.parseFloat(formData.minBalance)
    if (isNaN(minBalanceNum) || minBalanceNum < 100) {
      newErrors.minBalance = "Minimum balance alert must be at least 100."
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      register({
        ...formData,
        minBalance: Number.parseFloat(formData.minBalance),
      })
      router.push("/kyc")
    } catch (error) {
      setErrors({ general: "Registration failed. Please try again." })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            💰 Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">Join Mini Wallet System</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="mt-1 block w-full px-3 py-3 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="mt-1 block w-full px-3 py-3 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
              </div>
            </div>

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
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
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
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Currency
              </label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="mt-1 block w-full px-3 py-3 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ETB">Ethiopian Birr (ETB)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="minBalance"
                className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Min Balance Alert
                <div className="relative group">
                  <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    Get alerts when your balance falls below this amount
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                  </div>
                </div>
              </label>
              <input
                id="minBalance"
                type="number"
                step="0.01"
                min="100"
                value={formData.minBalance}
                onChange={(e) => setFormData({ ...formData, minBalance: e.target.value })}
                className="mt-1 block w-full px-3 py-3 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.minBalance && <p className="mt-1 text-sm text-red-600">{errors.minBalance}</p>}
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                You'll receive alerts when your balance falls below this amount (minimum: 100)
              </p>
            </div>
          </div>

          {errors.general && <div className="text-red-600 text-sm text-center">{errors.general}</div>}

          <div>
            <Button type="submit" className="w-full">
              Create Account
            </Button>
          </div>

          <div className="text-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}
