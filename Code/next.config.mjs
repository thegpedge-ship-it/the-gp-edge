/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  /**
   * optimizePackageImports — enables Next.js to tree-shake icons and motion imports
   * more aggressively, reducing the initial JS bundle size.
   * framer-motion: only the components actually used get bundled.
   * lucide-react: only the specific icons imported get included.
   */
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
