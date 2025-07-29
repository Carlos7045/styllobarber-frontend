// Componente para buscar e selecionar clientes com agendamentos pendentes
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, User, Calendar, Clock, DollarSign, Check, X, Phone, Scissors } from 'lucide-react'
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
  className = '',
}: ClienteAgendamentoPickerProps) => {
  const {
    clientes,
    agendamentosPendentes,
    clientesComPendencias,
    buscarPorCliente,
    buscarClientesPorNome,
    loading,
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
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 ${className}`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="max-h-[90vh] w-full max-w-4xl overflow-hidden"
      >
        <Card className="bg-white shadow-2xl dark:bg-secondary-graphite-light">
          {/* Header */}
          <div className="border-b border-gray-200 p-6 dark:border-gray-700">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                  <Search className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Buscar Cliente
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Busque por qualquer cliente cadastrado ou selecione um agendamento para
                    pagamento
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
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Digite o nome do cliente (cadastrados ou com agendamentos)..."
                className="w-full rounded-xl border-2 border-gray-300 bg-white py-3 pl-12 pr-4 text-lg text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-graphite dark:text-white"
                autoFocus
              />

              {/* Sugestões de Clientes */}
              {showSuggestions && searchTerm && (
                <div className="absolute left-0 right-0 top-full z-10 mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-secondary-graphite">
                  {clientesSugeridos.length > 0 && (
                    <>
                      <div className="border-b bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                        Clientes Cadastrados
                      </div>
                      {clientesSugeridos.map((cliente, index) => (
                        <button
                          key={`cliente-${index}`}
                          onClick={() => setSearchTerm(cliente.nome)}
                          className="w-full border-b border-gray-100 px-4 py-3 text-left text-gray-900 last:border-b-0 hover:bg-gray-100 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="rounded bg-blue-100 p-1 dark:bg-blue-900/30">
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
                    <div className="border-b bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      Com Agendamentos
                    </div>
                  )}

                  {/* Clientes com agendamentos */}
                  {agendamentosFiltrados.map((agendamento, index) => (
                    <button
                      key={`agendamento-${index}`}
                      onClick={() => setSearchTerm(agendamento.cliente_nome)}
                      className="w-full border-b border-gray-100 px-4 py-3 text-left text-gray-900 last:border-b-0 hover:bg-gray-100 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="rounded bg-green-100 p-1 dark:bg-green-900/30">
                          <Calendar className="h-3 w-3 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">{agendamento.cliente_nome}</div>
                          <div className="text-xs text-gray-500">
                            {formatDate(agendamento.data_agendamento)} -{' '}
                            {formatCurrency(agendamento.valor_total)}
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
          <div className="max-h-96 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                  <p className="text-gray-600 dark:text-gray-300">Carregando agendamentos...</p>
                </div>
              </div>
            ) : agendamentosFiltrados.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 p-4 dark:bg-gray-800">
                  <Calendar className="h-8 w-8 text-gray-400" />
                </div>
                <p className="font-medium text-gray-600 dark:text-gray-400">
                  {searchTerm ? 'Nenhum agendamento encontrado' : 'Nenhum agendamento pendente'}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm
                    ? 'Tente buscar por outro nome'
                    : 'Todos os agendamentos já foram pagos'}
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
                    <Card
                      className="cursor-pointer border-2 p-4 transition-all duration-300 hover:border-blue-500 hover:shadow-lg"
                      onClick={() => handleAgendamentoSelect(agendamento)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Cliente e Barbeiro */}
                          <div className="mb-3 flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                                <User className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">
                                  {agendamento.cliente_nome}
                                </h3>
                                {agendamento.cliente_telefone && (
                                  <p className="flex items-center space-x-1 text-xs text-gray-500">
                                    <Phone className="h-3 w-3" />
                                    <span>{agendamento.cliente_telefone}</span>
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
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
                          <div className="mb-3 flex items-center space-x-4">
                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(agendamento.data_agendamento)}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                              <Clock className="h-4 w-4" />
                              <span>
                                {formatTime(agendamento.hora_inicio)} -{' '}
                                {formatTime(agendamento.hora_fim)}
                              </span>
                            </div>
                          </div>

                          {/* Serviços */}
                          <div className="mb-3">
                            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                              Serviços:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {agendamento.servicos.map((servico, idx) => (
                                <span
                                  key={idx}
                                  className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                >
                                  {servico.nome} - {formatCurrency(servico.preco)}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Observações */}
                          {agendamento.observacoes && (
                            <p className="text-sm italic text-gray-600 dark:text-gray-400">
                              "{agendamento.observacoes}"
                            </p>
                          )}
                        </div>

                        {/* Valor Total */}
                        <div className="ml-4 text-right">
                          <div className="mb-2 flex items-center space-x-2">
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
                            <Check className="mr-2 h-4 w-4" />
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
          <div className="border-t border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-secondary-graphite">
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
