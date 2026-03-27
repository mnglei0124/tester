import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ["pg"],
  experimental: {
    serverActions: {
      allowedOrigins: ["192.168.250.251", "192.168.250.251:3000"],
    },
  },
};

export default nextConfig;
