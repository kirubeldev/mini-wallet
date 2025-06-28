"use client"

import type React from "react"

import { useState } from "react"
import { useWalletStore } from "@/store/wallet-store"
import Layout from "@/components/Layout"
import Toast from "@/components/Toast"
import { UserCircleIcon } from "@heroicons/react/24/outline"

export default function Settings() {
  const { user, updateUser } = useWalletStore()
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [formData, setFormData] = useState({
    profileImage: user?.profileImage || "",
    theme: user?.theme || "light",
    minBalance: user?.minBalance?.toString() || "100",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    const minBalanceNum = Number.parseFloat(formData.minBalance)
    if (isNaN(minBalanceNum) || minBalanceNum < 100) {
      newErrors.minBalance = "Minimum balance must be at least 100"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      updateUser({
        profileImage: formData.profileImage,
        theme: formData.theme as "light" | "dark",
        minBalance: Number.parseFloat(formData.minBalance),
      })

      setToast({ message: "Settings updated successfully!", type: "success" })
    } catch (error) {
      setToast({ message: "Failed to update settings", type: "error" })
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your account preferences and security settings</p>
        </div>

        {/* Profile Settings */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Profile Settings</h3>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Profile Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Profile Image</label>
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {formData.profileImage ? (
                    <img
                      src={formData.profileImage || "/placeholder.svg"}
                      alt="Profile preview"
                      className="h-16 w-16 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                      }}
                    />
                  ) : (
                    <UserCircleIcon className="h-16 w-16 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="url"
                    value={formData.profileImage}
                    onChange={(e) => setFormData({ ...formData, profileImage: e.target.value })}
                    placeholder="https://example.com/profile.jpg"
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Enter a URL for your profile image</p>
                </div>
              </div>
            </div>

            {/* Theme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme Preference
              </label>
              <select
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            {/* Minimum Balance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Minimum Balance Threshold
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="100"
                  value={formData.minBalance}
                  onChange={(e) => setFormData({ ...formData, minBalance: e.target.value })}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400 sm:text-sm">{user?.currency || "ETB"}</span>
                </div>
              </div>
              {errors.minBalance && <p className="mt-1 text-sm text-red-600">{errors.minBalance}</p>}
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                You'll receive alerts when your balance falls below this amount (minimum: 100)
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Account Information */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Account Information</h3>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{user?.firstName}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{user?.lastName}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{user?.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Default Currency</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{user?.currency}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">KYC Status</label>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user?.kycStatus === "approved"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : user?.kycStatus === "rejected"
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  }`}
                >
                  {user?.kycStatus?.toUpperCase() || "PENDING"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Security Settings</h3>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200">🔒 Demo Security Features</h4>
              <ul className="mt-2 text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <li>• Two-factor authentication (2FA)</li>
                <li>• Password change functionality</li>
                <li>• Login activity monitoring</li>
                <li>• Device management</li>
                <li>• Account recovery options</li>
              </ul>
              <p className="mt-2 text-xs text-blue-700 dark:text-blue-400">
                These features would be implemented in a production environment
              </p>
            </div>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </Layout>
  )
}
