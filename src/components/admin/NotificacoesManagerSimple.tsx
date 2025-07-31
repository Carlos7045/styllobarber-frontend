'use client'

import React, { useState } from 'react'
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

interface NotificacoesManagerSimpleProps {
  className?: string
}

type TabType = 'templates' | 'logs' | 'agendadas' | 'configuracoes' | 'estatisticas'

export function NotificacoesManagerSimple({ className }: NotificacoesManagerSimpleProps) {
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <button 
                onClick={handleEditTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Novo Template
              </button>
            </div>

            {/* Lista de templates */}
            <div className="p-8 text-cen">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum template enco/h3>
              <p className="text-gray-600 mb-4">
                Comece criando seu primeiro templao.
              </p>
              <button 
                onClick=
                className="flex items-center g-auto"
              >
                <>
                Criar Template
              </button>
            </div>
          </div>
        )

      cas
 (
          <div cla
            <Eye" />
            <h3 className="text-xl font-semib3>
            <p className="text-gray-600 mb-4">
              Visualize o histórico de envios e falhas das notificações
            </p>
            <p className="text-sm text-yellow-600">Em desenvolvimento</p>
          </div>
        )

      cass':

          <div classNam>
            <Clo
            <h3 className="text-xl font-semibadas</h3>
            <p className="text-gray-600 mb-4">
              Gerencie notificações programadas para envio futuro
            </p>
            <p className="text-sm text-yellow-600">Em desenvolvim
          </div>
        )

      cas:

          <div className="t
            <Set4" />
            <h3 className="text-xl font-semib
            <p className="text-gray-600 mb-4">
              Configure canais de envio, retry e outras opções
            </p>
            <p className="text-sm text-yellow-600">Em desenvolto</p>
          </div>
        )

      cassticas':
(
          <div className="y-12">
            <Bar />
            <h3 className="text-xl font-semib
            <p className="text-gray-600 mb-4">
              Analise o desempenho das suas notificações
            </p>
            <p className="text-sm text-yellow-600">Em de/p>
          </div>
        )

      def
ll
    }
  }

  rn (

      {/*  */}
      <div className="flex items-center justify-betw
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Sções
          </h1>
          <p className="text-gray-6">
            Ger
          </p>
        </div>
      </div>

      {/* Es}

        <div className="bg-white r-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Enviadas</
              <p 
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div c">
">
            <div>
              <p className="text-sm text-gray-600">Falharam</>
              <p >
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div cow p-4">
en">
            <div>
              <p className="text-sm text-gray-600">Taxa de Suso</p>
              <p ">0%</p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div cp-4">
>
            <div>
              <p className="text-sm text-gray-600">Templates</p>
              <p 
            </div>
            <FileText className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Ta*/}
00">
        <nav class">
          {[
            { id: 'templates', label: 'Templateext },
            e },
            { id: 'agendadas', label: 'Agendadas', icon: Clock },
            { id: 'configuracoes', label: 'Configuraçngs },
            { id: 'estatisticas', label: 'Estatísticas', icon: Ba
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key=
                onCli}
                className={`
                  activeTab === tab.id
                    ? "border-yellow-500 text-yellow-600"
                    : "border-transpar"
                }`}
              >
                <Ic
               bel}
              </button>
            )
          })}
        </nav
      </div>

      {/* Co}

        {renderTabContent()}
      </div>

      {/* Mo */}
en && (
        <div className="fixed inset-0 bg-4">
          <div className="bg-whi6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Novo Template
              </h2>
              <button 
                onClick={handleCloseEditor}
                className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome do Template</label>
                <input 
                  type="text"
                  placeholder="Ex: Confirmação de Agendamento"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tipo</label>
                <select className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="push">Push</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Conteúdo</label>
                <textarea 
                  className="w-full p-2 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  placeholder="Digite o conteúdo da notificação..."
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button 
                  onClick={handleCloseEditor}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    console.log('Salvando template...')
                    handleCloseEditor()
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificacoesManagerSimple