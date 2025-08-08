'use client'

import { useProfileSync } from '@/domains/users/hooks/use-profile-sync'
import { Card, CardContent, Button } from '@/shared/components/ui'
import { RefreshCw, CheckCircle, AlertTriangle, Settings } from 'lucide-react'

export function ProfileSync() {
  const {
    isInSync,
    lastSync,
    differences,
    syncing,
    autoSyncEnabled,
    syncFromAuth,
    refreshCache,
    enableAutoSync,
    disableAutoSync,
    user,
    profile
  } = useProfileSync()

  if (!user || !profile) {
    return null
  }

  return (
    <Card className="border-l-4 border-l-primary-gold">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-primary-gold" />
            <h3 className="font-medium">Sincronização do Perfil</h3>
          </div>

          <div className="flex items-center gap-3">
            {/* Status de sincronização */}
            {isInSync ? (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Sincronizado</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-yellow-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Dessincronizado</span>
              </div>
            )}

            {/* Status do auto-sync */}
            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${autoSyncEnabled ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-secondary-graphite-card text-gray-600 dark:text-gray-300'
              }`}>
              <Settings className="h-3 w-3" />
              Auto: {autoSyncEnabled ? 'ON' : 'OFF'}
            </div>
          </div>
        </div>

        {/* Status da sincronização */}
        <div className="space-y-3">
          {lastSync && (
            <div className="text-sm text-text-muted">
              Última verificação: {lastSync.toLocaleTimeString()}
            </div>
          )}

          {/* Diferenças encontradas */}
          {differences.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <h4 className="font-medium text-yellow-800 mb-2">
                Campos dessincronizados:
              </h4>
              <div className="flex flex-wrap gap-2">
                {differences.map((field, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-200 text-yellow-800"
                  >
                    {field}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshCache}
              disabled={syncing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              Atualizar Cache
            </Button>

            {!isInSync && (
              <Button
                size="sm"
                onClick={syncFromAuth}
                disabled={syncing}
              >
                <ArrowLeftRight className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Sincronizando...' : 'Sincronizar'}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={autoSyncEnabled ? disableAutoSync : enableAutoSync}
            >
              <Settings className="h-4 w-4 mr-2" />
              Auto-sync: {autoSyncEnabled ? 'Desabilitar' : 'Habilitar'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
