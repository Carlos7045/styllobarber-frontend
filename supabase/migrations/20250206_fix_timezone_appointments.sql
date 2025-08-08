-- =====================================================
-- CORREÇÃO DE FUSO HORÁRIO - APPOINTMENTS
-- =====================================================

-- Esta migração corrige problemas de fuso horário na tabela appointments
-- Garante que todas as datas sejam tratadas consistentemente

-- Comentário sobre o problema:
-- O banco está em UTC, mas a aplicação trabalha com horário brasileiro (UTC-3)
-- Esta migração documenta a estrutura correta e adiciona funções auxiliares

-- =====================================================
-- FUNÇÕES AUXILIARES PARA TIMEZONE
-- =====================================================

-- Função para converter UTC para horário brasileiro
CREATE OR REPLACE FUNCTION convert_utc_to_brazil(utc_timestamp TIMESTAMP WITH TIME ZONE)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
  -- Converter para timezone brasileiro
  RETURN utc_timestamp AT TIME ZONE 'America/Sao_Paulo';
END;
$$ LANGUAGE plpgsql;

-- Função para obter horário atual brasileiro
CREATE OR REPLACE FUNCTION now_brazil()
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
  RETURN NOW() AT TIME ZONE 'America/Sao_Paulo';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICAÇÕES DE INTEGRIDADE
-- =====================================================

-- Verificar se existem agendamentos com datas inconsistentes
DO $$
DECLARE
    inconsistent_count INTEGER;
    total_count INTEGER;
BEGIN
    -- Contar total de agendamentos
    SELECT COUNT(*) INTO total_count FROM appointments;
    
    -- Contar agendamentos com possíveis problemas de timezone
    -- (agendamentos marcados para horários muito cedo ou muito tarde)
    SELECT COUNT(*) INTO inconsistent_count 
    FROM appointments 
    WHERE EXTRACT(HOUR FROM data_agendamento AT TIME ZONE 'America/Sao_Paulo') < 6 
       OR EXTRACT(HOUR FROM data_agendamento AT TIME ZONE 'America/Sao_Paulo') > 22;
    
    RAISE NOTICE 'Total de agendamentos: %', total_count;
    RAISE NOTICE 'Agendamentos com possíveis problemas de timezone: %', inconsistent_count;
    
    IF inconsistent_count > 0 THEN
        RAISE NOTICE 'ATENÇÃO: Existem % agendamentos que podem ter problemas de fuso horário', inconsistent_count;
        RAISE NOTICE 'Verifique manualmente se estes horários estão corretos:';
        
        -- Mostrar alguns exemplos
        FOR rec IN 
            SELECT id, data_agendamento, 
                   data_agendamento AT TIME ZONE 'America/Sao_Paulo' as brazil_time
            FROM appointments 
            WHERE EXTRACT(HOUR FROM data_agendamento AT TIME ZONE 'America/Sao_Paulo') < 6 
               OR EXTRACT(HOUR FROM data_agendamento AT TIME ZONE 'America/Sao_Paulo') > 22
            LIMIT 5
        LOOP
            RAISE NOTICE 'ID: %, UTC: %, Brasil: %', rec.id, rec.data_agendamento, rec.brazil_time;
        END LOOP;
    ELSE
        RAISE NOTICE 'Todos os agendamentos parecem ter horários consistentes';
    END IF;
END $$;

-- =====================================================
-- ÍNDICES PARA PERFORMANCE COM TIMEZONE
-- =====================================================

-- Índice para consultas por data no fuso brasileiro
CREATE INDEX IF NOT EXISTS idx_appointments_brazil_date 
ON appointments ((data_agendamento AT TIME ZONE 'America/Sao_Paulo'));

-- Índice para consultas por hora no fuso brasileiro
CREATE INDEX IF NOT EXISTS idx_appointments_brazil_hour 
ON appointments ((EXTRACT(HOUR FROM data_agendamento AT TIME ZONE 'America/Sao_Paulo')));

-- =====================================================
-- VIEWS PARA FACILITAR CONSULTAS
-- =====================================================

-- View que mostra agendamentos com horário brasileiro
CREATE OR REPLACE VIEW appointments_brazil AS
SELECT 
    id,
    cliente_id,
    barbeiro_id,
    service_id,
    data_agendamento as data_agendamento_utc,
    data_agendamento AT TIME ZONE 'America/Sao_Paulo' as data_agendamento_brasil,
    DATE(data_agendamento AT TIME ZONE 'America/Sao_Paulo') as data_brasil,
    TIME(data_agendamento AT TIME ZONE 'America/Sao_Paulo') as hora_brasil,
    status,
    observacoes,
    preco_final,
    created_at,
    updated_at
FROM appointments;

-- Comentário sobre a view
COMMENT ON VIEW appointments_brazil IS 'View que mostra agendamentos com datas convertidas para o fuso horário brasileiro (America/Sao_Paulo)';

-- =====================================================
-- TRIGGER PARA VALIDAR HORÁRIOS DE AGENDAMENTO
-- =====================================================

-- Função para validar horários de funcionamento
CREATE OR REPLACE FUNCTION validate_appointment_time()
RETURNS TRIGGER AS $$
DECLARE
    brazil_hour INTEGER;
    brazil_dow INTEGER; -- day of week (0=Sunday, 6=Saturday)
BEGIN
    -- Extrair hora e dia da semana no fuso brasileiro
    brazil_hour := EXTRACT(HOUR FROM NEW.data_agendamento AT TIME ZONE 'America/Sao_Paulo');
    brazil_dow := EXTRACT(DOW FROM NEW.data_agendamento AT TIME ZONE 'America/Sao_Paulo');
    
    -- Validar horário de funcionamento (8h às 18h)
    IF brazil_hour < 8 OR brazil_hour >= 18 THEN
        RAISE EXCEPTION 'Agendamento fora do horário de funcionamento (8h às 18h). Horário brasileiro: %h', brazil_hour;
    END IF;
    
    -- Validar dias da semana (Segunda a Sábado: 1-6)
    IF brazil_dow = 0 THEN -- Domingo
        RAISE EXCEPTION 'Agendamentos não são permitidos aos domingos';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para validação (comentado por padrão para não quebrar dados existentes)
-- Descomente se quiser ativar a validação:
-- DROP TRIGGER IF EXISTS validate_appointment_time_trigger ON appointments;
-- CREATE TRIGGER validate_appointment_time_trigger
--     BEFORE INSERT OR UPDATE ON appointments
--     FOR EACH ROW EXECUTE FUNCTION validate_appointment_time();

-- =====================================================
-- FUNÇÕES UTILITÁRIAS PARA A APLICAÇÃO
-- =====================================================

-- Função para buscar agendamentos de um dia específico (horário brasileiro)
CREATE OR REPLACE FUNCTION get_appointments_by_brazil_date(target_date DATE)
RETURNS TABLE (
    id UUID,
    cliente_id UUID,
    barbeiro_id UUID,
    service_id UUID,
    data_agendamento_utc TIMESTAMP WITH TIME ZONE,
    data_agendamento_brasil TIMESTAMP,
    hora_brasil TIME,
    status TEXT,
    observacoes TEXT,
    preco_final NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.cliente_id,
        a.barbeiro_id,
        a.service_id,
        a.data_agendamento,
        (a.data_agendamento AT TIME ZONE 'America/Sao_Paulo')::TIMESTAMP,
        (a.data_agendamento AT TIME ZONE 'America/Sao_Paulo')::TIME,
        a.status,
        a.observacoes,
        a.preco_final
    FROM appointments a
    WHERE DATE(a.data_agendamento AT TIME ZONE 'America/Sao_Paulo') = target_date
    ORDER BY (a.data_agendamento AT TIME ZONE 'America/Sao_Paulo')::TIME;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DOCUMENTAÇÃO E COMENTÁRIOS
-- =====================================================

COMMENT ON FUNCTION convert_utc_to_brazil(TIMESTAMP WITH TIME ZONE) IS 'Converte timestamp UTC para horário brasileiro';
COMMENT ON FUNCTION now_brazil() IS 'Retorna o horário atual no fuso brasileiro';
COMMENT ON FUNCTION validate_appointment_time() IS 'Valida se o agendamento está dentro do horário de funcionamento brasileiro';
COMMENT ON FUNCTION get_appointments_by_brazil_date(DATE) IS 'Busca agendamentos de uma data específica no fuso brasileiro';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migração de timezone concluída com sucesso!';
    RAISE NOTICE '📋 Recursos adicionados:';
    RAISE NOTICE '   - Funções auxiliares para conversão de timezone';
    RAISE NOTICE '   - View appointments_brazil para consultas facilitadas';
    RAISE NOTICE '   - Índices otimizados para consultas por data brasileira';
    RAISE NOTICE '   - Função de validação de horários (desabilitada por padrão)';
    RAISE NOTICE '   - Função utilitária para buscar agendamentos por data';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Para usar na aplicação:';
    RAISE NOTICE '   - Use a view appointments_brazil para consultas';
    RAISE NOTICE '   - Use as funções convert_utc_to_brazil() e now_brazil()';
    RAISE NOTICE '   - Sempre especifique timezone ao criar agendamentos';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Lembre-se:';
    RAISE NOTICE '   - O banco continua armazenando em UTC (correto)';
    RAISE NOTICE '   - A aplicação deve converter para exibição';
    RAISE NOTICE '   - Use timezone "America/Sao_Paulo" nas consultas';
END $$;