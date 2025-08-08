
'use client'

// Mock temporário para motion
const motion = {
  div: 'div' as any,
  span: 'span' as any,
  button: 'button' as any,
  h1: 'h1' as any,
  p: 'p' as any,
}

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { ArrowLeft, Home, ShieldX } from 'lucide-react'
import { Button } from '@/shared/components/ui'
import { useAuth } from '@/domains/auth/hooks/use-auth'

export default function UnauthorizedPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, profile } = useAuth()
  
  const attemptedRoute = searchParams.get('attempted')
  const error = searchParams.get('error')

  const handleGoBack = () => {
    router.back()
  }

  const handleGoHome = () => {
    // Redirecionar para a área apropriada baseada no role
    const userRole = profile?.role || user?.user_metadata?.role || 'client'
    
    let homePath = '/dashboard'
    if (userRole === 'saas_owner') {
      homePath = '/saas-admin'
    } else if (userRole === 'client') {
      homePath = '/dashboard/agendamentos'
    }
    
    router.push(homePath)
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        {/* Ícone de erro */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-6"
        >
          <div className="w-20 h-20 mx-auto bg-red-500/10 rounded-full flex items-center justify-center">
            <ShieldX className="w-10 h-10 text-red-500" />
          </div>
        </motion.div>

        {/* Título */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-white mb-4"
        >
          Acesso Negado
        </motion.h1>

        {/* Mensagem */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-300 mb-6 space-y-2"
        >
          <p>
            Você não tem permissão para acessar esta página.
          </p>
          
          {attemptedRoute && (
            <p className="text-sm text-gray-400">
              Tentativa de acesso: <code className="bg-gray-800 px-2 py-1 rounded">{attemptedRoute}</code>
            </p>
          )}
          
          {profile?.role && (
            <p className="text-sm text-amber-400">
              Seu nível de acesso: <span className="font-medium capitalize">{profile.role}</span>
            </p>
          )}
        </motion.div>

        {/* Ações */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          <Button
            onClick={handleGoHome}
            className="w-full"
            size="lg"
          >
            <Home className="w-4 h-4 mr-2" />
            Ir para Página Inicial
          </Button>
          
          <Button
            onClick={handleGoBack}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </motion.div>

        {/* Informações de contato */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700"
        >
          <p className="text-sm text-gray-400 mb-2">
            Precisa de mais acesso?
          </p>
          <p className="text-xs text-gray-500">
            Entre em contato com o administrador do sistema para solicitar as permissões necessárias.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
