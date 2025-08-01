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
  
  // Configurações experimentais
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // Configurações de webpack para resolver problemas com pacotes ES modules
  webpack: (config, { isServer }) => {
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
    
    return config
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
