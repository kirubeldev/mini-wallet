import { useCallback } from "react";
import useSWRMutation from "swr/mutation";
import useSWR from "swr";
import axiosInstance from "@/lib/axios-Instance";
import { useAuthStore } from "@/store/AuthStore";

interface KycData {
  userId: string;
  fullName: string;
  documentType: string;
  documentNumber: string;
  gender: string;
  dob: string;
  address: string;
  country: string;
  photoUrl: string;
}

const kycSubmitFetcher = async (url: string, { arg }: { arg: { userId: string; kycData: KycData } }) => {
  try {
    const kycResponse = await axiosInstance.post(url, arg.kycData);
    const userResponse = await axiosInstance.patch(`/users/${arg.userId}`, {
      kycStatus: "approved",
    });
    return { 
      kyc: kycResponse.data, 
      user: userResponse.data, 
      fetchedKyc: kycResponse.data 
    };
  } catch (error: any) {
    throw new Error("Failed to submit KYC data: " + (error.message || "Unknown error"));
  }
};

const kycFetchFetcher = async (url: string) => {
  try {
    const response = await axiosInstance.get(url);
    return response.data as KycData[];
  } catch (error) {
    throw new Error("Failed to fetch KYC data");
  }
};

export const useKycSubmit = () => {
  const { setUser, user } = useAuthStore();
  const { 
    trigger: submitTrigger, 
    isMutating: isSubmitting, 
    error: submitError 
  } = useSWRMutation("/kyc", kycSubmitFetcher, {
    revalidate: false,
    populateCache: false,
    throwOnError: false,
  });

  const { 
    data: kycData, 
    error: fetchError, 
    isLoading: isFetching,
    mutate: mutateKyc
  } = useSWR(
    user?.id ? `/kyc?userId=${user.id}` : null,
    kycFetchFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  const submitKyc = useCallback(
    async (userId: string, kycData: KycData) => {
      try {
        const response = await submitTrigger({ userId, kycData });
        if (!response) {
          throw new Error("No response from server");
        }
        
        const { user: updatedUser, fetchedKyc } = response;
        const userData = {
          id: updatedUser.id,
          firstname: updatedUser.firstname || "",
          lastname: updatedUser.lastname || "",
          email: updatedUser.email,
          token: updatedUser.token ?? "",
          kycStatus: updatedUser.kycStatus || "approved",
        };
        
        setUser(userData);
        await mutateKyc([fetchedKyc]);
        return userData;
      } catch (err: any) {
        throw new Error(err.message || "KYC submission failed. Please try again.");
      }
    },
    [submitTrigger, setUser, mutateKyc]
  );

  // Get the first item if array exists, or null
  const userKycData = kycData && kycData.length > 0 ? kycData[0] : null;

  return { 
    submitKyc, 
    isSubmitting, 
    submitError, 
    kycData: userKycData, 
    fetchError, 
    isFetching 
  };
};