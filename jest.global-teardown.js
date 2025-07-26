/**
 * Jest global teardown
 * Executado uma vez após todos os testes
 */

module.exports = async () => {
  console.log('🧹 Iniciando teardown global dos testes...')
  
  // Calcular métricas finais de teste
  if (global.testMetrics) {
    const endTime = Date.now()
    const totalTime = endTime - global.testMetrics.startTime
    
    console.log(`📊 Métricas dos testes:`)
    console.log(`   ⏱️  Tempo total: ${totalTime}ms`)
    console.log(`   🔄 Operações: ${global.testMetrics.operations.length}`)
    console.log(`   ❌ Erros: ${global.testMetrics.errors.length}`)
    
    if (global.testMetrics.errors.length > 0) {
      console.log(`   📝 Primeiros 5 erros:`)
      global.testMetrics.errors.slice(0, 5).forEach((error, index) => {
        console.log(`      ${index + 1}. ${error.message}`)
      })
    }
  }
  
  // Limpar timers pendentes
  if (global.clearAllTimers) {
    global.clearAllTimers()
  }
  
  // Limpar mocks globais
  if (global.mockSupabaseClient) {
    Object.keys(global.mockSupabaseClient).forEach(key => {
      if (global.mockSupabaseClient[key] && typeof global.mockSupabaseClient[key].mockClear === 'function') {
        global.mockSupabaseClient[key].mockClear()
      }
    })
  }
  
  // Forçar garbage collection se disponível
  if (global.gc) {
    global.gc()
  }
  
  // Restaurar console original
  if (global.originalConsole) {
    global.console = global.originalConsole
  }
  
  // Limpar event listeners
  if (typeof window !== 'undefined') {
    window.removeAllListeners?.()
  }
  
  // Limpar storage mocks
  if (global.localStorage) {
    global.localStorage.clear()
  }
  
  if (global.sessionStorage) {
    global.sessionStorage.clear()
  }
  
  // Relatório final de cobertura
  if (process.env.COLLECT_COVERAGE === 'true') {
    console.log('📈 Cobertura de código será gerada...')
  }
  
  console.log('✅ Teardown global dos testes concluído')
}