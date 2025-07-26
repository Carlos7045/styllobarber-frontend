/**
 * Badge que aparece no item de monitoramento para indicar acesso especial
 */

'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useMonitoringPermissions } from '@/lib/monitoring-permissions'
import { Crown, Code } from 'lucide-react'

export function MonitoringBadge() {
  const { profile } = useAuth()
  const { isSaasOwner, isDeveloper } = useMonitoringPermissions(profile?.role || 'client', profile)

  if (isSaasOwner()) {
    return (
      <div className="flex items-center gap-1">
        <Crown className="h-3 w-3 text-purple-500" />
        <span className="text-xs text-purple-600 font-medium">OWNER</span>
      </div>
    )
  }

  if (isDeveloper()) {
    return (
      <div className="flex items-center gap-1">
        <Code className="h-3 w-3 text-blue-500" />
        <span className="text-xs text-blue-600 font-medium">DEV</span>
      </div>
    )
  }

  return null
}