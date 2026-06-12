import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  experimental: {
    /**
     * outputFileTracingRoot — fixes Vercel/Next.js build failure:
     * "The following paths are not configured in your Next.js config"
     *
     * Required when the project lives in a deeply nested directory path.
     * Points Next.js's static analysis trace to the correct project root so it
     * can resolve package.json, node_modules, and tsconfig.json during the
     * build optimization (file tracing) phase.
     *
     * Docs: https://nextjs.org/docs/messages/next-config-output-file-tracing-root
     */
    outputFileTracingRoot: path.resolve(__dirname),

    /**
     * optimizePackageImports — enables Next.js to tree-shake icons and motion imports
     * more aggressively, reducing the initial JS bundle size.
     * framer-motion: only the components actually used get bundled.
     * lucide-react: only the specific icons imported get included.
     */
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
