import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client'],
  env: {
    NEXT_PUBLIC_SYNAPSE_API: process.env.NEXT_PUBLIC_SYNAPSE_API ?? "http://localhost:8000",
  },
};

export default nextConfig;
