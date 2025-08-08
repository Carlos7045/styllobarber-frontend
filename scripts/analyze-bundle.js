#!/usr/bin/env node

/**
 * Script para análise de bundle do Next.js
 * Analisa o tamanho dos chunks, dependências e oportunidades de otimização
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

class BundleAnalyzer {
  constructor() {
    this.buildDir = path.join(process.cwd(), '.next')
    this.staticDir = path.join(this.buildDir, 'static')
    this.chunksDir = path.join(this.staticDir, 'chunks')
    this.results = {
      totalSize: 0,
      chunks: [],
      pages: [],
      dependencies: new Map(),
      recommendations: []
    }
  }

  async analyze() {
    console.log('🔍 Analisando bundle do Next.js...\n')

    try {
      // Verificar se o build existe
      if (!fs.existsSync(this.buildDir)) {
        console.log('❌ Build não encontrado. Execute "npm run build" primeiro.')
        return
      }

      // Analisar chunks
      await this.analyzeChunks()
      
      // Analisar páginas
      await this.analyzePages()
      
      // Analisar dependências
      await this.analyzeDependencies()
      
      // Gerar recomendações
      this.generateRecommendations()
      
      // Exibir resultados
      this.displayResults()
      
      // Salvar relatório
      this.saveReport()

    } catch (error) {
      console.error('❌ Erro durante análise:', error.message)
    }
  }

  async analyzeChunks() {
    console.log('📦 Analisando chunks...')
    
    if (!fs.existsSync(this.chunksDir)) {
      console.log('⚠️  Diretório de chunks não encontrado')
      return
    }

    const files = fs.readdirSync(this.chunksDir, { recursive: true })
    
    for (const file of files) {
      if (typeof file === 'string' && file.endsWith('.js')) {
        const filePath = path.join(this.chunksDir, file)
        const stats = fs.statSync(filePath)
        const sizeKB = Math.round(stats.size / 1024)
        
        this.results.chunks.push({
          name: file,
          size: stats.size,
          sizeKB,
          path: filePath
        })
        
        this.results.totalSize += stats.size
      }
    }

    // Ordenar por tamanho
    this.results.chunks.sort((a, b) => b.size - a.size)
  }

  async analyzePages() {
    console.log('📄 Analisando páginas...')
    
    const pagesManifestPath = path.join(this.buildDir, 'server', 'pages-manifest.json')
    
    if (fs.existsSync(pagesManifestPath)) {
      const pagesManifest = JSON.parse(fs.readFileSync(pagesManifestPath, 'utf8'))
      
      for (const [route, file] of Object.entries(pagesManifest)) {
        const filePath = path.join(this.buildDir, 'server', file)
        
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath)
          const sizeKB = Math.round(stats.size / 1024)
          
          this.results.pages.push({
            route,
            file,
            size: stats.size,
            sizeKB
          })
        }
      }
    }

    // Ordenar por tamanho
    this.results.pages.sort((a, b) => b.size - a.size)
  }

  async analyzeDependencies() {
    console.log('📚 Analisando dependências...')
    
    try {
      // Ler package.json
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }
      
      // Analisar tamanho das dependências (estimativa)
      for (const [name, version] of Object.entries(dependencies)) {
        try {
          const packagePath = path.join('node_modules', name, 'package.json')
          if (fs.existsSync(packagePath)) {
            const depPackageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
            
            // Estimar tamanho baseado no diretório
            const depDir = path.join('node_modules', name)
            const size = this.getDirectorySize(depDir)
            
            this.results.dependencies.set(name, {
              version,
              size,
              sizeKB: Math.round(size / 1024),
              description: depPackageJson.description || '',
              isDevDependency: !!packageJson.devDependencies[name]
            })
          }
        } catch (error) {
          // Ignorar erros de dependências específicas
        }
      }
    } catch (error) {
      console.log('⚠️  Erro ao analisar dependências:', error.message)
    }
  }

  getDirectorySize(dirPath) {
    let totalSize = 0
    
    try {
      const files = fs.readdirSync(dirPath, { withFileTypes: true })
      
      for (const file of files) {
        const filePath = path.join(dirPath, file.name)
        
        if (file.isDirectory()) {
          totalSize += this.getDirectorySize(filePath)
        } else {
          const stats = fs.statSync(filePath)
          totalSize += stats.size
        }
      }
    } catch (error) {
      // Ignorar erros de acesso
    }
    
    return totalSize
  }

  generateRecommendations() {
    console.log('💡 Gerando recomendações...')
    
    // Chunks muito grandes
    const largeChunks = this.results.chunks.filter(chunk => chunk.sizeKB > 500)
    if (largeChunks.length > 0) {
      this.results.recommendations.push({
        type: 'warning',
        category: 'Bundle Size',
        title: 'Chunks muito grandes detectados',
        description: `${largeChunks.length} chunk(s) maiores que 500KB encontrados`,
        items: largeChunks.map(chunk => `${chunk.name}: ${chunk.sizeKB}KB`),
        solution: 'Considere implementar code splitting ou lazy loading'
      })
    }

    // Dependências pesadas
    const heavyDeps = Array.from(this.results.dependencies.entries())
      .filter(([_, dep]) => dep.sizeKB > 1000 && !dep.isDevDependency)
      .sort((a, b) => b[1].sizeKB - a[1].sizeKB)
      .slice(0, 5)

    if (heavyDeps.length > 0) {
      this.results.recommendations.push({
        type: 'info',
        category: 'Dependencies',
        title: 'Dependências pesadas identificadas',
        description: 'Dependências que podem impactar o bundle size',
        items: heavyDeps.map(([name, dep]) => `${name}: ${dep.sizeKB}KB`),
        solution: 'Verifique se todas são necessárias ou se há alternativas mais leves'
      })
    }

    // Páginas grandes
    const largePages = this.results.pages.filter(page => page.sizeKB > 100)
    if (largePages.length > 0) {
      this.results.recommendations.push({
        type: 'info',
        category: 'Pages',
        title: 'Páginas com bundle grande',
        description: `${largePages.length} página(s) com mais de 100KB`,
        items: largePages.map(page => `${page.route}: ${page.sizeKB}KB`),
        solution: 'Implemente lazy loading para componentes pesados'
      })
    }

    // Bundle total muito grande
    const totalSizeMB = this.results.totalSize / (1024 * 1024)
    if (totalSizeMB > 5) {
      this.results.recommendations.push({
        type: 'warning',
        category: 'Overall',
        title: 'Bundle total muito grande',
        description: `Bundle total: ${totalSizeMB.toFixed(2)}MB`,
        solution: 'Implemente tree shaking, code splitting e remova dependências desnecessárias'
      })
    }
  }

  displayResults() {
    console.log('\n📊 RELATÓRIO DE ANÁLISE DE BUNDLE\n')
    console.log('=' .repeat(50))
    
    // Resumo geral
    console.log('\n🎯 RESUMO GERAL')
    console.log(`Total de chunks: ${this.results.chunks.length}`)
    console.log(`Total de páginas: ${this.results.pages.length}`)
    console.log(`Tamanho total: ${(this.results.totalSize / (1024 * 1024)).toFixed(2)}MB`)
    console.log(`Dependências: ${this.results.dependencies.size}`)

    // Top 10 chunks maiores
    console.log('\n📦 TOP 10 CHUNKS MAIORES')
    console.log('-'.repeat(50))
    this.results.chunks.slice(0, 10).forEach((chunk, index) => {
      console.log(`${index + 1}. ${chunk.name}: ${chunk.sizeKB}KB`)
    })

    // Top 5 páginas maiores
    if (this.results.pages.length > 0) {
      console.log('\n📄 TOP 5 PÁGINAS MAIORES')
      console.log('-'.repeat(50))
      this.results.pages.slice(0, 5).forEach((page, index) => {
        console.log(`${index + 1}. ${page.route}: ${page.sizeKB}KB`)
      })
    }

    // Top 10 dependências mais pesadas
    const sortedDeps = Array.from(this.results.dependencies.entries())
      .sort((a, b) => b[1].sizeKB - a[1].sizeKB)
      .slice(0, 10)

    if (sortedDeps.length > 0) {
      console.log('\n📚 TOP 10 DEPENDÊNCIAS MAIS PESADAS')
      console.log('-'.repeat(50))
      sortedDeps.forEach(([name, dep], index) => {
        const type = dep.isDevDependency ? '(dev)' : '(prod)'
        console.log(`${index + 1}. ${name} ${type}: ${dep.sizeKB}KB`)
      })
    }

    // Recomendações
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 RECOMENDAÇÕES')
      console.log('-'.repeat(50))
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

    console.log('\n' + '='.repeat(50))
    console.log('✅ Análise concluída!')
  }

  saveReport() {
    const reportPath = path.join(process.cwd(), 'bundle-analysis-report.json')
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalChunks: this.results.chunks.length,
        totalPages: this.results.pages.length,
        totalSizeBytes: this.results.totalSize,
        totalSizeMB: this.results.totalSize / (1024 * 1024),
        totalDependencies: this.results.dependencies.size
      },
      chunks: this.results.chunks,
      pages: this.results.pages,
      dependencies: Object.fromEntries(this.results.dependencies),
      recommendations: this.results.recommendations
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`\n📄 Relatório salvo em: ${reportPath}`)
  }
}

// Executar análise se chamado diretamente
if (require.main === module) {
  const analyzer = new BundleAnalyzer()
  analyzer.analyze().catch(console.error)
}

module.exports = BundleAnalyzer