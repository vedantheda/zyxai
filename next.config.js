/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // Disable problematic features that might cause manifest issues
    optimizePackageImports: ['lucide-react'],
  },
  // Ensure proper client/server boundary handling
  swcMinify: true,
}

module.exports = nextConfig
