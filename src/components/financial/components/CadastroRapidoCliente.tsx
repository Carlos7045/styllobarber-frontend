
'use client'

// Mock temporário para motion
const motion = {
  div: 'div' as any,
  span: 'span' as any,
  button: 'button' as any,
}

const AnimatePresence = ({ children }: { children: React.ReactNode }) => <>{children}</>
// Componente para cadastro rápido de clientes no PDV

import { useState, useEffect } from 'react'

import { User, Phone, Mail, Save, X, Loader2, Check, AlertCircle, UserPlus, Eye, EyeOff } from 'lucide-react'
import { Card, Button, Input, Badge } from '@/shared/components/ui'
import { useToast } from '@/shared/components/ui'
import { clienteCadastroService, type NovoClienteData } from '../services/cliente-cadastro-service'
import { useAuth } from '@/domains/auth/hooks/use-auth'

// Interface já importada do serviço

interface ClienteExistente {
  id: string
  nome: string
  telefone?: string
  email?: string
  ultimoAtendimento?: string
}

interface CadastroRapidoClienteProps {
  isOpen: boolean
  onClose: () => void
  onClienteCriado: (cliente: ClienteExistente & { senhaTemporaria: string }) => void
  className?: string
}

// Função para obter senha temporária padrão
const obterSenhaTemporaria = (): string => {
  // Usar senha padrão "bemvindo" para facilitar o primeiro acesso
  return 'bemvindo'
}

// Função para validar telefone brasileiro
const validarTelefone = (telefone: string): boolean => {
  const telefoneNumeros = telefone.replace(/\D/g, '')
  return telefoneNumeros.length >= 10 && telefoneNumeros.length <= 11
}

// Função para formatar telefone
const formatarTelefone = (telefone: string): string => {
  const numeros = telefone.replace(/\D/g, '')
  
  if (numeros.length <= 10) {
    return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  } else {
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
}

// Função para validar email
const validarEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const CadastroRapidoCliente = ({
  isOpen,
  onClose,
  onClienteCriado,
  className = ''
}: CadastroRapidoClienteProps) => {
  const [formData, setFormData] = useState<NovoClienteData>({
    nome: '',
    telefone: '',
    email: '',
    observacoes: ''
  })
  
  const [clientesEncontrados, setClientesEncontrados] = useState<ClienteExistente[]>([])
  const [loading, setLoading] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [senhaGerada, setSenhaGerada] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [step, setStep] = useState<'form' | 'confirmacao' | 'sucesso'>('form')
  
  const { addToast } = useToast()
  const { user } = useAuth()

  // Resetar form quando abrir/fechar
  useEffect(() => {
    if (isOpen) {
      setFormData({
        nome: '',
        telefone: '',
        email: '',
        observacoes: ''
      })
      setClientesEncontrados([])
      setErrors({})
      setStep('form')
      setSenhaGerada('')
    }
  }, [isOpen])

  // Buscar clientes similares quando digitar telefone
  useEffect(() => {
    const buscarClientesSimilares = async () => {
      if (formData.telefone.length >= 8) {
        setLoading(true)
        try {
          const clientesEncontrados = await clienteCadastroService.verificarClienteExistente(
            formData.telefone, 
            formData.email
          )
          
          setClientesEncontrados(clientesEncontrados.map(cliente => ({
            id: cliente.id,
            nome: cliente.nome,
            telefone: cliente.telefone,
            email: cliente.email,
            ultimoAtendimento: cliente.created_at
          })))
        } catch (error) {
          console.error('Erro ao buscar clientes:', error)
          setClientesEncontrados([])
        } finally {
          setLoading(false)
        }
      } else {
        setClientesEncontrados([])
      }
    }

    const timer = setTimeout(buscarClientesSimilares, 300)
    return () => clearTimeout(timer)
  }, [formData.telefone, formData.email])

  // Validar formulário
  const validarFormulario = (): boolean => {
    const novosErrors: Record<string, string> = {}

    if (!formData.nome.trim()) {
      novosErrors.nome = 'Nome é obrigatório'
    } else if (formData.nome.trim().length < 2) {
      novosErrors.nome = 'Nome deve ter pelo menos 2 caracteres'
    }

    if (!formData.telefone.trim()) {
      novosErrors.telefone = 'Telefone é obrigatório'
    } else if (!validarTelefone(formData.telefone)) {
      novosErrors.telefone = 'Telefone inválido'
    }

    if (formData.email && !validarEmail(formData.email)) {
      novosErrors.email = 'Email inválido'
    }

    setErrors(novosErrors)
    return Object.keys(novosErrors).length === 0
  }

  // Selecionar cliente existente
  const selecionarClienteExistente = (cliente: ClienteExistente) => {
    onClienteCriado({ ...cliente, senhaTemporaria: '' })
    onClose()
  }

  // Prosseguir para confirmação
  const prosseguirParaConfirmacao = () => {
    if (validarFormulario()) {
      const senha = obterSenhaTemporaria()
      setSenhaGerada(senha)
      setStep('confirmacao')
    }
  }

  // Salvar novo cliente
  const salvarNovoCliente = async () => {
    if (!user?.id) {
      addToast({
        title: 'Erro de autenticação',
        description: 'Usuário não autenticado.',
        type: 'error'
      })
      return
    }

    setSalvando(true)
    
    try {
      const dadosCliente: NovoClienteData = {
        nome: formData.nome,
        telefone: formData.telefone,
        email: formData.email || undefined,
        observacoes: formData.observacoes || undefined
      }

      const clienteCriado = await clienteCadastroService.cadastrarCliente(dadosCliente, user.id)
      
      const novoCliente: ClienteExistente & { senhaTemporaria: string } = {
        id: clienteCriado.id,
        nome: clienteCriado.nome,
        telefone: clienteCriado.telefone,
        email: clienteCriado.email,
        ultimoAtendimento: new Date().toISOString(),
        senhaTemporaria: clienteCriado.senhaTemporaria
      }
      
      setStep('sucesso')
      
      // Aguardar um pouco para mostrar sucesso
      setTimeout(() => {
        onClienteCriado(novoCliente)
        onClose()
        
        addToast({
          title: 'Cliente cadastrado com sucesso!',
          description: `${novoCliente.nome} foi cadastrado e receberá as credenciais por ${novoCliente.email ? 'email' : 'SMS'}.`,
          type: 'success'
        })
      }, 1500)
      
    } catch (error: any) {
      console.error('Erro ao salvar cliente:', error)
      addToast({
        title: 'Erro ao cadastrar cliente',
        description: error.message || 'Tente novamente em alguns instantes.',
        type: 'error'
      })
      setStep('form') // Voltar para o formulário em caso de erro
    } finally {
      setSalvando(false)
    }
  }

  // Voltar para formulário
  const voltarParaFormulario = () => {
    setStep('form')
    setSenhaGerada('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`w-full max-w-2xl mx-4 ${className}`}
      >
        <Card className="bg-white dark:bg-secondary-graphite-light shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-secondary-graphite-card/30">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <UserPlus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {step === 'form' ? 'Cadastro Rápido de Cliente' : 
                   step === 'confirmacao' ? 'Confirmar Cadastro' : 
                   'Cliente Cadastrado!'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {step === 'form' ? 'Preencha os dados básicos do cliente' : 
                   step === 'confirmacao' ? 'Revise os dados antes de salvar' : 
                   'Credenciais enviadas com sucesso'}
                </p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={salvando}
              className="hover:bg-gray-100 dark:hover:bg-secondary-graphite"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Conteúdo */}
          <div className="p-6">
            <AnimatePresence>
              {/* Formulário */}
              {step === 'form' && (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Clientes Encontrados */}
                  {clientesEncontrados.length > 0 && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                          Cliente(s) encontrado(s) com dados similares
                        </h4>
                      </div>
                      
                      <div className="space-y-2">
                        {clientesEncontrados.map((cliente) => (
                          <div
                            key={cliente.id}
                            className="flex items-center justify-between p-3 bg-white dark:bg-secondary-graphite rounded-lg border border-yellow-200 dark:border-yellow-800/30"
                          >
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {cliente.nome}
                              </p>
                              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-300">
                                {cliente.telefone && (
                                  <span className="flex items-center space-x-1">
                                    <Phone className="h-3 w-3" />
                                    <span>{cliente.telefone}</span>
                                  </span>
                                )}
                                {cliente.email && (
                                  <span className="flex items-center space-x-1">
                                    <Mail className="h-3 w-3" />
                                    <span>{cliente.email}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => selecionarClienteExistente(cliente)}
                              className="border-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                            >
                              Usar Este Cliente
                            </Button>
                          </div>
                        ))}
                      </div>
                      
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-3">
                        Se é um cliente diferente, continue preenchendo o formulário abaixo.
                      </p>
                    </div>
                  )}

                  {/* Campos do Formulário */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nome */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nome Completo *
                      </label>
                      <Input
                        value={formData.nome}
                        onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                        placeholder="Ex: João Silva"
                        leftIcon={<User className="h-4 w-4" />}
                        error={errors.nome}
                        className="py-3"
                      />
                    </div>

                    {/* Telefone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Telefone *
                      </label>
                      <div className="relative">
                        <Input
                          value={formData.telefone}
                          onChange={(e) => {
                            const formatted = formatarTelefone(e.target.value)
                            setFormData(prev => ({ ...prev, telefone: formatted }))
                          }}
                          placeholder="(11) 99999-9999"
                          leftIcon={<Phone className="h-4 w-4" />}
                          error={errors.telefone}
                          className="py-3"
                        />
                        {loading && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email (opcional)
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="joao@email.com"
                        leftIcon={<Mail className="h-4 w-4" />}
                        error={errors.email}
                        className="py-3"
                      />
                    </div>

                    {/* Observações */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Observações (opcional)
                      </label>
                      <textarea
                        value={formData.observacoes}
                        onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                        placeholder="Ex: Cliente preferencial, alérgico a..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-secondary-graphite-card/30 rounded-lg bg-white dark:bg-secondary-graphite text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      />
                    </div>
                  </div>

                  {/* Informações sobre o cadastro */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded">
                        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-sm text-blue-800 dark:text-blue-200">
                        <p className="font-medium mb-1">O que acontecerá após o cadastro:</p>
                        <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                          <li>• Uma conta será criada automaticamente para o cliente</li>
                          <li>• A senha padrão "bemvindo" será definida</li>
                          <li>• As credenciais serão enviadas por {formData.email ? 'email' : 'SMS'}</li>
                          <li>• O cliente precisará alterar a senha no primeiro acesso</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={onClose}
                      className="px-6"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={prosseguirParaConfirmacao}
                      disabled={!formData.nome.trim() || !formData.telefone.trim()}
                      className="px-6 bg-blue-600 hover:bg-blue-700"
                    >
                      Continuar
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Confirmação */}
              {step === 'confirmacao' && (
                <motion.div
                  key="confirmacao"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Dados do Cliente */}
                  <div className="bg-gray-50 dark:bg-secondary-graphite-card rounded-lg p-6">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                      Dados do Cliente
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Nome</p>
                        <p className="font-medium text-gray-900 dark:text-white">{formData.nome}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Telefone</p>
                        <p className="font-medium text-gray-900 dark:text-white">{formatarTelefone(formData.telefone)}</p>
                      </div>
                      
                      {formData.email && (
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                          <p className="font-medium text-gray-900 dark:text-white">{formData.email}</p>
                        </div>
                      )}
                      
                      {formData.observacoes && (
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Observações</p>
                          <p className="font-medium text-gray-900 dark:text-white">{formData.observacoes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Credenciais */}
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-lg p-6">
                    <h3 className="font-medium text-green-800 dark:text-green-200 mb-4">
                      Credenciais de Acesso
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-green-700 dark:text-green-300">Login</p>
                        <p className="font-mono font-medium text-green-800 dark:text-green-200">
                          {formData.email || formatarTelefone(formData.telefone)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-green-700 dark:text-green-300">Senha Padrão</p>
                        <div className="flex items-center space-x-2">
                          <p className="font-mono font-bold text-lg text-green-800 dark:text-green-200">
                            {mostrarSenha ? senhaGerada : '••••••••'}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMostrarSenha(!mostrarSenha)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
                          >
                            {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <p className="text-sm text-green-800 dark:text-green-200">
                        <strong>Importante:</strong> As credenciais serão enviadas por {formData.email ? 'email' : 'SMS'} 
                        e o cliente deverá alterar a senha padrão no primeiro acesso.
                      </p>
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={voltarParaFormulario}
                      disabled={salvando}
                    >
                      Voltar
                    </Button>
                    
                    <div className="flex space-x-3">
                      <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={salvando}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={salvarNovoCliente}
                        disabled={salvando}
                        className="px-6 bg-green-600 hover:bg-green-700"
                      >
                        {salvando ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Cadastrando...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Confirmar Cadastro
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Sucesso */}
              {step === 'sucesso' && (
                <motion.div
                  key="sucesso"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-8"
                >
                  <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                    <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Cliente Cadastrado!
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {formData.nome} foi cadastrado com sucesso e receberá as credenciais por {formData.email ? 'email' : 'SMS'}.
                  </p>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      O cliente poderá fazer login usando <strong>{formData.email || formatarTelefone(formData.telefone)}</strong> 
                      e a senha padrão <strong>{senhaGerada}</strong>
                    </p>
                  </div>
                  
                  <div className="animate-pulse">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Finalizando cadastro...
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}