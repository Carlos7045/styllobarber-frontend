'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Container } from '@/components/layout'

// Redirecionar baseado no role do usuário
export default function DashboardRedirect() {
  const { profile, user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return // Aguardar carregar

    const userRole = profile?.role || user?.user_metadata?.role || 'client'

    // Redirecionar baseado no role
    switch (userRole) {
      case 'admin':
      case 'barber':
        router.replace('/dashboard/dashboard') // Dashboard administrativo
        break
      case 'client':
        router.replace('/agendamentos') // Clientes vão direto para agendamentos
        break
      default:
        router.replace('/agendamentos') // Default para agendamentos
    }
  }, [profile, user, loading, router])

  // Mostrar loading enquanto redireciona
  if (loading) {
    return (
      <Container className="py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-gold"></div>
        </div>
      </Container>
    )
  }

  return null
}