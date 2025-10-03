import type { NextConfig } from "next";
import createMDX from '@next/mdx';
import { securityHeaders } from './src/lib/security-headers';

const nextConfig: NextConfig = {
  /* config options here */
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/api/:path*',
        headers: [
          ...securityHeaders,
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        ],
      },
    ];
  },
  eslint: {
    // Skip ESLint during production builds; run `pnpm lint` separately
    ignoreDuringBuilds: true,
  },
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Turbopack optimization - automatically handles code splitting
  experimental: {
    // Optimize specific package imports for better tree-shaking
    optimizePackageImports: [
      '@/components/ui',
      '@/components/atom',
      'lucide-react',
      'recharts',
      'date-fns',
      '@tanstack/react-table',
      'zod',
      'react-hook-form',
      '@hookform/resolvers',
    ],
    // Disable tracing to fix Windows EPERM errors with .next/trace file
    turbo: {
      trace: false,
    },
  },

  // Turbopack configuration (moved from experimental as it's now stable)
  turbopack: {
    resolveAlias: {
      // Add any import aliases if needed
    },
  },

  // Compiler options for production build
  compiler: {
    // Remove console.log in production (keep errors and warnings)
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Disable powered by header for security
  poweredByHeader: false,

  // Enable response compression
  compress: true,

  // Generate build ID based on git commit or timestamp
  generateBuildId: async () => {
    return process.env.BUILD_ID || Date.now().toString();
  },

  // Optimize production builds
  productionBrowserSourceMaps: false,

  // Strict mode for better debugging
  reactStrictMode: true,
};

const withMDX = createMDX({
  // Add markdown plugins here, as desired
})

// Wrap MDX and Next.js config with each other
export default withMDX(nextConfig)
