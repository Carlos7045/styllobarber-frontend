#!/usr/bin/env node

/**
 * Helper script para executar ESLint em arquivos específicos
 * Como o MCP do ESLint não está funcionando, usamos este script como alternativa
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Função para executar lint em arquivo específico
function lintFile(filePath) {
  try {
    const relativePath = path.relative(process.cwd(), filePath);
    console.log(`🔍 Executando ESLint em: ${relativePath}`);
    
    const result = execSync(`npx eslint "${relativePath}"`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log('✅ Nenhum problema encontrado!');
    return { success: true, output: result };
  } catch (error) {
    console.log('⚠️ Problemas encontrados:');
    console.log(error.stdout);
    return { success: false, output: error.stdout };
  }
}

// Função para executar lint com correção automática
function lintAndFix(filePath) {
  try {
    const relativePath = path.relative(process.cwd(), filePath);
    console.log(`🔧 Executando ESLint com correção em: ${relativePath}`);
    
    const result = execSync(`npx eslint "${relativePath}" --fix`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log('✅ Arquivo corrigido automaticamente!');
    return { success: true, output: result };
  } catch (error) {
    console.log('⚠️ Alguns problemas não puderam ser corrigidos automaticamente:');
    console.log(error.stdout);
    return { success: false, output: error.stdout };
  }
}

// Função para lint de diretório
function lintDirectory(dirPath = 'src') {
  try {
    console.log(`🔍 Executando ESLint no diretório: ${dirPath}`);
    
    const result = execSync(`npx eslint "${dirPath}/**/*.{js,jsx,ts,tsx}"`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log('✅ Nenhum problema encontrado no diretório!');
    return { success: true, output: result };
  } catch (error) {
    console.log('⚠️ Problemas encontrados no diretório:');
    console.log(error.stdout);
    return { success: false, output: error.stdout };
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const target = args[1];

  switch (command) {
    case 'file':
      if (!target) {
        console.error('❌ Uso: node lint-helper.js file <caminho-do-arquivo>');
        process.exit(1);
      }
      lintFile(target);
      break;
      
    case 'fix':
      if (!target) {
        console.error('❌ Uso: node lint-helper.js fix <caminho-do-arquivo>');
        process.exit(1);
      }
      lintAndFix(target);
      break;
      
    case 'dir':
      lintDirectory(target || 'src');
      break;
      
    default:
      console.log(`
🔧 ESLint Helper - StylloBarber

Comandos disponíveis:
  file <arquivo>    - Executa lint em arquivo específico
  fix <arquivo>     - Executa lint com correção automática
  dir [diretório]   - Executa lint em diretório (padrão: src)

Exemplos:
  node scripts/lint-helper.js file src/components/ui/button.tsx
  node scripts/lint-helper.js fix src/hooks/use-auth.ts
  node scripts/lint-helper.js dir src/components

Ou use os comandos npm:
  npm run lint      - Lint completo do projeto
  npm run lint:fix  - Lint com correção automática
      `);
  }
}

module.exports = { lintFile, lintAndFix, lintDirectory };