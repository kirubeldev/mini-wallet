import axios from "axios";

// I have created an Axios instance here with the local server base URL for development and an environment variable for Vercel deployment.
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000", // I have set this to use the proxy locally or the backend URL on Vercel.
  headers: { "Content-Type": "application/json" },
});

export default axiosInstance;