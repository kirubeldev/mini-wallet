"use client"

import type React from "react"
import { useState } from "react"
import { useWalletStore } from "@/store/wallet-store"
import { useRouter } from "next/navigation"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { CheckCircleIcon, XCircleIcon, ClockIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline"

export default function KYC() {



    const router = useRouter()
  const { user, updateUser, addWallet } = useWalletStore()
  const [formData, setFormData] = useState({
    fullName: user?.kycData?.fullName || "",
    documentType: user?.kycData?.documentType || "national_id",
    documentNumber: user?.kycData?.documentNumber || "",
    gender: user?.kycData?.gender || "",
    dob: user?.kycData?.dob || "",
    address: user?.kycData?.address || "",
    country: user?.kycData?.country || "",
    photoUrl: user?.kycData?.photoUrl || "",
    initialBalance: user?.kycData?.initialBalance || 0,
  })
  const [showProcessingDialog, setShowProcessingDialog] = useState(false)
  const [showApprovedDialog, setShowApprovedDialog] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const documentTypes = [
    { value: "national_id", label: "National ID" },
    { value: "passport", label: "Passport" },
    { value: "driver_license", label: "Driver License" },
  ]

  const getDocumentNumberLabel = () => {
    switch (formData.documentType) {
      case "passport":
        return "Passport Number"
      case "driver_license":
        return "Driver License Number"
      case "national_id":
      default:
        return "National ID Number"
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitted(true)

    // Update user with KYC data and set status to pending
    updateUser({
      kycData: formData,
      kycStatus: "pending",
    })

    // Show processing dialog for 4 seconds
    setShowProcessingDialog(true)
    document.body.style.cursor = "wait"

    setTimeout(() => {
      setShowProcessingDialog(false)
      // Auto-approve for demo and create wallet with initial balance
      updateUser({ kycStatus: "approved" })

      // Create wallet with initial balance from KYC form
      // Create wallet with initial balance from KYC form
      addWallet({
        name: "KYC Approved Wallet",
        balance: formData.initialBalance,
        currency: user?.currency || "ETB",
      })
      setShowApprovedDialog(true)

      // Show approved dialog for 3 seconds then redirect
      setTimeout(() => {
        setShowApprovedDialog(false)
        document.body.style.cursor = "default"
        router.push("/dashboard")
      }, 3000)
    }, 4000)
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

        {/* Status Card - only show if status exists */}
        {user?.kycStatus && (
          <div className={`border rounded-lg p-6 ${getStatusColor()}`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">{getStatusIcon()}</div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Verification Status: {user?.kycStatus?.toUpperCase()}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{getStatusMessage()}</p>
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
                {isSubmitted ? (
                  <p className="mt-1 text-sm text-gray-900 dark:text-white py-2">{formData.fullName}</p>
                ) : (
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Document Type</label>
                {isSubmitted ? (
                  <p className="mt-1 text-sm text-gray-900 dark:text-white py-2">
                    {documentTypes.find((type) => type.value === formData.documentType)?.label}
                  </p>
                ) : (
                  <select
                    value={formData.documentType}
                    onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {documentTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {getDocumentNumberLabel()}
                </label>
                {isSubmitted ? (
                  <p className="mt-1 text-sm text-gray-900 dark:text-white py-2">{formData.documentNumber}</p>
                ) : (
                  <input
                    type="text"
                    value={formData.documentNumber}
                    onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                {isSubmitted ? (
                  <p className="mt-1 text-sm text-gray-900 dark:text-white py-2 capitalize">{formData.gender}</p>
                ) : (
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth</label>
                {isSubmitted ? (
                  <p className="mt-1 text-sm text-gray-900 dark:text-white py-2">
                    {new Date(formData.dob).toLocaleDateString()}
                  </p>
                ) : (
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Country</label>
                {isSubmitted ? (
                  <p className="mt-1 text-sm text-gray-900 dark:text-white py-2">{formData.country}</p>
                ) : (
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select Country</option>
                    <option value="ET">Ethiopia</option>
                    <option value="US">United States</option>
                    <option value="GB">United Kingdom</option>
                    <option value="CA">Canada</option>
                    <option value="DE">Germany</option>
                  </select>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
              {isSubmitted ? (
                <p className="mt-1 text-sm text-gray-900 dark:text-white py-2">{formData.address}</p>
              ) : (
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Initial Balance</label>
              {isSubmitted ? (
                <p className="mt-1 text-sm text-gray-900 dark:text-white py-2">
                  {formData.initialBalance} {user?.currency}
                </p>
              ) : (
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.initialBalance}
                  onChange={(e) => setFormData({ ...formData, initialBalance: Number.parseFloat(e.target.value) || 0 })}
                  placeholder="Enter initial wallet balance"
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Photo URL</label>
              {isSubmitted ? (
                <div className="mt-2">
                  <img
                    src={formData.photoUrl || "/placeholder.svg"}
                    alt="ID Photo"
                    className="h-20 w-20 object-cover rounded-lg"
                  />
                </div>
              ) : (
                <>
                  <input
                    type="url"
                    value={formData.photoUrl}
                    onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                    placeholder="https://example.com/photo.jpg"
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                </>
              )}
            </div>

            {!isSubmitted && (
              <div className="flex justify-end">
                <Button type="submit">Submit KYC Information</Button>
              </div>
            )}
          </form>
        </div>

        {/* Requirements */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-200 mb-4">📋 KYC Requirements</h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <li>• Provide a clear, valid government-issued ID</li>
            <li>• Ensure all information matches your official documents</li>
            <li>• Upload a recent, high-quality photo</li>
            <li>• You'll receive an email notification once verified</li>
          </ul>
        </div>
      </div>

      {/* Processing Dialog */}
      {showProcessingDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl max-w-md w-full">
              <div className="text-center">
                <ClockIcon className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Processing Your Application</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your KYC verification is under review. This usually takes 1-3 business days.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approved Dialog */}
      {showApprovedDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl max-w-md w-full">
              <div className="text-center">
                <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">🎉 Congratulations!</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Your KYC verification has been approved successfully.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Redirecting to dashboard...</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
