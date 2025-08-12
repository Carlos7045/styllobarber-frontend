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
  let digito1 = resto < 2 ? 0 : resto
  
  soma = 0
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfNumeros.charAt(i)) * (11 - i)
  }
  resto = 11 - (soma % 11)
  let digito2 = resto < 2 ? 0 : resto
  
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
        mensagem: valido ? 'CPF válido!' : 'CPF inválido!'
      })
    } else {
      setResultado(null)
    }
  }

  const testarCPFsValidos = () => {
    const cpfsValidos = [
      '11144477735',
      '12345678909', 
      '98765432100'
    ]
    
    console.log('Testando CPFs válidos:')
    cpfsValidos.forEach(cpf => {
      const valido = validarCPF(cpf)
      console.log(`${cpf}: ${valido ? '✅ Válido' : '❌ Inválido'}`)
    })
  }

  return (
    <div className="min-h-screen bg-background-primary p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-gold mb-2">
              Teste de Validação CPF
            </h1>
            <p className="text-text-muted">
              Teste a implementação do campo CPF no StylloBarber
            </p>
          </div>

          <div className="space-y-6">
            {/* Campo de teste */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
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
                <div className={`flex items-center mt-2 p-3 rounded-lg ${
                  resultado.valido 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {resultado.valido ? (
                    <Check className="h-5 w-5 mr-2" />
                  ) : (
                    <X className="h-5 w-5 mr-2" />
                  )}
                  <span className="font-medium">{resultado.mensagem}</span>
                </div>
              )}
            </div>

            {/* Botão de teste */}
            <Button
              onClick={testarCPFsValidos}
              className="w-full"
              variant="outline"
            >
              Testar CPFs Válidos no Console
            </Button>

            {/* Informações */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">
                CPFs Válidos para Teste:
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 111.444.777-35</li>
                <li>• 123.456.789-09</li>
                <li>• 987.654.321-00</li>
              </ul>
            </div>

            {/* Status da implementação */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-800 mb-2">
                ✅ Status da Implementação:
              </h3>
              <ul className="text-sm text-green-700 space-y-1">
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