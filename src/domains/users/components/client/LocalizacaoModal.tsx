'use client'

import React from 'react'
import { X, MapPin, Phone, Clock, Navigation, Car, Bus } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'

interface LocalizacaoModalProps {
  isOpen: boolean
  onClose: () => void
}

// Dados da barbearia (em produção viria do banco/configurações)
const barbeariaInfo = {
  nome: 'StylloBarber',
  endereco: {
    rua: 'Rua das Flores, 123',
    bairro: 'Centro',
    cidade: 'São Paulo',
    cep: '01234-567',
    estado: 'SP',
  },
  telefone: '(11) 99999-9999',
  whatsapp: '5511999999999',
  horarioFuncionamento: {
    segunda: '09:00 - 19:00',
    terca: '09:00 - 19:00',
    quarta: '09:00 - 19:00',
    quinta: '09:00 - 19:00',
    sexta: '09:00 - 20:00',
    sabado: '08:00 - 18:00',
    domingo: 'Fechado',
  },
  coordenadas: {
    lat: -23.5505,
    lng: -46.6333,
  },
}

export const LocalizacaoModal: React.FC<LocalizacaoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  const enderecoCompleto = `${barbeariaInfo.endereco.rua}, ${barbeariaInfo.endereco.bairro}, ${barbeariaInfo.endereco.cidade} - ${barbeariaInfo.endereco.estado}, ${barbeariaInfo.endereco.cep}`

  const handleOpenMaps = () => {
    const query = encodeURIComponent(enderecoCompleto)
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank')
  }

  const handleOpenWaze = () => {
    const { lat, lng } = barbeariaInfo.coordenadas
    window.open(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`, '_blank')
  }

  const handleCall = () => {
    window.open(`tel:${barbeariaInfo.telefone}`, '_self')
  }

  const handleWhatsApp = () => {
    const message = encodeURIComponent('Olá! Gostaria de mais informações sobre os serviços.')
    window.open(`https://wa.me/${barbeariaInfo.whatsapp}?text=${message}`, '_blank')
  }

  const diasSemana = [
    { key: 'segunda', label: 'Segunda-feira' },
    { key: 'terca', label: 'Terça-feira' },
    { key: 'quarta', label: 'Quarta-feira' },
    { key: 'quinta', label: 'Quinta-feira' },
    { key: 'sexta', label: 'Sexta-feira' },
    { key: 'sabado', label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-gradient-to-r from-blue-50 to-green-50 p-6">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold text-text-primary">
              <MapPin className="h-6 w-6 text-green-600" />
              Como Chegar
            </h2>
            <p className="mt-1 text-text-muted">
              Encontre nossa localização e informações de contato
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="max-h-[75vh] space-y-6 overflow-y-auto p-6">
          {/* Endereço */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-green-600" />
                Endereço
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium text-text-primary">{barbeariaInfo.nome}</p>
                <p className="text-text-muted">{enderecoCompleto}</p>
              </div>

              {/* Botões de navegação */}
              <div className="mt-4 flex gap-2">
                <Button
                  onClick={handleOpenMaps}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <Navigation className="mr-2 h-4 w-4" />
                  Google Maps
                </Button>
                <Button
                  onClick={handleOpenWaze}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <Car className="mr-2 h-4 w-4" />
                  Waze
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Contato */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Phone className="h-5 w-5 text-blue-600" />
                Contato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Telefone:</span>
                  <span className="font-medium">{barbeariaInfo.telefone}</span>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCall} variant="outline" size="sm" className="flex-1">
                    <Phone className="mr-2 h-4 w-4" />
                    Ligar
                  </Button>
                  <Button
                    onClick={handleWhatsApp}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    <Bus className="mr-2 h-4 w-4" />
                    WhatsApp
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Horário de Funcionamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-primary-gold" />
                Horário de Funcionamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {diasSemana.map((dia) => {
                  const horario =
                    barbeariaInfo.horarioFuncionamento[
                      dia.key as keyof typeof barbeariaInfo.horarioFuncionamento
                    ]
                  const isToday = new Date().getDay() === diasSemana.indexOf(dia) + 1
                  const isClosed = horario === 'Fechado'

                  return (
                    <div
                      key={dia.key}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                        isToday ? 'border border-primary-gold/20 bg-primary-gold/10' : ''
                      }`}
                    >
                      <span
                        className={`font-medium ${isToday ? 'text-primary-gold' : 'text-text-primary'}`}
                      >
                        {dia.label}
                        {isToday && <span className="ml-2 text-xs">(Hoje)</span>}
                      </span>
                      <span
                        className={`${
                          isClosed ? 'text-red-600' : 'text-text-muted'
                        } ${isToday ? 'font-medium' : ''}`}
                      >
                        {horario}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Informações adicionais */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-blue-100 p-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="mb-1 font-medium text-blue-900">Dicas para chegar</h4>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li>• Estacionamento gratuito na rua</li>
                    <li>• Próximo ao metrô Centro (5 min a pé)</li>
                    <li>• Várias linhas de ônibus passam na região</li>
                    <li>• Acesso facilitado para cadeirantes</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 p-6">
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LocalizacaoModal
