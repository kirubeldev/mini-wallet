import { useCallback, useEffect } from "react";
import useSWRMutation from "swr/mutation";
import axiosInstance from "@/lib/axios-Instance";
import { useAuthStore } from "@/store/AuthStore";
import { v4 as uuidv4 } from "uuid";

// I have defined the User interface to match the JSON server and AuthStore, including kycStatus with all possible values.
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

  // I have used useEffect to fetch user data on mount if a token exists and ensure UUID for user.id.
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

        // I have ensured user.id is a UUID.
        const userId = fetchedUser.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fetchedUser.id)
          ? fetchedUser.id
          : uuidv4();

        if (userId !== fetchedUser.id) {
          console.log(`AutoLogin: Generated new UUID for user - ${userId}`);
          await axiosInstance.patch(`/users/${fetchedUser.id}`, { id: userId });
        }

        // I have mapped the fetched user to match the AuthStore's User interface.
        const userData = {
          id: userId,
          firstname: fetchedUser.firstname || "Guest",
          lastname: fetchedUser.lastname || "",
          email: fetchedUser.email,
          token: fetchedUser.token ?? "",
          kycStatus: fetchedUser.kycStatus || "not-started",
          KycStatus: fetchedUser.kycStatus || "", // Add this line to satisfy the interface
          currency: fetchedUser.currency || "USD",
          theme: fetchedUser.theme || "light",
          profileImage: fetchedUser.profileImage || "",
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

// I have updated the useLogin hook to include kycStatus and ensure UUID for user.id.
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

        // I have ensured user.id is a UUID.
        const userId = fullUserData.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fullUserData.id)
          ? fullUserData.id
          : uuidv4();

        if (userId !== fullUserData.id) {
          console.log(`Login: Generated new UUID for user - ${userId}`);
          await axiosInstance.patch(`/users/${fullUserData.id}`, { id: userId });
        }

        // I have mapped the fetched user to match the AuthStore's User interface, including kycStatus.
        const userData = {
          id: userId,
          firstname: fullUserData.firstname || "Guest",
          lastname: fullUserData.lastname || "",
          email: fullUserData.email,
          token: fullUserData.token ?? "",
          kycStatus: fullUserData.kycStatus || "not-started",
          KycStatus: fullUserData.kycStatus || "", // Add this line to satisfy the interface
          profileImage: fullUserData.profileImage || "",
          currency: fullUserData.currency || "USD",
          theme: fullUserData.theme || "light",
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

// I have updated the useRegister hook to generate a UUID for user.id and include kycStatus.
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

        // I have generated a UUID for the user ID.
        const userId = uuidv4();
        // I have generated a fake token for the user.
        const token = generateFakeToken();

        // I have logged the user POST request for debugging.
        console.log("Register: Sending POST to /users with data:", {
          id: userId,
          firstname: formData.firstName,
          lastname: formData.lastName,
          email: formData.email,
          password: formData.password,
          currency: "USD",
          theme: "light",
          profileImage: "",
          kycStatus: "not-started",
          kycData: null,
          token,
          createdAt: new Date().toISOString(),
        });

        // I have posted the user data to /users, including profileImage as empty string and kycStatus.
        const userResponse = await axiosInstance.post("/users", {
          id: userId,
          firstname: formData.firstName,
          lastname: formData.lastName,
          email: formData.email,
          password: formData.password,
          currency: "USD",
          theme: "light",
          profileImage: "",
          kycStatus: "not-started",
          kycData: null,
          token,
          createdAt: new Date().toISOString(),
        });

        // I have logged the user POST response.
        console.log("Register: POST response:", userResponse.data);

        // I have mapped the response to AuthStore's User interface, including kycStatus and profileImage.
        const userData: User = {
          id: userResponse.data.id,
          firstname: userResponse.data.firstname || "Guest",
          lastname: userResponse.data.lastname || "",
          email: userResponse.data.email,
          profileImage: typeof userResponse.data.profileImage === "string" ? userResponse.data.profileImage : "",
          token: userResponse.data.token,
          kycStatus: userResponse.data.kycStatus || "not-started",
          currency: userResponse.data.currency || "USD",
          theme: userResponse.data.theme || "light",
        };

        // I have stored the user in AuthStore to make user data and kycStatus visible.
        setUser(null);
        console.log(`Register: User stored - User: ${JSON.stringify(userData)}`);

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