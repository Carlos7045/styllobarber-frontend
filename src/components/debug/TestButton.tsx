'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'

export function TestButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleClick = async () => {
    setIsLoading(true)
    try {
      console.log('Botão clicado - redirecionando para /login')
      await router.push('/login')
    } catch (error) {
      console.error('Erro ao redirecionar:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleClick}
      loading={isLoading}
      size="lg"
      className="animate-scale-in"
    >
      {isLoading ? 'Redirecionando...' : 'Começar Agora'}
    </Button>
  )
}