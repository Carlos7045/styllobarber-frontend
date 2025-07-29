// Componente PDV para registrar transações rápidas
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus,
  Minus,
  DollarSign,
  CreditCard,
  Smartphone,
  User,
  Save,
  X
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '../utils'

interface QuickTransaction {
  tipo: 'ENTRADA' | 'SAIDA'
  valor: number
  descricao: string
  metodoPagamento?: 'DINHEIRO' | 'PIX' | 'CARTAO_DEBITO' | 'CARTAO_CREDITO'
  categoria: string
  cliente?: string
  barbeiro?: string
  observacoes?: string
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
    { id: '4', nome: 'Sobrancelha', preco: 15.00 }
  ],
  barbeiros: [
    { id: '1', nome: 'João Silva' },
    { id: '2', nome: 'Pedro Santos' },
    { id: '3', nome: 'Carlos Oliveira' }
  ]
}

export const QuickTransactionPDV = ({ 
  onTransactionSaved, 
  className = '' 
}: QuickTransactionPDVProps) => {
  const [activeTab, setActiveTab] = useState<'ENTRADA' | 'SAIDA'>('ENTRADA')
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

  const handleServiceSelect = (servico: any) => {
    setTransaction(prev => ({
      ...prev,
      valor: servico.preco,
      descricao: servico.nome,
      categoria: 'Serviços'
    }))
  }

  const handleSave = () => {
    if (transaction.valor > 0 && transaction.descricao.trim() !== '') {
      onTransactionSaved({
        ...transaction,
        tipo: activeTab
      })
      
      // Resetar formulário
      setTransaction({
        tipo: activeTab,
        valor: 0,
        descricao: '',
        metodoPagamento: 'DINHEIRO',
        categoria: '',
        cliente: '',
        barbeiro: '',
        observacoes: ''
      })
      
      alert('Transação registrada com sucesso!')
    }
  }

  const isValid = transaction.valor > 0 && transaction.descricao.trim() !== ''

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com Tabs */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            PDV - Registro Rápido
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 bg-gray-100 dark:bg-secondary-graphite-card p-2 rounded-xl mb-6">
          <Button
            variant={activeTab === 'ENTRADA' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('ENTRADA')}
            className="flex-1 flex items-center justify-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Entrada</span>
          </Button>
          <Button
            variant={activeTab === 'SAIDA' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('SAIDA')}
            className="flex-1 flex items-center justify-center space-x-2"
          >
            <Minus className="h-5 w-5" />
            <span>Saída</span>
          </Button>
        </div>

        {/* Conteúdo da Aba ENTRADA */}
        {activeTab === 'ENTRADA' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Serviços Rápidos */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Serviços Rápidos
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {mockData.servicos.map((servico) => (
                  <Button
                    key={servico.id}
                    variant="outline"
                    onClick={() => handleServiceSelect(servico)}
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                  >
                    <span className="text-sm font-semibold text-center">
                      {servico.nome}
                    </span>
                    <span className="text-sm text-green-600 dark:text-green-400 font-bold">
                      {formatCurrency(servico.preco)}
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Valor e Descrição */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valor
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    value={transaction.valor || ''}
                    onChange={(e) => setTransaction(prev => ({
                      ...prev,
                      valor: parseFloat(e.target.value) || 0
                    }))}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 dark:border-secondary-graphite-card/30 rounded-xl bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrição
                </label>
                <input
                  type="text"
                  value={transaction.descricao}
                  onChange={(e) => setTransaction(prev => ({
                    ...prev,
                    descricao: e.target.value
                  }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-secondary-graphite-card/30 rounded-xl bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Ex: Corte + Barba"
                />
              </div>
            </div>

            {/* Cliente e Barbeiro */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cliente (opcional)
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={transaction.cliente}
                    onChange={(e) => setTransaction(prev => ({
                      ...prev,
                      cliente: e.target.value
                    }))}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 dark:border-secondary-graphite-card/30 rounded-xl bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Nome do cliente"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Barbeiro
                </label>
                <select
                  value={transaction.barbeiro}
                  onChange={(e) => setTransaction(prev => ({
                    ...prev,
                    barbeiro: e.target.value
                  }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-secondary-graphite-card/30 rounded-xl bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Método de Pagamento
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: 'DINHEIRO', label: 'Dinheiro', icon: DollarSign },
                  { key: 'PIX', label: 'PIX', icon: Smartphone },
                  { key: 'CARTAO_DEBITO', label: 'Débito', icon: CreditCard },
                  { key: 'CARTAO_CREDITO', label: 'Crédito', icon: CreditCard }
                ].map((metodo) => {
                  const Icon = metodo.icon
                  const isSelected = transaction.metodoPagamento === metodo.key
                  
                  return (
                    <Button
                      key={metodo.key}
                      variant={isSelected ? 'primary' : 'outline'}
                      onClick={() => setTransaction(prev => ({
                        ...prev,
                        metodoPagamento: metodo.key as any
                      }))}
                      className="h-16 flex flex-col items-center justify-center space-y-1"
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

        {/* Conteúdo da Aba SAIDA */}
        {activeTab === 'SAIDA' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valor
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    value={transaction.valor || ''}
                    onChange={(e) => setTransaction(prev => ({
                      ...prev,
                      valor: parseFloat(e.target.value) || 0
                    }))}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 dark:border-secondary-graphite-card/30 rounded-xl bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrição
                </label>
                <input
                  type="text"
                  value={transaction.descricao}
                  onChange={(e) => setTransaction(prev => ({
                    ...prev,
                    descricao: e.target.value
                  }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-secondary-graphite-card/30 rounded-xl bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Ex: Compra de produtos"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Categoria
              </label>
              <select
                value={transaction.categoria}
                onChange={(e) => setTransaction(prev => ({
                  ...prev,
                  categoria: e.target.value
                }))}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-secondary-graphite-card/30 rounded-xl bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Selecionar categoria</option>
                <option value="Produtos">Produtos</option>
                <option value="Equipamentos">Equipamentos</option>
                <option value="Limpeza">Limpeza</option>
                <option value="Marketing">Marketing</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
          </motion.div>
        )}

        {/* Botões de Ação */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-secondary-graphite-card/30">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {isValid ? (
              <span className="text-green-600 dark:text-green-400">
                ✓ Pronto para salvar
              </span>
            ) : (
              <span>Preencha valor e descrição</span>
            )}
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setTransaction({
                  tipo: activeTab,
                  valor: 0,
                  descricao: '',
                  metodoPagamento: 'DINHEIRO',
                  categoria: '',
                  cliente: '',
                  barbeiro: '',
                  observacoes: ''
                })
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Limpar
            </Button>
            
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!isValid}
              className="min-w-[120px]"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}