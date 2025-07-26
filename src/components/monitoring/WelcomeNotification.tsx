/**
 * Notificação de boas-vindas para o sistema de monitoramento
 */

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useMonitoringPermissions } from '@/lib/monitoring-permissions'
import { Card, CardContent, Button } from '@/components/ui'
import { Crown, X, Sparkles, Shield, TrendingUp } from 'lucide-react'

export function WelcomeNotification() {
  const { profile } = useAuth()
  const { isSaasOwner } = useMonitoringPermissions(profile?.role || 'client', profile)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Verificar se já mostrou a notificação antes
    const hasSeenWelcome = localStorage.getItem('monitoring-welcome-seen')
    
    if (!hasSeenWelcome && isSaasOwner()) {
      setIsVisible(true)
    }
  }, [isSaasOwner])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('monitoring-welcome-seen', 'true')
  }

  if (!isVisible || !isSaasOwner()) {
    return null
  }

  return (
    <Card className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-blue-50 mb-6">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Crown className="h-6 w-6 text-purple-600" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Sistema de Monitoramento Ativado!
              </h3>
              
              <p className="text-sm text-purple-700 mb-4">
                Olá <strong>{profile?.nome?.split(' ')[0] || 'Carlos'}</strong>! 
                Você agora tem acesso completo ao sistema de monitoramento do StylloBarber SaaS.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-purple-600">
                  <Shield className="h-4 w-4" />
                  <span>Saúde do Sistema</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-purple-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>Métricas de Performance</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-purple-600">
                  <Crown className="h-4 w-4" />
                  <span>Visão Multi-Cliente</span>
                </div>
              </div>
              
              <div className="text-xs text-purple-600 bg-purple-100 p-2 rounded">
                💡 <strong>Dica:</strong> Use o botão "Mostrar Detalhes Técnicos" para acessar logs e métricas avançadas.
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-purple-600 hover:text-purple-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}