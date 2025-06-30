"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/hooks/UseTheamHook";
import { useAuthStore } from "@/store/AuthStore";
import { useAutoLogin, useRegister } from "@/hooks/UseAuthHook";
import { Toaster, toast } from "react-hot-toast";

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

export default function Register() {
  const { register } = useRegister();
  const { setUser } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const { isLoading: isAutoLoginLoading, error: autoLoginError } = useAutoLogin();
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";
    if (!formData.password) newErrors.password = "Password is required";
    else if (!/^\d{6}$/.test(formData.password)) newErrors.password = "Password must be exactly 6 digits";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const userData = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });
      setUser({
        id: userData.id,
        firstname: userData.firstname,
        lastname: userData.lastname,
        email: userData.email,
        profileImage: userData.profileImage || "",
        token: userData.token,
        kycStatus: userData.kycStatus || "not-started",
        currency: "USD",
        theme: userData.theme || "light",
      });
      document.cookie = `token=${userData.token}; path=/; max-age=${60 * 60 * 24 * 7}`;
      console.log(`Register: User registered - User: ${JSON.stringify(userData)}, Token: ${userData.token}`);

      toast.success("Registration successful! Please complete KYC.", {
        style: {
          minWidth: "300px",
          maxWidth: "500px",
          width: "100%",
          padding: "16px",
          borderRadius: "8px",
          background: theme === "dark" ? "#1f2937" : "#ffffff",
          color: theme === "dark" ? "#ffffff" : "#1f2937",
          border: theme === "dark" ? "1px solid #374151" : "1px solid #e5e7eb",
          wordBreak: "break-word",
        },
      });
      setTimeout(() => {
        router.push("/kyc");
      }, 1000);
    } catch (error: any) {
      console.log(`Register: Error - ${error.message}`);
      toast.error(error.message || "Registration failed. Please try again.", {
        style: {
          minWidth: "300px",
          maxWidth: "500px",
          width: "100%",
          padding: "16px",
          borderRadius: "8px",
          background: theme === "dark" ? "#1f2937" : "#ffffff",
          color: theme === "dark" ? "#ffffff" : "#1f2937",
          border: theme === "dark" ? "1px solid #374151" : "1px solid #e5e7eb",
          wordBreak: "break-word",
        },
      });
    }
  };

  if (isAutoLoginLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">Loading...</div>;
  }
  if (autoLoginError) {
    console.log(`AutoLogin Error: ${autoLoginError.message}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-center" />
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
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2"
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
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2"
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
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password (6 digits)
              </label>
              <input
                id="password"
                type="text"
                value={formData.password}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  if (value.length <= 6) {
                    setFormData({ ...formData, password: value });
                  }
                }}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2"
                placeholder="Enter 6-digit password"
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Account
            </button>
          </div>
          <div className="text-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
