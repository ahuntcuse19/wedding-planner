import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Prisma out of the bundled server build so the query engine resolves
  // correctly in Vercel's serverless functions.
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
