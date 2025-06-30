"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/AuthStore";
import Layout from "./ui/LayoutNavs";
import { Button } from "@/components/ui/button";
import Toast from "./ui/Toast";
import { User, Shield, Mail } from "lucide-react";
import { useProfileUpdate } from "@/hooks/UseProfileupdateHook";
import { useAutoLogin } from "@/hooks/UseAuthHook";

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

export default function Settings() {
  const { user } = useAuthStore();
  const { updateProfile, toast: profileToast, setToast: setProfileToast, isLoading: isUpdating } = useProfileUpdate();
  const { isLoading: isAutoLoginLoading } = useAutoLogin();
  const [formData, setFormData] = useState({
    email: user?.email || "",
    profileImage: user?.profileImage || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || "",
        profileImage: user.profileImage || "",
      });
      setIsLoading(false);
    }
  }, [user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Valid email is required";
    }
    if (!formData.profileImage.trim()) {
      newErrors.profileImage = "Profile image URL is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setProfileToast({ message: "Please fill all fields correctly.", type: "error" });
      return;
    }
    try {
      if (user?.id) {
        console.log(`${user.id}gggggggggggggggg`);
      }

      await updateProfile(formData.email, formData.profileImage);
      setProfileToast({ message: "Profile updated successfully!", type: "success" });
    } catch (error: any) {
      setProfileToast({ message: error.message || "Failed to update profile.", type: "error" });
    }
  };

  const getKycStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800 border border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "rejected":
        return "bg-red-100 text-red-800 border border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  if (isAutoLoginLoading || isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <p className="text-red-600 dark:text-red-400">Please log in to view settings.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <User className="h-8 w-8 text-blue-600" />
            Account Settings
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your email and profile image
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold௹semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Profile Settings
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Update your email and profile image
                </p>
              </div>
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <label
                      htmlFor="email"
                      className="block text-base font-medium text-gray-700 dark:text-gray-300"
                    >
                      Email
                    </label>
                    <div className="space-y-2">
                      <input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="example@domain.com"
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition duration-200 ${
                          errors.email ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                      <p className="text-sm text-gray-500 dark:text-gray-400">Enter your email address</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label
                      htmlFor="profileImage"
                      className="block text-base font-medium text-gray-700 dark:text-gray-300"
                    >
                      Profile Image
                    </label>
                    <div className="flex items-start gap-4">
                      <div className="relative h-20 w-20 rounded-full border-2 border-gray-200 overflow-hidden bg-gray-100">
                        <img
                          src={formData.profileImage || ""}
                          alt="Profile preview"
                          className="h-full w-full object-cover"
                          onError={(e) => (e.currentTarget.src = "")}
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <input
                          id="profileImage"
                          type="url"
                          value={formData.profileImage}
                          onChange={(e) => setFormData({ ...formData, profileImage: e.target.value })}
                          placeholder="data:image/jpeg;base64,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"
                          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition duration-200 ${
                            errors.profileImage ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        {errors.profileImage && <p className="text-sm text-red-600">{errors.profileImage}</p>}
                        <p className="text-sm text-gray-500 dark:text-gray-400">Enter a URL for your profile image</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={isUpdating}
                    >
                      {isUpdating ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
              <div className="text-center p-6">
                <div className="flex justify-center mb-4">
                  <div className="relative h-24 w-24 rounded-full border-4 border-white shadow-lg overflow-hidden">
                    <img
                      src={user.profileImage || ""}
                      alt="Profile"
                      className="h-full w-full object-cover"
                      onError={(e) => (e.currentTarget.src = "")}
                    />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {user.firstname} {user.lastname}
                </h3>
                <p  className="text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1 mt-1">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Account Details
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">KYC Status</span>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-md ${getKycStatusColor(
                      user.kycStatus || "not-started"
                    )}`}
                  >
                    { user.kycStatus?.toUpperCase() || "NOT-STARTED"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {profileToast && (
          <Toast
            message={profileToast.message}
            type={profileToast.type}
            onClose={() => setProfileToast(null)}
          />
        )}
      </div>
    </Layout>
  );
}