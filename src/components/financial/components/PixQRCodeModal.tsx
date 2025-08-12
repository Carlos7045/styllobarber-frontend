'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Copy, Check, Smartphone, QrCode } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import { formatCurrency } from '../utils'

interface PixQRCodeModalProps {
  isOpen: boolean
  onClose: () => void
  qrCode?: string
  copyAndPaste?: string
  valor: number
  descricao: string
  cliente?: string
  paymentId?: string
}

export const PixQRCodeModal = ({
  isOpen,
  onClose,
  qrCode,
  copyAndPaste,
  valor,
  descricao,
  cliente,
  paymentId
}: PixQRCodeModalProps) => {
  const [copied, setCopied] = useState(false)

  const handleCopyPix = async () => {
    if (!copyAndPaste) return

    try {
      await navigator.clipboard.writeText(copyAndPaste)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Erro ao copiar PIX:', error)
      // Fallback para navegadores mais antigos
      const textArea = document.createElement('textarea')
      textArea.value = copyAndPaste
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative mx-4 w-full max-w-md"
      >
        <Card className="bg-white dark:bg-secondary-graphite-light border-2 border-green-200 dark:border-green-800/30 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-green-200 dark:border-green-800/30">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <QrCode className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  PIX Gerado
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Pagamento via Asaas
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Conteúdo */}
          <div className="p-6 space-y-6">
            {/* Informações do Pagamento */}
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800/30">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Valor:</span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(valor)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Descrição:</span>
                  <span className="text-sm text-gray-900 dark:text-white font-medium">
                    {descricao}
                  </span>
                </div>
                {cliente && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Cliente:</span>
                    <span className="text-sm text-gray-900 dark:text-white font-medium">
                      {cliente}
                    </span>
                  </div>
                )}
                {paymentId && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">ID Asaas:</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {paymentId}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* QR Code */}
            {qrCode ? (
              <div className="text-center">
                <div className="bg-white p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 inline-block">
                  <img
                    src={`data:image/png;base64,${qrCode}`}
                    alt="QR Code PIX"
                    className="w-48 h-48 mx-auto"
                  />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
                  Escaneie o QR Code com o app do seu banco
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <QrCode className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  QR Code não disponível
                </p>
              </div>
            )}

            {/* Código PIX Copia e Cola */}
            {copyAndPaste && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Smartphone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ou copie o código PIX:
                  </span>
                </div>
                
                <div className="bg-gray-50 dark:bg-secondary-graphite p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-mono text-gray-600 dark:text-gray-300 break-all leading-relaxed">
                    {copyAndPaste}
                  </p>
                </div>

                <Button
                  onClick={handleCopyPix}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={copied}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar Código PIX
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Instruções */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800/30">
              <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2">
                Como pagar:
              </h4>
              <ol className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                <li>Abra o app do seu banco</li>
                <li>Escolha a opção PIX</li>
                <li>Escaneie o QR Code ou cole o código</li>
                <li>Confirme o pagamento</li>
              </ol>
            </div>

            {/* Botões de Ação */}
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Fechar
              </Button>
              <Button
                onClick={() => window.print()}
                variant="outline"
                className="flex-1"
              >
                Imprimir
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}