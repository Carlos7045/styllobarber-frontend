'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import { History, Clock, User, Phone, Calendar, Image, RefreshCw } from 'lucide-react'

interface ProfileChange {
  id: string
  field: string
  oldValue: string | null
  newValue: string | null
  timestamp: Date
  action: 'create' | 'update' | 'delete'
}

export function ProfileHistory() {
  const { profile } = useAuth()
  const [changes, setChanges] = useState<ProfileChange[]>([])
  const [loading, setLoading] = useState(false)

  // Simular histórico de alterações (em produção viria do banco)
  const generateMockHistory = (): ProfileChange[] => {
    if (!profile) return []

    const mockChanges: ProfileChange[] = [
      {
        id: '1',
        field: 'nome',
        oldValue: null,
        newValue: profile.nome,
        timestamp: new Date(profile.created_at),
        action: 'create'
      }
    ]

    // Adicionar mudanças simuladas se houver dados
    if (profile.telefone) {
      mockChanges.push({
        id: '2',
        field: 'telefone',
        oldValue: null,
        newValue: profile.telefone,
        timestamp: new Date(Date.now() - 86400000), // 1 dia atrás
        action: 'update'
      })
    }

    if (profile.data_nascimento) {
      mockChanges.push({
        id: '3',
        field: 'data_nascimento',
        oldValue: null,
        newValue: profile.data_nascimento,
        timestamp: new Date(Date.now() - 3600000), // 1 hora atrás
        action: 'update'
      })
    }

    if (profile.avatar_url) {
      mockChanges.push({
        id: '4',
        field: 'avatar_url',
        oldValue: null,
        newValue: 'Foto de perfil adicionada',
        timestamp: new Date(Date.now() - 1800000), // 30 min atrás
        action: 'update'
      })
    }

    return mockChanges.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // Carregar histórico
  const loadHistory = async () => {
    setLoading(true)
    try {
      // Simular delay de carregamento
      await new Promise(resolve => setTimeout(resolve, 500))
      const mockHistory = generateMockHistory()
      setChanges(mockHistory)
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    } finally {
      setLoading(false)
    }
  }

  // Carregar histórico ao montar o componente
  useEffect(() => {
    if (profile) {
      loadHistory()
    }
  }, [profile])

  // Obter ícone para o campo
  const getFieldIcon = (field: string) => {
    switch (field) {
      case 'nome':
        return <User className="h-4 w-4" />
      case 'telefone':
        return <Phone className="h-4 w-4" />
      case 'data_nascimento':
        return <Calendar className="h-4 w-4" />
      case 'avatar_url':
        return <Image className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  // Obter nome amigável do campo
  const getFieldName = (field: string) => {
    switch (field) {
      case 'nome':
        return 'Nome'
      case 'telefone':
        return 'Telefone'
      case 'data_nascimento':
        return 'Data de Nascimento'
      case 'avatar_url':
        return 'Foto de Perfil'
      default:
        return field
    }
  }

  // Obter cor da ação
  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'text-green-600 bg-green-100'
      case 'update':
        return 'text-blue-600 bg-blue-100'
      case 'delete':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-secondary-graphite-card'
    }
  }

  // Formatar valor
  const formatValue = (field: string, value: string | null) => {
    if (!value) return 'Não definido'
    
    if (field === 'data_nascimento') {
      return new Date(value).toLocaleDateString('pt-BR')
    }
    
    if (field === 'avatar_url') {
      return 'Foto de perfil'
    }
    
    return value
  }

  if (!profile) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Alterações
          </CardTitle>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadHistory}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-gold mr-2"></div>
            <span>Carregando histórico...</span>
          </div>
        ) : changes.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma alteração encontrada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {changes.map((change) => (
              <div key={change.id} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-background-dark-card rounded-lg hover:dark:bg-secondary-graphite-hover transition-colors">
                {/* Ícone do campo */}
                <div className={`p-2 rounded-full ${getActionColor(change.action)}`}>
                  {getFieldIcon(change.field)}
                </div>
                
                {/* Conteúdo da alteração */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{getFieldName(change.field)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(change.action)}`}>
                      {change.action === 'create' ? 'Criado' : 
                       change.action === 'update' ? 'Atualizado' : 'Removido'}
                    </span>
                  </div>
                  
                  {/* Valores */}
                  <div className="text-sm text-text-muted">
                    {change.action === 'create' ? (
                      <span>Valor inicial: <strong>{formatValue(change.field, change.newValue)}</strong></span>
                    ) : change.action === 'update' ? (
                      <span>
                        De: <strong>{formatValue(change.field, change.oldValue)}</strong>
                        {' → '}
                        Para: <strong>{formatValue(change.field, change.newValue)}</strong>
                      </span>
                    ) : (
                      <span>Valor removido: <strong>{formatValue(change.field, change.oldValue)}</strong></span>
                    )}
                  </div>
                  
                  {/* Timestamp */}
                  <div className="flex items-center gap-1 mt-2 text-xs text-text-muted">
                    <Clock className="h-3 w-3" />
                    {change.timestamp.toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Nota sobre o histórico */}
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Nota:</strong> Este histórico mostra as alterações mais recentes do seu perfil. 
            Em produção, todas as mudanças seriam registradas automaticamente.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}