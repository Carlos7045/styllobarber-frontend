/**
 * Componente discreto para mostrar info básica do usuário
 * Só aparece em development como um pequeno badge
 */

'use client'

import { useAuth } from '@/hooks/use-auth'

export function QuickUserInfo() {
  const { profile } = useAuth()

  // Só mostrar em desenvolvimento
  if (process.env.NODE_ENV !== 'development' || !profile) {
    return null
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700 border-red-200'
      case 'barber': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'client': return 'bg-green-100 text-green-700 border-green-200'
      case 'saas_owner': return 'bg-purple-100 text-purple-700 border-purple-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(profile.role)}`}>
        {profile.nome?.split(' ')[0]} ({profile.role})
      </div>
    </div>
  )
}