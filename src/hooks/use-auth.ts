// Re-export do AuthContext para manter compatibilidade
export { useAuth } from '@/contexts/AuthContext'
export type { 
  LoginData, 
  SignUpData, 
  ResetPasswordData, 
  UserProfile, 
  AuthResult 
} from '@/contexts/AuthContext'