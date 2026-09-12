/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  devIndicators: false,
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ["localhost", "127.0.0.1", "localhost:3000", "127.0.0.1:3000"],
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  experimental: {
    optimizePackageImports: ["lucide-react", "clsx", "tailwind-merge"],
  },
};

export default nextConfig;
