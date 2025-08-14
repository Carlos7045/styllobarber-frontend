'use client'

import { useState } from 'react'
import { Card, Button, Input } from '@/shared/components/ui'
import { CreditCard, Check, X } from 'lucide-react'

// Função para validar CPF
function validarCPF(cpf: string): boolean {
  if (!cpf) return false

  const cpfNumeros = cpf.replace(/\D/g, '')
  if (cpfNumeros.length !== 11 || /^(\d)\1+$/.test(cpfNumeros)) return false

  let soma = 0
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfNumeros.charAt(i)) * (10 - i)
  }
  let resto = 11 - (soma % 11)
  const digito1 = resto < 2 ? 0 : resto

  soma = 0
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfNumeros.charAt(i)) * (11 - i)
  }
  resto = 11 - (soma % 11)
  const digito2 = resto < 2 ? 0 : resto

  return digito1 === parseInt(cpfNumeros.charAt(9)) && digito2 === parseInt(cpfNumeros.charAt(10))
}

// Função para formatar CPF
function formatarCPF(cpf: string): string {
  const numeros = cpf.replace(/\D/g, '')
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export default function TestCPFPage() {
  const [cpf, setCpf] = useState('')
  const [resultado, setResultado] = useState<{ valido: boolean; mensagem: string } | null>(null)

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatarCPF(e.target.value)
    setCpf(formatted)

    // Validar em tempo real
    if (formatted.length === 14) {
      const valido = validarCPF(formatted)
      setResultado({
        valido,
        mensagem: valido ? 'CPF válido!' : 'CPF inválido!',
      })
    } else {
      setResultado(null)
    }
  }

  const testarCPFsValidos = () => {
    const cpfsValidos = ['11144477735', '12345678909', '98765432100']

    console.log('Testando CPFs válidos:')
    cpfsValidos.forEach((cpf) => {
      const valido = validarCPF(cpf)
      console.log(`${cpf}: ${valido ? '✅ Válido' : '❌ Inválido'}`)
    })
  }

  return (
    <div className="min-h-screen bg-background-primary p-8">
      <div className="mx-auto max-w-2xl">
        <Card className="p-8">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-primary-gold">Teste de Validação CPF</h1>
            <p className="text-text-muted">Teste a implementação do campo CPF no StylloBarber</p>
          </div>

          <div className="space-y-6">
            {/* Campo de teste */}
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">
                Digite um CPF para testar
              </label>
              <Input
                value={cpf}
                onChange={handleCPFChange}
                placeholder="000.000.000-00"
                leftIcon={<CreditCard className="h-4 w-4" />}
                maxLength={14}
                className="text-lg"
              />

              {/* Resultado da validação */}
              {resultado && (
                <div
                  className={`mt-2 flex items-center rounded-lg p-3 ${
                    resultado.valido
                      ? 'border border-green-200 bg-green-50 text-green-800'
                      : 'border border-red-200 bg-red-50 text-red-800'
                  }`}
                >
                  {resultado.valido ? (
                    <Check className="mr-2 h-5 w-5" />
                  ) : (
                    <X className="mr-2 h-5 w-5" />
                  )}
                  <span className="font-medium">{resultado.mensagem}</span>
                </div>
              )}
            </div>

            {/* Botão de teste */}
            <Button onClick={testarCPFsValidos} className="w-full" variant="outline">
              Testar CPFs Válidos no Console
            </Button>

            {/* Informações */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="mb-2 font-medium text-blue-800">CPFs Válidos para Teste:</h3>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>• 111.444.777-35</li>
                <li>• 123.456.789-09</li>
                <li>• 987.654.321-00</li>
              </ul>
            </div>

            {/* Status da implementação */}
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <h3 className="mb-2 font-medium text-green-800">✅ Status da Implementação:</h3>
              <ul className="space-y-1 text-sm text-green-700">
                <li>• ✅ Validação de CPF implementada</li>
                <li>• ✅ Formatação automática funcionando</li>
                <li>• ✅ Campo adicionado no cadastro</li>
                <li>• ✅ Banco de dados migrado</li>
                <li>• ✅ Integração Asaas preparada</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
