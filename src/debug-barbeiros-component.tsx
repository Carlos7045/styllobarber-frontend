/**
 * Componente de debug para testar o carregamento de barbeiros
 * Arquivo temporário para diagnóstico
 */

import React from 'react'
import { useFuncionariosPublicos } from '@/domains/users/hooks/use-funcionarios-publicos'

export function DebugBarbeiros() {
  const { funcionarios, loading, error, refetch } = useFuncionariosPublicos()

  return (
    <div className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow-lg">
      <h2 className="mb-4 text-2xl font-bold">🔍 Debug - Barbeiros</h2>

      <div className="space-y-4">
        <div className="rounded-lg bg-gray-50 p-4">
          <h3 className="mb-2 font-semibold">Status:</h3>
          <ul className="space-y-1 text-sm">
            <li>Loading: {loading ? '✅ Sim' : '❌ Não'}</li>
            <li>Error: {error ? `❌ ${error}` : '✅ Nenhum'}</li>
            <li>Funcionários: {funcionarios?.length || 0}</li>
          </ul>
        </div>

        <div className="rounded-lg bg-blue-50 p-4">
          <h3 className="mb-2 font-semibold">Dados dos Funcionários:</h3>
          {loading ? (
            <p>Carregando...</p>
          ) : funcionarios && funcionarios.length > 0 ? (
            <div className="space-y-2">
              {funcionarios.map((func, index) => (
                <div key={func.id} className="rounded border bg-white p-2">
                  <p>
                    <strong>#{index + 1}</strong>
                  </p>
                  <p>
                    <strong>ID:</strong> {func.id}
                  </p>
                  <p>
                    <strong>Nome:</strong> {func.profiles?.nome || 'N/A'}
                  </p>
                  <p>
                    <strong>Ativo:</strong> {func.ativo ? 'Sim' : 'Não'}
                  </p>
                  <p>
                    <strong>Especialidades:</strong> {func.especialidades?.join(', ') || 'Nenhuma'}
                  </p>
                  <p>
                    <strong>Avatar:</strong> {func.profiles?.avatar_url || 'N/A'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Nenhum funcionário encontrado</p>
          )}
        </div>

        <div className="rounded-lg bg-yellow-50 p-4">
          <h3 className="mb-2 font-semibold">Dados Brutos (JSON):</h3>
          <pre className="max-h-64 overflow-auto rounded bg-gray-100 p-2 text-xs">
            {JSON.stringify({ funcionarios, loading, error }, null, 2)}
          </pre>
        </div>

        <div className="flex gap-2">
          <button
            onClick={refetch}
            disabled={loading}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Carregando...' : 'Recarregar'}
          </button>

          <button
            onClick={() => console.log('Dados atuais:', { funcionarios, loading, error })}
            className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
          >
            Log no Console
          </button>
        </div>
      </div>
    </div>
  )
}

export default DebugBarbeiros
