import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configurações de TypeScript - menos rigoroso durante desenvolvimento
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  
  // Configurações de ESLint - menos rigoroso durante desenvolvimento
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },
  
  // Otimizações de imagem
  images: {
    domains: ['localhost', 'qekicxjdhehwzisjpupt.supabase.co'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Configurações experimentais para otimização
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      '@tanstack/react-query',
      'zustand'
    ],
  },
  
  // Configurações de webpack otimizadas
  webpack: (config, { isServer, dev }) => {
    // Resolver problemas com o pacote jose
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        stream: false,
        util: false,
      }
    }
    
    // Configurar externals para evitar problemas de bundling
    config.externals = config.externals || []
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    })

    // Otimizações de bundle splitting apenas em produção
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Vendor chunk para bibliotecas principais
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
              enforce: true,
            },
            // Chunk separado para lucide-react
            lucide: {
              test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
              name: 'lucide-icons',
              chunks: 'all',
              priority: 20,
              enforce: true,
            },
            // Chunk separado para date-fns
            dateFns: {
              test: /[\\/]node_modules[\\/]date-fns[\\/]/,
              name: 'date-utils',
              chunks: 'all',
              priority: 20,
              enforce: true,
            },
            // Chunk separado para recharts
            recharts: {
              test: /[\\/]node_modules[\\/]recharts[\\/]/,
              name: 'charts',
              chunks: 'all',
              priority: 20,
              enforce: true,
            },
            // Chunk separado para framer-motion
            framerMotion: {
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              name: 'animations',
              chunks: 'all',
              priority: 20,
              enforce: true,
            },
            // Chunk comum para código compartilhado
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      }

      // Tree shaking mais agressivo
      config.optimization.usedExports = true
      config.optimization.sideEffects = false
    }
    
    return config
  },
  
  // Redirecionamentos para manter compatibilidade
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/auth/login',
        permanent: true,
      },
      {
        source: '/cadastro',
        destination: '/auth/signup',
        permanent: true,
      },
      {
        source: '/recuperar-senha',
        destination: '/auth/reset-password',
        permanent: true,
      },
    ];
  },

  // Headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
