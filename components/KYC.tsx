"use client";

import type React from "react";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/AuthStore";
import { useTheme } from "@/hooks/UseTheamHook";
import Layout from "@/components/ui/LayoutNavs";
import { Button } from "@/components/ui/button";
import Toast from "@/components/ui/Toast";
import Skeleton from "react-loading-skeleton";
import { CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useKycSubmit } from "@/hooks/UseKycSubmit";
import { useAutoLogin } from "@/hooks/UseAuthHook";
import { Suspense, lazy } from "react";

const KYCSuccessDialog = lazy(() => import("../components/ui/kycSuccesDialog"));

interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  password?: string;
  currency: string;
  theme: "light" | "dark";
  profileImage?: string;
  kycStatus: "not-started" | "approved";
  token?: string;
}

export default function KYC() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const { submitKyc, isSubmitting, submitError, kycData, fetchError, isFetching } = useKycSubmit();
  const { isLoading: isAutoLoginLoading, error: autoLoginError } = useAutoLogin();
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    userId: user?.id || "",
    fullName: "",
    documentType: "national_id",
    documentNumber: "",
    gender: "",
    dob: "",
    address: "",
    country: "",
    photoUrl: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showProcessingDialog, setShowProcessingDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [ageError, setAgeError] = useState(false);

  useEffect(() => {
    if (kycData && user?.id && kycData.userId === user.id) {
      setFormData({
        userId: user.id,
        fullName: kycData.fullName || "",
        documentType: kycData.documentType || "national_id",
        documentNumber: kycData.documentNumber || "",
        gender: kycData.gender || "",
        dob: kycData.dob || "",
        address: kycData.address || "",
        country: kycData.country || "",
        photoUrl: kycData.photoUrl || "",
      });
    }
  }, [kycData, user?.id]);

  const documentTypes = useMemo(
    () => [
      { value: "national_id", label: "National ID" },
      { value: "passport", label: "Passport" },
      { value: "driver_license", label: "Driver License" },
    ],
    []
  );

  const countries = useMemo(
    () => [
      { value: "ET", label: "🇪🇹 Ethiopia" },
      { value: "US", label: "🇺🇸 United States" },
      { value: "GB", label: "🇬🇧 United Kingdom" },
      { value: "CA", label: "🇨🇦 Canada" },
      { value: "DE", label: "🇩🇪 Germany" },
      { value: "FR", label: "🇫🇷 France" },
      { value: "IN", label: "🇮🇳 India" },
      { value: "JP", label: "🇯🇵 Japan" },
      { value: "CN", label: "🇨🇳 China" },
      { value: "BR", label: "🇧🇷 Brazil" },
      { value: "AU", label: "🇦🇺 Australia" },
      { value: "ZA", label: "🇿🇦 South Africa" },
      { value: "NG", label: "🇳🇬 Nigeria" },
      { value: "KE", label: "🇰🇪 Kenya" },
      { value: "EG", label: "🇪🇬 Egypt" },
    ],
    []
  );

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.documentType) newErrors.documentType = "Document type is required";
    if (!formData.documentNumber.trim()) newErrors.documentNumber = "Document number is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.dob) newErrors.dob = "Date of birth is required";
    else {
      const dob = new Date(formData.dob);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      if (age < 18) {
        newErrors.dob = "You must be at least 18 years old";
        setAgeError(true);
      } else {
        setAgeError(false);
      }
    }
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.country) newErrors.country = "Country is required";
    if (!formData.photoUrl.trim()) newErrors.photoUrl = "Photo URL is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getDocumentNumberLabel = () => {
    switch (formData.documentType) {
      case "passport":
        return "Passport Number";
      case "driver_license":
        return "Driver License Number";
      case "national_id":
      default:
        return "National ID Number";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      setToast({ message: "Invalid user ID. Please log in again.", type: "error" });
      router.push("/auth/login");
      return;
    }

    if (!validateForm()) {
      if (ageError) {
        setToast({ message: "You must be at least 18 years old to submit KYC.", type: "error" });
      } else if (!toast || toast.message !== "You must be at least 18 years old to submit KYC.") {
        setToast({ message: "Please fill all required fields correctly.", type: "error" });
      }
      return;
    }

    try {
      const kycData = {
        userId: user.id,
        fullName: formData.fullName,
        documentType: formData.documentType,
        documentNumber: formData.documentNumber,
        gender: formData.gender,
        dob: formData.dob,
        address: formData.address,
        country: formData.country,
        photoUrl: formData.photoUrl,
      };
      await submitKyc(user.id, kycData);

      setToast({ message: "KYC submitted and wallet created successfully!", type: "success" });
      setShowProcessingDialog(true);
      document.body.style.cursor = "wait";

      setTimeout(() => {
        setShowProcessingDialog(false);
        setShowSuccessDialog(true);
        document.body.style.cursor = "default";
      }, 3000);
    } catch (err: any) {
      console.log(`Kyc: Error - ${err.message}`);
      setToast({ message: err.message || "KYC submission or wallet creation failed. Please try again.", type: "error" });
    }
  };

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    router.push("/wallet");
  };

  const getStatusIcon = () => {
    switch (user?.kycStatus) {
      case "approved":
        return <CheckCircleIcon className="h-8 w-8 text-green-500" />;
      case "not-started":
      default:
        return <ExclamationTriangleIcon className="h-8 w-8 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (user?.kycStatus) {
      case "approved":
        return "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700";
      case "not-started":
      default:
        return "bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-700";
    }
  };

  const getStatusMessage = () => {
    switch (user?.kycStatus) {
      case "approved":
        return "Your identity has been verified successfully. You now have full access.";
      case "not-started":
      default:
        return "Please complete your KYC verification to unlock all features including transfers.";
    }
  };

  const isApproved = user?.kycStatus === "approved";
  const showReadOnlyFields = isApproved;

  if (isAutoLoginLoading || isFetching) {
    return (
      <Layout>
        <div className="space-y-6 p-6">
          <div>
            <Skeleton height={32} width={200} />
            <Skeleton height={16} width={300} />
          </div>
          <div className="border rounded-lg p-6">
            <Skeleton circle height={32} width={32} />
            <Skeleton height={20} width={150} />
            <Skeleton height={16} width={250} />
          </div>
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <Skeleton height={24} width={200} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} height={40} />
              ))}
            </div>
            <Skeleton height={80} />
            <Skeleton height={40} />
            <Skeleton height={40} width={200} />
          </div>
          <div className="border rounded-lg p-6">
            <Skeleton height={24} width={150} />
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} height={16} width={200} />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (autoLoginError) {
    console.log(`AutoLogin Error: ${autoLoginError.message}`);
    setToast({ message: "Failed to authenticate. Please log in again.", type: "error" });
  }
  if (fetchError) {
    console.log(`KycFetch Error: ${fetchError.message}`);
    setToast({ message: "Failed to load KYC data.", type: "error" });
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">KYC Verification</h1>
          <p className="text-gray-600 dark:text-gray-400">Complete your identity verification to access all features</p>
        </div>

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

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {showReadOnlyFields ? "Your KYC Information" : "Identity Verification Form"}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                {showReadOnlyFields ? (
                  <div className="mt-1 p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                    <p className="text-sm text-gray-900 dark:text-white">{formData.fullName}</p>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                    {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Document Type</label>
                {showReadOnlyFields ? (
                  <div className="mt-1 p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {documentTypes.find((type) => type.value === formData.documentType)?.label}
                    </p>
                  </div>
                ) : (
                  <>
                    <select
                      value={formData.documentType}
                      onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      disabled={isSubmitting}
                    >
                      {documentTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    {errors.documentType && <p className="mt-1 text-sm text-red-600">{errors.documentType}</p>}
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {getDocumentNumberLabel()}
                </label>
                {showReadOnlyFields ? (
                  <div className="mt-1 p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                    <p className="text-sm text-gray-900 dark:text-white">{formData.documentNumber}</p>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={formData.documentNumber}
                      onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                    {errors.documentNumber && <p className="mt-1 text-sm text-red-600">{errors.documentNumber}</p>}
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                {showReadOnlyFields ? (
                  <div className="mt-1 p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                    <p className="text-sm text-gray-900 dark:text-white capitalize">{formData.gender}</p>
                  </div>
                ) : (
                  <>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      disabled={isSubmitting}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                    {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth</label>
                {showReadOnlyFields ? (
                  <div className="mt-1 p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {formData.dob ? new Date(formData.dob).toLocaleDateString() : ""}
                    </p>
                  </div>
                ) : (
                  <>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                    {errors.dob && <p className="mt-1 text-sm text-red-600">{errors.dob}</p>}
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Country</label>
                {showReadOnlyFields ? (
                  <div className="mt-1 p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {countries.find((c) => c.value === formData.country)?.label || formData.country}
                    </p>
                  </div>
                ) : (
                  <>
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      disabled={isSubmitting}
                    >
                      <option value="">Select Country</option>
                      {countries.map((country) => (
                        <option key={country.value} value={country.value}>
                          {country.label}
                        </option>
                      ))}
                    </select>
                    {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country}</p>}
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
              {showReadOnlyFields ? (
                <div className="mt-1 p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                  <p className="text-sm text-gray-900 dark:text-white">{formData.address}</p>
                </div>
              ) : (
                <>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                  {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Selfie Photo URL</label>
              {showReadOnlyFields ? (
                <div className="mt-2">
                  <img
                    src={formData.photoUrl || ""}
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
                    disabled={isSubmitting}
                  />
                  {formData.photoUrl && (
                    <div className="mt-2">
                      <img
                        src={formData.photoUrl || ""}
                        alt="Preview"
                        className="h-20 w-20 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                  {errors.photoUrl && <p className="mt-1 text-sm text-red-600">{errors.photoUrl}</p>}
                </>
              )}
            </div>

            {!isApproved && (
              <div className="flex justify-start">
                <Button
                  type="submit"
                  className="w-fit text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit KYC Information"}
                </Button>
              </div>
            )}
          </form>
        </div>

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

      {showProcessingDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl max-w-md w-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Processing Your Application</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your KYC verification is being processed. Please wait...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Suspense fallback={<div>Loading dialog...</div>}>
        <KYCSuccessDialog
          isOpen={showSuccessDialog}
          onClose={handleSuccessDialogClose}
          onRedirect={handleSuccessDialogClose}
        />
      </Suspense>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </Layout>
  );
}