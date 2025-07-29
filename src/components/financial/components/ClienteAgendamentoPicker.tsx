// Componente para buscar e selecionar clientes com agendamentos pendentes
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search,
  User,
  Calendar,
  Clock,
  DollarSign,
  Check,
  X,
  Phone,
  Scissors
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '../utils'
import { useAgendamentosPendentes } from '@/hooks/use-agendamentos-pendentes'

interface AgendamentoPendente {
  id: string
  cliente_nome: string
  cliente_telefone?: string
  barbeiro_id: string
  barbeiro_nome: string
  data_agendamento: string
  hora_inicio: string
  hora_fim: string
  servicos: Array<{
    id: string
    nome: string
    preco: number
    duracao: number
  }>
  valor_total: number
  status: 'AGENDADO' | 'EM_ANDAMENTO' | 'CONCLUIDO'
  observacoes?: string
}

interface ClienteAgendamentoPickerProps {
  onAgendamentoSelected: (agendamento: AgendamentoPendente) => void
  onClose: () => void
  className?: string
}

export const ClienteAgendamentoPicker = ({
  onAgendamentoSelected,
  onClose,
  className = ''
}: ClienteAgendamentoPickerProps) => {
  const { 
    clientes,
    agendamentosPendentes, 
    clientesComPendencias, 
    buscarPorCliente,
    buscarClientesPorNome,
    loading 
  } = useAgendamentosPendentes()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [agendamentosFiltrados, setAgendamentosFiltrados] = useState<AgendamentoPendente[]>([])
  const [clientesSugeridos, setClientesSugeridos] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Filtrar agendamentos e clientes baseado na busca
  useEffect(() => {
    if (searchTerm.trim()) {
      const agendamentosEncontrados = buscarPorCliente(searchTerm)
      const clientesEncontrados = buscarClientesPorNome(searchTerm)
      
      setAgendamentosFiltrados(agendamentosEncontrados)
      setClientesSugeridos(clientesEncontrados)
      setShowSuggestions(true)
    } else {
      setAgendamentosFiltrados(agendamentosPendentes.slice(0, 5)) // Mostrar os 5 mais recentes
      setClientesSugeridos(clientes.slice(0, 10)) // Mostrar os 10 primeiros clientes
      setShowSuggestions(false)
    }
  }, [searchTerm, buscarPorCliente, buscarClientesPorNome, agendamentosPendentes, clientes])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5) // Remove segundos
  }

  const handleAgendamentoSelect = (agendamento: AgendamentoPendente) => {
    onAgendamentoSelected(agendamento)
    onClose()
  }

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        <Card className="bg-white dark:bg-secondary-graphite-light shadow-2xl">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Search className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Buscar Cliente
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Busque por qualquer cliente cadastrado ou selecione um agendamento para pagamento
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Campo de Busca */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Digite o nome do cliente (cadastrados ou com agendamentos)..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-secondary-graphite text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                autoFocus
              />
              
              {/* Sugestões de Clientes */}
              {showSuggestions && searchTerm && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-secondary-graphite border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {clientesSugeridos.length > 0 && (
                    <>
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-b">
                        Clientes Cadastrados
                      </div>
                      {clientesSugeridos.map((cliente, index) => (
                        <button
                          key={`cliente-${index}`}
                          onClick={() => setSearchTerm(cliente.nome)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded">
                              <User className="h-3 w-3 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium">{cliente.nome}</div>
                              {cliente.telefone && (
                                <div className="text-xs text-gray-500">{cliente.telefone}</div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                  
                  {/* Separador se houver ambos */}
                  {clientesSugeridos.length > 0 && agendamentosFiltrados.length > 0 && (
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-b">
                      Com Agendamentos
                    </div>
                  )}
                  
                  {/* Clientes com agendamentos */}
                  {agendamentosFiltrados.map((agendamento, index) => (
                    <button
                      key={`agendamento-${index}`}
                      onClick={() => setSearchTerm(agendamento.cliente_nome)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded">
                          <Calendar className="h-3 w-3 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">{agendamento.cliente_nome}</div>
                          <div className="text-xs text-gray-500">
                            {formatDate(agendamento.data_agendamento)} - {formatCurrency(agendamento.valor_total)}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Lista de Agendamentos */}
          <div className="p-6 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-gray-600 dark:text-gray-300">Carregando agendamentos...</p>
                </div>
              </div>
            ) : agendamentosFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  {searchTerm ? 'Nenhum agendamento encontrado' : 'Nenhum agendamento pendente'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {searchTerm ? 'Tente buscar por outro nome' : 'Todos os agendamentos já foram pagos'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {agendamentosFiltrados.map((agendamento, index) => (
                  <motion.div
                    key={agendamento.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className="p-4 hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-blue-500"
                          onClick={() => handleAgendamentoSelect(agendamento)}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Cliente e Barbeiro */}
                          <div className="flex items-center space-x-4 mb-3">
                            <div className="flex items-center space-x-2">
                              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <User className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">
                                  {agendamento.cliente_nome}
                                </h3>
                                {agendamento.cliente_telefone && (
                                  <p className="text-xs text-gray-500 flex items-center space-x-1">
                                    <Phone className="h-3 w-3" />
                                    <span>{agendamento.cliente_telefone}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <Scissors className="h-4 w-4 text-green-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {agendamento.barbeiro_nome}
                                </p>
                                <p className="text-xs text-gray-500">Barbeiro</p>
                              </div>
                            </div>
                          </div>

                          {/* Data e Hora */}
                          <div className="flex items-center space-x-4 mb-3">
                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(agendamento.data_agendamento)}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                              <Clock className="h-4 w-4" />
                              <span>{formatTime(agendamento.hora_inicio)} - {formatTime(agendamento.hora_fim)}</span>
                            </div>
                          </div>

                          {/* Serviços */}
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Serviços:</p>
                            <div className="flex flex-wrap gap-2">
                              {agendamento.servicos.map((servico, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full text-gray-700 dark:text-gray-300"
                                >
                                  {servico.nome} - {formatCurrency(servico.preco)}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Observações */}
                          {agendamento.observacoes && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                              "{agendamento.observacoes}"
                            </p>
                          )}
                        </div>

                        {/* Valor Total */}
                        <div className="text-right ml-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <DollarSign className="h-5 w-5 text-green-600" />
                            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {formatCurrency(agendamento.valor_total)}
                            </span>
                          </div>
                          <Button
                            variant="primary"
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Pagar
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-secondary-graphite">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {agendamentosFiltrados.length} agendamento(s) encontrado(s)
              </p>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}