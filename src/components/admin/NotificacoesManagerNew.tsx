'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Button } from '@/components/ui'
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Smartphone, 
  Settings, 
  Plus, 
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  FileText,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'

type TabType = 'templates' | 'logs' | 'agendadas' | 'configuracoes' | 'estatisticas'

interface NotificacoesManagerProps {
  className?: string
}

export function NotificacoesManagerNew({ className }: NotificacoesManagerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('templates')
  const [searchTerm, setSearchTerm] = useState('')
  const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState(false)

  const handleEditTemplate = () => {
    setIsTemplateEditorOpen(true)
  }

  const handleCloseEditor = () => {
    setIsTemplateEditorOpen(false)
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'templates':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Buscar templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-gold focus:border-transparent dark:bg-secondary-graphite-light dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              <Button onClick={handleEditTemplate} className="bg-primary-gold hover:bg-primary-gold-dark">
                <Plus className="h-4 w-4 mr-2" />
                Novo Template
              </Button>
            </div>

            {/* Lista de templates */}
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                  Nenhum template encontrado
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Comece criando seu primeiro template de notificação.
                </p>
                <Button onClick={handleEditTemplate} className="bg-primary-gold hover:bg-primary-gold-dark">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Template
                </Button>
              </CardContent>
            </Card>
          </div>
        )

      case 'logs':
        return (
          <Card>
            <CardContent className="p-12 text-center">
              <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Logs de Notificações
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Visualize o histórico de envios e falhas das notificações
              </p>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                <Clock className="h-4 w-4 mr-1" />
                Em desenvolvimento
              </div>
            </CardContent>
          </Card>
        )

      case 'agendadas':
        return (
          <Card>
            <CardContent className="p-12 text-center">
              <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Notificações Agendadas
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Gerencie notificações programadas para envio futuro
              </p>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                <Clock className="h-4 w-4 mr-1" />
                Em desenvolvimento
              </div>
            </CardContent>
          </Card>
        )

      case 'configuracoes':
        return (
          <Card>
            <CardContent className="p-12 text-center">
              <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Configurações
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Configure canais de envio, retry e outras opções
              </p>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                <Clock className="h-4 w-4 mr-1" />
                Em desenvolvimento
              </div>
            </CardContent>
          </Card>
        )

      case 'estatisticas':
        return (
          <Card>
            <CardContent className="p-12 text-center">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Estatísticas
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Analise o desempenho das suas notificações
              </p>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                <Clock className="h-4 w-4 mr-1" />
                Em desenvolvimento
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Tabs */}
      <div className="flex space-x-1 rounded-lg bg-gray-100 p-1 dark:bg-secondary-graphite-light">
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
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-secondary-graphite dark:text-white'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <Icon className="mr-2 inline h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Conteúdo da aba */}
      <div className="min-h-[400px]">
        {renderTabContent()}
      </div>

      {/* Modal do editor de template */}
      {isTemplateEditorOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-secondary-graphite rounded-lg shadow-xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Novo Template
              </h2>
              <Button 
                variant="outline"
                onClick={handleCloseEditor}
                className="p-2"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Nome do Template
                </label>
                <input 
                  type="text"
                  placeholder="Ex: Confirmação de Agendamento"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-gold focus:border-transparent dark:bg-secondary-graphite-light dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Tipo
                </label>
                <select className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-gold focus:border-transparent dark:bg-secondary-graphite-light dark:border-gray-600 dark:text-white">
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="push">Push</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Conteúdo
                </label>
                <textarea 
                  className="w-full p-2 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-primary-gold focus:border-transparent dark:bg-secondary-graphite-light dark:border-gray-600 dark:text-white" 
                  placeholder="Digite o conteúdo da notificação..."
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline"
                  onClick={handleCloseEditor}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={() => {
                    console.log('Salvando template...')
                    handleCloseEditor()
                  }}
                  className="bg-primary-gold hover:bg-primary-gold-dark"
                >
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificacoesManagerNew