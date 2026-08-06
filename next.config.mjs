import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(__dirname),

  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "@napi-rs/canvas", "pdfkit", "tesseract.js"],

  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
    serverActions: {
      bodySizeLimit: "20mb",
      allowedOrigins: [
        "localhost:3000",
        "127.0.0.1:3000",
        "192.168.226.1:3000",
        "192.168.226.1",
        "localhost",
        "127.0.0.1",
      ],
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "pub-*.r2.dev",
      },
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
    ],
  },
};

export default nextConfig;


