# 🔍 Debug - Problema de Disponibilidade de Horários

## Problema Identificado

O sistema está mostrando "Este horário não está mais disponível" mesmo para datas/horários que deveriam estar livres.

## Logs Adicionados

### 1. Hook `use-client-appointments.ts`

- ✅ Log da verificação de disponibilidade
- ✅ Log dos agendamentos encontrados
- ✅ Log da configuração de horários de funcionamento
- ✅ Log do resultado final

### 2. Função `checkSlotAvailability`

- ✅ Log dos parâmetros de entrada
- ✅ Log do cache (se usado)
- ✅ Log do slot solicitado
- ✅ Log da verificação de intervalo
- ✅ Log da verificação de conflitos

### 3. Função `appointmentsConflict`

- ✅ Log da comparação de barbeiros
- ✅ Log detalhado da verificação de conflito

### 4. Função `hasTimeOverlap`

- ✅ Log da verificação de sobreposição de horários

## Como Testar

### Passo 1: Abrir Console do Navegador

1. Pressione F12 para abrir DevTools
2. Vá para a aba Console
3. Limpe o console (Ctrl+L)

### Passo 2: Tentar Agendar

1. Abra o modal de agendamento
2. Selecione um serviço
3. Selecione um barbeiro
4. Escolha uma data que você sabe que está livre
5. Tente selecionar um horário

### Passo 3: Analisar os Logs

Procure por estes logs no console:

```
🔍 Verificando disponibilidade: { date: "2025-08-08", time: "16:00", ... }
📅 Agendamentos encontrados: 0
📆 Dia da semana: 5
⏰ Configuração de horário: { intervalo_inicio: "12:00", intervalo_fim: "13:00" }
🔧 Configuração de intervalo: { inicio: "12:00", fim: "13:00" }
🔍 checkSlotAvailability: { date: "2025-08-08", time: "16:00", ... }
⏰ Slot solicitado: { inicio: "2025-08-08T16:00:00", fim: "2025-08-08T16:45:00", ... }
ℹ️ Nenhum intervalo configurado (ou) ✅ Não conflita com intervalo
📅 Verificando conflitos com 0 agendamentos existentes
✅ Slot disponível!
✅ Resultado da verificação: { available: true }
```

## Possíveis Problemas e Soluções

### Problema 1: Conflito com Intervalo

**Sintoma**: Log mostra "❌ Conflito com intervalo detectado"
**Causa**: O horário escolhido está dentro do intervalo de almoço
**Solução**: Escolher horário fora do intervalo ou ajustar configuração

### Problema 2: Agendamentos Fantasma

**Sintoma**: Log mostra agendamentos quando não deveria ter
**Causa**: Dados antigos ou status incorreto na base
**Solução**: Verificar tabela `appointments` no Supabase

### Problema 3: Configuração de Horário Incorreta

**Sintoma**: Intervalo muito amplo ou horários estranhos
**Causa**: Configuração errada na tabela `horarios_funcionamento`
**Solução**: Verificar/corrigir configuração

### Problema 4: Problema de Fuso Horário

**Sintoma**: Horários não batem com o esperado
**Causa**: Conversão de timezone incorreta
**Solução**: Verificar se as datas estão no timezone correto

### Problema 5: Cache Incorreto

**Sintoma**: Log mostra "💾 Resultado do cache" com resultado errado
**Causa**: Cache com dados incorretos
**Solução**: Limpar cache ou desabilitar temporariamente

## Queries para Verificar Base de Dados

### Verificar Agendamentos do Dia

```sql
SELECT
  id,
  data_agendamento,
  barbeiro_id,
  status,
  service:services(nome, duracao_minutos)
FROM appointments
WHERE data_agendamento::date = '2025-08-08'
AND status != 'cancelado';
```

### Verificar Horários de Funcionamento

```sql
SELECT
  dia_semana,
  intervalo_inicio,
  intervalo_fim,
  ativo
FROM horarios_funcionamento
WHERE dia_semana = 5  -- Sexta-feira
AND ativo = true;
```

### Verificar Barbeiros Ativos

```sql
SELECT
  f.id,
  f.ativo,
  p.nome
FROM funcionarios f
JOIN profiles p ON f.profile_id = p.id
WHERE f.ativo = true;
```

## Ações Recomendadas

1. **Execute o teste** seguindo os passos acima
2. **Copie os logs** do console
3. **Identifique onde está falhando** usando os logs
4. **Verifique a base de dados** se necessário
5. **Reporte o resultado** com os logs específicos

## Limpeza Após Debug

Após identificar e corrigir o problema, remover os logs de debug:

- Remover `console.log` do `use-client-appointments.ts`
- Remover `console.log` do `appointment-utils.ts`
- Deletar este arquivo de debug

## Status

🟡 **Debug Ativo** - Logs adicionados, aguardando teste
