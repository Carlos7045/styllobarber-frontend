'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { supabase } from '@/lib/supabase'

export default function MigratePaymentsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const applyMigration = async () => {
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      console.log('🔄 Aplicando migração de campos de pagamento...')

      // SQL para adicionar campos de pagamento
      const migrationSQL = `
        -- Adicionar campos de pagamento à tabela appointments
        ALTER TABLE appointments 
        ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
        ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('advance', 'cash', 'card', 'pix', 'local')),
        ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS asaas_payment_id TEXT,
        ADD COLUMN IF NOT EXISTS discount_applied DECIMAL(5,2) DEFAULT 0;

        -- Comentários para documentação
        COMMENT ON COLUMN appointments.payment_status IS 'Status do pagamento: pending, paid, failed, refunded';
        COMMENT ON COLUMN appointments.payment_method IS 'Método de pagamento: advance (antecipado), cash, card, pix, local';
        COMMENT ON COLUMN appointments.payment_date IS 'Data e hora do pagamento';
        COMMENT ON COLUMN appointments.asaas_payment_id IS 'ID do pagamento no Asaas';
        COMMENT ON COLUMN appointments.discount_applied IS 'Percentual de desconto aplicado (ex: 10.00 para 10%)';

        -- Índices para melhor performance
        CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON appointments(payment_status);
        CREATE INDEX IF NOT EXISTS idx_appointments_payment_method ON appointments(payment_method);
        CREATE INDEX IF NOT EXISTS idx_appointments_asaas_payment_id ON appointments(asaas_payment_id);
      `

      const { error: migrationError } = await supabase.rpc('exec_sql', {
        sql: migrationSQL
      })

      if (migrationError) {
        // Tentar método alternativo
        console.log('⚠️ Tentando método alternativo...')
        
        const queries = [
          "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_status TEXT",
          "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_method TEXT", 
          "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ",
          "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS asaas_payment_id TEXT",
          "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS discount_applied DECIMAL(5,2) DEFAULT 0"
        ]

        for (const query of queries) {
          const { error } = await supabase.rpc('exec_sql', { sql: query })
          if (error) {
            console.warn('⚠️ Erro em query individual:', query, error)
          }
        }
      }

      // Atualizar dados existentes
      const updateSQL = `
        -- Atualizar agendamentos existentes
        UPDATE appointments 
        SET payment_status = 'pending', 
            payment_method = 'local'
        WHERE status = 'concluido' 
          AND payment_status IS NULL;

        UPDATE appointments 
        SET payment_status = 'pending', 
            payment_method = 'local'
        WHERE status IN ('pendente', 'confirmado') 
          AND payment_status IS NULL;

        UPDATE appointments 
        SET payment_status = NULL, 
            payment_method = NULL
        WHERE status = 'cancelado';
      `

      const { error: updateError } = await supabase.rpc('exec_sql', {
        sql: updateSQL
      })

      if (updateError) {
        console.warn('⚠️ Erro ao atualizar dados existentes:', updateError)
      }

      // Verificar se as colunas foram criadas
      const { data: columns, error: checkError } = await supabase
        .rpc('exec_sql', {
          sql: `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'appointments' 
              AND column_name IN ('payment_status', 'payment_method', 'payment_date', 'asaas_payment_id', 'discount_applied')
            ORDER BY column_name;
          `
        })

      if (checkError) {
        throw new Error(`Erro ao verificar colunas: ${checkError.message}`)
      }

      console.log('✅ Migração aplicada com sucesso!')
      setResult(`
        ✅ Migração aplicada com sucesso!
        
        Colunas criadas:
        ${columns?.map((col: any) => `- ${col.column_name} (${col.data_type})`).join('\n') || 'Verificação não disponível'}
        
        Próximos passos:
        1. Teste o sistema de pagamento
        2. Verifique se não há mais erros
        3. Delete esta página após confirmar que funciona
      `)

    } catch (err) {
      console.error('❌ Erro na migração:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const checkColumns = async () => {
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('payment_status, payment_method, payment_date, asaas_payment_id, discount_applied')
        .limit(1)

      if (error) {
        setError(`Colunas não existem: ${error.message}`)
      } else {
        setResult('✅ Todas as colunas de pagamento existem e estão funcionando!')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="border-gray-700 bg-gray-800">
          <CardHeader>
            <CardTitle className="text-white">🔧 Migração de Campos de Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
              <h3 className="text-yellow-400 font-semibold mb-2">⚠️ Página Temporária</h3>
              <p className="text-yellow-300 text-sm">
                Esta página serve para aplicar a migração dos campos de pagamento na tabela appointments.
                Delete esta página após usar.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={checkColumns}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading ? 'Verificando...' : '🔍 Verificar se Colunas Existem'}
              </Button>

              <Button
                onClick={applyMigration}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Aplicando...' : '🚀 Aplicar Migração'}
              </Button>
            </div>

            {result && (
              <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
                <pre className="text-green-300 text-sm whitespace-pre-wrap">{result}</pre>
              </div>
            )}

            {error && (
              <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <div className="bg-gray-700/50 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">📋 Instruções:</h4>
              <ol className="text-gray-300 text-sm space-y-1 list-decimal list-inside">
                <li>Primeiro clique em "Verificar se Colunas Existem"</li>
                <li>Se der erro, clique em "Aplicar Migração"</li>
                <li>Teste o sistema de pagamento</li>
                <li>Delete esta página após confirmar que funciona</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}