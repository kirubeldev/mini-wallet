"use client";

import type React from "react";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  HomeIcon,
  WalletIcon,
  ArrowsRightLeftIcon,
  DocumentCheckIcon,
  Cog6ToothIcon,
  SunIcon,
  MoonIcon,
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useAuthStore } from "@/store/AuthStore";
import { useTheme } from "@/hooks/UseTheamHook";
import { useAutoLogin } from "@/hooks/UseAuthHook";
import axiosInstance from "@/lib/axios-Instance";

interface LayoutProps {
  children: React.ReactNode;
}

export interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  password?: string;
  currency: string;
  theme: "light" | "dark";
  profileImage: string;
  kycStatus: "not-started" | "approved";
  token?: string;
}

const validateUser = (data: any): User | null => {
  if (!data?.id || !data?.email) return null;
  
  return {
    id: data.id,
    firstname: data.firstname || "Guest",
    lastname: data.lastname || "",
    email: data.email,
    password: data.password,
    currency: data.currency || "USD",
    theme: data.theme === "dark" ? "dark" : "light",
    profileImage: data.profileImage || "",
    kycStatus: data.kycStatus === "approved" ? "approved" : "not-started",
    token: data.token || ""
  };
};

export default function Layout({ children }: LayoutProps) {
  const { isLoading: isAutoLoginLoading, error: autoLoginError } = useAutoLogin();
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
    { name: "Wallets", href: "/wallet", icon: WalletIcon },
    { name: "Transactions", href: "/transactions", icon: ArrowsRightLeftIcon },
    { name: "KYC", href: "/kyc", icon: DocumentCheckIcon },
    { name: "Settings", href: "/settings", icon: Cog6ToothIcon },
  ];

  const handleLogout = async () => {
    try {
      console.log(`Logout: Clearing user - User: ${JSON.stringify(user)}, Token: ${user?.token || 'none'}`);
      
      if (user?.token) {
        // Optional: Add API call to invalidate token on server if needed
        await axiosInstance.post("/auth/logout", { token: user.token });
      }
      
      setUser(null);
      document.cookie = 'token=; path=/; max-age=0';
      setUserMenuOpen(false);
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout fails, clear local state
      setUser(null);
      document.cookie = 'token=; path=/; max-age=0';
      router.push("/auth/login");
    }
  };

  if (isAutoLoginLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        Loading...
      </div>
    );
  }

  if (autoLoginError) {
    console.log(`AutoLogin Error: ${autoLoginError.message}`);
  }

  console.log(`Layout: User data - ${JSON.stringify(user)}`);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white dark:bg-gray-800">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">💰 Mini Wallet</h1>
            <button onClick={() => setSidebarOpen(false)}>
              <XMarkIcon className="h-6 w-6 text-gray-500" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-6 w-6" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">💰 Mini Wallet</h1>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  <item.icon className="mr-3 h-6 w-6" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Left side - Mobile menu button */}
            <div className="flex items-center">
              <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Bars3Icon className="h-6 w-6 text-gray-500" />
              </button>
              <div className="hidden lg:block"></div>
            </div>

            {/* Right side - Theme toggle and User menu */}
            <div className="flex items-center space-x-4 ml-auto">
              <button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="p-2 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              >
               
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                    {(user?.firstname?.[0] || "G") + (user?.lastname?.[0] || "U")}
                  </div>

                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user ? `${user.firstname || "Guest"} ${user.lastname || ""}` : "Guest"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.email || "guest@example.com"}
                    </p>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="py-1">
                      <Link
                        href="/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <UserIcon className="h-4 w-4 mr-3" />
                        Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>

      {/* Click outside to close user menu */}
      {userMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />}
    </div>
  );
}