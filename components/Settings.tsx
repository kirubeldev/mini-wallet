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
                          src={formData.profileImage || "/placeholder.svg"}
                          alt="Profile preview"
                          className="h-full w-full object-cover"
                          onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <input
                          id="profileImage"
                          type="url"
                          value={formData.profileImage}
                          onChange={(e) => setFormData({ ...formData, profileImage: e.target.value })}
                          placeholder="https://example.com/profile.jpg"
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
                      src={user.profileImage || "/placeholder.svg"}
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

        {profileToast && (["success", "error"].includes(profileToast.type) ? (
          <Toast
            message={profileToast.message}
            type={profileToast.type as "success" | "error"}
            onClose={() => setProfileToast(null)}
          />
        ) : null)}
      </div>
    </Layout>
  );
}