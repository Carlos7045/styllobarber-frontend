/**
 * Hook para gerenciar configurações do usuário
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './use-auth'
import { supabase } from '@/lib/api/supabase'
import type {
  UserSettings,
  NotificationSettings,
  PrivacySettings,
  AppearanceSettings,
  SecuritySettings,
  ChangePasswordData,
} from '@/types/settings'
import { DEFAULT_SETTINGS } from '@/types/settings'

interface UseSettingsReturn {
  settings: UserSettings | null
  loading: boolean
  error: string | null

  // Funções de atualização
  updateNotificationSettings: (notifications: NotificationSettings) => Promise<boolean>
  updatePrivacySettings: (privacy: PrivacySettings) => Promise<boolean>
  updateAppearanceSettings: (appearance: AppearanceSettings) => Promise<boolean>
  updateSecuritySettings: (security: SecuritySettings) => Promise<boolean>

  // Função para alterar senha
  changePassword: (data: ChangePasswordData) => Promise<boolean>

  // Função para recarregar configurações
  refreshSettings: () => Promise<void>
}

export function useSettings(): UseSettingsReturn {
  const { user, profile } = useAuth()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carregar configurações do usuário
  const loadSettings = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Buscar configurações no banco
      const { data, error: dbError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (dbError && dbError.code !== 'PGRST116') {
        throw dbError
      }

      if (data) {
        // Converter dados do banco para o formato esperado
        const settingsData: UserSettings = {
          id: data.id,
          userId: data.user_id,
          notifications: data.notifications,
          privacy: data.privacy,
          appearance: data.appearance,
          security: data.security,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        }
        setSettings(settingsData)
      } else {
        // Criar configurações padrão se não existirem
        const defaultSettings = {
          user_id: user.id,
          notifications: DEFAULT_SETTINGS.notifications,
          privacy: DEFAULT_SETTINGS.privacy,
          appearance: DEFAULT_SETTINGS.appearance,
          security: DEFAULT_SETTINGS.security,
        }

        const { data: newSettings, error: createError } = await supabase
          .from('user_settings')
          .insert(defaultSettings)
          .select()
          .single()

        if (createError) throw createError

        const settingsData: UserSettings = {
          id: newSettings.id,
          userId: newSettings.user_id,
          notifications: newSettings.notifications,
          privacy: newSettings.privacy,
          appearance: newSettings.appearance,
          security: newSettings.security,
          createdAt: newSettings.created_at,
          updatedAt: newSettings.updated_at,
        }
        setSettings(settingsData)
      }
    } catch (err) {
      console.error('Erro ao carregar configurações:', err)
      setError('Erro ao carregar configurações')

      // Usar configurações padrão como fallback
      if (user?.id) {
        setSettings({
          id: 'temp',
          userId: user.id,
          ...DEFAULT_SETTINGS,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Função genérica para atualizar configurações
  const updateSettings = async (updates: Partial<UserSettings>): Promise<boolean> => {
    if (!user?.id || !settings) return false

    try {
      // Converter para formato do banco
      const dbUpdates: any = {}
      if (updates.notifications) dbUpdates.notifications = updates.notifications
      if (updates.privacy) dbUpdates.privacy = updates.privacy
      if (updates.appearance) dbUpdates.appearance = updates.appearance
      if (updates.security) dbUpdates.security = updates.security

      const { data, error } = await supabase
        .from('user_settings')
        .update(dbUpdates)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      // Converter resposta do banco para formato esperado
      const updatedSettings: UserSettings = {
        id: data.id,
        userId: data.user_id,
        notifications: data.notifications,
        privacy: data.privacy,
        appearance: data.appearance,
        security: data.security,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }

      setSettings(updatedSettings)
      return true
    } catch (err) {
      console.error('Erro ao atualizar configurações:', err)
      setError('Erro ao salvar configurações')
      return false
    }
  }

  // Atualizar configurações de notificação
  const updateNotificationSettings = async (
    notifications: NotificationSettings
  ): Promise<boolean> => {
    return updateSettings({ notifications })
  }

  // Atualizar configurações de privacidade
  const updatePrivacySettings = async (privacy: PrivacySettings): Promise<boolean> => {
    return updateSettings({ privacy })
  }

  // Atualizar configurações de aparência
  const updateAppearanceSettings = async (appearance: AppearanceSettings): Promise<boolean> => {
    const success = await updateSettings({ appearance })

    if (success) {
      // Aplicar todas as configurações de aparência imediatamente
      applyAppearanceSettings(appearance)
    }

    return success
  }

  // Função para aplicar configurações de aparência
  const applyAppearanceSettings = (appearance: AppearanceSettings) => {
    const root = document.documentElement

    // Aplicar tema
    if (appearance.theme === 'dark') {
      root.classList.add('dark')
    } else if (appearance.theme === 'light') {
      root.classList.remove('dark')
    } else {
      // Sistema - detectar preferência do usuário
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }

    // Aplicar densidade
    root.classList.remove('density-compact', 'density-comfortable', 'density-spacious')
    root.classList.add(`density-${appearance.density}`)

    // Aplicar tamanho da fonte
    root.classList.remove('font-small', 'font-medium', 'font-large')
    root.classList.add(`font-${appearance.fontSize}`)

    // Aplicar animações
    if (appearance.animations) {
      root.classList.remove('no-animations')
    } else {
      root.classList.add('no-animations')
    }

    // Aplicar idioma (para direção de texto futuro)
    root.setAttribute('lang', appearance.language === 'en-US' ? 'en' : 'pt-BR')
  }

  // Atualizar configurações de segurança
  const updateSecuritySettings = async (security: SecuritySettings): Promise<boolean> => {
    return updateSettings({ security })
  }

  // Alterar senha
  const changePassword = async (data: ChangePasswordData): Promise<boolean> => {
    if (!user) return false

    try {
      // Validar senhas
      if (data.newPassword !== data.confirmPassword) {
        setError('As senhas não coincidem')
        return false
      }

      if (data.newPassword.length < 6) {
        setError('A nova senha deve ter pelo menos 6 caracteres')
        return false
      }

      // Atualizar senha no Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      })

      if (error) throw error

      // Atualizar data da última alteração de senha
      if (settings) {
        await updateSecuritySettings({
          ...settings.security,
          passwordLastChanged: new Date().toISOString(),
        })
      }

      return true
    } catch (err) {
      console.error('Erro ao alterar senha:', err)
      setError('Erro ao alterar senha')
      return false
    }
  }

  // Recarregar configurações
  const refreshSettings = async (): Promise<void> => {
    await loadSettings()
  }

  // Carregar configurações quando o usuário mudar
  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // Aplicar configurações de aparência na inicialização
  useEffect(() => {
    if (settings?.appearance) {
      applyAppearanceSettings(settings.appearance)
    }
  }, [settings?.appearance])

  return {
    settings,
    loading,
    error,
    updateNotificationSettings,
    updatePrivacySettings,
    updateAppearanceSettings,
    updateSecuritySettings,
    changePassword,
    refreshSettings,
  }
}
