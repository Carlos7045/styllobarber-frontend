#!/usr/bin/env node

/**
 * Script principal para otimização completa do projeto
 * Executa todas as otimizações de assets e bundle em sequência
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Importar analisadores
const BundleAnalyzer = require('./analyze-bundle')
const ImageOptimizer = require('./optimize-images')
const DependencyAnalyzer = require('./analyze-dependencies')
const WebpackOptimizer = require('./optimize-webpack')

class ProjectOptimizer {
  constructor() {
    this.results = {
      bundle: null,
      images: null,
      dependencies: null,
      webpack: null,
      summary: {
        startTime: Date.now(),
        endTime: null,
        totalTime: null,
        optimizationsApplied: 0,
        errors: []
      }
    }
  }

  async optimize() {
    console.log('🚀 INICIANDO OTIMIZAÇÃO COMPLETA DO PROJETO\n')
    console.log('=' .repeat(60))
    console.log('Este processo irá:')
    console.log('• Analisar o bundle atual')
    console.log('• Otimizar imagens')
    console.log('• Analisar dependências')
    console.log('• Otimizar configurações do webpack')
    console.log('• Gerar relatórios detalhados')
    console.log('=' .repeat(60))
    console.log()

    try {
      // Verificar se o projeto foi buildado
      await this.ensureBuild()
      
      // 1. Análise inicial do bundle
      await this.analyzeBundleStep()
      
      // 2. Otimização de imagens
      await this.optimizeImagesStep()
      
      // 3. Análise de dependências
      await this.analyzeDependenciesStep()
      
      // 4. Otimização do webpack
      await this.optimizeWebpackStep()
      
      // 5. Análise final e comparação
      await this.finalAnalysisStep()
      
      // 6. Gerar relatório consolidado
      await this.generateConsolidatedReport()
      
      // 7. Exibir resumo final
      this.displayFinalSummary()

    } catch (error) {
      console.error('❌ Erro durante otimização:', error.message)
      this.results.summary.errors.push(error.message)
    } finally {
      this.results.summary.endTime = Date.now()
      this.results.summary.totalTime = this.results.summary.endTime - this.results.summary.startTime
    }
  }

  async ensureBuild() {
    console.log('🔍 Verificando build do projeto...')
    
    const buildDir = path.join(process.cwd(), '.next')
    
    if (!fs.existsSync(buildDir)) {
      console.log('📦 Build não encontrado. Executando build...')
      try {
        execSync('npm run build', { stdio: 'inherit' })
        console.log('✅ Build concluído com sucesso')
      } catch (error) {
        throw new Error('Falha ao executar build do projeto')
      }
    } else {
      console.log('✅ Build encontrado')
    }
    console.log()
  }

  async analyzeBundleStep() {
    console.log('📊 ETAPA 1: ANÁLISE INICIAL DO BUNDLE')
    console.log('-'.repeat(40))
    
    try {
      const analyzer = new BundleAnalyzer()
      await analyzer.analyze()
      this.results.bundle = analyzer.results
      this.results.summary.optimizationsApplied++
      console.log('✅ Análise do bundle concluída\n')
    } catch (error) {
      console.error('❌ Erro na análise do bundle:', error.message)
      this.results.summary.errors.push(`Bundle analysis: ${error.message}`)
    }
  }

  async optimizeImagesStep() {
    console.log('🖼️  ETAPA 2: OTIMIZAÇÃO DE IMAGENS')
    console.log('-'.repeat(40))
    
    try {
      const optimizer = new ImageOptimizer()
      await optimizer.optimize()
      this.results.images = optimizer.results
      this.results.summary.optimizationsApplied++
      console.log('✅ Otimização de imagens concluída\n')
    } catch (error) {
      console.error('❌ Erro na otimização de imagens:', error.message)
      this.results.summary.errors.push(`Image optimization: ${error.message}`)
    }
  }

  async analyzeDependenciesStep() {
    console.log('📦 ETAPA 3: ANÁLISE DE DEPENDÊNCIAS')
    console.log('-'.repeat(40))
    
    try {
      const analyzer = new DependencyAnalyzer()
      await analyzer.analyze()
      this.results.dependencies = analyzer.results
      this.results.summary.optimizationsApplied++
      console.log('✅ Análise de dependências concluída\n')
    } catch (error) {
      console.error('❌ Erro na análise de dependências:', error.message)
      this.results.summary.errors.push(`Dependency analysis: ${error.message}`)
    }
  }

  async optimizeWebpackStep() {
    console.log('⚙️  ETAPA 4: OTIMIZAÇÃO DO WEBPACK')
    console.log('-'.repeat(40))
    
    try {
      const optimizer = new WebpackOptimizer()
      await optimizer.optimize()
      this.results.webpack = optimizer.optimizations
      this.results.summary.optimizationsApplied++
      console.log('✅ Otimização do webpack concluída\n')
    } catch (error) {
      console.error('❌ Erro na otimização do webpack:', error.message)
      this.results.summary.errors.push(`Webpack optimization: ${error.message}`)
    }
  }

  async finalAnalysisStep() {
    console.log('🔍 ETAPA 5: ANÁLISE FINAL')
    console.log('-'.repeat(40))
    
    try {
      console.log('🔄 Executando novo build com otimizações...')
      execSync('npm run build', { stdio: 'pipe' })
      
      console.log('📊 Executando análise final do bundle...')
      const finalAnalyzer = new BundleAnalyzer()
      await finalAnalyzer.analyze()
      
      // Comparar resultados
      if (this.results.bundle) {
        const improvement = this.calculateImprovement(this.results.bundle, finalAnalyzer.results)
        console.log(`📈 Melhoria no bundle: ${improvement.percentage}%`)
        console.log(`💾 Economia de espaço: ${improvement.savedKB}KB`)
      }
      
      console.log('✅ Análise final concluída\n')
    } catch (error) {
      console.error('❌ Erro na análise final:', error.message)
      this.results.summary.errors.push(`Final analysis: ${error.message}`)
    }
  }

  calculateImprovement(before, after) {
    const beforeSize = before.totalSize
    const afterSize = after.totalSize
    const saved = beforeSize - afterSize
    const percentage = beforeSize > 0 ? Math.round((saved / beforeSize) * 100) : 0
    const savedKB = Math.round(saved / 1024)
    
    return { percentage, savedKB, saved }
  }

  async generateConsolidatedReport() {
    console.log('📄 ETAPA 6: GERANDO RELATÓRIO CONSOLIDADO')
    console.log('-'.repeat(40))
    
    const report = {
      timestamp: new Date().toISOString(),
      project: {
        name: 'StylloBarber Frontend',
        version: this.getProjectVersion()
      },
      optimization: {
        duration: this.results.summary.totalTime,
        steps: this.results.summary.optimizationsApplied,
        errors: this.results.summary.errors
      },
      results: {
        bundle: this.results.bundle,
        images: this.results.images,
        dependencies: this.results.dependencies,
        webpack: this.results.webpack
      },
      recommendations: this.generateConsolidatedRecommendations()
    }

    const reportPath = path.join(process.cwd(), 'optimization-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    
    console.log(`✅ Relatório consolidado salvo: ${path.basename(reportPath)}\n`)
  }

  getProjectVersion() {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
      return packageJson.version || '1.0.0'
    } catch {
      return '1.0.0'
    }
  }

  generateConsolidatedRecommendations() {
    const recommendations = []
    
    // Recomendações do bundle
    if (this.results.bundle?.recommendations) {
      recommendations.push(...this.results.bundle.recommendations)
    }
    
    // Recomendações das dependências
    if (this.results.dependencies?.recommendations) {
      recommendations.push(...this.results.dependencies.recommendations)
    }
    
    // Recomendações gerais
    recommendations.push({
      type: 'info',
      category: 'Monitoring',
      title: 'Monitoramento contínuo',
      description: 'Configure monitoramento de performance em produção',
      solution: 'Implemente Web Vitals e monitore métricas de bundle size regularmente'
    })
    
    return recommendations
  }

  displayFinalSummary() {
    console.log('🎉 RESUMO FINAL DA OTIMIZAÇÃO\n')
    console.log('=' .repeat(60))
    
    const durationMinutes = Math.round(this.results.summary.totalTime / 60000)
    const durationSeconds = Math.round((this.results.summary.totalTime % 60000) / 1000)
    
    console.log(`⏱️  Tempo total: ${durationMinutes}m ${durationSeconds}s`)
    console.log(`✅ Etapas concluídas: ${this.results.summary.optimizationsApplied}/4`)
    console.log(`❌ Erros: ${this.results.summary.errors.length}`)
    
    // Resumo por categoria
    if (this.results.images) {
      console.log(`🖼️  Imagens otimizadas: ${this.results.images.optimized}/${this.results.images.processed}`)
      console.log(`💾 Economia em imagens: ${Math.round(this.results.images.totalSavings / 1024)}KB`)
    }
    
    if (this.results.dependencies) {
      console.log(`📦 Dependências não utilizadas: ${this.results.dependencies.unused.size}`)
      console.log(`🔄 Dependências duplicadas: ${this.results.dependencies.duplicates.size}`)
    }
    
    if (this.results.webpack) {
      console.log(`⚙️  Otimizações webpack aplicadas: ${this.results.webpack.length}`)
    }
    
    // Próximos passos
    console.log('\n🚀 PRÓXIMOS PASSOS RECOMENDADOS')
    console.log('-'.repeat(40))
    console.log('1. Teste a aplicação para garantir que tudo funciona')
    console.log('2. Execute testes de performance (Lighthouse)')
    console.log('3. Monitore métricas em produção')
    console.log('4. Execute esta otimização regularmente (mensal)')
    
    if (this.results.dependencies?.unused.size > 0) {
      console.log('5. Remova dependências não utilizadas:')
      console.log(`   npm uninstall ${Array.from(this.results.dependencies.unused).join(' ')}`)
    }
    
    // Arquivos gerados
    console.log('\n📄 RELATÓRIOS GERADOS')
    console.log('-'.repeat(40))
    console.log('• optimization-report.json - Relatório consolidado')
    console.log('• bundle-analysis-report.json - Análise do bundle')
    console.log('• image-optimization-report.json - Otimização de imagens')
    console.log('• dependency-analysis-report.json - Análise de dependências')
    
    if (this.results.summary.errors.length > 0) {
      console.log('\n⚠️  ERROS ENCONTRADOS')
      console.log('-'.repeat(40))
      this.results.summary.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`)
      })
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('✨ OTIMIZAÇÃO COMPLETA FINALIZADA!')
    console.log('=' .repeat(60))
  }
}

// Executar otimização se chamado diretamente
if (require.main === module) {
  const optimizer = new ProjectOptimizer()
  optimizer.optimize().catch(console.error)
}

module.exports = ProjectOptimizer