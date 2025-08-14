/**
 * Componente de teste para funcionários admin
 * Para verificar se o sistema está funcionando corretamente após correções
 */
import React, { useState } from 'react'
import { useFuncionariosAdmin } from '@/domains/users/hooks/use-funcionarios-admin'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function TestFuncionariosAdmin() {
  const { funcionarios, loading, error, updateEspecialidades } = useFuncionariosAdmin()
  const [selectedFuncionario, setSelectedFuncionario] = useState<string>('')
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [isUpdating, setIsUpdating] = useState(false)

  // Buscar serviços disponíveis
  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('ativo', true)
        .order('categoria', { ascending: true })
      if (error) throw error
      return data
    }
  })

  const handleUpdateEspecialidades = async () => {
    if (!selectedFuncionario) {
      alert('Selecione um funcionário')
      return
    }

    setIsUpdating(true)
    try {
      console.log('🔄 Testando atualização de especialidades:', {
        funcionario_id: selectedFuncionario,
        service_ids: selectedServices
      })

      const result = await updateEspecialidades({
        funcionario_id: selectedFuncionario,
        service_ids: selectedServices
      })

      if (result.success) {
        alert('✅ Especialidades atualizadas com sucesso!')
        setSelectedServices([])
      } else {
        alert(`❌ Erro: ${result.error}`)
      }
    } catch (err) {
      console.error('❌ Erro no teste:', err)
      alert(`❌ Erro: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    )
  }

  if (loading) return <div className="p-6">Carregando funcionários...</div>
  if (error) return <div className="p-6 text-red-600">Erro: {error}</div>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">🧪 Teste de Funcionários Admin (CORRIGIDO)</h1>
      
      {/* Status da correção */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-green-800 mb-2">✅ Correções Implementadas:</h2>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• Query corrigida para usar JOIN entre profiles → funcionarios → funcionario_servicos</li>
          <li>• Função updateEspecialidades corrigida para usar funcionario_id correto</li>
          <li>• Criação automática de registros na tabela funcionarios quando necessário</li>
          <li>• Tratamento de erros melhorado</li>
        </ul>
      </div>
      
      {/* Estatísticas */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-100 p-4 rounded-lg text-center">
          <h3 className="font-semibold text-blue-800">Funcionários</h3>
          <p className="text-3xl font-bold text-blue-600">{funcionarios.length}</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg text-center">
          <h3 className="font-semibold text-green-800">Serviços</h3>
          <p className="text-3xl font-bold text-green-600">{services.length}</p>
        </div>
        <div className="bg-purple-100 p-4 rounded-lg text-center">
          <h3 className="font-semibold text-purple-800">Total Especialidades</h3>
          <p className="text-3xl font-bold text-purple-600">
            {funcionarios.reduce((acc, f) => acc + f.servicos.length, 0)}
          </p>
        </div>
        <div className="bg-orange-100 p-4 rounded-lg text-center">
          <h3 className="font-semibold text-orange-800">Funcionários Ativos</h3>
          <p className="text-3xl font-bold text-orange-600">
            {funcionarios.filter(f => f.ativo).length}
          </p>
        </div>
      </div>

      {/* Lista de funcionários com suas especialidades */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">👥 Funcionários e Especialidades</h2>
        <div className="space-y-4">
          {funcionarios.map(funcionario => (
            <div key={funcionario.id} className="border border-gray-200 p-4 rounded-lg shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold">{funcionario.nome}</h3>
                  <p className="text-sm text-gray-600">
                    {funcionario.role === 'admin' ? '👑 Admin' : '✂️ Barbeiro'} - {funcionario.email}
                  </p>
                  <p className="text-xs text-gray-500">ID: {funcionario.id}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  funcionario.ativo 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {funcionario.ativo ? '✅ Ativo' : '❌ Inativo'}
                </span>
              </div>
              
              <div className="border-t pt-3">
                <p className="text-sm font-medium mb-2">
                  🎯 Especialidades ({funcionario.servicos.length}):
                </p>
                {funcionario.servicos.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {funcionario.servicos.map(servico => (
                      <span 
                        key={servico.id} 
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium"
                      >
                        {servico.nome} ({servico.categoria}) - R$ {servico.preco.toFixed(2)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic">Nenhuma especialidade configurada</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Formulário para testar especialidades */}
      <div className="border-t-2 pt-8">
        <h2 className="text-2xl font-semibold mb-4">🧪 Testar Atualização de Especialidades</h2>
        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          {/* Seleção de funcionário */}
          <div>
            <label className="block text-sm font-medium mb-2">Selecionar Funcionário:</label>
            <select 
              value={selectedFuncionario}
              onChange={(e) => {
                setSelectedFuncionario(e.target.value)
                setSelectedServices([]) // Limpar seleção de serviços
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Escolha um funcionário --</option>
              {funcionarios.map(funcionario => (
                <option key={funcionario.id} value={funcionario.id}>
                  {funcionario.nome} ({funcionario.role}) - {funcionario.servicos.length} especialidades
                </option>
              ))}
            </select>
          </div>

          {/* Seleção de serviços */}
          {selectedFuncionario && (
            <div>
              <label className="block text-sm font-medium mb-2">Selecionar Especialidades:</label>
              <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto border border-gray-200 p-4 rounded-lg bg-white">
                {services.map(service => (
                  <label key={service.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={selectedServices.includes(service.id)}
                      onChange={() => handleServiceToggle(service.id)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">
                      <strong>{service.nome}</strong> ({service.categoria}) - R$ {service.preco}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {selectedServices.length} especialidade(s) selecionada(s)
              </p>
            </div>
          )}

          {/* Botão de teste */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleUpdateEspecialidades}
              disabled={isUpdating || !selectedFuncionario}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                isUpdating || !selectedFuncionario
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
              }`}
            >
              {isUpdating ? '🔄 Atualizando...' : '🚀 Testar Atualização'}
            </button>
            
            {selectedFuncionario && (
              <button
                onClick={() => {
                  setSelectedServices([])
                }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Limpar Seleção
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}