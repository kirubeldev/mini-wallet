import { useCallback } from "react";
import useSWRMutation from "swr/mutation";
import useSWR from "swr";
import axiosInstance from "@/lib/axios-Instance";
import { useAuthStore } from "@/store/AuthStore";
import { v4 as uuidv4 } from "uuid";

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

interface Wallet {
  walletId: string;
  userId: string;
  accountNumber: string;
  balance: number;
  createdAt: string;
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

const walletFetcher = async (url: string) => {
  const response = await axiosInstance.get(url);
  return response.data as Wallet[];
};

const addWalletFetcher = async (url: string, { arg }: { arg: Wallet }) => {
  const response = await axiosInstance.post(url, arg);
  return response.data;
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

  const { data: walletData } = useSWR(
    user?.id ? `/wallets?userId=${user.id}` : null,
    walletFetcher,
    { revalidateOnFocus: false }
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

        // Check if user has any wallets
        const hasWallets = walletData && walletData.length > 0;
        if (!hasWallets) {
          // Create a new wallet for first-time KYC submission
          const walletId = uuidv4();
          const accountNumber = uuidv4();
          
          // Check if accountNumber is unique
          const checkAccountResponse = await axiosInstance.get(`/wallets?accountNumber=${accountNumber}`);
          if (checkAccountResponse.data.length > 0) {
            throw new Error("Account number already exists. Please try again.");
          }

          const walletResponse = await axiosInstance.post("/wallets", {
            walletId,
            userId: user.id,
            accountNumber,
            balance: 0,
            createdAt: new Date().toISOString(),
          });

          console.log("submitKyc: Wallet created for first-time KYC:", walletResponse.data);
        }

        return userData;
      } catch (err: any) {
        throw new Error(err.message || "KYC submission or wallet creation failed. Please try again.");
      }
    },
    [submitTrigger, setUser, mutateKyc, user, walletData]
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