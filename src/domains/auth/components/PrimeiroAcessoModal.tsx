
'use client'

// Mock temporário para motion
const motion = {
  div: 'div' as any,
  span: 'span' as any,
  button: 'button' as any,
}
// Modal para primeiro acesso de clientes cadastrados automaticamente

import { useState } from 'react'

import { Key, Eye, EyeOff, User, Calendar, Phone, Mail, Shield, LogOut, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'
import { Card, Button, Input } from '@/shared/components/ui'
import { usePrimeiroAcesso } from '../hooks/use-primeiro-acesso'
import { formatDate } from '@/shared/utils/date-utils'

interface AlterarSenhaForm {
  senhaAtual: string
  novaSenha: string
  confirmarSenha: string
}

export const PrimeiroAcessoModal = () => {
  const {
    isPrimeiroAcesso,
    loading,
    alterandoSenha,
    dadosCliente,
    alterarSenha,
    fazerLogout,
    reenviarCredenciais
  } = usePrimeiroAcesso()

  const [formData, setFormData] = useState<AlterarSenhaForm>({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  })

  const [mostrarSenhas, setMostrarSenhas] = useState({
    atual: false,
    nova: false,
    confirmar: false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [step, setStep] = useState<'boas-vindas' | 'alterar-senha'>('boas-vindas')

  // Se não é primeiro acesso ou ainda está carregando, não mostrar modal
  if (!isPrimeiroAcesso || loading) {
    return null
  }

  // Validar formulário
  const validarFormulario = (): boolean => {
    const novosErrors: Record<string, string> = {}

    if (!formData.senhaAtual.trim()) {
      novosErrors.senhaAtual = 'Senha atual é obrigatória'
    }

    if (!formData.novaSenha.trim()) {
      novosErrors.novaSenha = 'Nova senha é obrigatória'
    } else if (formData.novaSenha.length < 6) {
      novosErrors.novaSenha = 'Nova senha deve ter pelo menos 6 caracteres'
    }

    if (!formData.confirmarSenha.trim()) {
      novosErrors.confirmarSenha = 'Confirmação de senha é obrigatória'
    } else if (formData.novaSenha !== formData.confirmarSenha) {
      novosErrors.confirmarSenha = 'As senhas não coincidem'
    }

    if (formData.senhaAtual === formData.novaSenha) {
      novosErrors.novaSenha = 'A nova senha deve ser diferente da atual'
    }

    setErrors(novosErrors)
    return Object.keys(novosErrors).length === 0
  }

  // Submeter alteração de senha
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validarFormulario()) return

    const resultado = await alterarSenha(formData)

    if (!resultado.sucesso && resultado.erro) {
      setErrors({ geral: resultado.erro })
    }
  }

  // Prosseguir para alteração de senha
  const prosseguirParaAlteracao = () => {
    setStep('alterar-senha')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl mx-4"
      >
        <Card className="bg-white dark:bg-secondary-graphite-light shadow-2xl border-2 border-primary-gold/20">
          {step === 'boas-vindas' ? (
            // Tela de Boas-vindas
            <div className="p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="p-4 bg-primary-gold/10 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <User className="h-10 w-10 text-primary-gold" />
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Bem-vindo à StylloBarber!
                </h1>
                
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  Olá <strong>{dadosCliente?.nome}</strong>, sua conta foi criada com sucesso!
                </p>
              </div>

              {/* Informações da Conta */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-6 mb-8">
                <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Informações da sua conta
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dadosCliente?.telefone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-sm text-blue-700 dark:text-blue-300">Telefone</p>
                        <p className="font-medium text-blue-800 dark:text-blue-200">
                          {dadosCliente.telefone}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {dadosCliente?.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-sm text-blue-700 dark:text-blue-300">Email</p>
                        <p className="font-medium text-blue-800 dark:text-blue-200">
                          {dadosCliente.email}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Cadastrado em</p>
                      <p className="font-medium text-blue-800 dark:text-blue-200">
                        {dadosCliente?.cadastradoEm ? formatDate(dadosCliente.cadastradoEm) : 'Hoje'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Aviso de Segurança */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30 rounded-lg p-6 mb-8">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                      Importante: Altere sua senha
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                      Por segurança, você deve alterar sua senha temporária antes de continuar. 
                      Isso garante que apenas você tenha acesso à sua conta.
                    </p>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                      <li>• Use uma senha forte com pelo menos 6 caracteres</li>
                      <li>• Combine letras, números e símbolos</li>
                      <li>• Não use informações pessoais óbvias</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={prosseguirParaAlteracao}
                  className="flex-1 bg-primary-gold hover:bg-primary-gold-dark text-black font-medium py-3"
                >
                  <Key className="h-5 w-5 mr-2" />
                  Alterar Senha Agora
                </Button>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={reenviarCredenciais}
                    className="border-blue-300 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reenviar Credenciais
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={fazerLogout}
                    className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // Tela de Alteração de Senha
            <div className="p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Key className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Alterar Senha
                </h2>
                
                <p className="text-gray-600 dark:text-gray-300">
                  Crie uma nova senha segura para sua conta
                </p>
              </div>

              {/* Formulário */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Erro Geral */}
                {errors.geral && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      <p className="text-sm text-red-700 dark:text-red-300">{errors.geral}</p>
                    </div>
                  </div>
                )}

                {/* Senha Atual */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Senha Atual (temporária) *
                  </label>
                  <div className="relative">
                    <Input
                      type={mostrarSenhas.atual ? 'text' : 'password'}
                      value={formData.senhaAtual}
                      onChange={(e) => setFormData(prev => ({ ...prev, senhaAtual: e.target.value }))}
                      placeholder="Digite sua senha temporária"
                      error={errors.senhaAtual}
                      className="pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenhas(prev => ({ ...prev, atual: !prev.atual }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {mostrarSenhas.atual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Nova Senha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nova Senha *
                  </label>
                  <div className="relative">
                    <Input
                      type={mostrarSenhas.nova ? 'text' : 'password'}
                      value={formData.novaSenha}
                      onChange={(e) => setFormData(prev => ({ ...prev, novaSenha: e.target.value }))}
                      placeholder="Digite sua nova senha"
                      error={errors.novaSenha}
                      className="pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenhas(prev => ({ ...prev, nova: !prev.nova }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {mostrarSenhas.nova ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirmar Senha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirmar Nova Senha *
                  </label>
                  <div className="relative">
                    <Input
                      type={mostrarSenhas.confirmar ? 'text' : 'password'}
                      value={formData.confirmarSenha}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmarSenha: e.target.value }))}
                      placeholder="Confirme sua nova senha"
                      error={errors.confirmarSenha}
                      className="pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenhas(prev => ({ ...prev, confirmar: !prev.confirmar }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {mostrarSenhas.confirmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Indicador de Força da Senha */}
                {formData.novaSenha && (
                  <div className="bg-gray-50 dark:bg-secondary-graphite-card rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Força da senha:
                    </p>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            formData.novaSenha.length < 6 ? 'w-1/3 bg-red-500' :
                            formData.novaSenha.length < 8 ? 'w-2/3 bg-yellow-500' :
                            'w-full bg-green-500'
                          }`}
                        />
                      </div>
                      <span className={`text-sm font-medium ${
                        formData.novaSenha.length < 6 ? 'text-red-600' :
                        formData.novaSenha.length < 8 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {formData.novaSenha.length < 6 ? 'Fraca' :
                         formData.novaSenha.length < 8 ? 'Média' :
                         'Forte'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Botões */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={alterandoSenha}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3"
                  >
                    {alterandoSenha ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="mr-2"
                        >
                          <RefreshCw className="h-5 w-5" />
                        </motion.div>
                        Alterando Senha...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Confirmar Alteração
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('boas-vindas')}
                    disabled={alterandoSenha}
                    className="border-gray-300 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Voltar
                  </Button>
                </div>
              </form>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  )
}