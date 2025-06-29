import { useCallback } from "react";
import useSWRMutation from "swr/mutation";
import axiosInstance from "@/lib/axios-Instance";
import { useAuthStore } from "@/store/AuthRegistrationStore"; // I have updated to useAuthStore to align with Layout.tsx and Register.tsx.

// I have defined the User interface to match the JSON server and AuthStore for consistency.
interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  currency: string;
  theme: "light" | "dark";
  profileImage?: string;
  minBalance: number;
  kycStatus: "pending" | "approved" | "rejected";
  kycData?: {
    fullName: string;
    documentType: string;
    documentNumber: string;
    gender: string;
    dob: string;
    address: string;
    country: string;
    photoUrl: string;
    initialBalance: number;
  };
  token?: string;
}

// I have created a fetcher function for SWR mutation to get user by email.
const fetcherByEmail = async (url: string, { arg }: { arg: string }) => {
  try {
    const response = await axiosInstance.get(`${url}?email=${arg}`);
    return response.data as User[];
  } catch (error: any) {
    throw new Error("Failed to fetch user data by email: " + (error.message || "Unknown error"));
  }
};

// I have created a fetcher function for SWR mutation to get user by ID.
const fetcherById = async (url: string, { arg }: { arg: string }) => {
  try {
    const response = await axiosInstance.get(`/users/${arg}`);
    return response.data as User;
  } catch (error: any) {
    throw new Error("Failed to fetch user data by ID: " + (error.message || "Unknown error"));
  }
};

// I have used useSWRMutation to fetch user data and simulate POST /login.
export const useLogin = () => {
  const { setUser } = useAuthStore(); // I have updated to useAuthStore for consistency with Register.tsx and Layout.tsx.
  const { trigger: triggerEmail, isMutating: isMutatingEmail, error: errorEmail } = useSWRMutation(
    "/users",
    fetcherByEmail,
    { revalidate: false, populateCache: false, throwOnError: false }
  );
  const { trigger: triggerId, isMutating: isMutatingId, error: errorId } = useSWRMutation(
    "/users",
    fetcherById,
    { revalidate: false, populateCache: false, throwOnError: false }
  );

  // I have created a login function to authenticate the user and fetch complete user data by ID.
  const login = useCallback(
    async (email: string, password: string) => {
      try {
        // I have used triggerEmail to fetch user data by email to validate credentials.
        const data = await triggerEmail(email);
        if (!data || data.length === 0) {
          throw new Error("User not found");
        }
        const fetchedUser = data[0];
        // I have logged the raw fetched user data from email fetch for debugging.
        console.log(`Login: Raw fetched user (by email) - ${JSON.stringify(fetchedUser)}`);
        if (fetchedUser.password !== password) {
          throw new Error("Invalid Credentials");
        }
        if (!fetchedUser.token) {
          throw new Error("No token found for user");
        }
        // I have used triggerId to fetch the full user data by ID to ensure all fields are included.
        const fullUserData = await triggerId(fetchedUser.id);
        // I have logged the raw user data from ID fetch for debugging.
        console.log(`Login: Raw fetched user (by ID) - ${JSON.stringify(fullUserData)}`);
        // I have mapped the fetched user to match the AuthStore's User interface.
        const userData = {
          id: fullUserData.id,
          firstname: fullUserData.firstname || "Guest", // I have used firstname from db.json with fallback.
          lastname: fullUserData.lastname || "",        // I have used lastname from db.json with fallback.
          email: fullUserData.email,
          token: fullUserData.token ?? "", // Ensure token is always a string
        };
        // I have stored the user in the Zustand store using setUser to make user data visible.
        setUser(userData);
        // I have set the token in a cookie for middleware authentication.
        document.cookie = `token=${userData.token}; path=/; max-age=${60 * 60 * 24 * 7}`;
        // I have logged the user and token for debugging to verify user data visibility.
        console.log(`Login: User logged in - User: ${JSON.stringify(userData)}, Token: ${userData.token}`);
        return { user: userData, kycStatus: fullUserData.kycStatus || "pending" };
      } catch (err: any) {
        // I have logged the error for debugging.
        console.log(`Login: Error - ${err.message}`);
        throw new Error(err.message || "Login failed. Please try again.");
      }
    },
    [triggerEmail, triggerId, setUser]
  );

  return { login, isLoading: isMutatingEmail || isMutatingId, error: errorEmail || errorId };
};