"use client"

import type React from "react"

import { useState } from "react"
import { useWalletStore } from "@/store/wallet-store"
import Layout from "@/components/Layout"
import Toast from "@/components/Toast"
import { CheckCircleIcon, XCircleIcon, ClockIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline"

export default function KYC() {
  const { user, updateUser } = useWalletStore()
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [formData, setFormData] = useState({
    fullName: user?.kycData?.fullName || "",
    documentType: user?.kycData?.documentType || "national_id",
    documentNumber: user?.kycData?.documentNumber || "",
    gender: user?.kycData?.gender || "",
    dob: user?.kycData?.dob || "",
    address: user?.kycData?.address || "",
    country: user?.kycData?.country || "",
    photoUrl: user?.kycData?.photoUrl || "",
  })

  const documentTypes = [
    { value: "national_id", label: "National ID" },
    { value: "passport", label: "Passport" },
    { value: "driver_license", label: "Driver License" },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    try {
      updateUser({
        kycData: formData,
        kycStatus: "pending",
      })

      setToast({
        message: "KYC information submitted successfully! Your verification is now pending.",
        type: "success",
      })
    } catch (error) {
      setToast({ message: "Failed to submit KYC information", type: "error" })
    }
  }

  const getStatusIcon = () => {
    switch (user?.kycStatus) {
      case "approved":
        return <CheckCircleIcon className="h-8 w-8 text-green-500" />
      case "rejected":
        return <XCircleIcon className="h-8 w-8 text-red-500" />
      case "pending":
        return <ClockIcon className="h-8 w-8 text-yellow-500" />
      default:
        return <ExclamationTriangleIcon className="h-8 w-8 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (user?.kycStatus) {
      case "approved":
        return "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700"
      case "rejected":
        return "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700"
      case "pending":
        return "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700"
      default:
        return "bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-700"
    }
  }

  const getStatusMessage = () => {
    switch (user?.kycStatus) {
      case "approved":
        return "Your identity has been verified successfully. You can now access all features."
      case "rejected":
        return "Your KYC verification was rejected. Please review and resubmit your information."
      case "pending":
        return "Your KYC verification is under review. This usually takes 1-3 business days."
      default:
        return "Please complete your KYC verification to unlock all features including transfers."
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">KYC Verification</h1>
          <p className="text-gray-600 dark:text-gray-400">Complete your identity verification to access all features</p>
        </div>

        {/* Status Card */}
        <div className={`border rounded-lg p-6 ${getStatusColor()}`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">{getStatusIcon()}</div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Verification Status: {user?.kycStatus?.toUpperCase() || "NOT STARTED"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{getStatusMessage()}</p>
            </div>
          </div>
        </div>

        {/* Alert for unverified users */}
        {user?.kycStatus !== "approved" && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-orange-400 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">Limited Access</h3>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  Please complete KYC verification to unlock transfers and other premium features.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* KYC Form */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Identity Verification Form</h3>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Document Type</label>
                <select
                  value={formData.documentType}
                  onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  {documentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Document Number</label>
                <input
                  type="text"
                  value={formData.documentNumber}
                  onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Country</label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Country</option>
                  <option value="ET">Ethiopia</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="DE">Germany</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Photo URL</label>
              <input
                type="url"
                value={formData.photoUrl}
                onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                placeholder="https://example.com/photo.jpg"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
              {formData.photoUrl && (
                <div className="mt-2">
                  <img
                    src={formData.photoUrl || "/placeholder.svg"}
                    alt="Preview"
                    className="h-20 w-20 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  // Simulate manual status change for demo
                  const statuses = ["pending", "approved", "rejected"]
                  const currentIndex = statuses.indexOf(user?.kycStatus || "pending")
                  const nextStatus = statuses[(currentIndex + 1) % statuses.length]
                  updateUser({ kycStatus: nextStatus as any })
                  setToast({
                    message: `KYC status changed to ${nextStatus}`,
                    type: "success",
                  })
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Simulate Status Change
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Submit KYC Information
              </button>
            </div>
          </form>
        </div>

        {/* Requirements */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-200 mb-4">📋 KYC Requirements</h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <li>• Provide a clear, valid government-issued ID</li>
            <li>• Ensure all information matches your official documents</li>
            <li>• Upload a recent, high-quality photo</li>
            <li>• Verification typically takes 1-3 business days</li>
            <li>• You'll receive an email notification once verified</li>
          </ul>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </Layout>
  )
}
