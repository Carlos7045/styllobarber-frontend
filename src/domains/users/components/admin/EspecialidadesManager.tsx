/**
 * Componente para gerenciamento avançado de especialidades
 * Permite operações em lote e sincronização automática
 */

'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/shared/components/ui'
import { useFuncionariosAdmin } from '@/domains/users/hooks/use-funcionarios-admin'
import { useServices } from '@/shared/hooks/data/use-services'
import { Users, Scissors, RefreshCw, AlertTriangle, CheckCircle, Copy, RotateCcw } from 'lucide-react'
import type { FuncionarioComEspecialidades } from '@/types/funcionarios'
import type { Service } from '@/types/services'

interface EspecialidadesManagerProps {
  className?: string
}

export function EspecialidadesManager({ className }: EspecialidadesManagerProps) {
  const { funcionarios, loading: funcionariosLoading, updateEspecialidades, refetch } = useFuncionariosAdmin()
  const { services, loading: servicesLoading } = useServices()
  
  const [selectedFuncionarios, setSelectedFuncionarios] = useState<string[]>([])
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [operationLoading, setOperationLoading] = useState(false)
  const [lastOperation, setLastOperation] = useState<string | null>(null)

  // Filtrar apenas funcionários barbeiros
  const barbeiros = funcionarios.filter(f => f.role === 'barber')

  // Calcular estatísticas
  const stats = {
    totalBarbeiros: barbeiros.length,
    barbeirosComEspecialidades: barbeiros.filter(f => f.servicos.length > 0).length,
    barbeirosSeEspecialidades: barbeiros.filter(f => f.servicos.length === 0).length,
    totalServicos: services.length,
    servicosNaoAtribuidos: services.filter(service => 
      !barbeiros.some(barbeiro => barbeiro.servicos.some(s => s.id === service.id))
    ).length,
  }

  // Função para aplicar especialidades em lote
  const handleBulkApplyEspecialidades = useCallback(async () => {
    if (selectedFuncionarios.length === 0 || selectedServices.length === 0) {
      alert('Selecione pelo menos um funcionário e um serviço')
      return
    }

    const confirmar = window.confirm(
      `Aplicar especialidades em lote?\n\n` +
      `Funcionários selecionados: ${selectedFuncionarios.length}\n` +
      `Serviços selecionados: ${selectedServices.length}\n\n` +
      `Esta operação irá ADICIONAR os serviços selecionados às especialidades existentes dos funcionários.`
    )

    if (!confirmar) return

    console.log('🚀 Iniciando aplicação em lote de especialidades')
    console.log('👥 Funcionários selecionados:', selectedFuncionarios)
    console.log('🔧 Serviços selecionados:', selectedServices)
    console.log('📋 Lista de funcionários disponíveis:', funcionarios.map(f => ({ 
      id: f.id, 
      nome: f.nome,
      tipo_id: typeof f.id,
      length_id: f.id?.length,
      isValidUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(f.id)
    })))
    
    // Verificar se todos os funcionários selecionados existem na lista
    const funcionariosInvalidos = selectedFuncionarios.filter(id => 
      !funcionarios.find(f => f.id === id)
    )
    
    if (funcionariosInvalidos.length > 0) {
      console.error('❌ Funcionários selecionados não encontrados na lista:', funcionariosInvalidos)
      alert('Erro: Alguns funcionários selecionados não foram encontrados. Recarregue a página.')
      return
    }

    setOperationLoading(true)
    setLastOperation('Aplicando especialidades em lote...')

    try {
      let sucessos = 0
      let erros = 0

      for (const funcionarioId of selectedFuncionarios) {
        try {
          console.log('🔍 Processando funcionário ID:', funcionarioId)
          
          const funcionario = funcionarios.find(f => f.id === funcionarioId)
          if (!funcionario) {
            console.error('❌ Funcionário não encontrado na lista:', funcionarioId)
            erros++
            continue
          }

          console.log('✅ Funcionário encontrado:', funcionario.nome, 'ID:', funcionario.id)

          // Combinar especialidades existentes com as novas
          const especialidadesExistentes = funcionario.servicos.map(s => s.id)
          const novasEspecialidades = [...new Set([...especialidadesExistentes, ...selectedServices])]

          console.log('📝 Dados para atualização:', {
            funcionario_id: funcionarioId,
            service_ids: novasEspecialidades,
            funcionario_nome: funcionario.nome
          })

          const result = await updateEspecialidades({
            funcionario_id: funcionarioId,
            service_ids: novasEspecialidades
          })

          if (result.success) {
            sucessos++
            console.log('✅ Sucesso para:', funcionario.nome)
          } else {
            erros++
            console.error(`❌ Erro ao atualizar ${funcionario.nome}:`, result.error)
          }
        } catch (err) {
          erros++
          console.error(`❌ Erro inesperado para funcionário ${funcionarioId}:`, err)
        }
      }

      await refetch()

      alert(
        `Operação concluída!\n\n` +
        `✅ Sucessos: ${sucessos}\n` +
        `❌ Erros: ${erros}\n\n` +
        `${sucessos > 0 ? 'As especialidades foram aplicadas com sucesso.' : ''}`
      )

      // Limpar seleções
      setSelectedFuncionarios([])
      setSelectedServices([])
      setLastOperation(`Concluído: ${sucessos} sucessos, ${erros} erros`)

    } catch (err) {
      console.error('Erro na operação em lote:', err)
      alert('Erro inesperado na operação em lote')
      setLastOperation('Erro na operação')
    } finally {
      setOperationLoading(false)
    }
  }, [selectedFuncionarios, selectedServices, funcionarios, updateEspecialidades, refetch])

  // Função para copiar especialidades de um funcionário para outros
  const handleCopyEspecialidades = useCallback(async (sourceFuncionarioId: string) => {
    if (selectedFuncionarios.length === 0) {
      alert('Selecione os funcionários que receberão as especialidades')
      return
    }

    const sourceFuncionario = funcionarios.find(f => f.id === sourceFuncionarioId)
    if (!sourceFuncionario) return

    if (sourceFuncionario.servicos.length === 0) {
      alert(`${sourceFuncionario.nome} não possui especialidades para copiar`)
      return
    }

    const targetFuncionarios = selectedFuncionarios.filter(id => id !== sourceFuncionarioId)
    if (targetFuncionarios.length === 0) {
      alert('Selecione funcionários diferentes do funcionário de origem')
      return
    }

    const confirmar = window.confirm(
      `Copiar especialidades?\n\n` +
      `De: ${sourceFuncionario.nome}\n` +
      `Especialidades: ${sourceFuncionario.servicos.map(s => s.nome).join(', ')}\n\n` +
      `Para: ${targetFuncionarios.length} funcionário(s)\n\n` +
      `Esta operação irá SUBSTITUIR as especialidades existentes dos funcionários selecionados.`
    )

    if (!confirmar) return

    setOperationLoading(true)
    setLastOperation('Copiando especialidades...')

    try {
      const serviceIds = sourceFuncionario.servicos.map(s => s.id)
      let sucessos = 0
      let erros = 0

      for (const funcionarioId of targetFuncionarios) {
        try {
          const result = await updateEspecialidades({
            funcionario_id: funcionarioId,
            service_ids: serviceIds
          })

          if (result.success) {
            sucessos++
          } else {
            erros++
          }
        } catch (err) {
          erros++
          console.error(`Erro ao copiar para funcionário ${funcionarioId}:`, err)
        }
      }

      await refetch()

      alert(
        `Especialidades copiadas!\n\n` +
        `✅ Sucessos: ${sucessos}\n` +
        `❌ Erros: ${erros}`
      )

      setSelectedFuncionarios([])
      setLastOperation(`Cópia concluída: ${sucessos} sucessos, ${erros} erros`)

    } catch (err) {
      console.error('Erro ao copiar especialidades:', err)
      alert('Erro inesperado ao copiar especialidades')
      setLastOperation('Erro na cópia')
    } finally {
      setOperationLoading(false)
    }
  }, [selectedFuncionarios, funcionarios, updateEspecialidades, refetch])

  // Função para sincronizar especialidades com serviços ativos
  const handleSyncEspecialidades = useCallback(async () => {
    const confirmar = window.confirm(
      `Sincronizar especialidades com serviços?\n\n` +
      `Esta operação irá:\n` +
      `• Remover especialidades de serviços desativados\n` +
      `• Manter apenas especialidades de serviços ativos\n\n` +
      `Deseja continuar?`
    )

    if (!confirmar) return

    setOperationLoading(true)
    setLastOperation('Sincronizando especialidades...')

    try {
      const servicosAtivos = services.filter(s => s.ativo).map(s => s.id)
      let funcionariosAtualizados = 0

      for (const funcionario of barbeiros) {
        // Filtrar apenas especialidades de serviços ativos
        const especialidadesValidas = funcionario.servicos
          .filter(s => servicosAtivos.includes(s.id))
          .map(s => s.id)

        // Só atualizar se houver diferença
        const especialidadesAtuais = funcionario.servicos.map(s => s.id).sort()
        const especialidadesNovas = especialidadesValidas.sort()

        if (JSON.stringify(especialidadesAtuais) !== JSON.stringify(especialidadesNovas)) {
          const result = await updateEspecialidades({
            funcionario_id: funcionario.id,
            service_ids: especialidadesValidas
          })

          if (result.success) {
            funcionariosAtualizados++
          }
        }
      }

      await refetch()

      alert(
        `Sincronização concluída!\n\n` +
        `${funcionariosAtualizados} funcionário(s) atualizado(s)\n\n` +
        `Todas as especialidades agora correspondem apenas a serviços ativos.`
      )

      setLastOperation(`Sincronização concluída: ${funcionariosAtualizados} atualizações`)

    } catch (err) {
      console.error('Erro na sincronização:', err)
      alert('Erro inesperado na sincronização')
      setLastOperation('Erro na sincronização')
    } finally {
      setOperationLoading(false)
    }
  }, [barbeiros, services, updateEspecialidades, refetch])

  const loading = funcionariosLoading || servicesLoading

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scissors className="h-5 w-5 text-primary-gold" />
          Gerenciador de Especialidades
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg dark:bg-blue-900/20">
            <div className="text-2xl font-bold text-blue-600">{stats.totalBarbeiros}</div>
            <div className="text-sm text-blue-600">Total Barbeiros</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg dark:bg-green-900/20">
            <div className="text-2xl font-bold text-green-600">{stats.barbeirosComEspecialidades}</div>
            <div className="text-sm text-green-600">Com Especialidades</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg dark:bg-orange-900/20">
            <div className="text-2xl font-bold text-orange-600">{stats.barbeirosSeEspecialidades}</div>
            <div className="text-sm text-orange-600">Sem Especialidades</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg dark:bg-purple-900/20">
            <div className="text-2xl font-bold text-purple-600">{stats.servicosNaoAtribuidos}</div>
            <div className="text-sm text-purple-600">Serviços Não Atribuídos</div>
          </div>
        </div>

        {/* Operações em lote */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Operações em Lote</h3>
          
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleBulkApplyEspecialidades}
              disabled={loading || operationLoading || selectedFuncionarios.length === 0 || selectedServices.length === 0}
              className="bg-primary-gold hover:bg-primary-gold-dark text-primary-black"
            >
              <Users className="h-4 w-4 mr-2" />
              Aplicar em Lote
            </Button>

            <Button
              onClick={handleSyncEspecialidades}
              disabled={loading || operationLoading}
              variant="outline"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Sincronizar com Serviços
            </Button>

            <Button
              onClick={() => refetch()}
              disabled={loading || operationLoading}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          {lastOperation && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Última operação: {lastOperation}
            </div>
          )}
        </div>

        {/* Seleção de funcionários */}
        <div className="space-y-3">
          <h4 className="font-medium">Selecionar Funcionários ({selectedFuncionarios.length})</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {barbeiros.map(funcionario => (
              <label
                key={funcionario.id}
                className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <input
                  type="checkbox"
                  checked={selectedFuncionarios.includes(funcionario.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedFuncionarios(prev => [...prev, funcionario.id])
                    } else {
                      setSelectedFuncionarios(prev => prev.filter(id => id !== funcionario.id))
                    }
                  }}
                  className="rounded"
                />
                <div className="flex-1">
                  <div className="font-medium">{funcionario.nome}</div>
                  <div className="text-sm text-gray-500">
                    {funcionario.servicos.length} especialidade{funcionario.servicos.length !== 1 ? 's' : ''}
                    {funcionario.servicos.length > 0 && (
                      <Button
                        onClick={(e) => {
                          e.preventDefault()
                          handleCopyEspecialidades(funcionario.id)
                        }}
                        size="sm"
                        variant="ghost"
                        className="ml-2 h-6 px-2"
                        title="Copiar especialidades deste funcionário"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Seleção de serviços */}
        <div className="space-y-3">
          <h4 className="font-medium">Selecionar Serviços ({selectedServices.length})</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {services.filter(s => s.ativo).map(service => (
              <label
                key={service.id}
                className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <input
                  type="checkbox"
                  checked={selectedServices.includes(service.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedServices(prev => [...prev, service.id])
                    } else {
                      setSelectedServices(prev => prev.filter(id => id !== service.id))
                    }
                  }}
                  className="rounded"
                />
                <div className="flex-1">
                  <div className="font-medium">{service.nome}</div>
                  <div className="text-sm text-gray-500">
                    R$ {service.preco.toFixed(2)} • {service.duracao_minutos}min
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Alertas */}
        {stats.barbeirosSeEspecialidades > 0 && (
          <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg dark:bg-orange-900/20 dark:border-orange-800/30">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <span className="text-sm text-orange-700 dark:text-orange-300">
              {stats.barbeirosSeEspecialidades} barbeiro(s) sem especialidades não poderão realizar serviços.
            </span>
          </div>
        )}

        {stats.servicosNaoAtribuidos > 0 && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800/30">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-blue-700 dark:text-blue-300">
              {stats.servicosNaoAtribuidos} serviço(s) não estão atribuídos a nenhum barbeiro.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}