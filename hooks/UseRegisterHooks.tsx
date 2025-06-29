import { useCallback } from "react";
import axiosInstance from "@/lib/axios-Instance";

// I have created a simple function here to generate a fake token for the user, simulating a server-generated token.
const generateFakeToken = () => {
  return `token-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
};

// I have updated the useRegister hook to check if the email already exists and throw an error to be caught by the Register component.
export const useRegister = () => {
  const register = useCallback(async (formData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => {
    try {
      // I have added a GET request here to check if a user with the provided email already exists.
      const checkEmailResponse = await axiosInstance.get(`/users?email=${formData.email}`);
      
      // I have checked if the response contains any users with the provided email.
      if (checkEmailResponse.data.length > 0) {
        console.log("Email already exists:", formData.email);
        throw new Error("Email already Existed. Please use a different email.");
      }

      // I have generated a fake token here for the user to use in subsequent requests.
      const token = generateFakeToken();

      // I have logged the request details here to debug the POST to /api/users.
      console.log("Sending POST to /users with data:", {
        firstname: formData.firstName,
        lastname: formData.lastName,
        email: formData.email,
        password: formData.password,
        status: false,
        kycId: null,
        walletId: null,
        token,
        createdAt: new Date().toISOString(),
      });

      // I have mapped the form data here to match the JSON server users collection structure.
      const response = await axiosInstance.post("/users", {
        firstname: formData.firstName,
        lastname: formData.lastName,
        email: formData.email,
        password: formData.password, // In a real app, this should be hashed
        status: false, // I have set status to false (pending) for new users.
        kycId: null, // I have added a null kycId here for future relation with the kyc collection.
        walletId: null, // I have added a null walletId here for future relation with the wallets collection.
        token, // I have included the fake token here for authentication.
        createdAt: new Date().toISOString(),
      });

      // I have logged the response here to verify the POST success.
      console.log("Register: POST response:", response.data);

      return response.data;
    } catch (error: any) {
      // I have logged the error here to debug the POST failure or email check failure.
      console.log("Register: Error during registration:", error.response?.data || error.message);
      throw new Error(error.message || "Registration failed. Please try again.");
    }
  }, []);

  return { register };
};