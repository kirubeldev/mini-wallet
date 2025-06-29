import { useCallback, useEffect, useState } from "react";
import useSWRMutation from "swr/mutation";
import axiosInstance from "@/lib/axios-Instance";
import { useAuthStore } from "@/store/AuthStore";

// I have updated KycData to remove initialBalance and add userId.
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

// I have updated the fetcher to set kycStatus to "approved" and include userId.
const kycSubmitFetcher = async (url: string, { arg }: { arg: { userId: string; kycData: KycData } }) => {
  try {
    // I have posted KYC data to /kyc with userId.
    const kycResponse = await axiosInstance.post("/kyc", {
      ...arg.kycData,
    });
    // I have updated the user's kycStatus to "approved" without kycData.
    const userResponse = await axiosInstance.patch(`/users/${arg.userId}`, {
      kycStatus: "approved",
    });
    // I have fetched the KYC data post-submission.
    const kycFetchResponse = await axiosInstance.get(`/kyc?userId=${arg.userId}`);
    return { kyc: kycResponse.data, user: userResponse.data, fetchedKyc: kycFetchResponse.data[0] || null };
  } catch (error: any) {
    throw new Error("Failed to submit KYC data: " + (error.message || "Unknown error"));
  }
};

// I have created a fetcher to get KYC data by userId.
const kycFetchFetcher = async (url: string, { arg }: { arg: string }) => {
  try {
    const response = await axiosInstance.get(`/kyc?userId=${arg}`);
    return response.data as KycData[];
  } catch (error: any) {
    throw new Error("Failed to fetch KYC data: " + (error.message || "Unknown error"));
  }
};

// I have updated useKycSubmit to handle userId and auto-approve KYC.
export const useKycSubmit = () => {
  const { setUser, user } = useAuthStore();
  const { trigger: submitTrigger, isMutating: isSubmitting, error: submitError } = useSWRMutation("/kyc", kycSubmitFetcher, {
    revalidate: false,
    populateCache: false,
    throwOnError: false,
  });
  const { trigger: fetchTrigger, data: kycData, error: fetchError } = useSWRMutation("/kyc", kycFetchFetcher, {
    revalidate: false,
    populateCache: false,
    throwOnError: false,
  });
  const [fetchedKycData, setFetchedKycData] = useState<KycData | null>(null);

  // I have fetched KYC data for approved users.
  useEffect(() => {
    const fetchKycData = async () => {
      if (!user?.id || user?.kycStatus !== "approved") return;
      try {
        console.log(`KycSubmit: Fetching KYC data for userId - ${user.id}`);
        const data = await fetchTrigger(user.id);
        if (data && data.length > 0) {
          setFetchedKycData(data[0]);
          console.log(`KycSubmit: Fetched KYC data - ${JSON.stringify(data[0])}`);
        } else {
          console.log(`KycSubmit: No KYC data found for userId - ${user.id}`);
        }
      } catch (err: any) {
        console.log(`KycSubmit: Fetch error - ${err.message}`);
      }
    };
    fetchKycData();
  }, [user?.id, user?.kycStatus, fetchTrigger]);

  const submitKyc = useCallback(
    async (userId: string, kycData: KycData) => {
      try {
        console.log(`KycSubmit: Sending POST to /kyc and PATCH to /users/${userId} with data:`, {
          ...kycData,
        });
        const response = await submitTrigger({ userId, kycData });
        if (!response) {
          throw new Error("No response from server");
        }
        const { user: updatedUser, fetchedKyc } = response;
        const userData = {
          id: updatedUser.id,
          firstname: updatedUser.firstname || "Guest",
          lastname: updatedUser.lastname || "",
          email: updatedUser.email,
          token: updatedUser.token ?? "",
          kycStatus: updatedUser.kycStatus || "not-started",
        };
        setUser(userData);
        setFetchedKycData(fetchedKyc);
        console.log(`KycSubmit: User updated in store - User: ${JSON.stringify(userData)}`);
        console.log(`KycSubmit: KYC data set - ${JSON.stringify(fetchedKyc)}`);
        return userData;
      } catch (err: any) {
        console.log(`KycSubmit: Error - ${err.message}`);
        throw new Error(err.message || "KYC submission failed. Please try again.");
      }
    },
    [submitTrigger, setUser]
  );

  return { submitKyc, isSubmitting, submitError, kycData: fetchedKycData, fetchError };
};