"use client"

import type React from "react"
import { useState } from "react"
import { useWalletStore } from "@/store/wallet-store"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { UserCircleIcon } from "@heroicons/react/24/outline"

export default function Settings() {
  const { user, updateUser } = useWalletStore()
  const [formData, setFormData] = useState({
    profileImage: user?.profileImage || "",
    minBalance: user?.minBalance?.toString() || "100",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState("")

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
        minBalance: Number.parseFloat(formData.minBalance),
      })

      setSuccess("Settings updated successfully!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      setErrors({ general: "Failed to update settings" })
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

            {errors.general && <div className="text-red-600 text-sm">{errors.general}</div>}
            {success && <div className="text-green-600 text-sm">{success}</div>}

            <div className="flex justify-end">
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </div>

        {/* Account Information - Vertical ID Card Style */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Account Information</h3>
          </div>

          <div className="p-6">
            <div className="max-w-sm mx-auto bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-white shadow-lg">
              {/* ID Card Header */}
              <div className="text-center mb-4">
                <h4 className="text-lg font-bold">MINI WALLET ID</h4>
                <p className="text-xs opacity-80">Digital Identity Card</p>
              </div>

              {/* Profile Photo */}
              <div className="flex justify-center mb-4">
                {user?.profileImage ? (
                  <img
                    src={user.profileImage || "/placeholder.svg"}
                    alt="Profile"
                    className="h-20 w-20 rounded-full object-cover border-2 border-white"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-2xl font-bold">
                    {user?.firstName?.charAt(0)}
                    {user?.lastName?.charAt(0)}
                  </div>
                )}
              </div>

              {/* User Information */}
              <div className="space-y-2 text-center">
                <div>
                  <p className="text-xs opacity-60">FULL NAME</p>
                  <p className="font-semibold">
                    {user?.firstName} {user?.lastName}
                  </p>
                </div>

                <div>
                  <p className="text-xs opacity-60">EMAIL</p>
                  <p className="text-sm">{user?.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-xs opacity-60">CURRENCY</p>
                    <p className="font-semibold">{user?.currency}</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-60">KYC STATUS</p>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user?.kycStatus === "approved"
                          ? "bg-green-500 bg-opacity-20 text-green-100"
                          : user?.kycStatus === "rejected"
                            ? "bg-red-500 bg-opacity-20 text-red-100"
                            : "bg-yellow-500 bg-opacity-20 text-yellow-100"
                      }`}
                    >
                      {user?.kycStatus?.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* ID Footer */}
                <div className="mt-4 pt-4 border-t border-white border-opacity-20">
                  <p className="text-xs opacity-60">MEMBER SINCE</p>
                  <p className="text-sm">2024</p>
                </div>
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
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
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
    </Layout>
  )
}
