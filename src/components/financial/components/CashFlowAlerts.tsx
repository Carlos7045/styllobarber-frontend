
'use client'

// Mock temporário para motion
const motion = {
  div: 'div' as any,
  span: 'span' as any,
  button: 'button' as any,
}

const AnimatePresence = ({ children }: { children: React.ReactNode }) => <>{children}</>
// Componente para gerenciamento de alertas de fluxo de caixa

import { useState, useEffect } from 'react'

import { Bell, Settings, AlertTriangle, CheckCircle, X, Mail, MessageSquare, Clock, DollarSign, TrendingDown, Target } from '@/shared/utils/optimized-imports'
import { Card, Button, Badge } from '@/shared/components/ui'
import { formatCurrency, formatDate } from '../utils'
import { useCashFlowAlerts } from '../hooks/use-cash-flow'

interface AlertConfig {
    limiteMinimo: number
    emailAtivo: boolean
    whatsappAtivo: boolean
    intervaloPadrao: number
}

interface CashFlowAlertsProps {
    className?: string
    showConfig?: boolean
}

// Componente de Item de Alerta
const AlertItem = ({
    alerta,
    onMarkAsRead,
    onRemove
}: {
    alerta: any
    onMarkAsRead: (id: string) => void
    onRemove: (id: string) => void
}) => {
    const getAlertIcon = (tipo: string) => {
        switch (tipo) {
            case 'SALDO_BAIXO':
                return <AlertTriangle className="h-5 w-5 text-red-500" />
            case 'PROJECAO_NEGATIVA':
                return <TrendingDown className="h-5 w-5 text-orange-500" />
            case 'META_ATINGIDA':
                return <Target className="h-5 w-5 text-green-500" />
            default:
                return <Bell className="h-5 w-5 text-blue-500" />
        }
    }

    const getAlertColor = (tipo: string) => {
        switch (tipo) {
            case 'SALDO_BAIXO':
                return 'border-red-200 bg-red-50'
            case 'PROJECAO_NEGATIVA':
                return 'border-orange-200 bg-orange-50'
            case 'META_ATINGIDA':
                return 'border-green-200 bg-green-50'
            default:
                return 'border-blue-200 bg-blue-50'
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className={`p-4 rounded-lg border ${getAlertColor(alerta.tipo)} ${alerta.lido ? 'opacity-60' : ''
                }`}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                    {getAlertIcon(alerta.tipo)}
                    <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm">
                            {alerta.titulo}
                        </h4>
                        <p className="text-gray-700 text-sm mt-1">
                            {alerta.mensagem}
                        </p>
                        <div className="flex items-center space-x-3 mt-2">
                            <span className="text-xs text-gray-500">
                                {formatDate(alerta.data.toISOString())} às {alerta.data.toLocaleTimeString('pt-BR')}
                            </span>
                            {!alerta.lido && (
                                <Badge variant="default" className="text-xs">
                                    Novo
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    {!alerta.lido && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onMarkAsRead(alerta.id)}
                            className="text-xs"
                        >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Marcar como lido
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRemove(alerta.id)}
                        className="text-xs text-red-600 hover:text-red-700"
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        </motion.div>
    )
}

// Componente de Configuração de Alertas
const AlertConfiguration = ({
    config,
    onSave,
    onCancel
}: {
    config: AlertConfig
    onSave: (config: AlertConfig) => void
    onCancel: () => void
}) => {
    const [localConfig, setLocalConfig] = useState(config)

    const handleSave = () => {
        onSave(localConfig)
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Configurações de Alertas
                    </h3>
                    <Settings className="h-5 w-5 text-gray-500" />
                </div>

                <div className="space-y-6">
                    {/* Limite Mínimo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Limite Mínimo de Caixa
                        </label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                            <input
                                type="number"
                                value={localConfig.limiteMinimo}
                                onChange={(e) => setLocalConfig({
                                    ...localConfig,
                                    limiteMinimo: Number(e.target.value)
                                })}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Ex: 5000"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Valor abaixo do qual será enviado alerta de saldo baixo
                        </p>
                    </div>

                    {/* Notificações */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Canais de Notificação
                        </label>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <Mail className="h-5 w-5 text-blue-500" />
                                    <div>
                                        <p className="font-medium text-gray-900 text-sm">Email</p>
                                        <p className="text-xs text-gray-500">Receber alertas por email</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={localConfig.emailAtivo}
                                        onChange={(e) => setLocalConfig({
                                            ...localConfig,
                                            emailAtivo: e.target.checked
                                        })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <MessageSquare className="h-5 w-5 text-green-500" />
                                    <div>
                                        <p className="font-medium text-gray-900 text-sm">WhatsApp</p>
                                        <p className="text-xs text-gray-500">Receber alertas por WhatsApp</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={localConfig.whatsappAtivo}
                                        onChange={(e) => setLocalConfig({
                                            ...localConfig,
                                            whatsappAtivo: e.target.checked
                                        })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Intervalo de Verificação */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Intervalo de Verificação (segundos)
                        </label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                            <select
                                value={localConfig.intervaloPadrao}
                                onChange={(e) => setLocalConfig({
                                    ...localConfig,
                                    intervaloPadrao: Number(e.target.value)
                                })}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={15}>15 segundos</option>
                                <option value={30}>30 segundos</option>
                                <option value={60}>1 minuto</option>
                                <option value={300}>5 minutos</option>
                                <option value={600}>10 minutos</option>
                            </select>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Frequência de verificação automática de alertas
                        </p>
                    </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                    <Button variant="outline" onClick={onCancel}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave}>
                        Salvar Configurações
                    </Button>
                </div>
            </Card>
        </motion.div>
    )
}

export const CashFlowAlerts = ({
    className = '',
    showConfig = false
}: CashFlowAlertsProps) => {
    const {
        alertas,
        alertasNaoLidos,
        marcarComoLido,
        removerAlerta
    } = useCashFlowAlerts()

    const [showConfiguration, setShowConfiguration] = useState(showConfig)
    const [alertConfig, setAlertConfig] = useState<AlertConfig>({
        limiteMinimo: 5000,
        emailAtivo: true,
        whatsappAtivo: false,
        intervaloPadrao: 30
    })

    // Simular alguns alertas para demonstração
    useEffect(() => {
        // Em produção, isso viria do hook useCashFlowAlerts
    }, [])

    const handleSaveConfig = (config: AlertConfig) => {
        setAlertConfig(config)
        setShowConfiguration(false)
        // Aqui salvaria as configurações no backend
        console.log('Configurações salvas:', config)
    }

    const alertasParaExibir = alertas.slice(0, 5) // Mostrar apenas os 5 mais recentes

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <Bell className="h-6 w-6 text-gray-700" />
                        {alertasNaoLidos.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {alertasNaoLidos.length}
                            </span>
                        )}
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Alertas de Fluxo de Caixa
                        </h2>
                        <p className="text-sm text-gray-600">
                            {alertasNaoLidos.length} alertas não lidos
                        </p>
                    </div>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConfiguration(!showConfiguration)}
                    className="flex items-center space-x-2"
                >
                    <Settings className="h-4 w-4" />
                    <span>Configurar</span>
                </Button>
            </div>

            {/* Configuração */}
            <AnimatePresence>
                {showConfiguration && (
                    <AlertConfiguration
                        config={alertConfig}
                        onSave={handleSaveConfig}
                        onCancel={() => setShowConfiguration(false)}
                    />
                )}
            </AnimatePresence>

            {/* Lista de Alertas */}
            <Card className="p-6">
                <div className="space-y-4">
                    <AnimatePresence>
                        {alertasParaExibir.map((alerta) => (
                            <AlertItem
                                key={alerta.id}
                                alerta={alerta}
                                onMarkAsRead={marcarComoLido}
                                onRemove={removerAlerta}
                            />
                        ))}
                    </AnimatePresence>

                    {alertas.length === 0 && (
                        <div className="text-center py-8">
                            <BellOff className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">Nenhum alerta no momento</p>
                            <p className="text-sm text-gray-400 mt-1">
                                Os alertas aparecerão aqui quando houver situações que requerem atenção
                            </p>
                        </div>
                    )}

                    {alertas.length > 5 && (
                        <div className="text-center pt-4 border-t border-gray-200">
                            <Button variant="outline" size="sm">
                                Ver todos os alertas ({alertas.length})
                            </Button>
                        </div>
                    )}
                </div>
            </Card>

            {/* Resumo de Configurações */}
            {!showConfiguration && (
                <Card className="p-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="text-sm text-gray-600">
                                <span className="font-medium">Limite:</span> {formatCurrency(alertConfig.limiteMinimo)}
                            </div>
                            <div className="text-sm text-gray-600">
                                <span className="font-medium">Email:</span> {alertConfig.emailAtivo ? 'Ativo' : 'Inativo'}
                            </div>
                            <div className="text-sm text-gray-600">
                                <span className="font-medium">WhatsApp:</span> {alertConfig.whatsappAtivo ? 'Ativo' : 'Inativo'}
                            </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                            Verificação a cada {alertConfig.intervaloPadrao}s
                        </Badge>
                    </div>
                </Card>
            )}
        </div>
    )
}
