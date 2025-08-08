#!/usr/bin/env node

/**
 * Script para otimização do webpack e configurações do Next.js
 * Gera configurações otimizadas baseadas na análise do projeto
 */

const fs = require('fs')
const path = require('path')

class WebpackOptimizer {
  constructor() {
    this.projectRoot = process.cwd()
    this.nextConfigPath = path.join(this.projectRoot, 'next.config.ts')
    this.packageJsonPath = path.join(this.projectRoot, 'package.json')
    this.optimizations = []
  }

  async optimize() {
    console.log('⚙️  Otimizando configurações do webpack...\n')

    try {
      // Analisar configuração atual
      await this.analyzeCurrentConfig()
      
      // Gerar otimizações
      this.generateOptimizations()
      
      // Aplicar otimizações
      await this.applyOptimizations()
      
      // Exibir resultados
      this.displayResults()

    } catch (error) {
      console.error('❌ Erro durante otimização:', error.message)
    }
  }

  async analyzeCurrentConfig() {
    console.log('🔍 Analisando configuração atual...')
    
    // Ler package.json para entender as dependências
    const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'))
    this.dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }
    
    // Ler configuração atual do Next.js
    if (fs.existsSync(this.nextConfigPath)) {
      this.currentConfig = fs.readFileSync(this.nextConfigPath, 'utf8')
    } else {
      this.currentConfig = ''
    }
    
    console.log('✅ Configuração atual analisada')
  }

  generateOptimizations() {
    console.log('💡 Gerando otimizações...')
    
    // Otimizações baseadas nas dependências encontradas
    this.addBundleOptimizations()
    this.addImageOptimizations()
    this.addPerformanceOptimizations()
    this.addTreeShakingOptimizations()
    this.addCompressionOptimizations()
    
    console.log(`✅ ${this.optimizations.length} otimizações geradas`)
  }

  addBundleOptimizations() {
    // Otimizações de bundle splitting
    this.optimizations.push({
      category: 'Bundle Splitting',
      name: 'Configurar chunks otimizados',
      description: 'Separar vendors e código da aplicação em chunks otimizados',
      config: `
    // Otimizações de bundle splitting
    webpack: (config, { isServer, dev }) => {
      if (!dev && !isServer) {
        // Configurar chunks otimizados
        config.optimization = {
          ...config.optimization,
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              vendor: {
                test: /[\\\\/]node_modules[\\\\/]/,
                name: 'vendors',
                chunks: 'all',
                priority: 10,
              },
              common: {
                name: 'common',
                minChunks: 2,
                chunks: 'all',
                priority: 5,
                reuseExistingChunk: true,
              },
              // Separar bibliotecas pesadas
              ${this.dependencies['framer-motion'] ? `
              framerMotion: {
                test: /[\\\\/]node_modules[\\\\/]framer-motion[\\\\/]/,
                name: 'framer-motion',
                chunks: 'all',
                priority: 20,
              },` : ''}
              ${this.dependencies['recharts'] ? `
              recharts: {
                test: /[\\\\/]node_modules[\\\\/]recharts[\\\\/]/,
                name: 'recharts',
                chunks: 'all',
                priority: 20,
              },` : ''}
              ${this.dependencies['@tanstack/react-query'] ? `
              reactQuery: {
                test: /[\\\\/]node_modules[\\\\/]@tanstack[\\\\/]react-query[\\\\/]/,
                name: 'react-query',
                chunks: 'all',
                priority: 20,
              },` : ''}
            },
          },
        }
      }
      
      return config
    },`
    })
  }

  addImageOptimizations() {
    this.optimizations.push({
      category: 'Images',
      name: 'Otimizações de imagem avançadas',
      description: 'Configurar formatos modernos e otimizações de imagem',
      config: `
  // Otimizações de imagem
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: ['localhost', 'qekicxjdhehwzisjpupt.supabase.co'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 dias
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },`
    })
  }

  addPerformanceOptimizations() {
    this.optimizations.push({
      category: 'Performance',
      name: 'Configurações de performance',
      description: 'Otimizações gerais de performance e carregamento',
      config: `
  // Configurações de performance
  poweredByHeader: false,
  compress: true,
  
  // Configurações experimentais para performance
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'framer-motion',
      'date-fns',
    ],
    optimizeCss: true,
    scrollRestoration: true,
    ${this.dependencies['@tanstack/react-query'] ? `
    serverComponentsExternalPackages: ['@tanstack/react-query'],` : ''}
  },`
    })
  }

  addTreeShakingOptimizations() {
    // Identificar bibliotecas que se beneficiam de tree shaking
    const treeShakingLibs = []
    
    if (this.dependencies['lodash']) {
      treeShakingLibs.push('lodash')
    }
    if (this.dependencies['date-fns']) {
      treeShakingLibs.push('date-fns')
    }
    if (this.dependencies['lucide-react']) {
      treeShakingLibs.push('lucide-react')
    }

    if (treeShakingLibs.length > 0) {
      this.optimizations.push({
        category: 'Tree Shaking',
        name: 'Configurar tree shaking otimizado',
        description: 'Melhorar tree shaking para bibliotecas específicas',
        config: `
    // Configurações de webpack para tree shaking
    webpack: (config, { isServer, dev }) => {
      // Melhorar tree shaking
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      }
      
      // Configurar resolve para melhor tree shaking
      config.resolve.alias = {
        ...config.resolve.alias,
        ${treeShakingLibs.includes('lodash') ? `
        'lodash': 'lodash-es',` : ''}
      }
      
      return config
    },`
      })
    }
  }

  addCompressionOptimizations() {
    this.optimizations.push({
      category: 'Compression',
      name: 'Headers de compressão e cache',
      description: 'Configurar headers otimizados para compressão e cache',
      config: `
  // Headers otimizados
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
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },`
    })
  }

  async applyOptimizations() {
    console.log('🔧 Aplicando otimizações...')
    
    // Gerar nova configuração
    const newConfig = this.generateNewConfig()
    
    // Fazer backup da configuração atual
    if (fs.existsSync(this.nextConfigPath)) {
      const backupPath = `${this.nextConfigPath}.backup.${Date.now()}`
      fs.copyFileSync(this.nextConfigPath, backupPath)
      console.log(`📄 Backup criado: ${path.basename(backupPath)}`)
    }
    
    // Escrever nova configuração
    fs.writeFileSync(this.nextConfigPath, newConfig)
    console.log('✅ Nova configuração aplicada')
    
    // Gerar arquivo de configuração adicional para webpack
    this.generateWebpackConfig()
  }

  generateNewConfig() {
    const configSections = this.optimizations.map(opt => opt.config).join('\n')
    
    return `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configurações de TypeScript
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  
  // Configurações de ESLint
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },
  ${configSections}
};

export default nextConfig;
`
  }

  generateWebpackConfig() {
    const webpackConfigPath = path.join(this.projectRoot, 'webpack.config.js')
    
    const webpackConfig = `
// Configuração adicional do webpack para otimizações avançadas
const path = require('path')

module.exports = {
  // Configurações de análise de bundle
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  
  // Configurações de otimização
  optimization: {
    // Minimizar CSS
    minimizer: [
      // Configurações serão aplicadas pelo Next.js
    ],
    
    // Configurações de tree shaking
    usedExports: true,
    sideEffects: [
      '*.css',
      '*.scss',
      '*.sass',
      '*.less',
    ],
  },
  
  // Configurações de performance
  performance: {
    hints: process.env.NODE_ENV === 'production' ? 'warning' : false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
}
`
    
    fs.writeFileSync(webpackConfigPath, webpackConfig)
    console.log('📄 Configuração adicional do webpack criada')
  }

  displayResults() {
    console.log('\n📊 RELATÓRIO DE OTIMIZAÇÃO DO WEBPACK\n')
    console.log('=' .repeat(60))
    
    console.log(`✅ ${this.optimizations.length} otimizações aplicadas\n`)
    
    // Listar otimizações por categoria
    const categories = [...new Set(this.optimizations.map(opt => opt.category))]
    
    categories.forEach(category => {
      console.log(`📦 ${category.toUpperCase()}`)
      console.log('-'.repeat(40))
      
      const categoryOpts = this.optimizations.filter(opt => opt.category === category)
      categoryOpts.forEach(opt => {
        console.log(`✓ ${opt.name}`)
        console.log(`  ${opt.description}`)
      })
      console.log()
    })
    
    // Próximos passos
    console.log('🚀 PRÓXIMOS PASSOS')
    console.log('-'.repeat(40))
    console.log('1. Execute "npm run build" para testar as otimizações')
    console.log('2. Use "npm run analyze-bundle" para verificar o impacto')
    console.log('3. Teste a aplicação para garantir que tudo funciona')
    console.log('4. Monitore as métricas de performance em produção')
    
    console.log('\n✅ Otimização concluída!')
  }
}

// Executar otimização se chamado diretamente
if (require.main === module) {
  const optimizer = new WebpackOptimizer()
  optimizer.optimize().catch(console.error)
}

module.exports = WebpackOptimizer`