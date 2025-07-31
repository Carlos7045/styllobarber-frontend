'use client'

import { useState } from 'react'
import {
  Settings,
  Plus,
  Search,
  Clock,
  BarChart3,
  FileText,
  Eye,
  Edit,
  Trash2,
  Mail,
  MessageSquare,
  Smartphone,
  Send
} from 'lucide-react'
import { Button, Card, CardContent, Modal } from '@/components/ui'

interface NotificacoesManagerProps {
  className?: string
}

type TabType = 'templates' | 'logs' | 'agendadas' | 'configuracoes' | 'estatisticas'

interface Template {
  id: string
  nome: string
  tipo: 'email' | 'sms' | 'push' | 'whatsapp'
  evento: string
  assunto?: string
  conteudo: string
  ativo: boolean
  criadoEm: string
}

export function NotificacoesManager({ className }: NotificacoesManagerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('templates')
  const [searchTerm, setSearchTerm] = useState('')
  const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: '1',
      nome: 'Confirmação de Agendamento',
      tipo: 'email',
      evento: 'agendamento_confirmado',
      assunto: 'Agendamento Confirmado - StylloBarber',
      conteudo: 'Olá {nome}, seu agendamento foi confirmado para {data} às {hora}.',
      ativo: true,
      criadoEm: '2024-01-15'
    },
    {
      id: '2',
      nome: 'Lembrete de Agendamento',
      tipo: 'sms',
      evento: 'lembrete_agendamento',
      conteudo: 'Lembrete: Você tem um agendamento hoje às {hora} na StylloBarber.',
      ativo: true,
      criadoEm: '2024-01-10'
    }
  ])

  const handleNewTemplate = () => {
    setEditingTemplate(null)
    setIsTemplateEditorOpen(true)
  }

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template)
    setIsTemplateEditorOpen(true)
  }

  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id))
  }

  const handleCloseEditor = () => {
    setIsTemplateEditorOpen(false)
    setEditingTemplate(null)
  }

  const getTypeIcon = (tipo: Template['tipo']) => {
    switch (tipo) {
      case 'email': return <Mail className="h-4 w-4" />
      case 'sms': return <MessageSquare className="h-4 w-4" />
      case 'push': return <Smartphone className="h-4 w-4" />
      case 'whatsapp': return <Send className="h-4 w-4" />
      default: return <Mail className="h-4 w-4" />
    }
  }

  const getTypeColor = (tipo: Template['tipo']) => {
    switch (tipo) {
      case 'email': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
      case 'sms': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
      case 'push': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400'
      case 'whatsapp': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400'
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
    }
  }

  const filteredTemplates = templates.filter(template =>
    template.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'templates':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Buscar templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-secondary-graphite-card/30 rounded-lg focus:ring-2 focus:ring-primary-gold focus:border-transparent bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                </div>
              </div>
              <Button onClick={handleNewTemplate}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Template
              </Button>
            </div>

            {filteredTemplates.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                    {searchTerm ? 'Nenhum template encontrado' : 'Nenhum template criado'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {searchTerm 
                      ? 'Tente ajustar os termos de busca.' 
                      : 'Comece criando seu primeiro template de notificação.'
                    }
                  </p>
                  {!searchTerm && (
                    <Button onClick={handleNewTemplate}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Template
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredTemplates.map((template) => (
                  <Card key={template.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{template.nome}</h3>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(template.tipo)}`}>
                              {getTypeIcon(template.tipo)}
                              {template.tipo.toUpperCase()}
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              template.ativo 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
                            }`}>
                              {template.ativo ? 'Ativo' : 'Inativo'}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            <strong>Evento:</strong> {template.evento}
                          </p>
                          {template.assunto && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                              <strong>Assunto:</strong> {template.assunto}
                            </p>
                          )}
                          <p className="text-sm text-gray-700 dark:text-gray-200 line-clamp-2">
                            {template.conteudo}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Criado em {new Date(template.criadoEm).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTemplate(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )

      case 'logs':
        return (
          <div className="text-center py-12">
            <Eye className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Logs de Notificações</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Visualize o histórico de envios e falhas das notificações
            </p>
            <p className="text-sm text-primary-gold">Em desenvolvimento</p>
          </div>
        )

      case 'agendadas':
        return (
          <div className="text-center py-12">
            <Clock className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Notificações Agendadas</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Gerencie notificações programadas para envio futuro
            </p>
            <p className="text-sm text-primary-gold">Em desenvolvimento</p>
          </div>
        )

      case 'configuracoes':
        return (
          <div className="text-center py-12">
            <Settings className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Configurações</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Configure canais de envio, retry e outras opções
            </p>
            <p className="text-sm text-primary-gold">Em desenvolvimento</p>
          </div>
        )

      case 'estatisticas':
        return (
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Estatísticas</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Analise o desempenho das suas notificações
            </p>
            <p className="text-sm text-primary-gold">Em desenvolvimento</p>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>

      {/* Tabs */}
      <div className="border-b border-secondary-graphite-card/30 dark:border-secondary-graphite-card/30">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'templates', label: 'Templates', icon: FileText },
            { id: 'logs', label: 'Logs', icon: Eye },
            { id: 'agendadas', label: 'Agendadas', icon: Clock },
            { id: 'configuracoes', label: 'Configurações', icon: Settings },
            { id: 'estatisticas', label: 'Estatísticas', icon: BarChart3 }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                    ? "border-primary-gold text-primary-gold"
                    : "border-transparent text-gray-400 dark:text-gray-400 hover:text-white dark:hover:text-white hover:border-primary-gold/50"
                  }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Conteúdo da aba */}
      <div className="min-h-[400px]">
        {renderTabContent()}
      </div>

      {/* Modal do editor de template */}
      <Modal
        isOpen={isTemplateEditorOpen}
        onClose={handleCloseEditor}
        title={editingTemplate ? 'Editar Template' : 'Novo Template'}
        size="2xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Nome do Template</label>
            <input
              type="text"
              placeholder="Ex: Confirmação de Agendamento"
              defaultValue={editingTemplate?.nome || ''}
              className="w-full p-3 border border-gray-300 dark:border-secondary-graphite-card/30 rounded-lg focus:ring-2 focus:ring-primary-gold focus:border-transparent bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Tipo</label>
            <select 
              className="w-full p-2 border border-gray-300 dark:border-secondary-graphite-card/30 rounded-lg focus:ring-2 focus:ring-primary-gold focus:border-transparent bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white"
              defaultValue={editingTemplate?.tipo || 'email'}
            >
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="push">Push Notification</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Evento</label>
            <input
              type="text"
              placeholder="Ex: agendamento_confirmado"
              defaultValue={editingTemplate?.evento || ''}
              className="w-full p-3 border border-gray-300 dark:border-secondary-graphite-card/30 rounded-lg focus:ring-2 focus:ring-primary-gold focus:border-transparent bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Assunto (apenas para email)</label>
            <input
              type="text"
              placeholder="Ex: Agendamento Confirmado - StylloBarber"
              defaultValue={editingTemplate?.assunto || ''}
              className="w-full p-3 border border-gray-300 dark:border-secondary-graphite-card/30 rounded-lg focus:ring-2 focus:ring-primary-gold focus:border-transparent bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Conteúdo</label>
            <textarea
              className="w-full h-32 p-3 border border-gray-300 dark:border-secondary-graphite-card/30 rounded-lg focus:ring-2 focus:ring-primary-gold focus:border-transparent bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 resize-none"
              placeholder="Digite o conteúdo da notificação... Use {nome}, {data}, {hora} para variáveis."
              defaultValue={editingTemplate?.conteudo || ''}
            />
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-secondary-graphite-card/30 p-3 rounded-lg">
            <p className="font-medium mb-2 text-gray-900 dark:text-white">Variáveis disponíveis:</p>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <p><code className="bg-gray-200 dark:bg-secondary-graphite-light px-1 rounded">{'{nome}'}</code> - Nome do cliente</p>
              <p><code className="bg-gray-200 dark:bg-secondary-graphite-light px-1 rounded">{'{data}'}</code> - Data do agendamento</p>
              <p><code className="bg-gray-200 dark:bg-secondary-graphite-light px-1 rounded">{'{hora}'}</code> - Hora do agendamento</p>
              <p><code className="bg-gray-200 dark:bg-secondary-graphite-light px-1 rounded">{'{servico}'}</code> - Nome do serviço</p>
              <p><code className="bg-gray-200 dark:bg-secondary-graphite-light px-1 rounded">{'{barbeiro}'}</code> - Nome do barbeiro</p>
              <p><code className="bg-gray-200 dark:bg-secondary-graphite-light px-1 rounded">{'{valor}'}</code> - Valor do serviço</p>
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleCloseEditor}>
              Cancelar
            </Button>
            <Button onClick={() => {
              console.log('Salvando template...')
              handleCloseEditor()
            }}>
              {editingTemplate ? 'Atualizar' : 'Salvar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default NotificacoesManager