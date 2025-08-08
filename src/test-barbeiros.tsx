'use client'

import React from 'react'
import { useAdminFuncionarios } from '@/domains/users/hooks/use-admin-funcionarios'

/**
 * Componente de teste simples para verificar barbeiros
 * Executar: npm run dev e acessar /test-barbeiros
 */
export default function TestBarbeiros() {
  const { funcionarios, loading, error } = useAdminFuncionarios()

  console.log('🔍 Debug Barbeiros:', { funcionarios, loading, error })

  if (loading) {
    return <div className="p-8">Carregando barbeiros...</div>
  }

  if (error) {
    return <div className="p-8 text-red-600">Erro: {error}</div>
  }

  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold">Teste de Barbeiros</h1>
      <p className="mb-4">Total de funcionários: {funcionarios.length}</p>

      {funcionarios.length === 0 ? (
        <p className="text-yellow-600">Nenhum funcionário cadastrado.</p>
      ) : (
        <div className="space-y-4">
          {funcionarios.map((funcionario) => (
            <div key={funcionario.id} className="rounded border p-4">
              <h3 className="font-bold">{funcionario.profile?.nome || 'Nome não informado'}</h3>
              <p>Status: {funcionario.ativo ? 'Ativo' : 'Inativo'}</p>
              <p>Email: {funcionario.profile?.email}</p>
              <p>Especialidades: {funcionario.especialidades?.join(', ') || 'Nenhuma'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
