/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable React strict mode in development for better performance
  reactStrictMode: process.env.NODE_ENV === 'production',

  // External packages for server components (moved from experimental)
  serverExternalPackages: ['@supabase/supabase-js'],

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // Turbopack configuration (stable)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Image optimization configuration
  images: {
    // Enable image optimization (default behavior)
    unoptimized: false,
    // Add common image domains if needed
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
        pathname: "/**",
      },
      // Add other trusted domains as needed
    ],
    // Image formats for better compression
    formats: ['image/webp', 'image/avif'],
  },

  // Enable TypeScript error checking during builds
  typescript: {
    ignoreBuildErrors: false,
  },

  // Enable ESLint during builds for production quality
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Compression for better performance
  compress: true,

  // Power optimizations
  poweredByHeader: false,

  // Bundle analyzer (uncomment to analyze bundle size)
  // bundleAnalyzer: {
  //   enabled: process.env.ANALYZE === 'true',
  // },
};

module.exports = nextConfig;
