import { useState, useEffect } from "react";

// I have created a hook to manage the theme, using localStorage to persist the theme across sessions.
// I want the theme to be based on the device's preferred color scheme (light/dark) if no theme is stored.
export const useTheme = () => {
  // I have initialized the theme state, defaulting to "light" if no preference is found.
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // I have used useEffect to initialize the theme on mount, checking localStorage and device preference.
  useEffect(() => {
    // I have checked localStorage for a previously saved theme.
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
        if (savedTheme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } else {
        // I have used the device's preferred color scheme if no theme is saved in localStorage.
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const initialTheme = prefersDark ? "dark" : "light";
        setTheme(initialTheme);
        localStorage.setItem("theme", initialTheme);
        if (initialTheme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    }, []);
  
        return { theme, setTheme };
    };