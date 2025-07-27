-- Migração para tabelas de fluxo de caixa
-- Data: 2025-01-27
-- Descrição: Criar estruturas para controle de fluxo de caixa

-- Tabela para configurações financeiras
CREATE TABLE IF NOT EXISTS configuracoes_financeiras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT NOT NULL,
    descricao TEXT,
    tipo VARCHAR(50) DEFAULT 'STRING' CHECK (tipo IN ('STRING', 'NUMBER', 'BOOLEAN', 'JSON')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configurações padrão
INSERT INTO configuracoes_financeiras (chave, valor, descricao, tipo) VALUES
('limite_minimo_caixa', '5000', 'Limite mínimo de saldo em caixa para alertas', 'NUMBER'),
('dias_projecao_padrao', '30', 'Número padrão de dias para projeções', 'NUMBER'),
('auto_refresh_interval', '30000', 'Intervalo de atualização automática em milissegundos', 'NUMBER'),
('alertas_email_ativo', 'true', 'Enviar alertas por email', 'BOOLEAN'),
('alertas_whatsapp_ativo', 'false', 'Enviar alertas por WhatsApp', 'BOOLEAN')
ON CONFLICT (chave) DO NOTHING;

-- Tabela para histórico de alertas de fluxo de caixa
CREATE TABLE IF NOT EXISTS alertas_fluxo_caixa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('SALDO_BAIXO', 'PROJECAO_NEGATIVA', 'META_ATINGIDA', 'LIMITE_ULTRAPASSADO')),
    titulo VARCHAR(200) NOT NULL,
    mensagem TEXT NOT NULL,
    saldo_atual DECIMAL(10,2),
    limite_configurado DECIMAL(10,2),
    data_alerta TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    lido BOOLEAN DEFAULT FALSE,
    usuario_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para projeções de fluxo de caixa
CREATE TABLE IF NOT EXISTS projecoes_fluxo_caixa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_projecao DATE NOT NULL,
    entradas_projetadas DECIMAL(10,2) DEFAULT 0,
    saidas_projetadas DECIMAL(10,2) DEFAULT 0,
    saldo_projetado DECIMAL(10,2) NOT NULL,
    cenario VARCHAR(20) DEFAULT 'REALISTA' CHECK (cenario IN ('OTIMISTA', 'REALISTA', 'PESSIMISTA')),
    base_calculo JSONB, -- Dados usados para o cálculo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(data_projecao, cenario)
);

-- View materializada para métricas de fluxo de caixa
CREATE MATERIALIZED VIEW IF NOT EXISTS metricas_fluxo_caixa AS
SELECT 
    DATE_TRUNC('day', data_transacao) as data,
    SUM(CASE WHEN tipo = 'RECEITA' AND status = 'CONFIRMADA' THEN valor ELSE 0 END) as entradas_realizadas,
    SUM(CASE WHEN tipo = 'DESPESA' AND status = 'CONFIRMADA' THEN valor ELSE 0 END) as saidas_realizadas,
    SUM(CASE 
        WHEN tipo = 'RECEITA' AND status = 'CONFIRMADA' THEN valor 
        WHEN tipo = 'DESPESA' AND status = 'CONFIRMADA' THEN -valor 
        ELSE 0 
    END) as saldo_diario,
    COUNT(CASE WHEN tipo = 'RECEITA' AND status = 'CONFIRMADA' THEN 1 END) as numero_entradas,
    COUNT(CASE WHEN tipo = 'DESPESA' AND status = 'CONFIRMADA' THEN 1 END) as numero_saidas
FROM transacoes_financeiras 
WHERE data_transacao >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', data_transacao)
ORDER BY data DESC;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_transacoes_data_tipo_status ON transacoes_financeiras(data_transacao, tipo, status);
CREATE INDEX IF NOT EXISTS idx_alertas_fluxo_data_tipo ON alertas_fluxo_caixa(data_alerta, tipo);
CREATE INDEX IF NOT EXISTS idx_projecoes_data_cenario ON projecoes_fluxo_caixa(data_projecao, cenario);
CREATE INDEX IF NOT EXISTS idx_configuracoes_chave ON configuracoes_financeiras(chave);

-- Função para calcular saldo atual
CREATE OR REPLACE FUNCTION calcular_saldo_atual()
RETURNS DECIMAL(10,2) AS $$
DECLARE
    saldo DECIMAL(10,2) := 0;
BEGIN
    SELECT COALESCE(
        SUM(CASE 
            WHEN tipo = 'RECEITA' THEN valor 
            WHEN tipo = 'DESPESA' THEN -valor 
            ELSE 0 
        END), 0
    ) INTO saldo
    FROM transacoes_financeiras 
    WHERE status = 'CONFIRMADA';
    
    RETURN saldo;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar alertas de saldo baixo
CREATE OR REPLACE FUNCTION verificar_alerta_saldo_baixo()
RETURNS BOOLEAN AS $$
DECLARE
    saldo_atual DECIMAL(10,2);
    limite_minimo DECIMAL(10,2);
    alerta_existe BOOLEAN := FALSE;
BEGIN
    -- Obter saldo atual
    SELECT calcular_saldo_atual() INTO saldo_atual;
    
    -- Obter limite mínimo configurado
    SELECT CAST(valor AS DECIMAL(10,2)) INTO limite_minimo
    FROM configuracoes_financeiras 
    WHERE chave = 'limite_minimo_caixa';
    
    -- Se não há configuração, usar padrão
    IF limite_minimo IS NULL THEN
        limite_minimo := 5000;
    END IF;
    
    -- Verificar se saldo está abaixo do limite
    IF saldo_atual < limite_minimo THEN
        -- Verificar se já existe alerta recente (últimas 24h)
        SELECT EXISTS(
            SELECT 1 FROM alertas_fluxo_caixa 
            WHERE tipo = 'SALDO_BAIXO' 
            AND data_alerta >= NOW() - INTERVAL '24 hours'
        ) INTO alerta_existe;
        
        -- Se não existe alerta recente, criar um novo
        IF NOT alerta_existe THEN
            INSERT INTO alertas_fluxo_caixa (
                tipo, 
                titulo, 
                mensagem, 
                saldo_atual, 
                limite_configurado
            ) VALUES (
                'SALDO_BAIXO',
                'Saldo Abaixo do Limite Mínimo',
                'O saldo atual (' || saldo_atual || ') está abaixo do limite configurado (' || limite_minimo || ')',
                saldo_atual,
                limite_minimo
            );
        END IF;
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Trigger para verificar alertas após inserção/atualização de transações
CREATE OR REPLACE FUNCTION trigger_verificar_alertas()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar alerta de saldo baixo
    PERFORM verificar_alerta_saldo_baixo();
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_alertas_transacoes ON transacoes_financeiras;
CREATE TRIGGER trigger_alertas_transacoes
    AFTER INSERT OR UPDATE OR DELETE ON transacoes_financeiras
    FOR EACH ROW
    EXECUTE FUNCTION trigger_verificar_alertas();

-- Função para atualizar view materializada
CREATE OR REPLACE FUNCTION refresh_metricas_fluxo_caixa()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW metricas_fluxo_caixa;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar automaticamente as métricas
CREATE OR REPLACE FUNCTION trigger_refresh_metricas()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar view materializada de forma assíncrona
    PERFORM pg_notify('refresh_metricas', 'fluxo_caixa');
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para refresh automático
DROP TRIGGER IF EXISTS trigger_refresh_metricas_transacoes ON transacoes_financeiras;
CREATE TRIGGER trigger_refresh_metricas_transacoes
    AFTER INSERT OR UPDATE OR DELETE ON transacoes_financeiras
    FOR EACH ROW
    EXECUTE FUNCTION trigger_refresh_metricas();

-- Políticas RLS (Row Level Security)
ALTER TABLE configuracoes_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas_fluxo_caixa ENABLE ROW LEVEL SECURITY;
ALTER TABLE projecoes_fluxo_caixa ENABLE ROW LEVEL SECURITY;

-- Política para configurações (apenas admins podem modificar)
CREATE POLICY "Admins podem gerenciar configurações" ON configuracoes_financeiras
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM funcionarios 
            WHERE funcionarios.user_id = auth.uid() 
            AND funcionarios.role = 'ADMIN'
        )
    );

-- Política para alertas (usuários podem ver seus próprios alertas)
CREATE POLICY "Usuários podem ver alertas" ON alertas_fluxo_caixa
    FOR SELECT USING (
        usuario_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM funcionarios 
            WHERE funcionarios.user_id = auth.uid() 
            AND funcionarios.role IN ('ADMIN', 'BARBEIRO')
        )
    );

-- Política para projeções (usuários autenticados podem ver)
CREATE POLICY "Usuários autenticados podem ver projeções" ON projecoes_fluxo_caixa
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Comentários nas tabelas
COMMENT ON TABLE configuracoes_financeiras IS 'Configurações do sistema financeiro';
COMMENT ON TABLE alertas_fluxo_caixa IS 'Histórico de alertas do fluxo de caixa';
COMMENT ON TABLE projecoes_fluxo_caixa IS 'Projeções calculadas do fluxo de caixa';
COMMENT ON MATERIALIZED VIEW metricas_fluxo_caixa IS 'Métricas agregadas do fluxo de caixa para performance';

-- Atualizar view materializada inicial
SELECT refresh_metricas_fluxo_caixa();