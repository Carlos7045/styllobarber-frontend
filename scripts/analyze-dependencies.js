#!/usr/bin/env node

/**
 * Script para análise de dependências
 * Identifica dependências não utilizadas, duplicadas e oportunidades de otimização
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

class DependencyAnalyzer {
  constructor() {
    this.projectRoot = process.cwd()
    this.packageJsonPath = path.join(this.projectRoot, 'package.json')
    this.srcDir = path.join(this.projectRoot, 'src')
    this.results = {
      total: 0,
      used: new Set(),
      unused: new Set(),
      duplicates: new Map(),
      heavy: new Map(),
      recommendations: []
    }
  }

  async analyze() {
    console.log('📦 Analisando dependências...\n')

    try {
      // Ler package.json
      const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'))
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }
      
      this.results.total = Object.keys(dependencies).length
      console.log(`📊 Total de dependências: ${this.results.total}`)

      // Analisar uso das dependências
      await this.analyzeUsage(dependencies)
      
      // Analisar duplicações
      await this.analyzeDuplicates()
      
      // Analisar tamanhos
      await this.analyzeSizes(dependencies)
      
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

  async analyzeUsage(dependencies) {
    console.log('🔍 Analisando uso das dependências...')
    
    // Encontrar todos os arquivos de código
    const codeFiles = this.findCodeFiles(this.srcDir)
    console.log(`📁 Analisando ${codeFiles.length} arquivos de código`)

    // Padrões de import comuns
    const importPatterns = [
      /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g,
      /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
      /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g
    ]

    // Analisar cada arquivo
    for (const filePath of codeFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf8')
        
        for (const pattern of importPatterns) {
          let match
          while ((match = pattern.exec(content)) !== null) {
            const importPath = match[1]
            const packageName = this.extractPackageName(importPath)
            
            if (dependencies[packageName]) {
              this.results.used.add(packageName)
            }
          }
        }
      } catch (error) {
        // Ignorar erros de leitura de arquivo
      }
    }

    // Identificar dependências não utilizadas
    for (const depName of Object.keys(dependencies)) {
      if (!this.results.used.has(depName) && !this.isFrameworkDependency(depName)) {
        this.results.unused.add(depName)
      }
    }

    console.log(`✅ Dependências utilizadas: ${this.results.used.size}`)
    console.log(`⚠️  Dependências não utilizadas: ${this.results.unused.size}`)
  }

  findCodeFiles(dir, files = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        // Pular diretórios de build e node_modules
        if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(entry.name)) {
          this.findCodeFiles(fullPath, files)
        }
      } else {
        const ext = path.extname(entry.name).toLowerCase()
        if (['.js', '.jsx', '.ts', '.tsx', '.mjs'].includes(ext)) {
          files.push(fullPath)
        }
      }
    }

    return files
  }

  extractPackageName(importPath) {
    // Remover caminhos relativos
    if (importPath.startsWith('.') || importPath.startsWith('/')) {
      return null
    }

    // Extrair nome do pacote
    const parts = importPath.split('/')
    
    // Pacotes com escopo (@org/package)
    if (parts[0].startsWith('@')) {
      return parts.slice(0, 2).join('/')
    }
    
    // Pacotes normais
    return parts[0]
  }

  isFrameworkDependency(packageName) {
    const frameworkDeps = [
      'next',
      'react',
      'react-dom',
      'typescript',
      'eslint',
      'prettier',
      'tailwindcss',
      'postcss',
      'autoprefixer',
      '@types/node',
      '@types/react',
      '@types/react-dom'
    ]
    
    return frameworkDeps.includes(packageName) || 
           packageName.startsWith('@types/') ||
           packageName.startsWith('eslint-') ||
           packageName.startsWith('prettier-')
  }

  async analyzeDuplicates() {
    console.log('🔍 Analisando duplicações...')
    
    try {
      // Usar npm ls para encontrar duplicações
      const output = execSync('npm ls --depth=0 --json', { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'] // Ignorar stderr
      })
      
      const npmData = JSON.parse(output)
      
      // Analisar dependências transitivas
      const allDeps = new Map()
      this.collectAllDependencies(npmData.dependencies || {}, allDeps)
      
      // Encontrar duplicações
      for (const [name, versions] of allDeps) {
        if (versions.size > 1) {
          this.results.duplicates.set(name, Array.from(versions))
        }
      }
      
    } catch (error) {
      console.log('⚠️  Não foi possível analisar duplicações:', error.message)
    }
  }

  collectAllDependencies(deps, allDeps, visited = new Set()) {
    for (const [name, info] of Object.entries(deps)) {
      if (visited.has(name)) continue
      visited.add(name)
      
      if (!allDeps.has(name)) {
        allDeps.set(name, new Set())
      }
      
      allDeps.get(name).add(info.version)
      
      if (info.dependencies) {
        this.collectAllDependencies(info.dependencies, allDeps, visited)
      }
    }
  }

  async analyzeSizes(dependencies) {
    console.log('📏 Analisando tamanhos das dependências...')
    
    for (const [name, version] of Object.entries(dependencies)) {
      try {
        const packagePath = path.join('node_modules', name)
        if (fs.existsSync(packagePath)) {
          const size = this.getDirectorySize(packagePath)
          const sizeKB = Math.round(size / 1024)
          
          if (sizeKB > 500) { // Dependências maiores que 500KB
            this.results.heavy.set(name, {
              version,
              size,
              sizeKB,
              sizeMB: Math.round(size / (1024 * 1024) * 100) / 100
            })
          }
        }
      } catch (error) {
        // Ignorar erros
      }
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
    
    // Dependências não utilizadas
    if (this.results.unused.size > 0) {
      this.results.recommendations.push({
        type: 'warning',
        category: 'Unused Dependencies',
        title: `${this.results.unused.size} dependência(s) não utilizada(s)`,
        description: 'Dependências que podem ser removidas para reduzir o bundle',
        items: Array.from(this.results.unused),
        solution: 'Execute: npm uninstall ' + Array.from(this.results.unused).join(' ')
      })
    }

    // Dependências pesadas
    if (this.results.heavy.size > 0) {
      const heavyList = Array.from(this.results.heavy.entries())
        .sort((a, b) => b[1].sizeKB - a[1].sizeKB)
        .slice(0, 5)
      
      this.results.recommendations.push({
        type: 'info',
        category: 'Heavy Dependencies',
        title: 'Dependências pesadas identificadas',
        description: 'Dependências que ocupam muito espaço',
        items: heavyList.map(([name, info]) => `${name}: ${info.sizeKB}KB`),
        solution: 'Verifique se há alternativas mais leves ou se todas as funcionalidades são necessárias'
      })
    }

    // Duplicações
    if (this.results.duplicates.size > 0) {
      this.results.recommendations.push({
        type: 'warning',
        category: 'Duplicate Dependencies',
        title: `${this.results.duplicates.size} dependência(s) duplicada(s)`,
        description: 'Múltiplas versões da mesma dependência',
        items: Array.from(this.results.duplicates.entries()).map(
          ([name, versions]) => `${name}: ${versions.join(', ')}`
        ),
        solution: 'Execute npm dedupe ou atualize dependências para versões compatíveis'
      })
    }

    // Oportunidades de otimização
    const optimizationOpportunities = []
    
    // Verificar se lodash está sendo usado (pode ser substituído por funções nativas)
    if (this.results.used.has('lodash')) {
      optimizationOpportunities.push('Considere substituir lodash por funções nativas do JavaScript')
    }
    
    // Verificar moment.js (pode ser substituído por date-fns)
    if (this.results.used.has('moment')) {
      optimizationOpportunities.push('Substitua moment.js por date-fns (já instalado) para reduzir bundle size')
    }

    if (optimizationOpportunities.length > 0) {
      this.results.recommendations.push({
        type: 'info',
        category: 'Optimization Opportunities',
        title: 'Oportunidades de otimização',
        description: 'Sugestões para reduzir o bundle size',
        items: optimizationOpportunities,
        solution: 'Implemente as substituições sugeridas gradualmente'
      })
    }
  }

  displayResults() {
    console.log('\n📊 RELATÓRIO DE ANÁLISE DE DEPENDÊNCIAS\n')
    console.log('=' .repeat(60))
    
    // Resumo geral
    console.log('\n🎯 RESUMO GERAL')
    console.log(`Total de dependências: ${this.results.total}`)
    console.log(`Dependências utilizadas: ${this.results.used.size}`)
    console.log(`Dependências não utilizadas: ${this.results.unused.size}`)
    console.log(`Dependências duplicadas: ${this.results.duplicates.size}`)
    console.log(`Dependências pesadas (>500KB): ${this.results.heavy.size}`)

    // Dependências não utilizadas
    if (this.results.unused.size > 0) {
      console.log('\n⚠️  DEPENDÊNCIAS NÃO UTILIZADAS')
      console.log('-'.repeat(40))
      Array.from(this.results.unused).forEach(dep => {
        console.log(`• ${dep}`)
      })
    }

    // Dependências pesadas
    if (this.results.heavy.size > 0) {
      console.log('\n📦 DEPENDÊNCIAS PESADAS')
      console.log('-'.repeat(40))
      Array.from(this.results.heavy.entries())
        .sort((a, b) => b[1].sizeKB - a[1].sizeKB)
        .forEach(([name, info]) => {
          console.log(`• ${name}: ${info.sizeKB}KB (${info.sizeMB}MB)`)
        })
    }

    // Duplicações
    if (this.results.duplicates.size > 0) {
      console.log('\n🔄 DEPENDÊNCIAS DUPLICADAS')
      console.log('-'.repeat(40))
      Array.from(this.results.duplicates.entries()).forEach(([name, versions]) => {
        console.log(`• ${name}: ${versions.join(', ')}`)
      })
    }

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
          rec.items.slice(0, 5).forEach(item => console.log(`   • ${item}`))
          if (rec.items.length > 5) {
            console.log(`   ... e mais ${rec.items.length - 5} item(s)`)
          }
        }
        console.log(`   💡 Solução: ${rec.solution}`)
      })
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ Análise concluída!')
  }

  saveReport() {
    const reportPath = path.join(process.cwd(), 'dependency-analysis-report.json')
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.total,
        used: this.results.used.size,
        unused: this.results.unused.size,
        duplicates: this.results.duplicates.size,
        heavy: this.results.heavy.size
      },
      used: Array.from(this.results.used),
      unused: Array.from(this.results.unused),
      duplicates: Object.fromEntries(this.results.duplicates),
      heavy: Object.fromEntries(this.results.heavy),
      recommendations: this.results.recommendations
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`\n📄 Relatório salvo em: ${reportPath}`)
  }
}

// Executar análise se chamado diretamente
if (require.main === module) {
  const analyzer = new DependencyAnalyzer()
  analyzer.analyze().catch(console.error)
}

module.exports = DependencyAnalyzer