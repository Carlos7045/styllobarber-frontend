'use client'

import React from 'react'
import { TestFuncionariosAdmin } from '@/components/debug/TestFuncionariosAdmin'

export default function TestFuncionariosPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-800">🧪 Teste do Hook de Funcionários</h1>

        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <h2 className="mb-2 text-lg font-semibold">ℹ️ Informações do Teste</h2>
          <p className="mb-2 text-gray-600">
            Esta página testa o hook{' '}
            <code className="rounded bg-gray-100 px-1">useFuncionariosAdmin</code>
          </p>
          <p className="text-gray-600">Verifique o console do navegador para logs detalhados.</p>
        </div>

        <TestFuncionariosAdmin />
      </div>
    </div>
  )
}
