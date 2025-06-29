import type { NextConfig } from "next";

// I have defined the Next.js config here to include image domains and a proxy rewrite for the local JSON server to avoid CORS issues.
const nextConfig: NextConfig = {
  images: {
    domains: ["images.unsplash.com", "example.com"],
    unoptimized: true,
  },
  async rewrites() {
    // I have added a rewrite rule here to proxy /api/* requests to the local JSON server at http://localhost:4000 for development.
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:4000/:path*",
      },
    ];
  },
};

export default nextConfig;