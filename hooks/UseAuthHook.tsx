import { useCallback, useEffect } from "react";
import useSWRMutation from "swr/mutation";
import axiosInstance from "@/lib/axios-Instance";
import { useAuthStore } from "@/store/AuthStore";

// I have defined the User interface to match the JSON server and AuthStore, including kycStatus with all possible values.
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
  kycStatus:  "not-started" | "approved" 
 
  token?: string;
}

// I have created a fetcher function for SWR mutation to get user by email for login.
const fetcherByEmail = async (url: string, { arg }: { arg: string }) => {
  try {
    const response = await axiosInstance.get(`${url}?email=${arg}`);
    return response.data as User[];
  } catch (error: any) {
    throw new Error("Failed to fetch user data by email: " + (error.message || "Unknown error"));
  }
};

// I have created a fetcher function for SWR mutation to get user by ID for login.
const fetcherById = async (url: string, { arg }: { arg: string }) => {
  try {
    const response = await axiosInstance.get(`/users/${arg}`);
    return response.data as User;
  } catch (error: any) {
    throw new Error("Failed to fetch user data by ID: " + (error.message || "Unknown error"));
  }
};

// I have created a fetcher function for SWR mutation to get user by token for auto-login.
const fetcherByToken = async (url: string, { arg }: { arg: string }) => {
  try {
    const response = await axiosInstance.get(`${url}?token=${arg}`);
    return response.data as User[];
  } catch (error: any) {
    throw new Error("Failed to fetch user data by token: " + (error.message || "Unknown error"));
  }
};

// I have created a simple function to generate a fake token for the user during registration.
const generateFakeToken = () => {
  return `token-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
};

// I have created the useAutoLogin hook to fetch user data on page load/refresh using the token from cookies.
export const useAutoLogin = () => {
  const { setUser } = useAuthStore();
  const { trigger, isMutating, error } = useSWRMutation("/users", fetcherByToken, {
    revalidate: false,
    populateCache: false,
    throwOnError: false,
  });

  // I have created a function to get the token from cookies.
  const getTokenFromCookies = () => {
    const cookies = document.cookie.split(";").map((cookie) => cookie.trim());
    const tokenCookie = cookies.find((cookie) => cookie.startsWith("token="));
    return tokenCookie ? tokenCookie.split("=")[1] : null;
  };

  // I have used useEffect to fetch user data on mount if a token exists.
  useEffect(() => {
    const autoLogin = async () => {
      const token = getTokenFromCookies();
      if (!token) {
        console.log("AutoLogin: No token found in cookies");
        return;
      }

      try {
        console.log(`AutoLogin: Fetching user with token - ${token}`);
        const data = await trigger(token);
        if (!data || data.length === 0) {
          console.log("AutoLogin: No user found for token");
          return;
        }
        const fetchedUser = data[0];
        // I have logged the fetched user data for debugging.
        console.log(`AutoLogin: Raw fetched user - ${JSON.stringify(fetchedUser)}`);
        // I have mapped the fetched user to match the AuthStore's User interface.
        const userData = {
          id: fetchedUser.id,
          firstname: fetchedUser.firstname || "Guest",
          lastname: fetchedUser.lastname || "",
          email: fetchedUser.email,
          token: fetchedUser.token ?? "",
          kycStatus: fetchedUser.kycStatus || "not-started",
        };
        // I have stored the user in the Zustand store.
        setUser(userData);
        console.log(`AutoLogin: User set in store - User: ${JSON.stringify(userData)}`);
      } catch (err: any) {
        console.log(`AutoLogin: Error - ${err.message}`);
        // I have cleared the invalid token to prevent repeated failed attempts.
        document.cookie = "token=; path=/; max-age=0";
      }
    };

    autoLogin();
  }, [trigger, setUser]);

  return { isLoading: isMutating, error };
};

// I have updated the useLogin hook to include kycStatus in the stored user data.
export const useLogin = () => {
  const { setUser } = useAuthStore();
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
        // I have mapped the fetched user to match the AuthStore's User interface, including kycStatus.
        const userData = {
          id: fullUserData.id,
          firstname: fullUserData.firstname || "Guest",
          lastname: fullUserData.lastname || "",
          email: fullUserData.email,
          token: fullUserData.token ?? "",
          kycStatus: fullUserData.kycStatus || "not-started",
        };
        // I have stored the user in the Zustand store to make user data and kycStatus visible.
        setUser(userData);
        // I have set the token in a cookie for middleware authentication.
        document.cookie = `token=${userData.token}; path=/; max-age=${60 * 60 * 24 * 7}`;
        // I have logged the user and token for debugging to verify user data visibility.
        console.log(`Login: User logged in - User: ${JSON.stringify(userData)}, Token: ${userData.token}`);
        return { user: userData, kycStatus: fullUserData.kycStatus || "not-started" };
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

// I have created the useRegister hook to handle user registration using useAuthStore, including kycStatus.
export const useRegister = () => {
  const { setUser } = useAuthStore();

  const register = useCallback(
    async (formData: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
    
    }) => {
      try {
        // I have checked if a user with the provided email already exists.
        const checkEmailResponse = await axiosInstance.get(`/users?email=${formData.email}`);
        if (checkEmailResponse.data.length > 0) {
          console.log("Email already exists:", formData.email);
          throw new Error("Email already Existed. Please use a different email.");
        }

        // I have generated a fake token for the user.
        const token = generateFakeToken();

        // I have logged the user POST request for debugging.
        console.log("Register: Sending POST to /users with data:", {
          firstname: formData.firstName,
          lastname: formData.lastName,
          email: formData.email,
          password: formData.password,
          currency: "ETB",
          theme: "light",
          minBalance: 0,
          kycStatus: formData.kycData ? "not-started" : "not-started",
          kycData: null,
          token,
          createdAt: new Date().toISOString(),
        });

        // I have posted the user data to /users, including kycStatus.
        const userResponse = await axiosInstance.post("/users", {
          firstname: formData.firstName,
          lastname: formData.lastName,
          email: formData.email,
          password: formData.password,
          currency: "ETB",
          theme: "light",
          minBalance: 0,
          kycStatus: formData.kycData ? "not-started" : "not-started",
          kycData: null,
          token,
          createdAt: new Date().toISOString(),
        });

        // I have logged the user POST response.
        console.log("Register: POST response:", userResponse.data);

        // I have mapped the response to AuthStore's User interface, including kycStatus.
        const userData = {
          id: userResponse.data.id,
          firstname: userResponse.data.firstname || "Guest",
          lastname: userResponse.data.lastname || "",
          email: userResponse.data.email,
          token: userResponse.data.token,
          kycStatus: userResponse.data.kycStatus || "not-started",
        };

        // I have stored the user in AuthStore to make user data and kycStatus visible.
        setUser(userData);
        console.log(`Register: User stored - User: ${JSON.stringify(userData)}`);

        // I have posted KYC data to /kyc if provided.
        if (formData.kycData) {
          console.log(`Register: Sending POST to /kyc with data:`, {
            userId: userResponse.data.id,
            ...formData.kycData,
          });
          const kycResponse = await axiosInstance.post("/kyc", {
            userId: userResponse.data.id,
            ...formData.kycData,
          });
          console.log(`Register: KYC POST response:`, kycResponse.data);
        }

        return userResponse.data;
      } catch (error: any) {
        console.log("Register: Error during registration:", error.response?.data || error.message);
        throw new Error(error.message || "Registration failed. Please try again.");
      }
    },
    [setUser]
  );

  return { register };
};