import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['firebase-admin', 'jose'],
};

export default nextConfig;
