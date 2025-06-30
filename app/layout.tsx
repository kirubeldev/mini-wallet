import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Mini Wallet Managment",
  description: "A simple wallet management web app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-darkreader-mode="disabled">
      <body className={inter.className}>{children}</body>
    </html>
  )}