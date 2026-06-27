import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(__dirname),

  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "@napi-rs/canvas"],

  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },
};

export default nextConfig;


