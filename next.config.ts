import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ["pg"],
  experimental: {
    serverActions: {
      // Note: Next.js allowedOrigins currently requires specific strings (no wildcards).
      // I have included the primary network gateway and common local IPs.
      // Replace these with your server's actual IP address or domain when deployed.
      allowedOrigins: [
        "10.128.50.142", 
        "10.128.50.142:3000",
        "10.128.50.149",
        "10.128.50.149:3000",
        "192.168.250.251", 
        "192.168.250.251:3000",
        "localhost:3000"
      ],
    },
  },
};

export default nextConfig;
