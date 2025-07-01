import type React from "react";
import { useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

const toastStyles = {
  success: "bg-green-300 dark:bg-green-700/50 text-green-800 dark:text-green-200 border-green-400 dark:border-green-600",
  error: "bg-red-300 dark:bg-red-700/50 text-red-800 dark:text-red-200 border-red-400 dark:border-red-600",
};

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Dismiss after 3 seconds

    return () => clearTimeout(timer); // Cleanup timer on unmount
  }, [onClose]);

  return (
    <div
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[1000] min-w-[300px] max-w-[500px] w-full p-4 rounded-md shadow-lg border ${toastStyles[type]} flex items-center justify-between custom-toast`}
      style={{ wordBreak: "break-word" }}
    >
      <span>{message}</span>
      <button onClick={onClose} className="text-current hover:text-gray-600 dark:hover:text-gray-300">
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
}