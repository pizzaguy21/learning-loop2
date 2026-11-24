import type { NextConfig } from "next";

// Cache Components is off: every data read happens in the browser through the
// Firebase client SDK, so there is no server data for Next.js to cache.
const nextConfig: NextConfig = {
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
