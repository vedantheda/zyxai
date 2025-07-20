/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: 'build-output',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
