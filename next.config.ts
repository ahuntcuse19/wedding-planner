import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the Google Sheets client (and its auth/transport deps) out of the
  // bundled server build so they load normally from node_modules at runtime in
  // Vercel's serverless functions.
  serverExternalPackages: ["google-spreadsheet", "google-auth-library"],
};

export default nextConfig;
