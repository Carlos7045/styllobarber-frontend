#!/usr/bin/env node

/**
 * Script para otimização de imagens
 * Converte imagens para formatos modernos (WebP, AVIF) e otimiza tamanhos
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

class ImageOptimizer {
  constructor() {
    this.publicDir = path.join(process.cwd(), 'public')
    this.supportedFormats = ['.jpg', '.jpeg', '.png', '.gif']
    this.results = {
      processed: 0,
      optimized: 0,
      errors: 0,
      totalSavings: 0,
      files: []
    }
  }

  async optimize() {
    console.log('🖼️  Otimizando imagens...\n')

    try {
      // Verificar se sharp está disponível
      this.checkDependencies()
      
      // Encontrar todas as imagens
      const images = this.findImages(this.publicDir)
      console.log(`📁 Encontradas ${images.length} imagens para processar\n`)

      // Processar cada imagem
      for (const imagePath of images) {
        await this.processImage(imagePath)
      }

      // Exibir resultados
      this.displayResults()
      
      // Salvar relatório
      this.saveReport()

    } catch (error) {
      console.error('❌ Erro durante otimização:', error.message)
    }
  }

  checkDependencies() {
    try {
      require('sharp')
    } catch (error) {
      console.log('📦 Instalando dependência sharp...')
      try {
        execSync('npm install sharp --save-dev', { stdio: 'inherit' })
        console.log('✅ Sharp instalado com sucesso\n')
      } catch (installError) {
        throw new Error('Não foi possível instalar sharp. Instale manualmente: npm install sharp --save-dev')
      }
    }
  }

  findImages(dir, images = []) {
    const files = fs.readdirSync(dir, { withFileTypes: true })

    for (const file of files) {
      const filePath = path.join(dir, file.name)

      if (file.isDirectory()) {
        // Pular diretórios de build e node_modules
        if (!['node_modules', '.next', '.git'].includes(file.name)) {
          this.findImages(filePath, images)
        }
      } else {
        const ext = path.extname(file.name).toLowerCase()
        if (this.supportedFormats.includes(ext)) {
          images.push(filePath)
        }
      }
    }

    return images
  }

  async processImage(imagePath) {
    const sharp = require('sharp')
    const relativePath = path.relative(process.cwd(), imagePath)
    
    try {
      console.log(`🔄 Processando: ${relativePath}`)
      
      const originalStats = fs.statSync(imagePath)
      const originalSize = originalStats.size
      
      // Obter informações da imagem
      const image = sharp(imagePath)
      const metadata = await image.metadata()
      
      const result = {
        path: relativePath,
        originalSize,
        originalSizeKB: Math.round(originalSize / 1024),
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        optimizations: []
      }

      // Otimizar imagem original
      const optimizedPath = this.getOptimizedPath(imagePath, metadata.format)
      await this.optimizeFormat(image, optimizedPath, metadata.format)
      
      if (fs.existsSync(optimizedPath)) {
        const optimizedStats = fs.statSync(optimizedPath)
        const optimizedSize = optimizedStats.size
        const savings = originalSize - optimizedSize
        
        result.optimizations.push({
          format: metadata.format,
          size: optimizedSize,
          sizeKB: Math.round(optimizedSize / 1024),
          savings,
          savingsPercent: Math.round((savings / originalSize) * 100)
        })

        // Substituir arquivo original se houve economia significativa
        if (savings > originalSize * 0.1) { // 10% de economia mínima
          fs.copyFileSync(optimizedPath, imagePath)
          fs.unlinkSync(optimizedPath)
          this.results.optimized++
          this.results.totalSavings += savings
        } else {
          fs.unlinkSync(optimizedPath)
        }
      }

      // Gerar versões WebP e AVIF se a imagem for grande o suficiente
      if (metadata.width > 200 || metadata.height > 200) {
        await this.generateModernFormats(imagePath, image, result)
      }

      this.results.files.push(result)
      this.results.processed++
      
      console.log(`   ✅ Processado: ${result.originalSizeKB}KB`)

    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`)
      this.results.errors++
    }
  }

  async optimizeFormat(image, outputPath, format) {
    switch (format.toLowerCase()) {
      case 'jpeg':
      case 'jpg':
        await image
          .jpeg({ 
            quality: 85, 
            progressive: true,
            mozjpeg: true 
          })
          .toFile(outputPath)
        break
      
      case 'png':
        await image
          .png({ 
            compressionLevel: 9,
            adaptiveFiltering: true,
            palette: true
          })
          .toFile(outputPath)
        break
      
      case 'gif':
        // GIF não pode ser otimizado pelo Sharp, apenas copiar
        fs.copyFileSync(image.options.input.file, outputPath)
        break
      
      default:
        await image.toFile(outputPath)
    }
  }

  async generateModernFormats(originalPath, image, result) {
    const basePath = originalPath.replace(path.extname(originalPath), '')
    
    try {
      // Gerar WebP
      const webpPath = `${basePath}.webp`
      if (!fs.existsSync(webpPath)) {
        await image
          .webp({ quality: 85, effort: 6 })
          .toFile(webpPath)
        
        const webpStats = fs.statSync(webpPath)
        result.optimizations.push({
          format: 'webp',
          size: webpStats.size,
          sizeKB: Math.round(webpStats.size / 1024),
          savings: result.originalSize - webpStats.size,
          savingsPercent: Math.round(((result.originalSize - webpStats.size) / result.originalSize) * 100)
        })
      }

      // Gerar AVIF (mais agressivo na compressão)
      const avifPath = `${basePath}.avif`
      if (!fs.existsSync(avifPath)) {
        await image
          .avif({ quality: 80, effort: 9 })
          .toFile(avifPath)
        
        const avifStats = fs.statSync(avifPath)
        result.optimizations.push({
          format: 'avif',
          size: avifStats.size,
          sizeKB: Math.round(avifStats.size / 1024),
          savings: result.originalSize - avifStats.size,
          savingsPercent: Math.round(((result.originalSize - avifStats.size) / result.originalSize) * 100)
        })
      }

    } catch (error) {
      console.log(`   ⚠️  Erro ao gerar formatos modernos: ${error.message}`)
    }
  }

  getOptimizedPath(originalPath, format) {
    const dir = path.dirname(originalPath)
    const name = path.basename(originalPath, path.extname(originalPath))
    const ext = format === 'jpeg' ? 'jpg' : format
    return path.join(dir, `${name}_optimized.${ext}`)
  }

  displayResults() {
    console.log('\n📊 RELATÓRIO DE OTIMIZAÇÃO DE IMAGENS\n')
    console.log('=' .repeat(50))
    
    console.log(`📁 Imagens processadas: ${this.results.processed}`)
    console.log(`✅ Imagens otimizadas: ${this.results.optimized}`)
    console.log(`❌ Erros: ${this.results.errors}`)
    console.log(`💾 Economia total: ${Math.round(this.results.totalSavings / 1024)}KB`)

    if (this.results.files.length > 0) {
      console.log('\n🏆 TOP 10 MAIORES ECONOMIAS')
      console.log('-'.repeat(50))
      
      const sortedByEconomy = this.results.files
        .filter(file => file.optimizations.some(opt => opt.savings > 0))
        .sort((a, b) => {
          const aSavings = Math.max(...a.optimizations.map(opt => opt.savings))
          const bSavings = Math.max(...b.optimizations.map(opt => opt.savings))
          return bSavings - aSavings
        })
        .slice(0, 10)

      sortedByEconomy.forEach((file, index) => {
        const bestOptimization = file.optimizations.reduce((best, current) => 
          current.savings > best.savings ? current : best
        )
        console.log(`${index + 1}. ${file.path}`)
        console.log(`   ${file.originalSizeKB}KB → ${bestOptimization.sizeKB}KB (${bestOptimization.savingsPercent}% economia)`)
      })
    }

    // Recomendações
    console.log('\n💡 RECOMENDAÇÕES')
    console.log('-'.repeat(50))
    
    const largeImages = this.results.files.filter(file => file.originalSizeKB > 500)
    if (largeImages.length > 0) {
      console.log(`⚠️  ${largeImages.length} imagem(ns) muito grande(s) (>500KB) encontrada(s)`)
      console.log('   💡 Considere redimensionar ou usar lazy loading')
    }

    const unoptimizedImages = this.results.files.filter(file => 
      !file.optimizations.some(opt => opt.format === 'webp' || opt.format === 'avif')
    )
    if (unoptimizedImages.length > 0) {
      console.log(`ℹ️  ${unoptimizedImages.length} imagem(ns) sem formatos modernos`)
      console.log('   💡 Use Next.js Image component para servir WebP/AVIF automaticamente')
    }

    console.log('\n✅ Otimização concluída!')
  }

  saveReport() {
    const reportPath = path.join(process.cwd(), 'image-optimization-report.json')
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        processed: this.results.processed,
        optimized: this.results.optimized,
        errors: this.results.errors,
        totalSavingsBytes: this.results.totalSavings,
        totalSavingsKB: Math.round(this.results.totalSavings / 1024)
      },
      files: this.results.files
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`\n📄 Relatório salvo em: ${reportPath}`)
  }
}

// Executar otimização se chamado diretamente
if (require.main === module) {
  const optimizer = new ImageOptimizer()
  optimizer.optimize().catch(console.error)
}

module.exports = ImageOptimizer