import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(__dirname),

  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "@napi-rs/canvas", "pdfkit", "tesseract.js"],

  // Next.js 16 logs every Server Action's raw arguments to the dev terminal by default
  // (logging.serverFunctions defaults to true) — that meant plaintext passwords from
  // verifyAdminCredentialsAction/etc. were showing up in the terminal. Turn it off.
  logging: {
    serverFunctions: false,
  },

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


