import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 配置写在这里 */
  cacheComponents: true,
  serverExternalPackages: ["svg-captcha", "ali-oss"],
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
