
'use client'

// Mock temporário para motion
const motion = {
  div: 'div' as any,
  span: 'span' as any,
  button: 'button' as any,
}
// Componente PDV para registrar transações rápidas

import { useState, useEffect, useRef } from 'react'

import { Check, CreditCard, DollarSign, Loader2, Minus, Plus, Save, Search, User, X } from '@/shared/utils/optimized-imports'
import { Card } from '@/shared/components/ui'
import { Button } from '@/shared/components/ui'
import { formatCurrency } from '../utils'
import { usePDVData } from '@/shared/hooks/data/use-pdv-data'
import { ClienteAgendamentoPicker } from './ClienteAgendamentoPicker'
import { CadastroRapidoCliente } from './CadastroRapidoCliente'

interface ServicoSelecionado {
  id: string
  nome: string
  preco: number
  duracao: number
  quantidade: number
  precoTotal: number
}

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
  servicosSelecionados?: ServicoSelecionado[]
}

interface QuickTransactionPDVProps {
  onTransactionSaved: (transaction: QuickTransaction) => void
  className?: string
}



export const QuickTransactionPDV = ({ 
  onTransactionSaved, 
  className = '' 
}: QuickTransactionPDVProps) => {
  const { servicos, barbeiros, loading: pdvLoading } = usePDVData()
  const [activeTab, setActiveTab] = useState<'ENTRADA' | 'SAIDA'>('ENTRADA')
  const [showClientePicker, setShowClientePicker] = useState(false)
  const [showCadastroRapido, setShowCadastroRapido] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [servicoQuantidades, setServicoQuantidades] = useState<Record<string, number>>({})
  const [servicosSelecionados, setServicosSelecionados] = useState<ServicoSelecionado[]>([])
  const [transaction, setTransaction] = useState<QuickTransaction>({
    tipo: 'ENTRADA',
    valor: 0,
    descricao: '',
    metodoPagamento: 'DINHEIRO',
    categoria: '',
    cliente: '',
    barbeiro: '',
    observacoes: '',
    agendamentoId: undefined,
    servicosSelecionados: []
  })

  const selectRef = useRef<HTMLSelectElement>(null)

  // Forçar estilo do select após montagem
  useEffect(() => {
    if (selectRef.current) {
      const select = selectRef.current
      // Garantir que a classe pdv-select seja aplicada
      select.classList.add('pdv-select')
      
      // Debug: verificar se o valor está sendo definido
      console.log('Select categoria value:', transaction.categoria)
      console.log('Select element:', select)
      console.log('Select computed style:', window.getComputedStyle(select))
    }
  }, [transaction.categoria])

  // Função para calcular totais baseado nos serviços selecionados
  const calcularTotais = (servicos: ServicoSelecionado[]) => {
    const valorTotal = servicos.reduce((total, s) => total + s.precoTotal, 0)
    const descricao = servicos.map(s => 
      s.quantidade > 1 ? `${s.quantidade}x ${s.nome}` : s.nome
    ).join(' + ')
    
    return { valorTotal, descricao }
  }

  // Função para selecionar/deselecionar serviço
  const handleServiceToggle = (servico: any) => {
    const servicoExistente = servicosSelecionados.find(s => s.id === servico.id)
    
    if (servicoExistente) {
      // Se já está selecionado, remove completamente
      const novosServicos = servicosSelecionados.filter(s => s.id !== servico.id)
      const { valorTotal, descricao } = calcularTotais(novosServicos)
      
      setServicosSelecionados(novosServicos)
      setServicoQuantidades(prev => {
        const novas = { ...prev }
        delete novas[servico.id]
        return novas
      })
      
      setTransaction(prev => ({
        ...prev,
        valor: valorTotal,
        descricao,
        servicosSelecionados: novosServicos
      }))
    } else {
      // Se não está selecionado, adiciona com quantidade 1
      const novoServico: ServicoSelecionado = {
        id: servico.id,
        nome: servico.nome,
        preco: servico.preco,
        duracao: servico.duracao || 30,
        quantidade: 1,
        precoTotal: servico.preco
      }
      
      const novosServicos = [...servicosSelecionados, novoServico]
      const { valorTotal, descricao } = calcularTotais(novosServicos)
      
      setServicosSelecionados(novosServicos)
      setServicoQuantidades(prev => ({ ...prev, [servico.id]: 1 }))
      
      setTransaction(prev => ({
        ...prev,
        valor: valorTotal,
        descricao,
        categoria: servico.categoria || 'Serviços',
        servicosSelecionados: novosServicos
      }))
    }
  }

  // Função para alterar quantidade de um serviço selecionado
  const handleQuantidadeChange = (servicoId: string, novaQuantidade: number) => {
    if (novaQuantidade < 1) return // Não permite quantidade menor que 1
    
    const novosServicos = servicosSelecionados.map(s => 
      s.id === servicoId 
        ? { ...s, quantidade: novaQuantidade, precoTotal: s.preco * novaQuantidade }
        : s
    )
    
    const { valorTotal, descricao } = calcularTotais(novosServicos)
    
    setServicosSelecionados(novosServicos)
    setServicoQuantidades(prev => ({ ...prev, [servicoId]: novaQuantidade }))
    
    setTransaction(prev => ({
      ...prev,
      valor: valorTotal,
      descricao,
      servicosSelecionados: novosServicos
    }))
  }

  // Função para lidar com cliente criado no cadastro rápido
  const handleClienteCriado = (cliente: any) => {
    setTransaction(prev => ({
      ...prev,
      cliente: cliente.nome,
      observacoes: `Cliente cadastrado automaticamente. ${cliente.senhaTemporaria ? `Senha temporária: ${cliente.senhaTemporaria}` : ''}`
    }))
    setShowCadastroRapido(false)
  }

  // Função para selecionar agendamento (soma aos serviços existentes)
  const handleAgendamentoSelect = (agendamento: any) => {
    const servicosDoAgendamento: ServicoSelecionado[] = agendamento.servicos.map((s: any) => ({
      id: s.id,
      nome: s.nome,
      preco: s.preco,
      duracao: s.duracao || 30,
      quantidade: 1,
      precoTotal: s.preco
    }))
    
    // Soma aos serviços já selecionados (se houver)
    const servicosExistentes = servicosSelecionados.filter(s => 
      !servicosDoAgendamento.some(sa => sa.id === s.id)
    )
    
    const todosServicos = [...servicosExistentes, ...servicosDoAgendamento]
    const { valorTotal, descricao } = calcularTotais(todosServicos)
    
    setServicosSelecionados(todosServicos)
    
    // Atualizar quantidades para os serviços do agendamento
    const novasQuantidades = { ...servicoQuantidades }
    servicosDoAgendamento.forEach(s => {
      novasQuantidades[s.id] = 1
    })
    setServicoQuantidades(novasQuantidades)
    
    setTransaction(prev => ({
      ...prev,
      valor: valorTotal,
      descricao,
      categoria: 'Serviços',
      cliente: agendamento.cliente_nome,
      barbeiro: agendamento.barbeiro_nome,
      observacoes: `Pagamento do agendamento de ${new Date(agendamento.data_agendamento).toLocaleDateString('pt-BR')} às ${agendamento.hora_inicio}`,
      agendamentoId: agendamento.id,
      servicosSelecionados: todosServicos
    }))
  }



  // Função para remover serviço
  const handleRemoveServico = (servicoId: string) => {
    const novosServicos = servicosSelecionados.filter(s => s.id !== servicoId)
    const { valorTotal, descricao } = calcularTotais(novosServicos)
    
    setServicosSelecionados(novosServicos)
    setTransaction(prev => ({
      ...prev,
      valor: valorTotal,
      descricao,
      servicosSelecionados: novosServicos
    }))
  }

  // Função para limpar tudo
  const handleLimparTudo = () => {
    setServicosSelecionados([])
    setServicoQuantidades({})
    setTransaction({
      tipo: activeTab,
      valor: 0,
      descricao: '',
      metodoPagamento: 'DINHEIRO',
      categoria: '',
      cliente: '',
      barbeiro: '',
      observacoes: '',
      agendamentoId: undefined, // Limpar agendamentoId
      servicosSelecionados: []
    })
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
        observacoes: '',
        agendamentoId: undefined,
        servicosSelecionados: []
      })
      
      alert('Transação registrada com sucesso!')
    }
  }

  const isValid = transaction.valor > 0 && transaction.descricao.trim() !== ''

  return (
    <div className={`${isExpanded ? 'fixed inset-0 z-50 bg-white dark:bg-background-dark p-4 overflow-y-auto' : 'space-y-6'} ${className}`}>
      {/* Header Moderno */}
      <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border-l-4 border-l-primary-gold shadow-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary-gold/10 rounded-xl">
                <DollarSign className="h-8 w-8 text-primary-gold" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  PDV - Registro Rápido
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Registre entradas e saídas rapidamente
                </p>
              </div>
            </div>
            
            {/* Botão de Expandir */}
            <Button
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-2 border-primary-gold/30 hover:border-primary-gold/50 hover:bg-primary-gold/10"
            >
              {isExpanded ? (
                <>
                  <Minimize2 className="h-4 w-4" />
                  <span>Minimizar</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-4 w-4" />
                  <span>Expandir</span>
                </>
              )}
            </Button>
          </div>

          {/* Tabs Melhoradas */}
          <div className="flex space-x-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-secondary-graphite-card dark:to-secondary-graphite p-3 rounded-2xl mb-8 shadow-inner">
            <Button
              variant={activeTab === 'ENTRADA' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('ENTRADA')}
              className={`flex-1 flex items-center justify-center space-x-3 py-4 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'ENTRADA' 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg transform scale-105' 
                  : 'hover:bg-white/50 dark:hover:bg-secondary-graphite-light/50'
              }`}
            >
              <Plus className="h-6 w-6" />
              <span className="text-lg">Entrada</span>
            </Button>
            <Button
              variant={activeTab === 'SAIDA' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('SAIDA')}
              className={`flex-1 flex items-center justify-center space-x-3 py-4 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'SAIDA' 
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg transform scale-105' 
                  : 'hover:bg-white/50 dark:hover:bg-secondary-graphite-light/50'
              }`}
            >
              <Minus className="h-6 w-6" />
              <span className="text-lg">Saída</span>
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
            {/* Busca de Cliente com Agendamento */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-2xl border-2 border-blue-200 dark:border-blue-800/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                    Cliente com Agendamento
                  </h4>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="primary"
                    onClick={() => setShowClientePicker(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Buscar Cliente
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCadastroRapido(true)}
                    className="border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Novo Cliente
                  </Button>
                </div>
              </div>
              
              {transaction.agendamentoId && (
                <div className="bg-white dark:bg-secondary-graphite p-4 rounded-xl border border-blue-300 dark:border-blue-700">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-bold text-gray-900 dark:text-white">
                      Agendamento Selecionado
                    </h5>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLimparTudo}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm"><strong>Cliente:</strong> {transaction.cliente}</p>
                    <p className="text-sm"><strong>Barbeiro:</strong> {transaction.barbeiro}</p>
                    {servicosSelecionados.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Serviços Selecionados:</p>
                        <div className="flex flex-wrap gap-2">
                          {servicosSelecionados.map((servico, idx) => (
                            <div
                              key={idx}
                              className="flex items-center space-x-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-xs rounded-full text-blue-700 dark:text-blue-300"
                            >
                              <span>
                                {servico.quantidade > 1 && `${servico.quantidade}x `}
                                {servico.nome} - {formatCurrency(servico.precoTotal)}
                              </span>
                              <button
                                onClick={() => handleRemoveServico(servico.id)}
                                className="hover:bg-red-200 dark:hover:bg-red-800 rounded-full p-1"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Serviços Rápidos Melhorados */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-2xl border-2 border-green-200 dark:border-green-800/30 overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Serviços Rápidos
                  </h3>
                </div>
                {pdvLoading && (
                  <div className="flex items-center space-x-2 text-sm text-green-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Carregando...</span>
                  </div>
                )}
              </div>
              
              <div className={`grid gap-4 ${isExpanded ? 'grid-cols-2 lg:grid-cols-4 xl:grid-cols-6' : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                {servicos.map((servico, index) => (
                  <motion.div
                    key={servico.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="relative w-full"
                  >
                    <div
                      className={`
                        relative h-36 w-full p-3 rounded-xl border-2 cursor-pointer
                        bg-white dark:bg-secondary-graphite-light 
                        border-gray-200 dark:border-gray-600 
                        hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/30 
                        hover:shadow-lg transition-all duration-300 transform hover:scale-105
                        flex flex-col items-center justify-between
                        ${pdvLoading ? 'opacity-50 cursor-not-allowed' : ''}
                        ${transaction.descricao.includes(servico.nome) 
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/30 shadow-lg scale-105' 
                          : ''
                        }
                      `}
                    >
                      {/* Conteúdo do Serviço */}
                      <div 
                        onClick={() => handleServiceToggle(servico)}
                        className="flex flex-col items-center justify-center flex-1 w-full text-center space-y-1"
                      >
                        <div className="text-sm font-bold text-gray-900 dark:text-white leading-tight break-words max-w-full">
                          {servico.nome}
                        </div>
                        <div className="text-lg text-green-600 dark:text-green-400 font-bold">
                          {formatCurrency(servico.preco)}
                        </div>
                        {servico.duracao && (
                          <div className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                            {servico.duracao}min
                          </div>
                        )}
                      </div>

                      {/* Seletor de Quantidade - Só mostra se estiver selecionado */}
                      {transaction.descricao.includes(servico.nome) && (
                        <div className="flex items-center justify-center space-x-2 mt-2 w-full">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const servicoSelecionado = servicosSelecionados.find(s => s.id === servico.id)
                              if (servicoSelecionado) {
                                const novaQtd = Math.max(1, servicoSelecionado.quantidade - 1)
                                handleQuantidadeChange(servico.id, novaQtd)
                              }
                            }}
                            className="w-6 h-6 rounded-full bg-red-200 dark:bg-red-700 hover:bg-red-300 dark:hover:bg-red-600 flex items-center justify-center text-xs font-bold text-red-700 dark:text-red-200"
                          >
                            -
                          </button>
                          <span className="text-sm font-bold min-w-[20px] text-center">
                            {servicosSelecionados.find(s => s.id === servico.id)?.quantidade || 1}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const servicoSelecionado = servicosSelecionados.find(s => s.id === servico.id)
                              if (servicoSelecionado) {
                                const novaQtd = Math.min(10, servicoSelecionado.quantidade + 1)
                                handleQuantidadeChange(servico.id, novaQtd)
                              }
                            }}
                            className="w-6 h-6 rounded-full bg-green-200 dark:bg-green-700 hover:bg-green-300 dark:hover:bg-green-600 flex items-center justify-center text-xs font-bold text-green-700 dark:text-green-200"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {servicos.length === 0 && !pdvLoading && (
                <div className="text-center py-12">
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <DollarSign className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">Nenhum serviço disponível</p>
                  <p className="text-sm text-gray-500 mt-1">Configure os serviços no sistema</p>
                </div>
              )}
            </div>

            {/* Valor e Descrição Melhorados */}
            <div className="bg-white dark:bg-secondary-graphite-light p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-600 shadow-lg">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </div>
                <span>Detalhes da Transação</span>
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    Valor *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-green-500 pointer-events-none z-30" />
                    <input
                      type="number"
                      step="0.01"
                      value={transaction.valor || ''}
                      onChange={(e) => setTransaction(prev => ({
                        ...prev,
                        valor: parseFloat(e.target.value) || 0
                      }))}
                      className="w-full pl-16 pr-4 py-4 border-2 border-gray-300 dark:border-secondary-graphite-card/30 rounded-xl bg-white dark:bg-secondary-graphite text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-bold shadow-inner"
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    Descrição *
                  </label>
                  <input
                    type="text"
                    value={transaction.descricao}
                    onChange={(e) => setTransaction(prev => ({
                      ...prev,
                      descricao: e.target.value
                    }))}
                    className="w-full px-4 py-4 border-2 border-gray-300 dark:border-secondary-graphite-card/30 rounded-xl bg-white dark:bg-secondary-graphite text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg shadow-inner"
                    placeholder="Ex: Corte + Barba"
                  />
                </div>
              </div>
            </div>



            {/* Serviços Adicionais */}
            {transaction.agendamentoId && (
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-6 rounded-2xl border-2 border-yellow-200 dark:border-yellow-800/30">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <Plus className="h-5 w-5 text-yellow-600" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                    Adicionar Serviços Extras
                  </h4>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {servicos.map((servico, index) => {
                    const servicoSelecionado = servicosSelecionados.find(s => s.id === servico.id)
                    const quantidade = servicoQuantidades[servico.id] || 1
                    
                    return (
                      <motion.div
                        key={servico.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="relative w-full"
                      >
                        <div
                          className={`
                            relative h-32 w-full p-3 rounded-xl border-2 cursor-pointer
                            transition-all duration-300 transform hover:scale-105
                            flex flex-col items-center justify-between
                            ${servicoSelecionado 
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500 shadow-lg scale-105' 
                              : 'bg-white dark:bg-secondary-graphite-light border-gray-200 dark:border-gray-600 hover:border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                            }
                          `}
                        >
                          {/* Conteúdo do Serviço */}
                          <div 
                            onClick={() => handleServiceToggle(servico)}
                            className="flex flex-col items-center justify-center flex-1 w-full text-center space-y-1"
                          >
                            <div className="text-sm font-bold text-gray-900 dark:text-white leading-tight break-words max-w-full">
                              {servico.nome}
                            </div>
                            <div className="text-lg text-yellow-600 dark:text-yellow-400 font-bold">
                              {servicoSelecionado ? '-' : '+'}{formatCurrency(servico.preco)}
                            </div>
                            {servico.duracao && (
                              <div className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                                {servico.duracao}min
                              </div>
                            )}
                            {servicoSelecionado && (
                              <div className="text-xs text-yellow-700 dark:text-yellow-300 font-bold">
                                {servicoSelecionado.quantidade}x selecionado
                              </div>
                            )}
                          </div>

                          {/* Seletor de Quantidade - Só mostra se está selecionado */}
                          {servicoSelecionado && (
                            <div className="flex items-center justify-center space-x-2 mt-2 w-full">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const novaQtd = Math.max(1, servicoSelecionado.quantidade - 1)
                                  handleQuantidadeChange(servico.id, novaQtd)
                                }}
                                className="w-6 h-6 rounded-full bg-red-200 dark:bg-red-700 hover:bg-red-300 dark:hover:bg-red-600 flex items-center justify-center text-xs font-bold text-red-700 dark:text-red-200"
                              >
                                -
                              </button>
                              <span className="text-sm font-bold min-w-[20px] text-center">
                                {servicoSelecionado.quantidade}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const novaQtd = Math.min(10, servicoSelecionado.quantidade + 1)
                                  handleQuantidadeChange(servico.id, novaQtd)
                                }}
                                className="w-6 h-6 rounded-full bg-green-200 dark:bg-green-700 hover:bg-green-300 dark:hover:bg-green-600 flex items-center justify-center text-xs font-bold text-green-700 dark:text-green-200"
                              >
                                +
                              </button>
                            </div>
                          )}

                          {/* Indicador de selecionado */}
                          {servicoSelecionado && (
                            <div className="absolute top-2 right-2 bg-yellow-500 text-white rounded-full p-1">
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Cliente e Barbeiro Melhorados - Só mostra se não há agendamento */}
            {!transaction.agendamentoId && (
              <div className="bg-white dark:bg-secondary-graphite-light p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-600 shadow-lg">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                  <div className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded">
                    <User className="h-4 w-4 text-purple-600" />
                  </div>
                  <span>Informações Adicionais</span>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      Cliente (opcional)
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-500 pointer-events-none z-30" />
                      <input
                        type="text"
                        value={transaction.cliente}
                        onChange={(e) => setTransaction(prev => ({
                          ...prev,
                          cliente: e.target.value
                        }))}
                        className="w-full pl-14 pr-4 py-4 border-2 border-gray-300 dark:border-secondary-graphite-card/30 rounded-xl bg-white dark:bg-secondary-graphite text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg shadow-inner"
                        placeholder="Nome do cliente"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      Barbeiro
                    </label>
                    <div className="relative">
                      <select
                        value={transaction.barbeiro}
                        onChange={(e) => setTransaction(prev => ({
                          ...prev,
                          barbeiro: e.target.value
                        }))}
                        className="pdv-select"
                        disabled={pdvLoading}
                      >
                        <option value="">
                          {pdvLoading ? 'Carregando barbeiros...' : 'Selecionar barbeiro'}
                        </option>
                        {barbeiros.map((barbeiro) => (
                          <option key={barbeiro.id} value={barbeiro.nome}>
                            {barbeiro.nome}
                            {barbeiro.especialidades && barbeiro.especialidades.length > 0 && (
                              ` - ${barbeiro.especialidades.slice(0, 2).join(', ')}`
                            )}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {barbeiros.length === 0 && !pdvLoading && (
                      <p className="text-xs text-red-500 mt-2 flex items-center space-x-1">
                        <X className="h-3 w-3" />
                        <span>Nenhum barbeiro disponível</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Método de Pagamento Melhorado */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-2xl border-2 border-blue-200 dark:border-blue-800/30">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                  Método de Pagamento
                </h4>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { key: 'DINHEIRO', label: 'Dinheiro', icon: DollarSign, color: 'green' },
                  { key: 'PIX', label: 'PIX', icon: Smartphone, color: 'blue' },
                  { key: 'CARTAO_DEBITO', label: 'Débito', icon: CreditCard, color: 'purple' },
                  { key: 'CARTAO_CREDITO', label: 'Crédito', icon: CreditCard, color: 'orange' }
                ].map((metodo) => {
                  const Icon = metodo.icon
                  const isSelected = transaction.metodoPagamento === metodo.key
                  
                  const colorClasses = {
                    green: isSelected 
                      ? 'bg-gradient-to-br from-green-500 to-green-600 text-white border-green-500 shadow-lg transform scale-105' 
                      : 'bg-white dark:bg-secondary-graphite-light border-green-200 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20',
                    blue: isSelected 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-500 shadow-lg transform scale-105' 
                      : 'bg-white dark:bg-secondary-graphite-light border-blue-200 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20',
                    purple: isSelected 
                      ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white border-purple-500 shadow-lg transform scale-105' 
                      : 'bg-white dark:bg-secondary-graphite-light border-purple-200 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20',
                    orange: isSelected 
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white border-orange-500 shadow-lg transform scale-105' 
                      : 'bg-white dark:bg-secondary-graphite-light border-orange-200 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                  }
                  
                  return (
                    <Button
                      key={metodo.key}
                      variant="outline"
                      onClick={() => setTransaction(prev => ({
                        ...prev,
                        metodoPagamento: metodo.key as any
                      }))}
                      className={`h-20 flex flex-col items-center justify-center space-y-2 border-2 transition-all duration-300 ${colorClasses[metodo.color as keyof typeof colorClasses]}`}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-sm font-bold">{metodo.label}</span>
                    </Button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Conteúdo da Aba SAIDA Melhorada */}
        {activeTab === 'SAIDA' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Valor e Descrição para Saída */}
            <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 p-6 rounded-2xl border-2 border-red-200 dark:border-red-800/30">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <div className="p-1 bg-red-100 dark:bg-red-900/30 rounded">
                  <Minus className="h-4 w-4 text-red-600" />
                </div>
                <span>Detalhes da Saída</span>
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    Valor *
                  </label>
                  <div className="relative">
                    <Minus className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-red-500 pointer-events-none z-30" />
                    <input
                      type="number"
                      step="0.01"
                      value={transaction.valor || ''}
                      onChange={(e) => setTransaction(prev => ({
                        ...prev,
                        valor: parseFloat(e.target.value) || 0
                      }))}
                      className="w-full pl-16 pr-4 py-4 border-2 border-gray-300 dark:border-secondary-graphite-card/30 rounded-xl bg-white dark:bg-secondary-graphite text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg font-bold shadow-inner"
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    Descrição *
                  </label>
                  <input
                    type="text"
                    value={transaction.descricao}
                    onChange={(e) => setTransaction(prev => ({
                      ...prev,
                      descricao: e.target.value
                    }))}
                    className="w-full px-4 py-4 border-2 border-gray-300 dark:border-secondary-graphite-card/30 rounded-xl bg-white dark:bg-secondary-graphite text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg shadow-inner"
                    placeholder="Ex: Compra de produtos"
                  />
                </div>
              </div>
            </div>

            {/* Categoria para Saída */}
            <div className="bg-white dark:bg-secondary-graphite-light p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-600 shadow-lg">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <div className="p-1 bg-orange-100 dark:bg-orange-900/30 rounded">
                  <DollarSign className="h-4 w-4 text-orange-600" />
                </div>
                <span>Categoria da Despesa</span>
              </h4>
              
              <div className="relative">
                <select
                  ref={selectRef}
                  value={transaction.categoria}
                  onChange={(e) => {
                    console.log('Categoria selecionada:', e.target.value)
                    setTransaction(prev => ({
                      ...prev,
                      categoria: e.target.value
                    }))
                  }}
                  className="pdv-select"

                >
                <option value="">Selecionar categoria</option>
                <option value="Produtos">💄 Produtos</option>
                <option value="Equipamentos">⚙️ Equipamentos</option>
                <option value="Limpeza">🧽 Limpeza</option>
                <option value="Marketing">📢 Marketing</option>
                <option value="Aluguel">🏠 Aluguel</option>
                <option value="Energia">⚡ Energia</option>
                <option value="Internet">🌐 Internet</option>
                <option value="Outros">📦 Outros</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Botões de Ação para Saída */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-secondary-graphite-card dark:to-secondary-graphite p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {isValid ? (
                    <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                      <div className="p-1 bg-red-100 dark:bg-red-900/30 rounded-full">
                        <Save className="h-4 w-4" />
                      </div>
                      <span className="font-semibold">Pronto para registrar saída</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400">
                      <div className="p-1 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                        <X className="h-4 w-4" />
                      </div>
                      <span className="font-semibold">Preencha valor, descrição e categoria</span>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-4">
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
                    className="px-6 py-3 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"
                  >
                    <X className="h-5 w-5 mr-2" />
                    <span className="font-semibold">Limpar</span>
                  </Button>
                  
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={!isValid || !transaction.categoria}
                    className={`px-8 py-3 font-bold text-lg transition-all duration-300 ${
                      isValid && transaction.categoria
                        ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg transform hover:scale-105' 
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <Save className="h-5 w-5 mr-2" />
                    <span>Registrar Saída</span>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Botão de Confirmação de Pagamento - Sempre Visível */}
        {isValid && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-2xl shadow-xl border-2 border-green-400">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <h3 className="text-xl font-bold mb-2">Confirmar Pagamento</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Cliente:</strong> {transaction.cliente || 'Não informado'}</p>
                    <p><strong>Valor Total:</strong> {formatCurrency(transaction.valor)}</p>
                    <p><strong>Método:</strong> {transaction.metodoPagamento?.replace('_', ' ')}</p>
                    {transaction.agendamentoId && (
                      <p><strong>Agendamento:</strong> Será marcado como pago</p>
                    )}
                    {!transaction.agendamentoId && transaction.cliente && transaction.barbeiro && activeTab === 'ENTRADA' && (
                      <p className="text-blue-600 dark:text-blue-400">
                        <strong>📅 Agendamento:</strong> Será criado automaticamente para histórico e fidelidade
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col space-y-3">
                  <Button
                    variant="outline"
                    onClick={handleSave}
                    className="px-8 py-4 bg-white text-green-600 border-2 border-white hover:bg-green-50 font-bold text-lg min-w-[200px] shadow-lg"
                  >
                    <ShoppingCart className="h-6 w-6 mr-3" />
                    {activeTab === 'ENTRADA' ? 'CONFIRMAR PAGAMENTO' : 'REGISTRAR SAÍDA'}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    onClick={handleLimparTudo}
                    className="text-white hover:bg-white/20 text-sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpar Tudo
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        </div>
      </Card>

      {/* Modal de Busca de Cliente */}
      {showClientePicker && (
        <ClienteAgendamentoPicker
          onAgendamentoSelected={handleAgendamentoSelect}
          onClose={() => setShowClientePicker(false)}
        />
      )}

      {/* Modal de Cadastro Rápido */}
      {showCadastroRapido && (
        <CadastroRapidoCliente
          isOpen={showCadastroRapido}
          onClose={() => setShowCadastroRapido(false)}
          onClienteCriado={handleClienteCriado}
        />
      )}
    </div>
  )
}
