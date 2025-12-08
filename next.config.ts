import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // 优化配置
  output: "export",
  experimental: {
    optimizePackageImports: ["@mui/material", "@mui/icons-material"],
  },
  images: {
    domains: ["gateway.pinata.cloud"],
  },
  // 生产环境优化
  compiler: {
    removeConsole: process.env.NODE_ENV === "production", // 生产环境移除 console.log
  },
};

export default nextConfig;
