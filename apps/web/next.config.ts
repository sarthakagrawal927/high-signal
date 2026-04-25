import type { NextConfig } from "next";

const config: NextConfig = {
  experimental: { typedRoutes: true },
  transpilePackages: ["@high-signal/shared"],
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true },
};

export default config;
