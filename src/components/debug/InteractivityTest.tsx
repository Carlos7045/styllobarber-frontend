'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function InteractivityTest() {
  const [count, setCount] = useState(0)
  const [message, setMessage] = useState('')

  const handleClick = () => {
    setCount(prev => prev + 1)
    setMessage(`Botão clicado ${count + 1} vezes!`)
    console.log('Botão clicado!', count + 1)
  }

  const handleAlert = () => {
    alert('Botão funcionando!')
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Teste de Interatividade</h2>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">Contador: {count}</p>
          <Button onClick={handleClick} variant="primary">
            Clique aqui ({count})
          </Button>
        </div>

        <div>
          <Button onClick={handleAlert} variant="secondary">
            Mostrar Alert
          </Button>
        </div>

        <div>
          <button 
            onClick={() => setMessage('Botão HTML nativo funcionando!')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Botão HTML Nativo
          </button>
        </div>

        {message && (
          <div className="p-3 bg-green-100 text-green-800 rounded">
            {message}
          </div>
        )}
      </div>
    </div>
  )
}