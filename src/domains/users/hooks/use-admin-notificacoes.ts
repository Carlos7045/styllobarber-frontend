'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/api/supabase'
import { useAuth } from '@/domains/auth/hooks/use-auth'
// import { useToast } from '@/shared/components/ui/toast'
import type {
  NotificationTemplate,
  CreateNotificationTemplateData,
  UpdateNotificationTemplateData,
  NotificationLog,
  ScheduledNotification,
  AdminNotification,
  CreateAdminNotificationData,
  SendNotificationData,
  ScheduleNotificationData,
  NotificationStats,
  NotificationFilters,
  NotificationSetting,
  NotificationSystemConfig,
  ProcessedTemplate,
  TemplateVariables
} from '@/types/notifications'

export function useAdminNotificacoes() {
  const { profile } = useAuth()
  const addToast = (toast: any) => {
    console.log('Toast:', toast.title, toast.description)
  }
  
  // Estados
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [logs, setLogs] = useState<NotificationLog[]>([])
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([])
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([])
  const [settings, setSettings] = useState<NotificationSetting[]>([])
  const [stats, setStats] = useState<NotificationStats | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [logsLoading, setLogsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Verificar se usuário pode gerenciar notificações
  const canManageNotifications = profile?.role === 'admin' || profile?.role === 'saas_owner'

  // Carregar templates
  const loadTemplates = useCallback(async () => {
    if (!canManageNotifications) return

    try {
      setTemplatesLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setTemplates(data || [])
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao carregar templates'
      setError(errorMsg)
      addToast({
        type: 'error',
        title: 'Erro ao carregar templates',
        description: errorMsg
      })
    } finally {
      setTemplatesLoading(false)
    }
  }, [canManageNotifications, addToast])

  // Carregar logs
  const loadLogs = useCallback(async (filters?: NotificationFilters) => {
    if (!canManageNotifications) return

    try {
      setLogsLoading(true)
      setError(null)

      let query = supabase
        .from('notification_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      // Aplicar filtros
      if (filters?.tipo) {
        query = query.eq('tipo', filters.tipo)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.data_inicio) {
        query = query.gte('created_at', filters.data_inicio)
      }
      if (filters?.data_fim) {
        query = query.lte('created_at', filters.data_fim)
      }
      if (filters?.destinatario) {
        query = query.ilike('destinatario', `%${filters.destinatario}%`)
      }
      if (filters?.template_id) {
        query = query.eq('template_id', filters.template_id)
      }

      const { data, error } = await query

      if (error) throw error

      setLogs(data || [])
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao carregar logs'
      setError(errorMsg)
      addToast({
        type: 'error',
        title: 'Erro ao carregar logs',
        description: errorMsg
      })
    } finally {
      setLogsLoading(false)
    }
  }, [canManageNotifications, addToast])

  // Carregar notificações agendadas
  const loadScheduledNotifications = useCallback(async () => {
    if (!canManageNotifications) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('scheduled_notifications')
        .select(`
          *,
          notification_templates(nome, tipo, evento)
        `)
        .order('agendado_para', { ascending: true })

      if (error) throw error

      setScheduledNotifications(data || [])
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao carregar notificações agendadas'
      setError(errorMsg)
      addToast({
        type: 'error',
        title: 'Erro ao carregar notificações agendadas',
        description: errorMsg
      })
    } finally {
      setLoading(false)
    }
  }, [canManageNotifications, addToast])

  // Carregar notificações admin
  const loadAdminNotifications = useCallback(async () => {
    if (!profile?.id) return

    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .eq('destinatario_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setAdminNotifications(data || [])
    } catch (err) {
      console.error('Erro ao carregar notificações admin:', err)
    }
  }, [profile?.id])

  // Carregar configurações
  const loadSettings = useCallback(async () => {
    if (!canManageNotifications) return

    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .order('chave')

      if (error) throw error

      setSettings(data || [])
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao carregar configurações'
      setError(errorMsg)
    }
  }, [canManageNotifications])

  // Carregar estatísticas
  const loadStats = useCallback(async () => {
    if (!canManageNotifications) return

    try {
      // Buscar estatísticas básicas
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_notification_stats')

      if (statsError) {
        console.warn('Função get_notification_stats não encontrada, usando query manual')
        
        // Fallback para query manual
        const { data: logsData, error: logsError } = await supabase
          .from('notification_logs')
          .select('status, tipo, created_at')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

        if (logsError) throw logsError

        const total_enviadas = logsData?.filter(log => log.status === 'enviado').length || 0
        const total_falharam = logsData?.filter(log => log.status === 'falhou').length || 0
        const taxa_sucesso = total_enviadas + total_falharam > 0 
          ? (total_enviadas / (total_enviadas + total_falharam)) * 100 
          : 0

        const por_tipo = logsData?.reduce((acc, log) => {
          acc[log.tipo] = (acc[log.tipo] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}

        const por_status = logsData?.reduce((acc, log) => {
          acc[log.status] = (acc[log.status] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}

        setStats({
          total_enviadas,
          total_falharam,
          taxa_sucesso,
          por_tipo,
          por_status,
          ultimos_7_dias: []
        })
      } else {
        setStats(statsData)
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err)
    }
  }, [canManageNotifications])

  // Criar template
  const createTemplate = useCallback(async (data: CreateNotificationTemplateData) => {
    if (!canManageNotifications) {
      throw new Error('Sem permissão para criar templates')
    }

    try {
      setLoading(true)
      setError(null)

      const { data: newTemplate, error } = await supabase
        .from('notification_templates')
        .insert({
          ...data,
          created_by: profile?.id
        })
        .select()
        .single()

      if (error) throw error

      setTemplates(prev => [newTemplate, ...prev])
      
      addToast({
        type: 'success',
        title: 'Template criado',
        description: `Template "${data.nome}" criado com sucesso`
      })

      return newTemplate
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao criar template'
      setError(errorMsg)
      addToast({
        type: 'error',
        title: 'Erro ao criar template',
        description: errorMsg
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [canManageNotifications, profile?.id, addToast])

  // Atualizar template
  const updateTemplate = useCallback(async (id: string, data: UpdateNotificationTemplateData) => {
    if (!canManageNotifications) {
      throw new Error('Sem permissão para atualizar templates')
    }

    try {
      setLoading(true)
      setError(null)

      const { data: updatedTemplate, error } = await supabase
        .from('notification_templates')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setTemplates(prev => prev.map(template => 
        template.id === id ? updatedTemplate : template
      ))

      addToast({
        type: 'success',
        title: 'Template atualizado',
        description: 'Template atualizado com sucesso'
      })

      return updatedTemplate
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao atualizar template'
      setError(errorMsg)
      addToast({
        type: 'error',
        title: 'Erro ao atualizar template',
        description: errorMsg
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [canManageNotifications, addToast])

  // Deletar template
  const deleteTemplate = useCallback(async (id: string) => {
    if (!canManageNotifications) {
      throw new Error('Sem permissão para deletar templates')
    }

    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase
        .from('notification_templates')
        .delete()
        .eq('id', id)

      if (error) throw error

      setTemplates(prev => prev.filter(template => template.id !== id))

      addToast({
        type: 'success',
        title: 'Template deletado',
        description: 'Template deletado com sucesso'
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao deletar template'
      setError(errorMsg)
      addToast({
        type: 'error',
        title: 'Erro ao deletar template',
        description: errorMsg
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [canManageNotifications, addToast])

  // Processar template com variáveis
  const processTemplate = useCallback(async (
    templateId: string, 
    variables: TemplateVariables
  ): Promise<ProcessedTemplate> => {
    const template = templates.find(t => t.id === templateId)
    if (!template) {
      throw new Error('Template não encontrado')
    }

    try {
      const { data, error } = await supabase
        .rpc('process_template_variables', {
          template_content: template.conteudo,
          variables: variables
        })

      if (error) {
        // Fallback para processamento local
        let conteudo = template.conteudo
        let assunto = template.assunto

        const variaveis_utilizadas: string[] = []
        const variaveis_faltantes: string[] = []

        // Processar conteúdo
        template.variaveis_disponiveis.forEach(variavel => {
          const regex = new RegExp(`{{${variavel}}}`, 'g')
          if (conteudo.includes(`{{${variavel}}}`)) {
            if (variables[variavel] !== undefined) {
              conteudo = conteudo.replace(regex, String(variables[variavel]))
              variaveis_utilizadas.push(variavel)
            } else {
              variaveis_faltantes.push(variavel)
            }
          }
        })

        // Processar assunto se existir
        if (assunto) {
          template.variaveis_disponiveis.forEach(variavel => {
            const regex = new RegExp(`{{${variavel}}}`, 'g')
            if (assunto!.includes(`{{${variavel}}}`)) {
              if (variables[variavel] !== undefined) {
                assunto = assunto!.replace(regex, String(variables[variavel]))
                if (!variaveis_utilizadas.includes(variavel)) {
                  variaveis_utilizadas.push(variavel)
                }
              } else if (!variaveis_faltantes.includes(variavel)) {
                variaveis_faltantes.push(variavel)
              }
            }
          })
        }

        return {
          assunto,
          conteudo,
          variaveis_utilizadas,
          variaveis_faltantes
        }
      }

      return {
        assunto: template.assunto,
        conteudo: data,
        variaveis_utilizadas: Object.keys(variables),
        variaveis_faltantes: []
      }
    } catch (err) {
      console.error('Erro ao processar template:', err)
      throw err
    }
  }, [templates])

  // Enviar notificação
  const sendNotification = useCallback(async (data: SendNotificationData) => {
    if (!canManageNotifications) {
      throw new Error('Sem permissão para enviar notificações')
    }

    try {
      setLoading(true)
      setError(null)

      // Processar template
      const processedTemplate = await processTemplate(data.template_id, data.dados_contexto)
      
      // Buscar template para obter tipo
      const template = templates.find(t => t.id === data.template_id)
      if (!template) {
        throw new Error('Template não encontrado')
      }

      // Criar log de notificação
      const { data: logData, error } = await supabase
        .from('notification_logs')
        .insert({
          template_id: data.template_id,
          destinatario: data.destinatario,
          tipo: template.tipo,
          assunto: processedTemplate.assunto,
          conteudo: processedTemplate.conteudo,
          status: 'pendente',
          agendamento_id: data.agendamento_id,
          usuario_id: data.usuario_id
        })
        .select()
        .single()

      if (error) throw error

      // Aqui seria implementada a lógica real de envio
      // Por enquanto, simular sucesso
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Atualizar status para enviado
      await supabase
        .from('notification_logs')
        .update({ 
          status: 'enviado',
          enviado_em: new Date().toISOString(),
          tentativas: 1
        })
        .eq('id', logData.id)

      addToast({
        type: 'success',
        title: 'Notificação enviada',
        description: `Notificação enviada para ${data.destinatario}`
      })

      // Recarregar logs
      loadLogs()

      return logData
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao enviar notificação'
      setError(errorMsg)
      addToast({
        type: 'error',
        title: 'Erro ao enviar notificação',
        description: errorMsg
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [canManageNotifications, templates, processTemplate, addToast, loadLogs])

  // Agendar notificação
  const scheduleNotification = useCallback(async (data: ScheduleNotificationData) => {
    if (!canManageNotifications) {
      throw new Error('Sem permissão para agendar notificações')
    }

    try {
      setLoading(true)
      setError(null)

      const { data: scheduledData, error } = await supabase
        .from('scheduled_notifications')
        .insert({
          template_id: data.template_id,
          destinatario: data.destinatario,
          dados_contexto: data.dados_contexto,
          agendado_para: data.agendado_para.toISOString(),
          created_by: profile?.id
        })
        .select()
        .single()

      if (error) throw error

      setScheduledNotifications(prev => [...prev, scheduledData])

      addToast({
        type: 'success',
        title: 'Notificação agendada',
        description: `Notificação agendada para ${data.agendado_para.toLocaleString()}`
      })

      return scheduledData
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao agendar notificação'
      setError(errorMsg)
      addToast({
        type: 'error',
        title: 'Erro ao agendar notificação',
        description: errorMsg
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [canManageNotifications, profile?.id, addToast])

  // Criar notificação admin
  const createAdminNotification = useCallback(async (data: CreateAdminNotificationData) => {
    if (!canManageNotifications) {
      throw new Error('Sem permissão para criar notificações admin')
    }

    try {
      const { data: notificationData, error } = await supabase
        .from('admin_notifications')
        .insert(data)
        .select()
        .single()

      if (error) throw error

      // Se for para o usuário atual, adicionar à lista
      if (data.destinatario_id === profile?.id) {
        setAdminNotifications(prev => [notificationData, ...prev])
      }

      return notificationData
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao criar notificação admin'
      addToast({
        type: 'error',
        title: 'Erro ao criar notificação',
        description: errorMsg
      })
      throw err
    }
  }, [canManageNotifications, profile?.id, addToast])

  // Marcar notificação admin como lida
  const markAdminNotificationAsRead = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ 
          lida: true,
          lida_em: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      setAdminNotifications(prev => prev.map(notification =>
        notification.id === id 
          ? { ...notification, lida: true, lida_em: new Date().toISOString() }
          : notification
      ))
    } catch (err) {
      console.error('Erro ao marcar notificação como lida:', err)
    }
  }, [])

  // Atualizar configuração
  const updateSetting = useCallback(async (chave: string, valor: any) => {
    if (!canManageNotifications) {
      throw new Error('Sem permissão para atualizar configurações')
    }

    try {
      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          chave,
          valor: JSON.stringify(valor),
          updated_by: profile?.id
        })

      if (error) throw error

      setSettings(prev => {
        const existing = prev.find(s => s.chave === chave)
        if (existing) {
          return prev.map(s => s.chave === chave ? { ...s, valor } : s)
        } else {
          return [...prev, { 
            id: '', 
            chave, 
            valor, 
            updated_by: profile?.id,
            updated_at: new Date().toISOString()
          }]
        }
      })

      addToast({
        type: 'success',
        title: 'Configuração atualizada',
        description: `Configuração "${chave}" atualizada com sucesso`
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao atualizar configuração'
      addToast({
        type: 'error',
        title: 'Erro ao atualizar configuração',
        description: errorMsg
      })
      throw err
    }
  }, [canManageNotifications, profile?.id, addToast])

  // Obter configurações como objeto tipado
  const getSystemConfig = useCallback((): NotificationSystemConfig => {
    const getValue = (chave: string, defaultValue: any) => {
      const setting = settings.find(s => s.chave === chave)
      return setting ? setting.valor : defaultValue
    }

    return {
      email_enabled: getValue('email_enabled', true),
      sms_enabled: getValue('sms_enabled', false),
      push_enabled: getValue('push_enabled', true),
      retry_attempts: getValue('retry_attempts', 3),
      retry_delay_minutes: getValue('retry_delay_minutes', 5),
      lembrete_horas_antes: getValue('lembrete_horas_antes', 24),
      email_from: getValue('email_from', 'StylloBarber <noreply@styllobarber.com>'),
      telefone_barbearia: getValue('telefone_barbearia', '+55 11 99999-9999')
    }
  }, [settings])

  // Carregar dados iniciais
  useEffect(() => {
    if (canManageNotifications) {
      loadTemplates()
      loadSettings()
      loadStats()
      loadScheduledNotifications()
    }
    if (profile?.id) {
      loadAdminNotifications()
    }
  }, [canManageNotifications, profile?.id, loadTemplates, loadSettings, loadStats, loadScheduledNotifications, loadAdminNotifications])

  return {
    // Estados
    templates,
    logs,
    scheduledNotifications,
    adminNotifications,
    settings,
    stats,
    
    // Estados de loading
    loading,
    templatesLoading,
    logsLoading,
    error,
    
    // Permissões
    canManageNotifications,
    
    // Funções de carregamento
    loadTemplates,
    loadLogs,
    loadScheduledNotifications,
    loadAdminNotifications,
    loadSettings,
    loadStats,
    
    // Funções de CRUD
    createTemplate,
    updateTemplate,
    deleteTemplate,
    
    // Funções de processamento e envio
    processTemplate,
    sendNotification,
    scheduleNotification,
    
    // Funções de notificações admin
    createAdminNotification,
    markAdminNotificationAsRead,
    
    // Funções de configuração
    updateSetting,
    getSystemConfig
  }
}
