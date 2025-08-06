'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/domains/auth/hooks/use-auth'

interface ProfileSyncState {
  isInSync: boolean
  lastSync: Date | null
  differences: string[]
  syncing: boolean
  autoSyncEnabled: boolean
}

export function useProfileSync() {
  const { user, profile, refreshProfile, updateProfile } = useAuth()
  const [syncState, setSyncState] = useState<ProfileSyncState>({
    isInSync: true,
    lastSync: null,
    differences: [],
    syncing: false,
    autoSyncEnabled: true
  })

  // Verificar diferenças entre auth e profile
  const checkDifferences = useCallback(() => {
    if (!user || !profile) return []

    const differences: string[] = []

    // Verificar nome
    const authName = user.user_metadata?.nome || ''
    const profileName = profile.nome || ''
    if (authName && authName !== profileName) {
      differences.push('nome')
    }

    // Verificar telefone
    const authPhone = user.user_metadata?.telefone || ''
    const profilePhone = profile.telefone || ''
    if (authPhone && authPhone !== profilePhone) {
      differences.push('telefone')
    }

    // Verificar email
    const authEmail = user.email || ''
    const profileEmail = profile.email || ''
    if (authEmail !== profileEmail) {
      differences.push('email')
    }

    return differences
  }, [user, profile])

  // Verificar status de sincronização
  const checkSyncStatus = useCallback(() => {
    const differences = checkDifferences()
    
    setSyncState(prev => ({
      ...prev,
      isInSync: differences.length === 0,
      differences,
      lastSync: new Date()
    }))

    return differences.length === 0
  }, [checkDifferences])

  // Sincronizar dados do auth para o profile
  const syncFromAuth = useCallback(async () => {
    if (!user || !profile || syncState.syncing) return false

    try {
      setSyncState(prev => ({ ...prev, syncing: true }))

      const updates: any = {}

      // Preparar atualizações
      const authName = user.user_metadata?.nome
      if (authName && authName !== profile.nome) {
        updates.nome = authName
      }

      const authPhone = user.user_metadata?.telefone
      if (authPhone && authPhone !== profile.telefone) {
        updates.telefone = authPhone
      }

      if (user.email && user.email !== profile.email) {
        updates.email = user.email
      }

      if (Object.keys(updates).length > 0) {
        console.log('🔄 ProfileSync: Sincronizando dados:', updates)
        
        const result = await updateProfile(updates)
        
        if (result.success) {
          console.log('✅ ProfileSync: Sincronização concluída')
          checkSyncStatus()
          return true
        } else {
          console.error('❌ ProfileSync: Erro na sincronização:', result.error)
          return false
        }
      }

      return true
    } catch (error) {
      console.error('❌ ProfileSync: Erro inesperado:', error)
      return false
    } finally {
      setSyncState(prev => ({ ...prev, syncing: false }))
    }
  }, [user, profile, updateProfile, checkSyncStatus, syncState.syncing])

  // Sincronização automática
  const enableAutoSync = useCallback(() => {
    setSyncState(prev => ({ ...prev, autoSyncEnabled: true }))
  }, [])

  const disableAutoSync = useCallback(() => {
    setSyncState(prev => ({ ...prev, autoSyncEnabled: false }))
  }, [])

  // Atualizar cache do perfil
  const refreshCache = useCallback(async () => {
    if (syncState.syncing) return

    try {
      setSyncState(prev => ({ ...prev, syncing: true }))
      await refreshProfile()
      checkSyncStatus()
    } catch (error) {
      console.error('❌ ProfileSync: Erro ao atualizar cache:', error)
    } finally {
      setSyncState(prev => ({ ...prev, syncing: false }))
    }
  }, [refreshProfile, checkSyncStatus, syncState.syncing])

  // Verificação periódica
  useEffect(() => {
    if (!user || !profile) return

    // Verificação inicial
    checkSyncStatus()

    // Verificação periódica (a cada 30 segundos)
    const interval = setInterval(() => {
      if (syncState.autoSyncEnabled) {
        const isInSync = checkSyncStatus()
        
        // Auto-sincronizar se habilitado e fora de sincronia
        if (!isInSync && syncState.autoSyncEnabled && !syncState.syncing) {
          console.log('🔄 ProfileSync: Auto-sincronização iniciada')
          syncFromAuth()
        }
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [user, profile, checkSyncStatus, syncFromAuth, syncState.autoSyncEnabled, syncState.syncing])

  // Sincronização automática quando detectar mudanças
  useEffect(() => {
    if (user && profile && syncState.autoSyncEnabled && !syncState.syncing) {
      const differences = checkDifferences()
      
      if (differences.length > 0) {
        console.log('🔄 ProfileSync: Diferenças detectadas, iniciando sincronização automática')
        syncFromAuth()
      }
    }
  }, [user?.user_metadata, profile?.nome, profile?.telefone, profile?.email])

  return {
    // Estado
    isInSync: syncState.isInSync,
    lastSync: syncState.lastSync,
    differences: syncState.differences,
    syncing: syncState.syncing,
    autoSyncEnabled: syncState.autoSyncEnabled,
    
    // Ações
    syncFromAuth,
    refreshCache,
    checkSyncStatus,
    enableAutoSync,
    disableAutoSync,
    
    // Dados
    user,
    profile
  }
}
