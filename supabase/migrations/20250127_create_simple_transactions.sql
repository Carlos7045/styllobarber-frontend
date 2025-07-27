-- Migração simplificada para transações básicas
-- Data: 2025-01-27
-- Descrição: Criar tabela básica de transações se não existir

-- Verificar se a tabela já existe antes de criar
DO $$ 
BEGIN
    -- Criar tabela de transações financeiras se não existir
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transacoes_financeiras') THEN
        CREATE TABLE transacoes_financeiras (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('RECEITA', 'DESPESA', 'COMISSAO')),
            valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),
            descricao TEXT NOT NULL,
            metodo_pagamento VARCHAR(20) CHECK (metodo_pagamento IN ('DINHEIRO', 'PIX', 'CARTAO_DEBITO', 'CARTAO_CREDITO')),
            status VARCHAR(20) DEFAULT 'CONFIRMADA' CHECK (status IN ('PENDENTE', 'CONFIRMADA', 'CANCELADA')),
            data_transacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            observacoes TEXT,
            categoria_id UUID,
            barbeiro_id UUID,
            agendamento_id UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Criar índices básicos
        CREATE INDEX idx_transacoes_data_tipo ON transacoes_financeiras(data_transacao, tipo);
        CREATE INDEX idx_transacoes_status ON transacoes_financeiras(status);
        CREATE INDEX idx_transacoes_barbeiro ON transacoes_financeiras(barbeiro_id);

        -- Inserir algumas transações de exemplo
        INSERT INTO transacoes_financeiras (tipo, valor, descricao, metodo_pagamento, status, data_transacao) VALUES
        ('RECEITA', 45.00, 'Corte + Barba', 'DINHEIRO', 'CONFIRMADA', NOW() - INTERVAL '30 minutes'),
        ('RECEITA', 25.00, 'Corte Simples', 'PIX', 'CONFIRMADA', NOW() - INTERVAL '1 hour'),
        ('DESPESA', 120.00, 'Compra de produtos', NULL, 'CONFIRMADA', NOW() - INTERVAL '2 hours'),
        ('RECEITA', 20.00, 'Barba', 'CARTAO_DEBITO', 'CONFIRMADA', NOW() - INTERVAL '3 hours'),
        ('DESPESA', 80.00, 'Material de limpeza', NULL, 'CONFIRMADA', NOW() - INTERVAL '4 hours');

        RAISE NOTICE 'Tabela transacoes_financeiras criada com dados de exemplo';
    ELSE
        RAISE NOTICE 'Tabela transacoes_financeiras já existe';
    END IF;

    -- Criar tabela de categorias se não existir
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'categorias_financeiras') THEN
        CREATE TABLE categorias_financeiras (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            nome VARCHAR(100) NOT NULL,
            tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('RECEITA', 'DESPESA')),
            cor VARCHAR(7) DEFAULT '#6B7280',
            orcamento_mensal DECIMAL(10,2),
            ativo BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Inserir categorias padrão
        INSERT INTO categorias_financeiras (nome, tipo, cor) VALUES
        ('Serviços', 'RECEITA', '#22C55E'),
        ('Produtos', 'RECEITA', '#3B82F6'),
        ('Produtos', 'DESPESA', '#EF4444'),
        ('Equipamentos', 'DESPESA', '#F59E0B'),
        ('Limpeza', 'DESPESA', '#10B981'),
        ('Marketing', 'DESPESA', '#8B5CF6'),
        ('Outros', 'DESPESA', '#6B7280');

        RAISE NOTICE 'Tabela categorias_financeiras criada com categorias padrão';
    ELSE
        RAISE NOTICE 'Tabela categorias_financeiras já existe';
    END IF;

    -- Criar tabela de funcionários básica se não existir
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'funcionarios') THEN
        CREATE TABLE funcionarios (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            nome VARCHAR(100) NOT NULL,
            email VARCHAR(100),
            role VARCHAR(20) DEFAULT 'BARBEIRO' CHECK (role IN ('ADMIN', 'BARBEIRO', 'CLIENTE')),
            ativo BOOLEAN DEFAULT true,
            user_id UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Inserir funcionários de exemplo
        INSERT INTO funcionarios (nome, email, role) VALUES
        ('João Silva', 'joao@styllobarber.com', 'BARBEIRO'),
        ('Pedro Santos', 'pedro@styllobarber.com', 'BARBEIRO'),
        ('Carlos Oliveira', 'carlos@styllobarber.com', 'BARBEIRO'),
        ('Admin Sistema', 'admin@styllobarber.com', 'ADMIN');

        RAISE NOTICE 'Tabela funcionarios criada com funcionários de exemplo';
    ELSE
        RAISE NOTICE 'Tabela funcionarios já existe';
    END IF;

END $$;

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_transacoes_updated_at') THEN
        CREATE TRIGGER update_transacoes_updated_at 
            BEFORE UPDATE ON transacoes_financeiras 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Habilitar RLS se as tabelas foram criadas
DO $$
BEGIN
    -- RLS para transações
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transacoes_financeiras') THEN
        ALTER TABLE transacoes_financeiras ENABLE ROW LEVEL SECURITY;
        
        -- Política básica - todos podem ver e inserir (para desenvolvimento)
        DROP POLICY IF EXISTS "Permitir acesso básico" ON transacoes_financeiras;
        CREATE POLICY "Permitir acesso básico" ON transacoes_financeiras
            FOR ALL USING (true);
    END IF;

    -- RLS para categorias
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'categorias_financeiras') THEN
        ALTER TABLE categorias_financeiras ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Permitir acesso básico" ON categorias_financeiras;
        CREATE POLICY "Permitir acesso básico" ON categorias_financeiras
            FOR ALL USING (true);
    END IF;

    -- RLS para funcionários
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'funcionarios') THEN
        ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Permitir acesso básico" ON funcionarios;
        CREATE POLICY "Permitir acesso básico" ON funcionarios
            FOR ALL USING (true);
    END IF;
END $$;