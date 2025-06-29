import { useCallback } from "react";
import useSWRMutation from "swr/mutation";
import axiosInstance from "@/lib/axios-Instance";
import { useAuthStore } from "@/store/AuthRegistrationStore"; 

// I have defined the User interface to match the JSON server, aligning with useRegister and AuthStore.
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
const fetcher = async (url: string, { arg }: { arg: string }) => {
  try {
    const response = await axiosInstance.get(`${url}?email=${arg}`);
    return response.data as User[];
  } catch (error: any) {
    throw new Error("Failed to fetch user data: " + (error.message || "Unknown error"));
  }
};

// I have created a function to fetch user by ID to ensure all fields are retrieved.
const fetchUserById = async (id: string) => {
  try {
    const response = await axiosInstance.get(`/users/${id}`);
    return response.data as User;
  } catch (error: any) {
    throw new Error("Failed to fetch user by ID: " + (error.message || "Unknown error"));
  }
};

// I have used useSWRMutation to fetch user data and simulate POST /login.
export const useLogin = () => {
  const { setUser } = useAuthStore();
  const { trigger, isMutating, error } = useSWRMutation(
    "/users",
    fetcher,
    { revalidate: false, populateCache: false, throwOnError: false }
  );

  // I have created a login function to authenticate the user and fetch complete user data by ID.
  const login = useCallback(
    async (email: string, password: string) => {
      try {
        // I have used trigger to fetch user data by email to validate credentials.
        const data = await trigger(email);
        if (!data || data.length === 0) {
          throw new Error("User not found");
        }
        const fetchedUser = data[0];
        // I have logged the raw fetched user data for debugging.
        console.log(`Login: Raw fetched user (by email) - ${JSON.stringify(fetchedUser)}`);
        if (fetchedUser.password !== password) {
          throw new Error("Invalid Credentials");
        }
        if (!fetchedUser.token) {
          throw new Error("No token found for user");
        }
        // I have fetched the full user data by ID to ensure all fields are included.
        const fullUserData = await fetchUserById(fetchedUser.id);
        // I have logged the raw user data from ID fetch for debugging.
        console.log(`Login: Raw fetched user (by ID) - ${JSON.stringify(fullUserData)}`);
        // I have mapped the fetched user to match the AuthStore's User interface.
        const userData = {
          id: fullUserData.id,
          firstname: fullUserData.firstname || "Guest", // I have used firstname from db.json with fallback.
          lastname: fullUserData.lastname || "",        // I have used lastname from db.json with fallback.
          email: fullUserData.email,
          token: fullUserData.token as string, // Ensure token is string
        };
        // I have stored the user in the Zustand store using setUser.
        setUser(userData);
        // I have set the token in a cookie for middleware authentication.
        document.cookie = `token=${userData.token}; path=/; max-age=${60 * 60 * 24 * 7}`;
        // I have logged the user and token for debugging.
        console.log(`Login: User logged in - User: ${JSON.stringify(userData)}, Token: ${userData.token}`);
        return { user: userData, kycStatus: fullUserData.kycStatus || "pending" };
      } catch (err: any) {
        // I have logged the error for debugging.
        console.log(`Login: Error - ${err.message}`);
        throw new Error(err.message || "Login failed. Please try again.");
      }
    },
    [trigger, setUser]
  );

  return { login, isLoading: isMutating, error };
};