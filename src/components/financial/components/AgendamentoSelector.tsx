// Componente para seleção de agendamentos do cliente
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar,
  Clock,
  User,
  Scissors,
  DollarSign,
  Check,
  AlertCircle,
  ChevronRight
} from 'lucide-react'
import { Card, Button, Badge } from '@/shared/components/ui'
import { formatCurrency, formatDate } from '../utils'
import { AgendamentoService } from '../services/agendamento-service'
import { useBarberFinancialFilter } from '@/domains/users/hooks/use-barber-permissions'

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
  descricaoServico?: string
}

interface AgendamentoSelectorProps {
  clienteId: string
  clienteNome: string
  onAgendamentoSelected: (agendamento: Agendamento) => void
  onClose: () => void
  className?: string
}

// Dados mockados de agendamentos
const getAgendamentosCliente = (clienteId: string): Agendamento[] => {
  const agendamentos: Record<string, Agendamento[]> = {
    '1': [
      {
        id: 'ag1',
        clienteId: '1',
        clienteNome: 'João Silva',
        servicoNome: 'Corte + Barba Completa',
        barbeiroNome: 'João Barbeiro',
        dataAgendamento: new Date().toISOString(),
        valorTotal: 45.00,
        status: 'PENDENTE_PAGAMENTO',
        observacoes: 'Cliente preferencial - desconto aplicado',
        descricaoServico: 'Corte degradê + barba com navalha + finalização'
      },
      {
        id: 'ag2',
        clienteId: '1',
        clienteNome: 'João Silva',
        servicoNome: 'Corte Simples',
        barbeiroNome: 'Pedro Barbeiro',
        dataAgendamento: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2h à frente
        valorTotal: 25.00,
        status: 'CONFIRMADO',
        descricaoServico: 'Corte tradicional com máquina'
      },
      {
        id: 'ag3',
        clienteId: '1',
        clienteNome: 'João Silva',
        servicoNome: 'Barba + Sobrancelha',
        barbeiroNome: 'Carlos Barbeiro',
        dataAgendamento: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias atrás
        valorTotal: 30.00,
        status: 'REALIZADO'
      }
    ],
    '2': [
      {
        id: 'ag4',
        clienteId: '2',
        clienteNome: 'Pedro Santos',
        servicoNome: 'Corte + Barba',
        barbeiroNome: 'João Barbeiro',
        dataAgendamento: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30min à frente
        valorTotal: 40.00,
        status: 'CONFIRMADO',
        observacoes: 'Primeira vez na barbearia'
      }
    ]
  }

  return agendamentos[clienteId] || []
}

// Componente de Card de Agendamento
const AgendamentoCard = ({ 
  agendamento, 
  onSelect, 
  isSelected 
}: { 
  agendamento: Agendamento
  onSelect: (agendamento: Agendamento) => void
  isSelected: boolean
}) => {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'CONFIRMADO':
        return { 
          color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/30', 
          text: 'Confirmado',
          canPay: true
        }
      case 'PENDENTE_PAGAMENTO':
        return { 
          color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/30', 
          text: 'Pendente Pagamento',
          canPay: true
        }
      case 'REALIZADO':
        return { 
          color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800/30', 
          text: 'Realizado',
          canPay: false
        }
      case 'CANCELADO':
        return { 
          color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/30', 
          text: 'Cancelado',
          canPay: false
        }
      default:
        return { 
          color: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800/30', 
          text: status,
          canPay: false
        }
    }
  }

  const statusInfo = getStatusInfo(agendamento.status)
  const dataAgendamento = new Date(agendamento.dataAgendamento)
  const isHoje = dataAgendamento.toDateString() === new Date().toDateString()
  const isFuturo = dataAgendamento > new Date()
  const isPassado = dataAgendamento < new Date()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative cursor-pointer transition-all duration-200 ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={() => statusInfo.canPay && onSelect(agendamento)}
    >
      <Card className={`p-4 hover:shadow-md ${
        !statusInfo.canPay ? 'opacity-60' : 'hover:shadow-lg'
      } ${isSelected ? 'border-blue-500' : ''}`}>
        {/* Header do Card */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Scissors className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {agendamento.servicoNome}
              </h3>
              <Badge className={`text-xs ${statusInfo.color}`}>
                {statusInfo.text}
              </Badge>
            </div>
            
            {agendamento.descricaoServico && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                {agendamento.descricaoServico}
              </p>
            )}
          </div>
          
          <div className="text-right">
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(agendamento.valorTotal)}
            </p>
            {statusInfo.canPay && (
              <p className="text-xs text-green-600 font-medium">
                Disponível para pagamento
              </p>
            )}
          </div>
        </div>

        {/* Informações do Agendamento */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formatDate(agendamento.dataAgendamento)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isHoje ? 'Hoje' : isFuturo ? 'Futuro' : 'Passado'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {agendamento.barbeiroNome}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Barbeiro</p>
            </div>
          </div>
        </div>

        {/* Observações */}
        {agendamento.observacoes && (
          <div className="p-2 bg-gray-50 dark:bg-secondary-graphite-card rounded text-sm text-gray-600 dark:text-gray-300 mb-3">
            <strong>Obs:</strong> {agendamento.observacoes}
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-secondary-graphite-card/30">
          <div className="flex items-center space-x-2">
            {isHoje && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Hoje
              </Badge>
            )}
            
            {agendamento.status === 'PENDENTE_PAGAMENTO' && (
              <Badge className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                <AlertCircle className="h-3 w-3 mr-1" />
                Pagamento Pendente
              </Badge>
            )}
          </div>
          
          {statusInfo.canPay && (
            <div className="flex items-center space-x-2">
              {isSelected && (
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
              )}
              <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

export const AgendamentoSelector = ({ 
  clienteId, 
  clienteNome, 
  onAgendamentoSelected, 
  onClose,
  className = '' 
}: AgendamentoSelectorProps) => {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null)
  const [loading, setLoading] = useState(true)

  // Obter filtros baseados nas permissões do barbeiro
  const { getAppointmentFilter } = useBarberFinancialFilter()

  useEffect(() => {
    // Carregar agendamentos do cliente
    const carregarAgendamentos = async () => {
      setLoading(true)
      try {
        const filtros = getAppointmentFilter()
        const agendamentosCliente = await AgendamentoService.buscarAgendamentosCliente(clienteId, filtros)
        setAgendamentos(agendamentosCliente)
      } catch (error) {
        console.error('Erro ao carregar agendamentos:', error)
        // Fallback para dados mockados
        const agendamentosCliente = getAgendamentosCliente(clienteId)
        setAgendamentos(agendamentosCliente)
      } finally {
        setLoading(false)
      }
    }

    carregarAgendamentos()
  }, [clienteId])

  const handleAgendamentoSelect = (agendamento: Agendamento) => {
    setSelectedAgendamento(agendamento)
  }

  const handleConfirmarSelecao = () => {
    if (selectedAgendamento) {
      onAgendamentoSelected(selectedAgendamento)
    }
  }

  const agendamentosDisponiveis = agendamentos.filter(a => 
    a.status === 'CONFIRMADO' || a.status === 'PENDENTE_PAGAMENTO'
  )

  const agendamentosHistorico = agendamentos.filter(a => 
    a.status === 'REALIZADO' || a.status === 'CANCELADO'
  )

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-gray-600 dark:text-gray-300">Carregando agendamentos...</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Agendamentos - {clienteNome}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Selecione um agendamento para processar o pagamento
          </p>
        </div>
        
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
      </div>

      {/* Agendamentos Disponíveis para Pagamento */}
      {agendamentosDisponiveis.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Disponíveis para Pagamento ({agendamentosDisponiveis.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agendamentosDisponiveis.map((agendamento) => (
              <AgendamentoCard
                key={agendamento.id}
                agendamento={agendamento}
                onSelect={handleAgendamentoSelect}
                isSelected={selectedAgendamento?.id === agendamento.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Histórico */}
      {agendamentosHistorico.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Histórico ({agendamentosHistorico.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agendamentosHistorico.map((agendamento) => (
              <AgendamentoCard
                key={agendamento.id}
                agendamento={agendamento}
                onSelect={() => {}} // Não permite seleção
                isSelected={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Nenhum Agendamento */}
      {agendamentos.length === 0 && (
        <Card className="p-8">
          <div className="text-center">
            <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhum agendamento encontrado
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Este cliente não possui agendamentos registrados
            </p>
          </div>
        </Card>
      )}

      {/* Botão de Confirmação */}
      {selectedAgendamento && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="sticky bottom-0 bg-white dark:bg-background-dark border-t border-gray-200 dark:border-secondary-graphite-card/30 p-4 -mx-4"
        >
          <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-300">
                  Agendamento Selecionado
                </h4>
                <p className="text-blue-700 dark:text-blue-400">
                  {selectedAgendamento.servicoNome} - {formatCurrency(selectedAgendamento.valorTotal)}
                </p>
              </div>
              
              <Button
                onClick={handleConfirmarSelecao}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Processar Pagamento
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
