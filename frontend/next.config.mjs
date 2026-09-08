import { fileURLToPath } from "url";
import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    // A stray package-lock.json in OneDrive/Documents (outside this repo) was
    // being detected as the workspace root — pin the root to the frontend.
    root: path.dirname(fileURLToPath(import.meta.url)),
  },
};

export default nextConfig;
