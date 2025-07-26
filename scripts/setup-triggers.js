#!/usr/bin/env node

/**
 * Script para configurar e testar triggers do Supabase
 * 
 * Uso:
 * node scripts/setup-triggers.js [comando]
 * 
 * Comandos:
 * - install: Instala os triggers
 * - test: Executa os testes
 * - status: Verifica status dos triggers
 * - help: Mostra ajuda
 */

const fs = require('fs')
const path = require('path')

// Configurações
const MIGRATION_FILE = path.join(__dirname, '../supabase/migrations/20240101000001_auth_triggers.sql')
const RLS_MIGRATION_FILE = path.join(__dirname, '../supabase/migrations/20240102000001_rls_policies.sql')
const TEST_FILE = path.join(__dirname, '../supabase/tests/triggers_test.sql')
const RLS_TEST_FILE = path.join(__dirname, '../supabase/tests/rls_policies_test.sql')

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function showHelp() {
  log('\n📋 Setup de Triggers do Supabase - StylloBarber\n', 'bright')
  
  log('Comandos disponíveis:', 'cyan')
  log('  install  - Instala triggers e políticas RLS')
  log('  test     - Executa testes de triggers e RLS')
  log('  status   - Verifica status de triggers e RLS')
  log('  rls      - Instala apenas políticas RLS')
  log('  help     - Mostra esta ajuda')
  
  log('\nExemplos:', 'yellow')
  log('  node scripts/setup-triggers.js install')
  log('  node scripts/setup-triggers.js rls')
  log('  node scripts/setup-triggers.js test')
  log('  node scripts/setup-triggers.js status')
  
  log('\nPré-requisitos:', 'magenta')
  log('  - Supabase CLI instalado')
  log('  - Projeto Supabase configurado')
  log('  - Variáveis de ambiente configuradas')
  
  log('\nArquivos:', 'blue')
  log(`  Triggers: ${MIGRATION_FILE}`)
  log(`  RLS: ${RLS_MIGRATION_FILE}`)
  log(`  Testes Triggers: ${TEST_FILE}`)
  log(`  Testes RLS: ${RLS_TEST_FILE}`)
}

function checkFiles() {
  const files = [
    { path: MIGRATION_FILE, name: 'Migration de triggers' },
    { path: RLS_MIGRATION_FILE, name: 'Migration de políticas RLS' },
    { path: TEST_FILE, name: 'Testes de triggers' },
    { path: RLS_TEST_FILE, name: 'Testes de políticas RLS' }
  ]
  
  let allExist = true
  
  for (const file of files) {
    if (fs.existsSync(file.path)) {
      log(`✅ ${file.name}: OK`, 'green')
    } else {
      log(`❌ ${file.name}: Não encontrado`, 'red')
      allExist = false
    }
  }
  
  return allExist
}

function showInstallInstructions() {
  log('\n🚀 Instruções para Instalação Completa\n', 'bright')
  
  log('Opção 1: Via Supabase CLI (Recomendado)', 'cyan')
  log('  # Instalar triggers')
  log(`  supabase db push --file ${MIGRATION_FILE}`)
  log('  # Instalar políticas RLS')
  log(`  supabase db push --file ${RLS_MIGRATION_FILE}`)
  log('  # ou instalar tudo de uma vez')
  log('  supabase db push')
  
  log('\nOpção 2: Via Dashboard do Supabase', 'cyan')
  log('  1. Acesse o SQL Editor no dashboard')
  log('  2. Execute primeiro o arquivo de triggers')
  log('  3. Execute depois o arquivo de políticas RLS')
  
  log('\nVerificação:', 'yellow')
  log('  Após a instalação, execute:')
  log('  node scripts/setup-triggers.js test')
}

function showRLSInstructions() {
  log('\n🔐 Instruções para Políticas RLS\n', 'bright')
  
  log('Via Supabase CLI:', 'cyan')
  log(`  supabase db push --file ${RLS_MIGRATION_FILE}`)
  
  log('\nVia Dashboard do Supabase:', 'cyan')
  log('  1. Acesse o SQL Editor no dashboard')
  log('  2. Cole o conteúdo do arquivo de políticas RLS')
  log('  3. Execute o script')
  
  log('\nO que as políticas RLS fazem:', 'yellow')
  log('  🔒 Controle de acesso por role (admin, barber, client)')
  log('  🔒 Usuários só veem seus próprios dados')
  log('  🔒 Admins têm acesso completo')
  log('  🔒 Barbeiros veem apenas clientes')
  log('  🔒 Proteção contra acesso não autorizado')
  
  log('\nTeste:', 'magenta')
  log(`  supabase db push --file ${RLS_TEST_FILE}`)
}

function showTestInstructions() {
  log('\n🧪 Instruções para Executar Testes\n', 'bright')
  
  log('Testes de Triggers:', 'cyan')
  log(`  supabase db push --file ${TEST_FILE}`)
  
  log('\nTestes de Políticas RLS:', 'cyan')
  log(`  supabase db push --file ${RLS_TEST_FILE}`)
  
  log('\nVia Dashboard do Supabase:', 'cyan')
  log('  1. Acesse o SQL Editor no dashboard')
  log('  2. Execute primeiro os testes de triggers')
  log('  3. Execute depois os testes de RLS')
  log('  4. Verifique os resultados no output')
  
  log('\nTestes de Triggers verificam:', 'yellow')
  log('  ✅ Criação automática de perfil')
  log('  ✅ Atualização de timestamps')
  log('  ✅ Validação de dados')
  log('  ✅ Sincronização de email')
  log('  ✅ Log de auditoria')
  log('  ✅ Limpeza de dados relacionados')
  log('  ✅ Performance dos triggers')
  
  log('\nTestes de RLS verificam:', 'yellow')
  log('  🔒 RLS habilitado nas tabelas')
  log('  🔒 Políticas criadas corretamente')
  log('  🔒 Funções auxiliares funcionando')
  log('  🔒 Controle de acesso por role')
  log('  🔒 Performance das políticas')
}

function showStatusInstructions() {
  log('\n📊 Verificação de Status dos Triggers\n', 'bright')
  
  log('Execute no SQL Editor do Supabase:', 'cyan')
  
  log('\n-- Verificar triggers criados')
  log(`SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name IN (
  'on_auth_user_created',
  'update_profiles_updated_at', 
  'sync_profiles_email',
  'cleanup_user_data',
  'validate_profile_data',
  'audit_profiles'
)
ORDER BY trigger_name;`, 'blue')
  
  log('\n-- Verificar funções criadas')
  log(`SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'handle_new_user',
  'sync_user_email',
  'handle_user_delete', 
  'validate_profile_data',
  'audit_profile_changes',
  'update_updated_at_column'
)
ORDER BY routine_name;`, 'blue')
  
  log('\nResultado esperado:', 'yellow')
  log('  - 6 triggers ativos')
  log('  - 6 funções criadas')
  log('  - Todos com status ativo')
}

function showFileContents() {
  log('\n📄 Conteúdo dos Arquivos\n', 'bright')
  
  if (fs.existsSync(MIGRATION_FILE)) {
    const migrationSize = fs.statSync(MIGRATION_FILE).size
    log(`Migration (${migrationSize} bytes):`, 'green')
    log(`  ${MIGRATION_FILE}`)
  }
  
  if (fs.existsSync(TEST_FILE)) {
    const testSize = fs.statSync(TEST_FILE).size
    log(`Testes (${testSize} bytes):`, 'green')
    log(`  ${TEST_FILE}`)
  }
  
  log('\nPara ver o conteúdo:', 'cyan')
  log(`  cat ${MIGRATION_FILE}`)
  log(`  cat ${TEST_FILE}`)
}

function main() {
  const command = process.argv[2] || 'help'
  
  log('🔧 Setup de Triggers - StylloBarber', 'bright')
  log('=====================================\n')
  
  // Verificar se arquivos existem
  const filesExist = checkFiles()
  
  if (!filesExist && command !== 'help') {
    log('\n❌ Alguns arquivos necessários não foram encontrados!', 'red')
    log('Verifique se você está executando o script na raiz do projeto.\n')
    return
  }
  
  switch (command) {
    case 'install':
      showInstallInstructions()
      break
      
    case 'rls':
      showRLSInstructions()
      break
      
    case 'test':
      showTestInstructions()
      break
      
    case 'status':
      showStatusInstructions()
      break
      
    case 'files':
      showFileContents()
      break
      
    case 'help':
    default:
      showHelp()
      break
  }
  
  log('\n📚 Documentação completa:', 'magenta')
  log('  docs/supabase-triggers.md')
  log('  docs/supabase-storage-setup.md\n')
}

// Executar script
if (require.main === module) {
  main()
}

module.exports = {
  showHelp,
  checkFiles,
  showInstallInstructions,
  showTestInstructions,
  showStatusInstructions
}