
'use client'

// Componente de busca de clientes e agendamentos

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { Search, User, Calendar, Clock, DollarSign, Check, X, Phone, Mail, Scissors, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, Button, Badge, Input } from '@/shared/components/ui'
import { formatCurrency, formatDate } from '../utils'
import { AgendamentoService } from '../services/agendamento-service'
// import { useBarberFinancialFilter } from '@/domains/users/hooks/use-barber-permissions' // Hook removido

interface Cliente {
  id: string
  nome: string
  telefone?: string
  email?: string
  ultimoAtendimento?: string
}

interface Agendamento {
  id: string
  clienteId: string
  clienteNome: string
  servicoNome: string
  barbeiroNome: string
  dataAgendamento: string
  valorTotal: number
  status: 'CONFIRMADO' | 'REALIZADO' | 'CANCELADO' | 'PENDENTE_PAGAMENTO'
  observacoes?: string
}

interface ClientSearchProps {
  onClienteSelected: (cliente: Cliente) => void
  onAgendamentoSelected: (agendamento: Agendamento) => void
  className?: string
}

// Dados mockados para demonstração
const mockClientes: Cliente[] = [
  {
    id: '1',
    nome: 'João Silva',
    telefone: '(11) 99999-1111',
    email: 'joao@email.com',
    ultimoAtendimento: '2025-01-20'
  },
  {
    id: '2',
    nome: 'Pedro Santos',
    telefone: '(11) 99999-2222',
    email: 'pedro@email.com',
    ultimoAtendimento: '2025-01-18'
  },
  {
    id: '3',
    nome: 'Carlos Oliveira',
    telefone: '(11) 99999-3333',
    email: 'carlos@email.com',
    ultimoAtendimento: '2025-01-15'
  },
  {
    id: '4',
    nome: 'Roberto Lima',
    telefone: '(11) 99999-4444',
    email: 'roberto@email.com',
    ultimoAtendimento: '2025-01-10'
  }
]

const mockAgendamentos: Agendamento[] = [
  {
    id: '1',
    clienteId: '1',
    clienteNome: 'João Silva',
    servicoNome: 'Corte + Barba',
    barbeiroNome: 'João Barbeiro',
    dataAgendamento: new Date().toISOString(),
    valorTotal: 45.00,
    status: 'PENDENTE_PAGAMENTO',
    observacoes: 'Cliente preferencial'
  },
  {
    id: '2',
    clienteId: '1',
    clienteNome: 'João Silva',
    servicoNome: 'Corte Simples',
    barbeiroNome: 'Pedro Barbeiro',
    dataAgendamento: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    valorTotal: 25.00,
    status: 'REALIZADO'
  },
  {
    id: '3',
    clienteId: '2',
    clienteNome: 'Pedro Santos',
    servicoNome: 'Barba',
    barbeiroNome: 'Carlos Barbeiro',
    dataAgendamento: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    valorTotal: 20.00,
    status: 'CONFIRMADO'
  }
]

// Componente de Item de Cliente
const ClienteItem = ({ 
  cliente, 
  onSelect, 
  agendamentos 
}: { 
  cliente: Cliente
  onSelect: (cliente: Cliente) => void
  agendamentos: Agendamento[]
}) => {
  const [expanded, setExpanded] = useState(false)
  const agendamentosCliente = agendamentos.filter(a => a.clienteId === cliente.id)
  const agendamentosPendentes = agendamentosCliente.filter(a => 
    a.status === 'PENDENTE_PAGAMENTO' || a.status === 'CONFIRMADO'
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="border border-gray-200 rounded-lg overflow-hidden"
    >
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">{cliente.nome}</h4>
              <div className="flex items-center space-x-3 mt-1">
                {cliente.telefone && (
                  <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                    <Phone className="h-3 w-3" />
                    <span>{cliente.telefone}</span>
                  </div>
                )}
                {cliente.ultimoAtendimento && (
                  <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="h-3 w-3" />
                    <span>Último: {formatDate(cliente.ultimoAtendimento)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {agendamentosPendentes.length > 0 && (
              <Badge variant="default" className="text-xs">
                {agendamentosPendentes.length} pendente{agendamentosPendentes.length > 1 ? 's' : ''}
              </Badge>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onSelect(cliente)
              }}
            >
              Selecionar
            </Button>
            
            {agendamentosCliente.length > 0 && (
              expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </div>
      </div>
      
      {/* Agendamentos do Cliente */}
      <AnimatePresence>
        {expanded && agendamentosCliente.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200 dark:border-secondary-graphite-card/30 bg-gray-50 dark:bg-secondary-graphite-card"
          >
            <div className="p-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                Agendamentos ({agendamentosCliente.length})
              </h5>
              
              <div className="space-y-2">
                {agendamentosCliente.map((agendamento) => (
                  <AgendamentoItem 
                    key={agendamento.id} 
                    agendamento={agendamento}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Componente de Item de Agendamento
const AgendamentoItem = ({ 
  agendamento 
}: { 
  agendamento: Agendamento 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMADO':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'PENDENTE_PAGAMENTO':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
      case 'REALIZADO':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'CANCELADO':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMADO':
        return 'Confirmado'
      case 'PENDENTE_PAGAMENTO':
        return 'Pendente Pagamento'
      case 'REALIZADO':
        return 'Realizado'
      case 'CANCELADO':
        return 'Cancelado'
      default:
        return status
    }
  }

  const isPendentePagamento = agendamento.status === 'PENDENTE_PAGAMENTO'
  const isConfirmado = agendamento.status === 'CONFIRMADO'

  return (
    <div className={`p-3 rounded-lg border ${
      isPendentePagamento ? 'border-orange-200 dark:border-orange-800/30 bg-orange-50 dark:bg-orange-900/20' : 
      isConfirmado ? 'border-blue-200 dark:border-blue-800/30 bg-blue-50 dark:bg-blue-900/20' : 
      'border-gray-200 bg-white dark:bg-background-dark-elevated dark:border-secondary-graphite-card/30'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Scissors className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-900 dark:text-white">{agendamento.servicoNome}</span>
            <Badge 
              className={`text-xs ${getStatusColor(agendamento.status)}`}
            >
              {getStatusText(agendamento.status)}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(agendamento.dataAgendamento)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <User className="h-3 w-3" />
              <span>{agendamento.barbeiroNome}</span>
            </div>
          </div>
          
          {agendamento.observacoes && (
            <p className="text-xs text-gray-500 mt-1">
              {agendamento.observacoes}
            </p>
          )}
        </div>
        
        <div className="text-right ml-4">
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatCurrency(agendamento.valorTotal)}
          </p>
          
          {(isPendentePagamento || isConfirmado) && (
            <Button
              size="sm"
              className={`mt-2 ${
                isPendentePagamento ? 'bg-orange-600 hover:bg-orange-700' : 
                'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <DollarSign className="h-3 w-3 mr-1" />
              {isPendentePagamento ? 'Pagar' : 'Finalizar'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export const ClientSearch = ({ 
  onClienteSelected, 
  onAgendamentoSelected, 
  className = '' 
}: ClientSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

  // Obter filtros baseados nas permissões do barbeiro
  // const { getClientFilter, getAppointmentFilter } = useBarberFinancialFilter() // Hook removido

  // Buscar clientes usando o serviço
  const buscarClientes = useCallback(async (termo: string) => {
    if (termo.length < 2) {
      setClientes([])
      setShowResults(false)
      return
    }

    setLoading(true)
    
    try {
      // const filtrosCliente = getClientFilter() // Hook removido
      // const filtrosAgendamento = getAppointmentFilter() // Hook removido
      const filtrosCliente = {}
      const filtrosAgendamento = {}
      
      const clientesEncontrados = await AgendamentoService.buscarClientes(termo, filtrosCliente)
      setClientes(clientesEncontrados)
      
      // Buscar agendamentos para cada cliente encontrado
      const todosAgendamentos: Agendamento[] = []
      for (const cliente of clientesEncontrados) {
        const agendamentosCliente = await AgendamentoService.buscarAgendamentosCliente(
          cliente.id, 
          filtrosAgendamento
        )
        todosAgendamentos.push(...agendamentosCliente)
      }
      
      setAgendamentos(todosAgendamentos)
      setShowResults(true)
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
      setClientes([])
      setAgendamentos([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      buscarClientes(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, buscarClientes])

  const handleClienteSelect = (cliente: Cliente) => {
    onClienteSelected(cliente)
    setSearchTerm(cliente.nome)
    setShowResults(false)
  }

  const limparBusca = () => {
    setSearchTerm('')
    setClientes([])
    setShowResults(false)
  }

  return (
    <div className={`relative ${className}`}>
      {/* Campo de Busca */}
      <Input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar cliente por nome, telefone ou email..."
        leftIcon={<Search className="h-4 w-4" />}
        rightIcon={searchTerm ? (
          <button
            onClick={limparBusca}
            className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        ) : undefined}
        className="py-3"
      />

      {/* Resultados da Busca */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="absolute top-full left-0 right-0 z-50 mt-2"
          >
            <Card className="p-4 max-h-96 overflow-y-auto shadow-lg">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600 dark:text-gray-300">Buscando clientes...</span>
                </div>
              ) : clientes.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {clientes.length} cliente{clientes.length > 1 ? 's' : ''} encontrado{clientes.length > 1 ? 's' : ''}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowResults(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {clientes.map((cliente) => (
                    <ClienteItem
                      key={cliente.id}
                      cliente={cliente}
                      onSelect={handleClienteSelect}
                      agendamentos={agendamentos}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">Nenhum cliente encontrado</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Tente buscar por nome, telefone ou email
                  </p>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
