#!/usr/bin/env node

/**
 * Script para otimização do Tailwind CSS
 * Analisa classes utilizadas e otimiza a configuração
 */

const fs = require('fs')
const path = require('path')

class TailwindOptimizer {
  constructor() {
    this.projectRoot = process.cwd()
    this.srcDir = path.join(this.projectRoot, 'src')
    this.tailwindConfigPath = path.join(this.projectRoot, 'tailwind.config.ts')
    this.results = {
      classesFound: new Set(),
      unusedClasses: new Set(),
      customClasses: new Set(),
      recommendations: []
    }
  }

  async optimize() {
    console.log('🎨 Otimizando configuração do Tailwind CSS...\n')

    try {
      // Analisar classes utilizadas
      await this.analyzeUsedClasses()
      
      // Analisar configuração atual
      await this.analyzeCurrentConfig()
      
      // Gerar otimizações
      this.generateOptimizations()
      
      // Exibir resultados
      this.displayResults()
      
      // Salvar relatório
      this.saveReport()

    } catch (error) {
      console.error('❌ Erro durante otimização do Tailwind:', error.message)
    }
  }

  async analyzeUsedClasses() {
    console.log('🔍 Analisando classes Tailwind utilizadas...')
    
    const files = this.findFiles(this.srcDir, ['.tsx', '.jsx', '.ts', '.js'])
    console.log(`📁 Analisando ${files.length} arquivos`)

    // Padrão para encontrar classes Tailwind
    const classPatterns = [
      /className\s*=\s*["'`]([^"'`]+)["'`]/g,
      /className\s*=\s*{[^}]*["'`]([^"'`]+)["'`][^}]*}/g,
      /class\s*=\s*["'`]([^"'`]+)["'`]/g,
    ]

    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf8')
        
        for (const pattern of classPatterns) {
          let match
          while ((match = pattern.exec(content)) !== null) {
            const classString = match[1]
            const classes = classString.split(/\s+/).filter(cls => cls.trim())
            
            classes.forEach(cls => {
              if (this.isTailwindClass(cls)) {
                this.results.classesFound.add(cls)
              } else if (cls.includes('-') && !cls.startsWith('data-')) {
                this.results.customClasses.add(cls)
              }
            })
          }
        }
      } catch (error) {
        // Ignorar erros de leitura
      }
    }

    console.log(`✅ ${this.results.classesFound.size} classes Tailwind encontradas`)
    console.log(`🎨 ${this.results.customClasses.size} classes customizadas encontradas`)
  }

  findFiles(dir, extensions, files = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        if (!['node_modules', '.next', '.git'].includes(entry.name)) {
          this.findFiles(fullPath, extensions, files)
        }
      } else {
        const ext = path.extname(entry.name).toLowerCase()
        if (extensions.includes(ext)) {
          files.push(fullPath)
        }
      }
    }

    return files
  }

  isTailwindClass(className) {
    // Lista de prefixos comuns do Tailwind
    const tailwindPrefixes = [
      'bg-', 'text-', 'border-', 'rounded-', 'p-', 'px-', 'py-', 'pt-', 'pb-', 'pl-', 'pr-',
      'm-', 'mx-', 'my-', 'mt-', 'mb-', 'ml-', 'mr-', 'w-', 'h-', 'min-w-', 'min-h-',
      'max-w-', 'max-h-', 'flex-', 'grid-', 'col-', 'row-', 'gap-', 'space-x-', 'space-y-',
      'justify-', 'items-', 'content-', 'self-', 'order-', 'z-', 'top-', 'right-', 'bottom-',
      'left-', 'inset-', 'shadow-', 'opacity-', 'scale-', 'rotate-', 'translate-', 'skew-',
      'transform-', 'transition-', 'duration-', 'ease-', 'delay-', 'animate-', 'cursor-',
      'select-', 'resize-', 'list-', 'appearance-', 'outline-', 'ring-', 'divide-',
      'sr-', 'not-sr-', 'focus:', 'hover:', 'active:', 'disabled:', 'visited:', 'first:',
      'last:', 'odd:', 'even:', 'group-hover:', 'group-focus:', 'focus-within:', 'focus-visible:',
      'motion-safe:', 'motion-reduce:', 'dark:', 'sm:', 'md:', 'lg:', 'xl:', '2xl:'
    ]

    // Classes específicas do Tailwind
    const tailwindClasses = [
      'flex', 'block', 'inline', 'inline-block', 'hidden', 'grid', 'table', 'table-cell',
      'absolute', 'relative', 'fixed', 'sticky', 'static', 'overflow-hidden', 'overflow-auto',
      'overflow-scroll', 'truncate', 'break-words', 'break-all', 'whitespace-nowrap',
      'uppercase', 'lowercase', 'capitalize', 'normal-case', 'underline', 'line-through',
      'no-underline', 'italic', 'not-italic', 'font-thin', 'font-light', 'font-normal',
      'font-medium', 'font-semibold', 'font-bold', 'font-extrabold', 'font-black'
    ]

    return tailwindPrefixes.some(prefix => className.startsWith(prefix)) ||
           tailwindClasses.includes(className) ||
           /^(sm|md|lg|xl|2xl):/.test(className) ||
           /^(hover|focus|active|disabled|group-hover|group-focus|dark):/.test(className)
  }

  async analyzeCurrentConfig() {
    console.log('📋 Analisando configuração atual do Tailwind...')
    
    if (fs.existsSync(this.tailwindConfigPath)) {
      const config = fs.readFileSync(this.tailwindConfigPath, 'utf8')
      
      // Analisar se há configurações customizadas
      if (config.includes('extend:')) {
        console.log('✅ Configurações customizadas encontradas')
      }
      
      if (config.includes('purge:') || config.includes('content:')) {
        console.log('✅ Configuração de purge/content encontrada')
      }
    }
  }

  generateOptimizations() {
    console.log('💡 Gerando otimizações...')
    
    // Analisar padrões de uso
    const colorClasses = Array.from(this.results.classesFound).filter(cls => 
      cls.includes('bg-') || cls.includes('text-') || cls.includes('border-')
    )
    
    const spacingClasses = Array.from(this.results.classesFound).filter(cls =>
      cls.match(/^(p|m|px|py|pt|pb|pl|pr|mx|my|mt|mb|ml|mr)-/)
    )
    
    const responsiveClasses = Array.from(this.results.classesFound).filter(cls =>
      cls.match(/^(sm|md|lg|xl|2xl):/)
    )

    // Gerar recomendações
    if (colorClasses.length > 50) {
      this.results.recommendations.push({
        type: 'info',
        category: 'Colors',
        title: 'Muitas classes de cor utilizadas',
        description: `${colorClasses.length} classes de cor encontradas`,
        solution: 'Considere criar um sistema de cores customizado no tema'
      })
    }

    if (spacingClasses.length > 30) {
      this.results.recommendations.push({
        type: 'info',
        category: 'Spacing',
        title: 'Sistema de espaçamento extenso',
        description: `${spacingClasses.length} classes de espaçamento encontradas`,
        solution: 'Considere padronizar espaçamentos com variáveis CSS customizadas'
      })
    }

    if (responsiveClasses.length > 100) {
      this.results.recommendations.push({
        type: 'warning',
        category: 'Responsive',
        title: 'Muitas classes responsivas',
        description: `${responsiveClasses.length} classes responsivas encontradas`,
        solution: 'Considere componentes mais consistentes para reduzir variações responsivas'
      })
    }

    // Verificar classes customizadas não utilizadas
    const potentiallyUnused = Array.from(this.results.customClasses).filter(cls =>
      !cls.includes('primary-') && !cls.includes('secondary-') && !cls.includes('accent-')
    )

    if (potentiallyUnused.length > 0) {
      this.results.recommendations.push({
        type: 'warning',
        category: 'Custom Classes',
        title: 'Classes customizadas potencialmente não utilizadas',
        description: `${potentiallyUnused.length} classes customizadas encontradas`,
        items: potentiallyUnused.slice(0, 10),
        solution: 'Verifique se essas classes são realmente necessárias'
      })
    }
  }

  displayResults() {
    console.log('\n📊 RELATÓRIO DE OTIMIZAÇÃO DO TAILWIND CSS\n')
    console.log('=' .repeat(60))
    
    console.log(`🎨 Classes Tailwind utilizadas: ${this.results.classesFound.size}`)
    console.log(`🖌️  Classes customizadas: ${this.results.customClasses.size}`)
    
    // Top classes mais utilizadas (simulado - seria necessário contar ocorrências)
    console.log('\n🏆 CATEGORIAS DE CLASSES MAIS UTILIZADAS')
    console.log('-'.repeat(40))
    
    const categories = {
      'Background': Array.from(this.results.classesFound).filter(cls => cls.startsWith('bg-')),
      'Text': Array.from(this.results.classesFound).filter(cls => cls.startsWith('text-')),
      'Padding': Array.from(this.results.classesFound).filter(cls => cls.match(/^p[xytrbl]?-/)),
      'Margin': Array.from(this.results.classesFound).filter(cls => cls.match(/^m[xytrbl]?-/)),
      'Flex': Array.from(this.results.classesFound).filter(cls => cls.startsWith('flex-') || cls === 'flex'),
      'Border': Array.from(this.results.classesFound).filter(cls => cls.startsWith('border-')),
      'Responsive': Array.from(this.results.classesFound).filter(cls => cls.match(/^(sm|md|lg|xl|2xl):/))
    }

    Object.entries(categories).forEach(([category, classes]) => {
      if (classes.length > 0) {
        console.log(`${category}: ${classes.length} classes`)
      }
    })

    // Recomendações
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 RECOMENDAÇÕES')
      console.log('-'.repeat(40))
      this.results.recommendations.forEach((rec, index) => {
        const icon = rec.type === 'warning' ? '⚠️' : 'ℹ️'
        console.log(`\n${icon} ${rec.title}`)
        console.log(`   Categoria: ${rec.category}`)
        console.log(`   ${rec.description}`)
        if (rec.items && rec.items.length > 0) {
          rec.items.forEach(item => console.log(`   • ${item}`))
        }
        console.log(`   💡 Solução: ${rec.solution}`)
      })
    }

    // Configuração otimizada sugerida
    console.log('\n⚙️  CONFIGURAÇÃO OTIMIZADA SUGERIDA')
    console.log('-'.repeat(40))
    console.log('Baseado no uso atual, considere esta configuração:')
    console.log()
    console.log(this.generateOptimizedConfig())

    console.log('\n✅ Análise do Tailwind concluída!')
  }

  generateOptimizedConfig() {
    const mostUsedColors = Array.from(this.results.classesFound)
      .filter(cls => cls.match(/^(bg|text|border)-(gray|blue|green|red|yellow|purple|pink|indigo)-/))
      .map(cls => cls.split('-')[1])
      .filter((color, index, arr) => arr.indexOf(color) === index)
      .slice(0, 5)

    return `// tailwind.config.ts - Configuração otimizada
import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Cores mais utilizadas no projeto
      colors: {
        primary: {
          // Suas cores primárias customizadas
        },
        secondary: {
          // Suas cores secundárias customizadas
        },
      },
      // Espaçamentos customizados baseados no uso
      spacing: {
        // Adicione apenas os espaçamentos realmente utilizados
      },
    },
  },
  plugins: [],
  // Otimizações de build
  corePlugins: {
    // Desabilite plugins não utilizados para reduzir bundle size
    // preflight: false, // Se você não usa reset CSS do Tailwind
  },
}

export default config`
  }

  saveReport() {
    const reportPath = path.join(process.cwd(), 'tailwind-optimization-report.json')
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalClasses: this.results.classesFound.size,
        customClasses: this.results.customClasses.size,
        recommendations: this.results.recommendations.length
      },
      classes: {
        tailwind: Array.from(this.results.classesFound),
        custom: Array.from(this.results.customClasses)
      },
      recommendations: this.results.recommendations
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`\n📄 Relatório salvo em: ${reportPath}`)
  }
}

// Executar otimização se chamado diretamente
if (require.main === module) {
  const optimizer = new TailwindOptimizer()
  optimizer.optimize().catch(console.error)
}

module.exports = TailwindOptimizer