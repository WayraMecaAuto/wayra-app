import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // ✅ Optimización crítica de memoria
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'chart.js',
      'date-fns',
      'framer-motion',
      'react-chartjs-2'
    ],
  },

  // ✅ Prisma debe estar en serverExternalPackages (renombrado en Next.js 15)
  serverExternalPackages: ['@prisma/client', 'prisma'],

  // ✅ Output standalone (reduce tamaño ~50%)
  output: 'standalone',

  // ✅ Ignorar errores de build
  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  // ✅ Optimizar imágenes
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // ✅ Reducir console.log en producción
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // ✅ Optimizar webpack
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        moduleIds: 'deterministic',
      }
    }

    // Resolver alias problemáticos
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
      encoding: false,
    }

    return config
  },
}

export default nextConfig