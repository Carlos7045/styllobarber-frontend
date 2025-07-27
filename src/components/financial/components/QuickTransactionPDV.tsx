// Componente PDV para registrar transações rápidas
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus,
  Minus,
  DollarSign,
  CreditCard,
  Smartphone,
  Receipt,
  User,
  Scissors,
  ShoppingCart,
  Save,
  X,
  Check,
  Calculator,
  Clock
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '../utils'
import { ClientSearch } from './ClientSearch'
import { AgendamentoSelector } from './AgendamentoSelector'

interface QuickTransaction {
  tipo: 'ENTRADA' | 'SAIDA'
  valor: number
  descricao: string
  metodoPagamento?: 'DINHEIRO' | 'PIX' | 'CARTAO_DEBITO' | 'CARTAO_CREDITO'
  categoria: string
  cliente?: string
  barbeiro?: string
  observacoes?: string
  agendamentoId?: string
}

interface QuickTransactionPDVProps {
  onTransactionSaved: (transaction: QuickTransaction) => void
  className?: string
}

// Dados mockados para demonstração
const mockData = {
  servicos: [
    { id: '1', nome: 'Corte Simples', preco: 25.00 },
    { id: '2', nome: 'Corte + Barba', preco: 45.00 },
    { id: '3', nome: 'Barba', preco: 20.00 },
    { id: '4', nome: 'Sobrancelha', preco: 15.00 },
    { id: '5', nome: 'Corte + Barba + Sobrancelha', preco: 55.00 }
  ],
  barbeiros: [
    { id: '1', nome: 'João Silva' },
    { id: '2', nome: 'Pedro Santos' },
    { id: '3', nome: 'Carlos Oliveira' }
  ],
  categoriasDespesas: [
    { id: '1', nome: 'Produtos', cor: '#EF4444' },
    { id: '2', nome: 'Equipamentos', cor: '#F59E0B' },
    { id: '3', nome: 'Limpeza', cor: '#10B981' },
    { id: '4', nome: 'Marketing', cor: '#8B5CF6' },
    { id: '5', nome: 'Outros', cor: '#6B7280' }
  ]
}

// Componente de Calculadora Rápida
const QuickCalculator = ({ 
  onValueChange, 
  initialValue = 0 
}: { 
  onValueChange: (value: number) => void
  initialValue?: number 
}) => {
  const [display, setDisplay] = useState(initialValue.toString())
  const [operation, setOperation] = useState<string | null>(null)
  const [previousValue, setPreviousValue] = useState<number | null>(null)

  const handleNumber = (num: string) => {
    if (display === '0') {
      setDisplay(num)
    } else {
      setDisplay(display + num)
    }
  }

  const handleOperation = (op: string) => {
    const current = parseFloat(display)
    if (previousValue !== null && operation) {
      const result = calculate(previousValue, current, operation)
      setDisplay(result.toString())
      setPreviousValue(result)
    } else {
      setPreviousValue(current)
    }
    setOperation(op)
    setDisplay('0')
  }

  const calculate = (prev: number, current: number, op: string): number => {
    switch (op) {
      case '+': return prev + current
      case '-': return prev - current
      case '*': return prev * current
      case '/': return prev / current
      default: return current
    }
  }

  const handleEquals = () => {
    if (previousValue !== null && operation) {
      const current = parseFloat(display)
      const result = calculate(previousValue, current, operation)
      setDisplay(result.toString())
      onValueChange(result)
      setPreviousValue(null)
      setOperation(null)
    }
  }

  const handleClear = () => {
    setDisplay('0')
    setOperation(null)
    setPreviousValue(null)
    onValueChange(0)
  }

  const buttons = [
    ['C', '/', '*', '←'],
    ['7', '8', '9', '-'],
    ['4', '5', '6', '+'],
    ['1', '2', '3', '='],
    ['0', '.', '=', '=']
  ]

  return (
    <div className="bg-gray-900 p-4 rounded-lg">
      <div className="bg-black text-green-400 p-3 rounded mb-3 text-right text-xl font-mono">
        {formatCurrency(parseFloat(display) || 0)}
      </div>
      
      <div className="grid grid-cols-4 gap-2">
        {buttons.flat().map((btn, index) => {
          if (btn === '=') {
            return index === buttons.flat().length - 2 ? (
              <Button
                key={index}
                onClick={handleEquals}
                className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {btn}
              </Button>
            ) : null
          }
          
          return (
            <Button
              key={index}
              onClick={() => {
                if (btn === 'C') handleClear()
                else if (btn === '←') setDisplay(display.slice(0, -1) || '0')
                else if (['+', '-', '*', '/'].includes(btn)) handleOperation(btn)
                else if (btn === '.') {
                  if (!display.includes('.')) setDisplay(display + '.')
                }
                else handleNumber(btn)
              }}
              variant={['+', '-', '*', '/', '='].includes(btn) ? 'default' : 'outline'}
              className={`h-12 ${
                btn === 'C' ? 'bg-red-600 hover:bg-red-700 text-white' :
                btn === '←' ? 'bg-orange-600 hover:bg-orange-700 text-white' :
                ['+', '-', '*', '/'].includes(btn) ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              {btn}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

// Componente Principal do PDV
export const QuickTransactionPDV = ({ 
  onTransactionSaved, 
  className = '' 
}: QuickTransactionPDVProps) => {
  const [activeTab, setActiveTab] = useState<'ENTRADA' | 'SAIDA'>('ENTRADA')
  const [showCalculator, setShowCalculator] = useState(false)
  const [showClientSearch, setShowClientSearch] = useState(false)
  const [showAgendamentos, setShowAgendamentos] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<any>(null)
  const [transaction, setTransaction] = useState<QuickTransaction>({
    tipo: 'ENTRADA',
    valor: 0,
    descricao: '',
    metodoPagamento: 'DINHEIRO',
    categoria: '',
    cliente: '',
    barbeiro: '',
    observacoes: ''
  })

  // Resetar transação quando mudar de aba
  useEffect(() => {
    setTransaction(prev => ({
      ...prev,
      tipo: activeTab,
      valor: 0,
      descricao: '',
      categoria: '',
      cliente: '',
      barbeiro: '',
      observacoes: '',
      agendamentoId: undefined
    }))
  }, [activeTab])

  const handleServiceSelect = (servico: any) => {
    setTransaction(prev => ({
      ...prev,
      valor: servico.preco,
      descricao: servico.nome,
      categoria: 'Serviços'
    }))
  }

  const handleClienteSelected = (cliente: any) => {
    setSelectedCliente(cliente)
    setTransaction(prev => ({
      ...prev,
      cliente: cliente.nome
    }))
    setShowClientSearch(false)
    setShowAgendamentos(true)
  }

  const handleAgendamentoSelected = (agendamento: any) => {
    setTransaction(prev => ({
      ...prev,
      valor: agendamento.valorTotal,
      descricao: agendamento.servicoNome,
      barbeiro: agendamento.barbeiroNome,
      categoria: 'Serviços',
      observacoes: `Agendamento #${agendamento.id} - ${agendamento.observacoes || ''}`,
      agendamentoId: agendamento.id // Adicionar ID do agendamento
    }))
    setShowAgendamentos(false)
    
    // Focar no método de pagamento
    setTimeout(() => {
      const paymentSection = document.querySelector('[data-payment-section]')
      if (paymentSection) {
        paymentSection.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  const handleSave = () => {
    if (transaction.valor > 0 && transaction.descricao) {
      onTransactionSaved(transaction)
      
      // Resetar formulário
      setTransaction({
        tipo: activeTab,
        valor: 0,
        descricao: '',
        metodoPagamento: 'DINHEIRO',
        categoria: '',
        cliente: '',
        barbeiro: '',
        observacoes: '',
        agendamentoId: undefined
      })
      setSelectedCliente(null)
      setShowClientSearch(false)
      setShowAgendamentos(false)
      
      // Feedback visual
      alert('Transação registrada com sucesso!')
    }
  }

  const isValid = transaction.valor > 0 && transaction.descricao.trim() !== ''

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com Tabs */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            PDV - Registro Rápido
          </h2>
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-500">
              {new Date().toLocaleTimeString('pt-BR')}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
          <Button
            variant={activeTab === 'ENTRADA' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('ENTRADA')}
            className="flex-1 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Entrada</span>
          </Button>
          <Button
            variant={activeTab === 'SAIDA' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('SAIDA')}
            className="flex-1 flex items-center space-x-2"
          >
            <Minus className="h-4 w-4" />
            <span>Saída</span>
          </Button>
        </div>

        {/* Conteúdo da Aba ENTRADA */}
        <AnimatePresence mode="wait">
          {activeTab === 'ENTRADA' && (
            <motion.div
              key="entrada"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Busca de Cliente */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">
                    Cliente
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowClientSearch(!showClientSearch)}
                    className="flex items-center space-x-2"
                  >
                    <User className="h-4 w-4" />
                    <span>Buscar Cliente</span>
                  </Button>
                </div>
                
                {selectedCliente ? (
                  <Card className="p-3 bg-blue-50 border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-blue-900">{selectedCliente.nome}</p>
                        {selectedCliente.telefone && (
                          <p className="text-sm text-blue-700">{selectedCliente.telefone}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCliente(null)
                          setTransaction(prev => ({ ...prev, cliente: '' }))
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ) : showClientSearch ? (
                  <ClientSearch
                    onClienteSelected={handleClienteSelected}
                    onAgendamentoSelected={handleAgendamentoSelected}
                  />
                ) : (
                  <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                    <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">
                      Clique em "Buscar Cliente" para encontrar agendamentos
                    </p>
                  </div>
                )}
              </div>

              {/* Serviços Rápidos */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Serviços Rápidos
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {mockData.servicos.map((servico) => (
                    <Button
                      key={servico.id}
                      variant="outline"
                      onClick={() => handleServiceSelect(servico)}
                      className="h-16 flex flex-col items-center justify-center space-y-1 hover:bg-blue-50"
                    >
                      <Scissors className="h-5 w-5 text-blue-600" />
                      <span className="text-xs font-medium">{servico.nome}</span>
                      <span className="text-xs text-green-600 font-bold">
                        {formatCurrency(servico.preco)}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Valor e Descrição */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      value={transaction.valor || ''}
                      onChange={(e) => setTransaction(prev => ({
                        ...prev,
                        valor: parseFloat(e.target.value) || 0
                      }))}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-bold"
                      placeholder="0,00"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCalculator(!showCalculator)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    >
                      <Calculator className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <input
                    type="text"
                    value={transaction.descricao}
                    onChange={(e) => setTransaction(prev => ({
                      ...prev,
                      descricao: e.target.value
                    }))}
                    className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Corte + Barba"
                  />
                </div>
              </div>

              {/* Cliente e Barbeiro */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cliente (opcional)
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={transaction.cliente}
                      onChange={(e) => setTransaction(prev => ({
                        ...prev,
                        cliente: e.target.value
                      }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nome do cliente"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Barbeiro
                  </label>
                  <select
                    value={transaction.barbeiro}
                    onChange={(e) => setTransaction(prev => ({
                      ...prev,
                      barbeiro: e.target.value
                    }))}
                    className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecionar barbeiro</option>
                    {mockData.barbeiros.map((barbeiro) => (
                      <option key={barbeiro.id} value={barbeiro.nome}>
                        {barbeiro.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Método de Pagamento */}
              <div data-payment-section>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Método de Pagamento
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { key: 'DINHEIRO', label: 'Dinheiro', icon: DollarSign, color: 'green' },
                    { key: 'PIX', label: 'PIX', icon: Smartphone, color: 'blue' },
                    { key: 'CARTAO_DEBITO', label: 'Débito', icon: CreditCard, color: 'purple' },
                    { key: 'CARTAO_CREDITO', label: 'Crédito', icon: CreditCard, color: 'orange' }
                  ].map((metodo) => {
                    const Icon = metodo.icon
                    const isSelected = transaction.metodoPagamento === metodo.key
                    
                    return (
                      <Button
                        key={metodo.key}
                        variant={isSelected ? 'default' : 'outline'}
                        onClick={() => setTransaction(prev => ({
                          ...prev,
                          metodoPagamento: metodo.key as any
                        }))}
                        className={`h-16 flex flex-col items-center justify-center space-y-1 ${
                          isSelected ? `bg-${metodo.color}-600 hover:bg-${metodo.color}-700` : ''
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs">{metodo.label}</span>
                      </Button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Conteúdo da Aba SAÍDA */}
          {activeTab === 'SAIDA' && (
            <motion.div
              key="saida"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Valor e Descrição */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor da Despesa
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      value={transaction.valor || ''}
                      onChange={(e) => setTransaction(prev => ({
                        ...prev,
                        valor: parseFloat(e.target.value) || 0
                      }))}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-bold"
                      placeholder="0,00"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCalculator(!showCalculator)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    >
                      <Calculator className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição da Despesa
                  </label>
                  <input
                    type="text"
                    value={transaction.descricao}
                    onChange={(e) => setTransaction(prev => ({
                      ...prev,
                      descricao: e.target.value
                    }))}
                    className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Compra de produtos"
                  />
                </div>
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Categoria da Despesa
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {mockData.categoriasDespesas.map((categoria) => {
                    const isSelected = transaction.categoria === categoria.nome
                    
                    return (
                      <Button
                        key={categoria.id}
                        variant={isSelected ? 'default' : 'outline'}
                        onClick={() => setTransaction(prev => ({
                          ...prev,
                          categoria: categoria.nome
                        }))}
                        className={`h-16 flex flex-col items-center justify-center space-y-1 ${
                          isSelected ? 'bg-red-600 hover:bg-red-700' : ''
                        }`}
                      >
                        <ShoppingCart className="h-5 w-5" />
                        <span className="text-xs font-medium">{categoria.nome}</span>
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações (opcional)
                </label>
                <textarea
                  value={transaction.observacoes}
                  onChange={(e) => setTransaction(prev => ({
                    ...prev,
                    observacoes: e.target.value
                  }))}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Informações adicionais sobre a despesa..."
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botões de Ação */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <Badge 
              variant={activeTab === 'ENTRADA' ? 'default' : 'destructive'}
              className="text-sm"
            >
              {activeTab === 'ENTRADA' ? 'Entrada' : 'Saída'}: {formatCurrency(transaction.valor)}
            </Badge>
            {transaction.metodoPagamento && activeTab === 'ENTRADA' && (
              <Badge variant="outline" className="text-sm">
                {transaction.metodoPagamento.replace('_', ' ')}
              </Badge>
            )}
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setTransaction(prev => ({
                ...prev,
                valor: 0,
                descricao: '',
                categoria: '',
                cliente: '',
                barbeiro: '',
                observacoes: ''
              }))}
            >
              <X className="h-4 w-4 mr-2" />
              Limpar
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={!isValid}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Registrar {activeTab === 'ENTRADA' ? 'Entrada' : 'Saída'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Modal de Agendamentos */}
      <AnimatePresence>
        {showAgendamentos && selectedCliente && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAgendamentos(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <AgendamentoSelector
                  clienteId={selectedCliente.id}
                  clienteNome={selectedCliente.nome}
                  onAgendamentoSelected={handleAgendamentoSelected}
                  onClose={() => setShowAgendamentos(false)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calculadora Modal */}
      <AnimatePresence>
        {showCalculator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowCalculator(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Calculadora</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCalculator(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <QuickCalculator
                initialValue={transaction.valor}
                onValueChange={(value) => setTransaction(prev => ({
                  ...prev,
                  valor: value
                }))}
              />
              
              <Button
                className="w-full mt-4"
                onClick={() => setShowCalculator(false)}
              >
                <Check className="h-4 w-4 mr-2" />
                Confirmar Valor
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}