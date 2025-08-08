'use client'

import React, { useState, useEffect } from 'react'
import { SimpleModal, SimpleModalContent, SimpleModalHeader, SimpleModalTitle } from '@/shared/components/ui/modal-simple'
import { Button } from '@/shared/components/ui'
import { useAdminServicos, type HistoricoPreco } from '@/domains/users/hooks/use-admin-servicos'
import { DollarSign, User, Calendar, TrendingUp, TrendingDown } from 'lucide-react'
import { formatarMoeda } from '@/shared/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface HistoricoPrecoModalProps {
  isOpen: boolean
  onClose: () => void
  servicoId: string
}

export const HistoricoPrecoModal: React.FC<HistoricoPrecoModalProps> = ({
  isOpen,
  onClose,
  servicoId,
}) => {
  const { getHistoricoPrecos, getServicoById } = useAdminServicos()
  const [historico, setHistorico] = useState<HistoricoPreco[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  const servico = getServicoById(servicoId)



  // Carregar histórico quando modal abre
  useEffect(() => {
    if (isOpen && servicoId) {
      loadHistorico()
    }
  }, [isOpen, servicoId])

  const loadHistorico = async () => {
    try {
      setLoading(true)
      setError(undefined)

      const data = await getHistoricoPrecos(servicoId)
      setHistorico(data)
    } catch (err) {
      console.error('Erro ao carregar histórico:', err)
      setError('Erro ao carregar histórico de preços')
    } finally {
      setLoading(false)
    }
  }

  const formatarData = (data: string) => {
    try {
      return format(new Date(data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    } catch {
      return data
    }
  }

  const calcularVariacao = (precoAnterior: number | null, precoNovo: number) => {
    if (!precoAnterior) return null

    const variacao = precoNovo - precoAnterior
    const percentual = (variacao / precoAnterior) * 100

    return {
      valor: variacao,
      percentual,
      tipo: variacao > 0 ? 'aumento' : variacao < 0 ? 'reducao' : 'igual',
    }
  }



  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Histórico de Preços - ${servico?.nome || 'Serviço'}`}
      size="lg"
    >
      <SimpleModalHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary-gold/10 p-2">
            <History className="h-6 w-6 text-primary-gold" />
          </div>
          <div>
            <SimpleModalTitle>Histórico de Alterações de Preços</SimpleModalTitle>
            <p className="mt-1 text-sm text-text-secondary">
              Acompanhe todas as mudanças de preço do serviço
            </p>
          </div>
        </div>
      </SimpleModalHeader>

      <SimpleModalContent className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-lg bg-neutral-light-gray dark:bg-background-dark-card"
              />
            ))}
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <div className="rounded-lg border border-error/20 bg-error/10 p-4 text-error">
              {error}
            </div>
          </div>
        ) : historico.length === 0 ? (
          <div className="py-12 text-center">
            <History className="mx-auto mb-4 h-12 w-12 text-text-secondary" />
            <h3 className="mb-2 text-lg font-medium text-text-primary">
              Nenhum histórico encontrado
            </h3>
            <p className="text-text-secondary">
              Este serviço ainda não teve alterações de preço registradas.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Preço atual */}
            <div className="rounded-lg border-2 border-primary-gold/20 bg-primary-gold/5 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary-gold/20 p-2">
                    <DollarSign className="h-5 w-5 text-primary-gold" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary">Preço Atual</h4>
                    <p className="text-sm text-text-secondary">Valor vigente</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-gold">
                    {formatarMoeda(servico?.preco || 0)}
                  </div>
                </div>
              </div>
            </div>

            {/* Histórico de alterações */}
            <div className="space-y-3">
              {historico.map((item, index) => {
                const variacao = calcularVariacao(item.preco_anterior, item.preco_novo)

                return (
                  <div
                    key={item.id}
                    className="border-border-default rounded-lg border bg-background-primary p-4 transition-all hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className={`rounded-full p-2 ${
                            variacao?.tipo === 'aumento'
                              ? 'bg-green-100 dark:bg-green-900/30'
                              : variacao?.tipo === 'reducao'
                                ? 'bg-red-100 dark:bg-red-900/30'
                                : 'bg-gray-100 dark:bg-gray-900/30'
                          } `}
                        >
                          {variacao?.tipo === 'aumento' ? (
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          ) : variacao?.tipo === 'reducao' ? (
                            <TrendingDown className="h-5 w-5 text-red-600" />
                          ) : (
                            <DollarSign className="h-5 w-5 text-gray-600" />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="font-medium text-text-primary">
                              {item.preco_anterior
                                ? formatarMoeda(item.preco_anterior)
                                : 'Preço inicial'}
                            </span>
                            <span className="text-text-secondary">→</span>
                            <span className="font-bold text-primary-gold">
                              {formatarMoeda(item.preco_novo)}
                            </span>

                            {variacao && variacao.tipo !== 'igual' && (
                              <span
                                className={`rounded-full px-2 py-1 text-xs ${
                                  variacao.tipo === 'aumento'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                } `}
                              >
                                {variacao.tipo === 'aumento' ? '+' : ''}
                                {formatarMoeda(variacao.valor)}({variacao.percentual > 0 ? '+' : ''}
                                {variacao.percentual.toFixed(1)}%)
                              </span>
                            )}
                          </div>

                          {item.motivo && (
                            <p className="mb-2 text-sm text-text-secondary">
                              <strong>Motivo:</strong> {item.motivo}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-xs text-text-secondary">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatarData(item.created_at)}
                            </div>

                            {item.alterado_por_profile?.nome && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {item.alterado_por_profile.nome}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Estatísticas do histórico */}
            {historico.length > 1 && (
              <div className="mt-6 rounded-lg bg-background-secondary p-4">
                <h4 className="mb-3 font-semibold text-text-primary">Estatísticas</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-text-secondary">Total de alterações:</span>
                    <span className="ml-2 font-medium text-text-primary">{historico.length}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Primeira alteração:</span>
                    <span className="ml-2 font-medium text-text-primary">
                      {formatarData(historico[historico.length - 1]?.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </SimpleModalContent>

      <div className="border-border-default flex justify-end border-t p-6">
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </SimpleModal>
  )
}

export default HistoricoPrecoModal
