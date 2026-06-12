import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },

  experimental: {
    outputFileTracingRoot: path.resolve(__dirname),
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
