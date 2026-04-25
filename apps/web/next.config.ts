import type { NextConfig } from "next";

const config: NextConfig = {
  experimental: { typedRoutes: true },
  transpilePackages: ["@high-signal/shared"],
};

export default config;
