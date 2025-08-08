'use client'

import React, { useState } from 'react'
import { X, Scissors, Clock, DollarSign, Star } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { useServices } from '@/shared/hooks/data/use-services'
import { formatarMoeda } from '@/shared/utils'

interface ServicosModalProps {
  isOpen: boolean
  onClose: () => void
  onAgendar?: (serviceId: string) => void
}

export const ServicosModal: React.FC<ServicosModalProps> = ({ isOpen, onClose, onAgendar }) => {
  const { services, loading } = useServices()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  if (!isOpen) return null

  // Categorias dos serviços
  const categories = [
    { id: 'all', name: 'Todos os Serviços' },
    { id: 'corte', name: 'Cortes' },
    { id: 'barba', name: 'Barba' },
    { id: 'combo', name: 'Combos' },
    { id: 'tratamento', name: 'Tratamentos' },
  ]

  // Filtrar serviços por categoria
  const filteredServices =
    selectedCategory === 'all'
      ? services
      : services.filter(
          (service) =>
            service.categoria?.toLowerCase().includes(selectedCategory) ||
            service.nome.toLowerCase().includes(selectedCategory)
        )

  const handleAgendar = (serviceId: string) => {
    onAgendar?.(serviceId)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-gradient-to-r from-primary-gold/5 to-primary-gold/10 p-6">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold text-text-primary">
              <Scissors className="h-6 w-6 text-primary-gold" />
              Nossos Serviços
            </h2>
            <p className="mt-1 text-text-muted">Escolha o serviço perfeito para você</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Filtros de categoria */}
        <div className="border-b p-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={
                  selectedCategory === category.id
                    ? 'bg-primary-gold hover:bg-primary-gold-dark'
                    : ''
                }
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Lista de serviços */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-lg bg-neutral-light-gray" />
              ))}
            </div>
          ) : filteredServices.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredServices.map((service) => (
                <Card
                  key={service.id}
                  className="cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                  onClick={() => handleAgendar(service.id)}
                >
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="mb-2 text-lg font-semibold text-text-primary">
                          {service.nome}
                        </h3>
                        {service.descricao && (
                          <p className="mb-3 text-sm text-text-muted">{service.descricao}</p>
                        )}
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-2xl font-bold text-primary-gold">
                          {formatarMoeda(service.preco)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-text-muted">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{service.duracao_minutos} min</span>
                        </div>
                        {service.categoria && (
                          <Badge variant="secondary" size="sm">
                            {service.categoria}
                          </Badge>
                        )}
                      </div>

                      <Button
                        size="sm"
                        className="bg-primary-gold hover:bg-primary-gold-dark"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAgendar(service.id)
                        }}
                      >
                        Agendar
                      </Button>
                    </div>

                    {/* Avaliação do serviço (se disponível) */}
                    {(service as any).avaliacao && (
                      <div className="mt-3 flex items-center gap-1 border-t pt-3">
                        <Star className="h-4 w-4 fill-current text-yellow-500" />
                        <span className="text-sm font-medium">
                          {(service as any).avaliacao.toFixed(1)}
                        </span>
                        <span className="ml-1 text-xs text-text-muted">
                          ({(service as any).totalAvaliacoes || 0} avaliações)
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Scissors className="mx-auto mb-4 h-12 w-12 text-text-muted" />
              <h3 className="mb-2 text-lg font-medium text-text-primary">
                Nenhum serviço encontrado
              </h3>
              <p className="text-text-muted">Tente selecionar uma categoria diferente</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-text-muted">
              {filteredServices.length} serviço{filteredServices.length !== 1 ? 's' : ''} disponível
              {filteredServices.length !== 1 ? 'eis' : ''}
            </div>
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServicosModal
