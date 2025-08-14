'use client'

import { useState, useEffect } from 'react'
import { X, Save, Eye, Mail, MessageSquare, Bell, Smartphone, Plus, Trash2, Code } from 'lucide-react'

import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'
import { cn } from '@/shared/utils'

import type { 
  NotificationTemplate, 
  CreateNotificationTemplateData,
  TipoNotificacao,
  EventoNotificacao
} from '@/types/notifications'
import { EVENTOS_NOTIFICACAO, VARIAVEIS_POR_EVENTO } from '@/types/notifications'

interface TemplateEditorProps {
  template?: NotificationTemplate | null
  onSave: (data: CreateNotificationTemplateData) => Promise<void>
  onClose: () => void
}

export function TemplateEditor({ template, onSave, onClose }: TemplateEditorProps) {
  // Estados do formulário
  const [formData, setFormData] = useState<CreateNotificationTemplateData>({
    nome: '',
    tipo: 'email',
    evento: '',
    assunto: '',
    conteudo: '',
    variaveis_disponiveis: [],
    ativo: true
  })

  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [customVariable, setCustomVariable] = useState('')

  // Preencher formulário se editando
  useEffect(() => {
    if (template) {
      setFormData({
        nome: template.nome,
        tipo: template.tipo,
        evento: template.evento,
        assunto: template.assunto || '',
        conteudo: template.conteudo,
        variaveis_disponiveis: template.variaveis_disponiveis,
        ativo: template.ativo
      })
    }
  }, [template])

  // Atualizar variáveis quando evento muda
  useEffect(() => {
    if (formData.evento && VARIAVEIS_POR_EVENTO[formData.evento as EventoNotificacao]) {
      const variaveisEvento = VARIAVEIS_POR_EVENTO[formData.evento as EventoNotificacao]
      setFormData(prev => ({
        ...prev,
        variaveis_disponiveis: [...new Set([...variaveisEvento, ...prev.variaveis_disponiveis])]
      }))
    }
  }, [formData.evento])

  // Obter ícone do tipo
  const getTipoIcon = (tipo: TipoNotificacao) => {
    switch (tipo) {
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'sms':
        return <MessageSquare className="h-4 w-4" />
      case 'push':
        return <Bell className="h-4 w-4" />
      case 'whatsapp':
        return <Smartphone className="h-4 w-4" />
    }
  }

  // Inserir variável no conteúdo
  const insertVariable = (variavel: string) => {
    const textarea = document.getElementById('conteudo') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = textarea.value
      const before = text.substring(0, start)
      const after = text.substring(end, text.length)
      const newText = before + `{{${variavel}}}` + after
      
      setFormData(prev => ({ ...prev, conteudo: newText }))
      
      // Reposicionar cursor
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + variavel.length + 4, start + variavel.length + 4)
      }, 0)
    }
  }

  // Adicionar variável customizada
  const addCustomVariable = () => {
    if (customVariable.trim() && !formData.variaveis_disponiveis.includes(customVariable.trim())) {
      setFormData(prev => ({
        ...prev,
        variaveis_disponiveis: [...prev.variaveis_disponiveis, customVariable.trim()]
      }))
      setCustomVariable('')
    }
  }

  // Remover variável
  const removeVariable = (variavel: string) => {
    setFormData(prev => ({
      ...prev,
      variaveis_disponiveis: prev.variaveis_disponiveis.filter(v => v !== variavel)
    }))
  }

  // Processar template para preview
  const processTemplateForPreview = (content: string) => {
    let processed = content
    formData.variaveis_disponiveis.forEach(variavel => {
      const regex = new RegExp(`{{${variavel}}}`, 'g')
      processed = processed.replace(regex, `[${variavel.toUpperCase()}]`)
    })
    return processed
  }

  // Salvar template
  const handleSave = async () => {
    try {
      setSaving(true)
      await onSave(formData)
    } catch (error) {
      console.error('Erro ao salvar template:', error)
    } finally {
      setSaving(false)
    }
  }

  // Validar formulário
  const isValid = formData.nome.trim() && formData.evento.trim() && formData.conteudo.trim()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-secondary-graphite-light rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {template ? 'Editar Template' : 'Novo Template'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure o template de notificação
            </p>
          </div>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Formulário */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Informações básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome do Template *
                  </label>
                  <Input
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Ex: Confirmação de Agendamento"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['email', 'sms', 'push', 'whatsapp'] as TipoNotificacao[]).map((tipo) => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, tipo }))}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-lg border transition-colors",
                          formData.tipo === tipo
                            ? "border-primary-gold bg-primary-gold/10 text-primary-gold"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        )}
                      >
                        {getTipoIcon(tipo)}
                        <span className="capitalize">{tipo}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Evento *
                </label>
                <select
                  value={formData.evento}
                  onChange={(e) => setFormData(prev => ({ ...prev, evento: e.target.value }))}
                  className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white"
                >
                  <option value="">Selecione um evento</option>
                  {Object.entries(EVENTOS_NOTIFICACAO).map(([key, value]) => (
                    <option key={value} value={value}>
                      {key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assunto (apenas para email) */}
              {formData.tipo === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assunto
                  </label>
                  <Input
                    value={formData.assunto}
                    onChange={(e) => setFormData(prev => ({ ...prev, assunto: e.target.value }))}
                    placeholder="Ex: Agendamento Confirmado - {{nome_barbearia}}"
                  />
                </div>
              )}

              {/* Conteúdo */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Conteúdo *
                  </label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsPreviewMode(!isPreviewMode)}
                    >
                      {isPreviewMode ? <Code className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {isPreviewMode ? 'Editar' : 'Preview'}
                    </Button>
                  </div>
                </div>

                {isPreviewMode ? (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-secondary-graphite min-h-[200px]">
                    <div className="whitespace-pre-wrap text-sm">
                      {processTemplateForPreview(formData.conteudo) || 'Conteúdo vazio...'}
                    </div>
                  </div>
                ) : (
                  <textarea
                    id="conteudo"
                    value={formData.conteudo}
                    onChange={(e) => setFormData(prev => ({ ...prev, conteudo: e.target.value }))}
                    placeholder="Digite o conteúdo da notificação..."
                    className="w-full h-48 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white resize-none"
                  />
                )}
              </div>

              {/* Status */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formData.ativo}
                  onChange={(e) => setFormData(prev => ({ ...prev, ativo: e.target.checked }))}
                  className="rounded border-gray-300 text-primary-gold focus:ring-primary-gold"
                />
                <label htmlFor="ativo" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Template ativo
                </label>
              </div>
            </div>
          </div>

          {/* Sidebar - Variáveis */}
          <div className="w-80 border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Variáveis Disponíveis
            </h3>

            {/* Adicionar variável customizada */}
            <div className="mb-4">
              <div className="flex gap-2">
                <Input
                  value={customVariable}
                  onChange={(e) => setCustomVariable(e.target.value)}
                  placeholder="Nova variável"
                  onKeyPress={(e) => e.key === 'Enter' && addCustomVariable()}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomVariable}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Lista de variáveis */}
            <div className="space-y-2">
              {formData.variaveis_disponiveis.map((variavel) => (
                <div
                  key={variavel}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-secondary-graphite rounded-lg"
                >
                  <button
                    type="button"
                    onClick={() => insertVariable(variavel)}
                    className="flex-1 text-left text-sm font-mono text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    {`{{${variavel}}}`}
                  </button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeVariable(variavel)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              {formData.variaveis_disponiveis.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Nenhuma variável disponível
                </p>
              )}
            </div>

            {/* Dica */}
            <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-400">
                <strong>Dica:</strong> Clique em uma variável para inseri-la no conteúdo na posição do cursor.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!isValid || saving}
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Salvando...' : 'Salvar Template'}
          </Button>
        </div>
      </div>
    </div>
  )
}
