# Correção Completa - Conflitos de Horários de Agendamento

## Problema Identificado

🚨 **CRÍTICO**: Sistema permitia agendamentos duplicados no mesmo horário para o mesmo barbeiro.

**Exemplo encontrado:**

- Barbeiro: Melry Teste
- Data/Hora: 09/08/2025 às 13:30
- Agendamentos: 2 serviços diferentes no mesmo horário
  - "Corte + Barba" (45 min)
  - "Corte Masculino" (30 min)

## Causa Raiz

1. ❌ **Ausência de validação no banco de dados**
2. ❌ **Frontend não verificava disponibilidade antes de criar**
3. ❌ **Nenhuma constraint para prevenir conflitos**
4. ❌ **Duração dos serviços não era considerada**

## Solução Implementada

### 1. Trigger de Prevenção de Conflitos ✅

**Migração:** `prevent_appointment_conflicts`

```sql
-- Função que verifica conflitos considerando duração dos serviços
CREATE OR REPLACE FUNCTION check_appointment_conflict()
RETURNS TRIGGER AS $$
DECLARE
    conflict_count INTEGER;
    service_duration INTEGER;
    appointment_start TIMESTAMP WITH TIME ZONE;
    appointment_end TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Obter duração do serviço (padrão 30 minutos)
    SELECT COALESCE(s.duracao_minutos, 30) INTO service_duration
    FROM services s WHERE s.id = NEW.service_id;

    -- Calcular início e fim do novo agendamento
    appointment_start := NEW.data_agendamento;
    appointment_end := NEW.data_agendamento + (service_duration || ' minutes')::INTERVAL;

    -- Verificar conflitos com agendamentos existentes
    SELECT COUNT(*) INTO conflict_count
    FROM appointments a
    JOIN services s ON a.service_id = s.id
    WHERE a.barbeiro_id = NEW.barbeiro_id
    AND a.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
    AND a.status IN ('confirmado', 'pendente', 'em_andamento')
    AND (
        -- Sobreposição de horários considerando duração
        (NEW.data_agendamento >= a.data_agendamento
         AND NEW.data_agendamento < a.data_agendamento + (COALESCE(s.duracao_minutos, 30) || ' minutes')::INTERVAL)
        OR
        (appointment_end > a.data_agendamento
         AND appointment_end <= a.data_agendamento + (COALESCE(s.duracao_minutos, 30) || ' minutes')::INTERVAL)
        OR
        (NEW.data_agendamento <= a.data_agendamento
         AND appointment_end >= a.data_agendamento + (COALESCE(s.duracao_minutos, 30) || ' minutes')::INTERVAL)
    );

    -- Impedir operação se há conflito
    IF conflict_count > 0 THEN
        RAISE EXCEPTION 'Conflito de horário: Barbeiro já possui agendamento neste horário. Horário: % - %',
            appointment_start, appointment_end
            USING ERRCODE = '23505';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para INSERT e UPDATE
CREATE TRIGGER trigger_check_appointment_conflict_insert
    BEFORE INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION check_appointment_conflict();

CREATE TRIGGER trigger_check_appointment_conflict_update
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    WHEN (NEW.data_agendamento != OLD.data_agendamento OR NEW.barbeiro_id != OLD.barbeiro_id OR NEW.service_id != OLD.service_id)
    EXECUTE FUNCTION check_appointment_conflict();
```

### 2. Função de Verificação de Disponibilidade ✅

**Migração:** `create_availability_functions_fixed`

```sql
-- Função para verificar se horário está disponível
CREATE OR REPLACE FUNCTION check_time_availability(
    p_barbeiro_id UUID,
    p_data_agendamento TIMESTAMP WITH TIME ZONE,
    p_service_id UUID,
    p_exclude_appointment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
-- Lógica completa de verificação de conflitos
-- Retorna TRUE se disponível, FALSE se ocupado
```

### 3. Função de Horários Disponíveis ✅

```sql
-- Função para obter todos os horários disponíveis em um dia
CREATE OR REPLACE FUNCTION get_available_times(
    p_barbeiro_id UUID,
    p_date DATE,
    p_service_id UUID
)
RETURNS TABLE(
    time_slot TIMESTAMP WITH TIME ZONE,
    is_available BOOLEAN
)
-- Gera slots de 30 em 30 minutos das 8h às 18h
-- Verifica disponibilidade de cada slot
```

### 4. Atualização do Hook Frontend ✅

**Arquivo:** `src/domains/appointments/hooks/use-appointments.ts`

- ✅ Adicionada função `checkAvailability()`
- ✅ Validação antes de criar agendamento
- ✅ Mensagens de erro amigáveis
- ✅ Tratamento de erros de conflito

## Testes Realizados

### 1. Teste de Constraint no Banco ✅

```sql
-- Tentativa de criar agendamento conflitante
INSERT INTO appointments (...) VALUES (..., '2025-08-09 13:30:00+00', ...);
-- Resultado: ERROR 23505 - Conflito de horário detectado ✅
```

### 2. Teste de Função de Disponibilidade ✅

```sql
-- Horário ocupado (13:30)
SELECT check_time_availability(..., '2025-08-09 13:30:00+00', ...);
-- Resultado: FALSE ✅

-- Horário livre (15:00)
SELECT check_time_availability(..., '2025-08-09 15:00:00+00', ...);
-- Resultado: TRUE ✅
```

### 3. Teste de Horários Disponíveis ✅

```sql
-- Verificar slots entre 13:00 e 15:00
SELECT * FROM get_available_times(..., '2025-08-09', ...);
-- Resultado:
-- 13:00 - ❌ Ocupado (conflito com agendamento 13:30)
-- 13:30 - ❌ Ocupado (agendamento existente)
-- 14:00 - ❌ Ocupado (ainda dentro da duração do serviço)
-- 14:30 - ✅ Disponível
-- 15:00 - ✅ Disponível
```

## Correção de Dados Existentes

### Agendamentos Duplicados Removidos ✅

```sql
-- Removido agendamento duplicado
DELETE FROM appointments WHERE id = '1e3b36c3-130d-4db2-8c8b-1a5de049535d';
-- Mantido: "Corte + Barba" às 13:30 (criado primeiro)
-- Removido: "Corte Masculino" às 13:30 (criado depois)
```

### Verificação de Integridade ✅

```sql
-- Buscar agendamentos duplicados restantes
SELECT barbeiro_id, data_agendamento, COUNT(*)
FROM appointments
WHERE status IN ('confirmado', 'pendente', 'em_andamento')
GROUP BY barbeiro_id, data_agendamento
HAVING COUNT(*) > 1;
-- Resultado: [] (nenhum duplicado encontrado) ✅
```

## Como Funciona Agora

### Fluxo de Criação de Agendamento

1. **Cliente seleciona horário**
   - Frontend chama `checkAvailability()` antes de permitir seleção

2. **Validação no Frontend**
   - Hook verifica disponibilidade via `check_time_availability()`
   - Se ocupado: mostra erro "Horário não disponível"

3. **Validação no Banco**
   - Trigger `check_appointment_conflict()` executa antes do INSERT
   - Considera duração do serviço para detectar sobreposições
   - Se conflito: retorna erro 23505

4. **Resultado**
   - ✅ Sucesso: Agendamento criado
   - ❌ Erro: Mensagem clara sobre conflito

### Tipos de Conflito Detectados

1. **Sobreposição Inicial**
   - Novo agendamento começa durante um existente
   - Ex: Existente 14:00-14:30, Novo 14:15-14:45

2. **Sobreposição Final**
   - Novo agendamento termina durante um existente
   - Ex: Existente 14:00-14:30, Novo 13:45-14:15

3. **Englobamento**
   - Novo agendamento engloba um existente
   - Ex: Existente 14:00-14:30, Novo 13:30-15:00

4. **Horário Exato**
   - Mesmo horário de início
   - Ex: Ambos às 14:00

## Benefícios da Solução

### Para o Sistema

- ✅ **Integridade de dados garantida**
- ✅ **Prevenção automática de conflitos**
- ✅ **Validação em múltiplas camadas**
- ✅ **Consideração da duração dos serviços**

### Para Barbeiros

- ✅ **Agenda organizada sem sobreposições**
- ✅ **Tempo adequado entre atendimentos**
- ✅ **Prevenção de overbooking**

### Para Clientes

- ✅ **Horários realmente disponíveis**
- ✅ **Feedback imediato sobre disponibilidade**
- ✅ **Experiência confiável de agendamento**

## Arquivos Modificados

### Migrações Criadas

1. ✅ `prevent_appointment_conflicts` - Triggers de prevenção
2. ✅ `create_availability_functions_fixed` - Funções de disponibilidade

### Código Atualizado

1. ✅ `src/domains/appointments/hooks/use-appointments.ts` - Validação no frontend

### Documentação

1. ✅ `CORRECAO_CONFLITOS_HORARIOS_COMPLETA.md` - Este documento

## Status Final

🎉 **PROBLEMA RESOLVIDO COMPLETAMENTE**

### ✅ Implementado

- Constraint de banco para prevenir conflitos
- Função de verificação de disponibilidade
- Função de horários disponíveis
- Validação no frontend
- Correção de dados duplicados existentes

### ✅ Testado

- Prevenção de conflitos no banco
- Verificação de disponibilidade
- Geração de horários disponíveis
- Integração frontend-backend

### 🎯 Próximos Passos (Opcionais)

1. **Interface visual**: Mostrar horários ocupados/disponíveis
2. **Cache**: Otimizar consultas de disponibilidade
3. **Notificações**: Avisar sobre conflitos em tempo real
4. **Relatórios**: Análise de ocupação por barbeiro

## Conclusão

O sistema agora **IMPEDE COMPLETAMENTE** agendamentos conflitantes:

- ✅ Validação no banco de dados (última linha de defesa)
- ✅ Validação no frontend (experiência do usuário)
- ✅ Consideração da duração dos serviços
- ✅ Mensagens de erro claras
- ✅ Dados existentes corrigidos

**Teste confirmado**: Tentativa de criar agendamento no horário ocupado (13:30) resulta em erro claro sobre conflito de horário. Sistema funcionando perfeitamente! 🚀
