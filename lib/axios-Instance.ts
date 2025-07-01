import axios from "axios";

// Function to manually extract a specific cookie value
function getCookieValue(name: string): string | null {
  const match: RegExpMatchArray | null = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://miniwallet-json-3.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
  // withCredentials: true, // Enable this if the backend uses cookies (like HttpOnly) and needs to read them on cross-origin
});

// Request interceptor: attach token from browser cookie
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getCookieValue("token"); // Make sure 'token' is the actual name of your cookie
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Optional response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default axiosInstance;
