-- Migração para criar tabela de movimentações do fluxo de caixa
-- Data: 2025-02-05
-- Descrição: Criar tabela específica para controle detalhado de movimentações

-- Criar tabela de movimentações do fluxo de caixa
CREATE TABLE IF NOT EXISTS movimentacoes_fluxo_caixa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ENTRADA', 'SAIDA')),
    valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),
    descricao TEXT NOT NULL,
    categoria VARCHAR(50) DEFAULT 'OPERACIONAL' CHECK (categoria IN ('OPERACIONAL', 'INVESTIMENTO', 'FINANCIAMENTO')),
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'REALIZADA' CHECK (status IN ('PENDENTE', 'REALIZADA', 'CANCELADA')),
    transacao_id UUID REFERENCES transacoes_financeiras(id) ON DELETE CASCADE,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_movimentacoes_fluxo_data ON movimentacoes_fluxo_caixa(data);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_fluxo_tipo ON movimentacoes_fluxo_caixa(tipo);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_fluxo_status ON movimentacoes_fluxo_caixa(status);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_fluxo_transacao ON movimentacoes_fluxo_caixa(transacao_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_movimentacoes_fluxo_updated_at 
    BEFORE UPDATE ON movimentacoes_fluxo_caixa 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE movimentacoes_fluxo_caixa ENABLE ROW LEVEL SECURITY;

-- Política básica - permitir acesso para usuários autenticados
CREATE POLICY "Permitir acesso básico movimentações" ON movimentacoes_fluxo_caixa
    FOR ALL USING (true);

-- Comentário na tabela
COMMENT ON TABLE movimentacoes_fluxo_caixa IS 'Registro detalhado de movimentações do fluxo de caixa';

-- Inserir dados históricos baseados nas transações existentes
INSERT INTO movimentacoes_fluxo_caixa (tipo, valor, descricao, categoria, data, status, transacao_id)
SELECT 
    CASE 
        WHEN t.tipo = 'RECEITA' THEN 'ENTRADA'
        WHEN t.tipo IN ('DESPESA', 'COMISSAO') THEN 'SAIDA'
    END as tipo,
    t.valor,
    t.descricao,
    'OPERACIONAL' as categoria,
    DATE(t.data_transacao) as data,
    'REALIZADA' as status,
    t.id as transacao_id
FROM transacoes_financeiras t
WHERE t.status = 'CONFIRMADA'
ON CONFLICT DO NOTHING;