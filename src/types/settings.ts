/**
 * Tipos para o sistema de configurações
 */

// Configurações de notificação
export interface NotificationSettings {
  email: {
    enabled: boolean
    appointments: boolean
    reminders: boolean
    marketing: boolean
    system: boolean
  }
  push: {
    enabled: boolean
    appointments: boolean
    reminders: boolean
    system: boolean
  }
  sms: {
    enabled: boolean
    appointments: boolean
    reminders: boolean
  }
  whatsapp: {
    enabled: boolean
    appointments: boolean
    reminders: boolean
    confirmations: boolean
    marketing: boolean
  }
}

// Configurações de privacidade
export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'contacts'
  dataUsage: boolean
  analytics: boolean
  shareData: boolean
  showOnlineStatus: boolean
}

// Configurações de aparência
export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system'
  language: 'pt-BR' | 'en-US'
  density: 'compact' | 'comfortable' | 'spacious'
  fontSize: 'small' | 'medium' | 'large'
  animations: boolean
}

// Configurações de segurança
export interface SecuritySettings {
  twoFactorEnabled: boolean
  sessionTimeout: number // em minutos
  loginNotifications: boolean
  passwordLastChanged?: string
}

// Configurações gerais do usuário
export interface UserSettings {
  id: string
  userId: string
  notifications: NotificationSettings
  privacy: PrivacySettings
  appearance: AppearanceSettings
  security: SecuritySettings
  createdAt: string
  updatedAt: string
}

// Configurações padrão
export const DEFAULT_SETTINGS: Omit<UserSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  notifications: {
    email: {
      enabled: true,
      appointments: true,
      reminders: true,
      marketing: false,
      system: true,
    },
    push: {
      enabled: true,
      appointments: true,
      reminders: true,
      system: true,
    },
    sms: {
      enabled: false,
      appointments: false,
      reminders: false,
    },
    whatsapp: {
      enabled: true,
      appointments: true,
      reminders: true,
      confirmations: true,
      marketing: false,
    },
  },
  privacy: {
    profileVisibility: 'contacts',
    dataUsage: true,
    analytics: true,
    shareData: false,
    showOnlineStatus: true,
  },
  appearance: {
    theme: 'dark',
    language: 'pt-BR',
    density: 'comfortable',
    fontSize: 'medium',
    animations: true,
  },
  security: {
    twoFactorEnabled: false,
    sessionTimeout: 480, // 8 horas
    loginNotifications: true,
  },
}

// Tipos para alteração de senha
export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// Tipos para resposta da API
export interface SettingsResponse {
  success: boolean
  message: string
  data?: UserSettings
}
