'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface AuthLoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  showLogo?: boolean
}

export function AuthLoadingState({ 
  message = 'Carregando...', 
  size = 'md',
  showLogo = true 
}: AuthLoadingStateProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  const containerClasses = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4'
  }

  return (
    <div className={`flex flex-col items-center justify-center ${containerClasses[size]}`}>
      {showLogo && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-2"
        >
          <div className="text-2xl font-bold text-amber-500">
            Styllo<span className="text-white">Barber</span>
          </div>
        </motion.div>
      )}
      
      <div className="flex items-center gap-2">
        {/* Spinner animado */}
        <motion.div
          className={`${sizeClasses[size]} border-2 border-amber-500/20 border-t-amber-500 rounded-full`}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Texto com animação de fade */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-300 text-sm font-medium"
        >
          {message}
        </motion.span>
      </div>
      
      {/* Barra de progresso animada */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="h-0.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
        style={{ maxWidth: '120px' }}
      />
    </div>
  )
}

// Componente para loading em botões
interface ButtonLoadingProps {
  isLoading: boolean
  children: React.ReactNode
  loadingText?: string
}

export function ButtonLoading({ isLoading, children, loadingText = 'Carregando...' }: ButtonLoadingProps) {
  return (
    <>
      {isLoading ? (
        <div className="flex items-center justify-center gap-2">
          <motion.div
            className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <span>{loadingText}</span>
        </div>
      ) : (
        children
      )}
    </>
  )
}

// Componente para loading de página inteira
export function FullPageLoading({ message = 'Inicializando sistema...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <AuthLoadingState message={message} size="lg" showLogo={true} />
    </div>
  )
}
