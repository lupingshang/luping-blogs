import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // 启用静态导出
  reactCompiler: true,

  // 优化配置
  experimental: {
    optimizePackageImports: ["@mui/material", "@mui/icons-material"],
  },

  // 生产环境优化
  compiler: {
    removeConsole: process.env.NODE_ENV === "production", // 生产环境移除 console.log
  },
};

export default nextConfig;
