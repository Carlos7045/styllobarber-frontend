/**
 * Exemplo simples de uso do sistema de validação
 * Demonstra como usar as validações implementadas
 */

'use client'

import React from 'react'
import { useFormValidation } from '@/hooks/use-form-validation'
import { userSchema, type UserFormData } from '@/lib/validation-schemas'
import { OperationResult } from '@/lib/error-handler'

// Exemplo de formulário simples
export function ExampleForm() {
  // Simular uma operação de API
  const handleSubmit = async (data: UserFormData): Promise<OperationResult<any>> => {
    // Simular delay de rede
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Simular sucesso ou erro baseado no email
    if (data.email.includes('error')) {
      return {
        success: false,
        error: {
          id: 'test-error',
          type: 'validation' as any,
          severity: 'medium' as any,
          message: 'Email não pode conter "error"',
          timestamp: new Date(),
          retryable: false,
        },
      }
    }

    return {
      success: true,
      data: { id: '123', ...data },
    }
  }

  const {
    register,
    handleSubmit: handleFormSubmit,
    formState,
    getFieldState,
  } = useFormValidation<UserFormData>({
    schema: userSchema,
    onSubmit: handleSubmit,
    defaultValues: {
      nome: '',
      email: '',
      telefone: '',
      role: 'cliente',
      ativo: true,
    },
  })

  return (
    <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-4 text-2xl font-bold">Exemplo de Validação</h2>

      <form onSubmit={handleFormSubmit} className="space-y-4">
        {/* Nome */}
        <div>
          <label className="mb-1 block text-sm font-medium">Nome</label>
          <input
            {...register('nome')}
            className={`w-full rounded-md border px-3 py-2 ${
              getFieldState('nome').hasError ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Digite seu nome"
          />
          {getFieldState('nome').hasError && (
            <p className="mt-1 text-sm text-red-500">{getFieldState('nome').errorMessage}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            {...register('email')}
            type="email"
            className={`w-full rounded-md border px-3 py-2 ${
              getFieldState('email').hasError ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Digite seu email"
          />
          {getFieldState('email').hasError && (
            <p className="mt-1 text-sm text-red-500">{getFieldState('email').errorMessage}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Dica: Use um email com "error" para testar erro de validação
          </p>
        </div>

        {/* Telefone */}
        <div>
          <label className="mb-1 block text-sm font-medium">Telefone</label>
          <input
            {...register('telefone')}
            className={`w-full rounded-md border px-3 py-2 ${
              getFieldState('telefone').hasError ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="(11) 99999-9999"
          />
          {getFieldState('telefone').hasError && (
            <p className="mt-1 text-sm text-red-500">{getFieldState('telefone').errorMessage}</p>
          )}
        </div>

        {/* Role */}
        <div>
          <label className="mb-1 block text-sm font-medium">Função</label>
          <select
            {...register('role')}
            className={`w-full rounded-md border px-3 py-2 ${
              getFieldState('role').hasError ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="admin">Administrador</option>
            <option value="barbeiro">Barbeiro</option>
            <option value="cliente">Cliente</option>
          </select>
          {getFieldState('role').hasError && (
            <p className="mt-1 text-sm text-red-500">{getFieldState('role').errorMessage}</p>
          )}
        </div>

        {/* Erro geral */}
        {formState.errors.root && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-800">{formState.errors.root.message}</p>
          </div>
        )}

        {/* Botão de submit */}
        <button
          type="submit"
          disabled={!formState.canSubmit}
          className={`w-full rounded-md px-4 py-2 font-medium ${
            formState.canSubmit
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'cursor-not-allowed bg-gray-300 text-gray-500'
          }`}
        >
          {formState.isSubmitting ? 'Salvando...' : 'Salvar'}
        </button>

        {/* Debug info */}
        <details className="mt-4 rounded-md bg-gray-100 p-3">
          <summary className="cursor-pointer text-sm font-medium">Debug Info</summary>
          <pre className="mt-2 overflow-auto text-xs">
            {JSON.stringify(
              {
                isValid: formState.isValid,
                isSubmitting: formState.isSubmitting,
                canSubmit: formState.canSubmit,
                errorCount: Object.keys(formState.errors).length,
              },
              null,
              2
            )}
          </pre>
        </details>
      </form>
    </div>
  )
}

// Exemplo de uso direto das validações
export function ValidationExample() {
  const [result, setResult] = React.useState<string>('')

  const testValidation = () => {
    const testData = {
      nome: 'João Silva',
      email: 'joao@email.com',
      telefone: '(11) 99999-9999',
      role: 'cliente' as const,
      ativo: true,
    }

    try {
      const validatedData = userSchema.parse(testData)
      setResult(`✅ Validação bem-sucedida: ${JSON.stringify(validatedData, null, 2)}`)
    } catch (error) {
      setResult(`❌ Erro de validação: ${error}`)
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-4 text-2xl font-bold">Teste de Validação</h2>

      <button
        onClick={testValidation}
        className="w-full rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
      >
        Testar Validação
      </button>

      {result && (
        <div className="mt-4 rounded-md bg-gray-100 p-3">
          <pre className="whitespace-pre-wrap text-xs">{result}</pre>
        </div>
      )}
    </div>
  )
}

// Página de exemplo completa
export default function ValidationExamplePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="mb-8 text-center text-3xl font-bold">Sistema de Validação - Exemplos</h1>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <ExampleForm />
          <ValidationExample />
        </div>

        <div className="mt-8 text-center text-gray-600">
          <p>
            Este exemplo demonstra o uso do sistema de validação implementado. Teste diferentes
            cenários para ver como funciona o tratamento de erros.
          </p>
        </div>
      </div>
    </div>
  )
}
