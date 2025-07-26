'use client'

import { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { sessionManager } from './session-manager'
import type { UserProfile } from '@/hooks/use-auth'

export interface ProfileSyncResult {
  success: boolean
  profile?: UserProfile
  error?: string
}

export class ProfileSync {
  private static instance: ProfileSync

  private constructor() {}

  static getInstance(): ProfileSync {
    if (!ProfileSync.instance) {
      ProfileSync.instance = new ProfileSync()
    }
    return ProfileSync.instance
  }

  // Sincronização principal
  async syncProfile(userId: string): Promise<ProfileSyncResult> {
    try {
      console.log('🔄 Sincronizando perfil para userId:', userId)

      // Primeiro, verificar se o usuário existe no auth
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user || user.id !== userId) {
        console.error('❌ Usuário não autenticado ou ID não confere:', { authError, userId, actualId: user?.id })
        return { success: false, error: 'Usuário não autenticado' }
      }

      // Buscar perfil existente
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
        console.error('❌ Erro ao buscar perfil:', fetchError)
        return { success: false, error: fetchError.message }
      }

      let profile: UserProfile

      if (!existingProfile) {
        // Criar novo perfil
        console.log('📝 Criando novo perfil...')
        profile = await this.createProfile(user)
      } else {
        // Atualizar perfil existente
        console.log('🔄 Atualizando perfil existente...')
        profile = await this.updateProfile(user, existingProfile)
      }

      console.log('✅ Perfil sincronizado com sucesso:', profile)
      return { success: true, profile }

    } catch (error) {
      console.error('❌ Erro na sincronização do perfil:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  async ensureProfileExists(user: User): Promise<UserProfile> {
    const result = await this.syncProfile(user.id)
    
    if (!result.success || !result.profile) {
      throw new Error(result.error || 'Falha ao criar/sincronizar perfil')
    }

    return result.profile
  }

  async repairProfile(userId: string): Promise<UserProfile> {
    console.log('🔧 Reparando perfil para userId:', userId)

    try {
      // Deletar perfil corrompido se existir
      await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      // Obter dados do auth
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user || user.id !== userId) {
        throw new Error('Usuário não encontrado no auth')
      }

      // Criar novo perfil
      const profile = await this.createProfile(user)
      
      console.log('✅ Perfil reparado com sucesso:', profile)
      return profile

    } catch (error) {
      console.error('❌ Erro ao reparar perfil:', error)
      throw error
    }
  }

  // Validação
  async validateProfileIntegrity(userId: string): Promise<boolean> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, nome, email, role')
        .eq('id', userId)
        .single()

      if (error) {
        console.warn('⚠️ Perfil não encontrado ou inválido:', error)
        return false
      }

      // Validar campos obrigatórios
      const isValid = !!(
        profile.id &&
        profile.nome &&
        profile.email &&
        profile.role &&
        ['admin', 'barber', 'client'].includes(profile.role)
      )

      if (!isValid) {
        console.warn('⚠️ Perfil com dados inválidos:', profile)
      }

      return isValid
    } catch (error) {
      console.error('❌ Erro na validação do perfil:', error)
      return false
    }
  }

  // Recovery
  async recoverProfile(userId: string): Promise<UserProfile | null> {
    try {
      console.log('🔄 Tentando recuperar perfil para userId:', userId)

      // Tentar sincronização normal primeiro
      const syncResult = await this.syncProfile(userId)
      if (syncResult.success && syncResult.profile) {
        return syncResult.profile
      }

      // Se falhar, tentar reparar
      console.log('🔧 Sincronização falhou, tentando reparar...')
      const repairedProfile = await this.repairProfile(userId)
      return repairedProfile

    } catch (error) {
      console.error('❌ Falha na recuperação do perfil:', error)
      return null
    }
  }

  // Métodos privados
  private async createProfile(user: User): Promise<UserProfile> {
    const profileData = {
      id: user.id,
      nome: user.user_metadata?.nome || user.email?.split('@')[0] || 'Usuário',
      email: user.email!,
      telefone: user.user_metadata?.telefone || null,
      role: (user.user_metadata?.role as 'admin' | 'barber' | 'client') || 'client',
      avatar_url: null,
      pontos_fidelidade: 0,
      data_nascimento: null
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao criar perfil:', error)
      throw new Error(`Erro ao criar perfil: ${error.message}`)
    }

    return data as UserProfile
  }

  private async updateProfile(user: User, existingProfile: any): Promise<UserProfile> {
    const updates = {
      nome: user.user_metadata?.nome || existingProfile.nome,
      email: user.email!,
      telefone: user.user_metadata?.telefone || existingProfile.telefone,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao atualizar perfil:', error)
      throw new Error(`Erro ao atualizar perfil: ${error.message}`)
    }

    return data as UserProfile
  }
}

// Export singleton instance
export const profileSync = ProfileSync.getInstance()