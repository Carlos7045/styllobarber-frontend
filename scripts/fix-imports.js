#!/usr/bin/env node

/**
 * Script para corrigir imports não otimizados
 * Substitui imports que carregam bibliotecas inteiras por imports específicos
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Configurações
const SRC_DIR = path.join(process.cwd(), 'src')
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx']

// Padrões de imports problemáticos e suas correções
const IMPORT_FIXES = {
  // TanStack Query v5 - cacheTime deprecated
  "cacheTime:": {
    replacement: "gcTime:",
    warning: "⚠️  'cacheTime' foi renomeado para 'gcTime' no TanStack Query v5+"
  }
}

// Imports específicos comuns que devem ser redirecionados
const SPECIFIC_REDIRECTS = {
  "from ['\"]lucide-react['\"]": "from '@/shared/utils/optimized-imports'",
  "from ['\"]date-fns['\"]": "from '@/shared/utils/optimized-imports'",
  "from ['\"]recharts['\"]": "from '@/shared/utils/optimized-imports'",
  "from ['\"]framer-motion['\"]": "from '@/shared/utils/optimized-imports'",
  "from ['\"]@tanstack/react-query['\"]": "from '@/shared/utils/optimized-imports'",
  "from ['\"]zustand['\"]": "from '@/shared/utils/optimized-imports'"
}

// Estatísticas
let stats = {
  filesScanned: 0,
  filesModified: 0,
  issuesFound: 0,
  issuesFixed: 0,
  warnings: []
}

/**
 * Verificar se um arquivo deve ser processado
 */
function shouldProcessFile(filePath) {
  const ext = path.extname(filePath)
  return EXTENSIONS.includes(ext) && 
         !filePath.includes('node_modules') &&
         !filePath.includes('.next') &&
         !filePath.includes('dist') &&
         !filePath.includes('build')
}

/**
 * Processar um arquivo
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    let modifiedContent = content
    let fileModified = false
    let fileIssues = 0
    
    // Aplicar correções de imports problemáticos
    for (const [pattern, fix] of Object.entries(IMPORT_FIXES)) {
      const regex = new RegExp(pattern, 'g')
      const matches = content.match(regex)
      
      if (matches) {
        fileIssues += matches.length
        stats.warnings.push(`${filePath}: ${fix.warning}`)
        
        // Para alguns casos, podemos fazer a substituição automática
        if (pattern === 'cacheTime:') {
          modifiedContent = modifiedContent.replace(regex, fix.replacement)
          fileModified = true
          stats.issuesFixed++
        }
      }
    }
    
    // Aplicar redirecionamentos de imports específicos
    for (const [pattern, replacement] of Object.entries(SPECIFIC_REDIRECTS)) {
      const regex = new RegExp(pattern, 'g')
      if (regex.test(modifiedContent)) {
        modifiedContent = modifiedContent.replace(regex, replacement)
        fileModified = true
      }
    }
    
    // Salvar arquivo se foi modificado
    if (fileModified) {
      fs.writeFileSync(filePath, modifiedContent, 'utf8')
      stats.filesModified++
      console.log(`✅ Corrigido: ${path.relative(process.cwd(), filePath)}`)
    }
    
    stats.issuesFound += fileIssues
    
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message)
  }
}

/**
 * Escanear diretório recursivamente
 */
function scanDirectory(dir) {
  const items = fs.readdirSync(dir)
  
  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory()) {
      // Pular diretórios que não devem ser processados
      if (!['node_modules', '.next', 'dist', 'build', '.git'].includes(item)) {
        scanDirectory(fullPath)
      }
    } else if (stat.isFile() && shouldProcessFile(fullPath)) {
      stats.filesScanned++
      processFile(fullPath)
    }
  }
}

/**
 * Gerar relatório de otimizações sugeridas
 */
function generateOptimizationReport() {
  const report = `# Relatório de Otimização de Imports

## 📊 Estatísticas

- **Arquivos escaneados**: ${stats.filesScanned}
- **Arquivos modificados**: ${stats.filesModified}
- **Problemas encontrados**: ${stats.issuesFound}
- **Problemas corrigidos automaticamente**: ${stats.issuesFixed}
- **Avisos**: ${stats.warnings.length}

## ⚠️ Avisos e Recomendações

${stats.warnings.map(warning => `- ${warning}`).join('\n')}

## 🎯 Próximas Ações Recomendadas

### 1. Imports Manuais Necessários
Os seguintes imports precisam ser corrigidos manualmente:

#### Lucide React
\`\`\`typescript
// ❌ Evitar
import * as Icons from 'lucide-react'
import { Calendar, User, Settings, /* ... todos os ícones */ } from 'lucide-react'

// ✅ Usar
import { Calendar, User, Settings } from '@/shared/utils/optimized-imports'
\`\`\`

#### Date-fns
\`\`\`typescript
// ❌ Evitar
import * as dateFns from 'date-fns'
import { format, parseISO, addDays, /* ... todas as funções */ } from 'date-fns'

// ✅ Usar
import { format, parseISO, addDays } from '@/shared/utils/optimized-imports'
\`\`\`

#### Recharts
\`\`\`typescript
// ❌ Evitar
import * as Recharts from 'recharts'

// ✅ Usar
import { LineChart, XAxis, YAxis, Tooltip } from '@/shared/utils/optimized-imports'
\`\`\`

### 2. Configurações Adicionais

#### Webpack Bundle Analyzer
Para monitorar o progresso:
\`\`\`bash
npm install --save-dev @next/bundle-analyzer
npm run build
npx next-bundle-analyzer
\`\`\`

### 3. Verificação de Progresso

Após aplicar as correções manuais:
1. Execute \`npm run build\` para verificar o tamanho do bundle
2. Use \`npm run analyze-bundle\` para análise detalhada
3. Execute este script novamente para verificar melhorias

## 📈 Meta de Otimização

- **Bundle atual**: ~78MB
- **Meta**: <20MB (redução de 75%)
- **Chunk maior atual**: ~10MB
- **Meta**: <2MB por chunk

## 🔧 Comandos Úteis

\`\`\`bash
# Executar este script
node scripts/fix-imports.js

# Analisar bundle
npm run build && npx next-bundle-analyzer

# Verificar otimizações
npm run optimize-all

# Executar testes
npm test
\`\`\`
`

  fs.writeFileSync('IMPORT_OPTIMIZATION_REPORT.md', report)
  console.log('\n📄 Relatório salvo em: IMPORT_OPTIMIZATION_REPORT.md')
}

/**
 * Função principal
 */
function main() {
  console.log('🚀 Iniciando correção de imports...')
  console.log(`📁 Escaneando diretório: ${SRC_DIR}`)
  
  const startTime = Date.now()
  
  // Escanear e processar arquivos
  scanDirectory(SRC_DIR)
  
  const endTime = Date.now()
  const duration = ((endTime - startTime) / 1000).toFixed(2)
  
  // Exibir resultados
  console.log('\n📊 Resultados:')
  console.log(`⏱️  Tempo de execução: ${duration}s`)
  console.log(`📄 Arquivos escaneados: ${stats.filesScanned}`)
  console.log(`✏️  Arquivos modificados: ${stats.filesModified}`)
  console.log(`🔍 Problemas encontrados: ${stats.issuesFound}`)
  console.log(`✅ Problemas corrigidos: ${stats.issuesFixed}`)
  console.log(`⚠️  Avisos: ${stats.warnings.length}`)
  
  // Gerar relatório
  generateOptimizationReport()
  
  // Sugestões finais
  console.log('\n🎯 Próximos passos:')
  console.log('1. Revise o relatório gerado: IMPORT_OPTIMIZATION_REPORT.md')
  console.log('2. Corrija manualmente os imports problemáticos')
  console.log('3. Execute: npm run build para verificar melhorias')
  console.log('4. Use: npx next-bundle-analyzer para análise detalhada')
  
  if (stats.issuesFound > stats.issuesFixed) {
    console.log('\n⚠️  Atenção: Alguns problemas precisam de correção manual.')
    process.exit(1)
  } else {
    console.log('\n✅ Todas as correções automáticas foram aplicadas!')
    process.exit(0)
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main()
}

module.exports = {
  processFile,
  scanDirectory,
  IMPORT_FIXES,
  SPECIFIC_REDIRECTS
}