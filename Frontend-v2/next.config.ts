import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "api.microlink.io"
      }
    ]
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  async rewrites() {
    const destination =
      process.env.N8N_WEBHOOK_URL || process.env.NEXT_PUBLIC_N8N_API_BASE_URL;

    if (!destination) return [];

    return [
      {
        source: "/api/n8n",
        destination,
      },
    ];
  },
  webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    return config;
  }
};

export default nextConfig;