import { useState, useCallback } from "react";
import useSWRMutation from "swr/mutation";
import axiosInstance from "@/lib/axios-Instance";
import { useAuthStore } from "@/store/AuthStore";

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

const updateProfileFetcher = async (
  url: string,
  { arg }: { arg: { userId: string; email?: string; profileImage?: string } }
) => {
  try {
    const response = await axiosInstance.patch(url, {
      email: arg.email,
      profileImage: arg.profileImage,
    });
    return response.data as User;
  } catch (error: any) {
    throw new Error("Failed to update profile: " + (error.message || "Unknown error"));
  }
};

export const useProfileUpdate = () => {
  const { user, setUser } = useAuthStore();
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning";
  } | null>(null);

  const { trigger, isMutating } = useSWRMutation(
    user?.id ? `/users/${user.id}` : "",
    updateProfileFetcher,
    { revalidate: false, populateCache: false, throwOnError: false }
  );

  const updateProfile = useCallback(
    async (email: string, profileImage: string) => {
      if (!user?.id) {
        setToast({
          message: "User not authenticated. Please log in.",
          type: "error",
        });
        return;
      }
      try {
        console.log(`useProfileUpdate: Updating profile for user ${user.id} - Email: ${email}, ProfileImage: ${profileImage}`);
        const updatedUser = await trigger({ userId: user.id, email, profileImage });
        setUser({ 
          ...user, 
          email: updatedUser.email ?? user.email, 
          profileImage: updatedUser.profileImage ?? user.profileImage 
        });
        setToast({
          message: "Profile updated successfully!",
          type: "success",
        });
      } catch (error: any) {
        console.error(`useProfileUpdate: Error updating profile - ${error.message}`);
        setToast({
          message: "Failed to update profile. Please try again.",
          type: "error",
        });
      }
    },
    [user, setUser, trigger]
  );

  return { updateProfile, toast, setToast, isLoading: isMutating };
};