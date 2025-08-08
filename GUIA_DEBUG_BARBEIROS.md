# 🔍 Guia de Debug - Problema dos Barbeiros no Modal

## Problema Identificado

Os barbeiros não estão aparecendo no modal de agendamento, mostrando apenas "Qualquer barbeiro disponível (0)".

## Melhorias Implementadas

### 1. Hook `useFuncionariosPublicos` Melhorado

- ✅ **5 estratégias de busca** diferentes para garantir que os dados sejam encontrados
- ✅ **Logs detalhados** para cada estratégia tentada
- ✅ **Filtros robustos** para garantir apenas funcionários ativos com profiles válidos
- ✅ **Dados mock** em desenvolvimento quando nada funciona
- ✅ **Tratamento de erro** melhorado

### 2. Modal `NovoAgendamentoModal` Melhorado

- ✅ **Debug visual** em modo desenvolvimento
- ✅ **Mensagens de erro** mais claras
- ✅ **Botão de retry** específico para barbeiros
- ✅ **Feedback visual** quando não há barbeiros
- ✅ **Dados detalhados** em modo debug

### 3. Componente de Debug Criado

- ✅ **Componente temporário** para testar isoladamente
- ✅ **Visualização completa** dos dados carregados
- ✅ **Botões de teste** e log

## Como Testar

### Passo 1: Verificar Console do Navegador

1. Abra o modal de agendamento
2. Abra o DevTools (F12)
3. Vá para a aba Console
4. Procure por logs que começam com:
   - `🔍 Iniciando busca de funcionários...`
   - `📋 Estratégia 1: Buscar funcionários com join`
   - `✅ Estratégia X funcionou!` ou `❌ Estratégia X falhou`

### Passo 2: Usar Componente de Debug

1. Importe o componente de debug em uma página:

```tsx
import DebugBarbeiros from '@/debug-barbeiros-component'

// Em qualquer página, adicione:
;<DebugBarbeiros />
```

2. Acesse a página e veja os dados detalhados
3. Use os botões "Recarregar" e "Log no Console"

### Passo 3: Verificar Base de Dados no Supabase

Execute estas queries no SQL Editor do Supabase:

```sql
-- 1. Verificar funcionários
SELECT * FROM funcionarios;

-- 2. Verificar profiles
SELECT * FROM profiles WHERE role IN ('admin', 'barber');

-- 3. Verificar relação funcionarios -> profiles
SELECT
  f.id,
  f.ativo,
  f.especialidades,
  f.profile_id,
  p.nome,
  p.role,
  p.avatar_url
FROM funcionarios f
LEFT JOIN profiles p ON f.profile_id = p.id;

-- 4. Verificar apenas funcionários ativos
SELECT
  f.id,
  f.ativo,
  f.especialidades,
  f.profile_id,
  p.nome,
  p.role
FROM funcionarios f
LEFT JOIN profiles p ON f.profile_id = p.id
WHERE f.ativo = true;
```

## Possíveis Problemas e Soluções

### Problema 1: Tabela `funcionarios` vazia

**Solução:** Criar registros na tabela funcionarios:

```sql
INSERT INTO funcionarios (profile_id, especialidades, ativo)
VALUES
  ('profile-id-do-barbeiro-1', ARRAY['Corte', 'Barba'], true),
  ('profile-id-do-barbeiro-2', ARRAY['Corte', 'Sobrancelha'], true);
```

### Problema 2: Campo `profile_id` não preenchido

**Solução:** Atualizar os registros existentes:

```sql
UPDATE funcionarios
SET profile_id = 'id-do-profile-correto'
WHERE id = 'id-do-funcionario';
```

### Problema 3: Profiles não têm role correto

**Solução:** Atualizar o role dos profiles:

```sql
UPDATE profiles
SET role = 'barber'
WHERE id IN ('id-profile-1', 'id-profile-2');
```

### Problema 4: Permissões RLS bloqueando

**Solução:** Verificar e ajustar políticas RLS:

```sql
-- Ver políticas atuais
SELECT * FROM pg_policies WHERE tablename = 'funcionarios';

-- Criar política para leitura pública (se necessário)
CREATE POLICY "Funcionarios são visíveis publicamente" ON funcionarios
FOR SELECT USING (ativo = true);
```

### Problema 5: Dados existem mas hook não carrega

**Verificar:**

1. Console do navegador para erros de rede
2. Aba Network do DevTools para ver requests
3. Se o Supabase client está configurado corretamente
4. Se as variáveis de ambiente estão corretas

## Estratégias do Hook

### Estratégia 1: Join Direto (Preferida)

```sql
SELECT funcionarios.*, profiles.nome, profiles.avatar_url
FROM funcionarios
JOIN profiles ON funcionarios.profile_id = profiles.id
WHERE funcionarios.ativo = true
```

### Estratégia 2: Busca Separada

1. Busca funcionários ativos
2. Busca profiles dos funcionários
3. Combina os dados manualmente

### Estratégia 3: Reverse Join

```sql
SELECT profiles.*, funcionarios.*
FROM profiles
JOIN funcionarios ON profiles.id = funcionarios.profile_id
WHERE profiles.role IN ('admin', 'barber') AND funcionarios.ativo = true
```

### Estratégia 4: Profiles Mock

Cria funcionários baseados apenas nos profiles com role de barbeiro

### Estratégia 5: Dados Mock (Desenvolvimento)

Fornece dados fictícios para desenvolvimento quando tudo falha

## Logs Esperados (Sucesso)

```
🔍 Iniciando busca de funcionários...
📋 Estratégia 1: Buscar funcionários com join
📋 Resultado estratégia 1: { funcionariosData: [...], funcionariosError: null, count: 2 }
✅ Estratégia 1 funcionou! Funcionários válidos: 2
```

## Logs de Problema

```
🔍 Iniciando busca de funcionários...
📋 Estratégia 1: Buscar funcionários com join
📋 Resultado estratégia 1: { funcionariosData: null, funcionariosError: {...}, count: 0 }
📋 Estratégia 2: Buscar funcionários e profiles separadamente
...
⚠️ Usando dados mock para desenvolvimento: 3
```

## Próximos Passos

1. Execute os testes acima
2. Identifique qual estratégia está funcionando (ou falhando)
3. Corrija os dados na base conforme necessário
4. Remova o componente de debug após resolver
5. Teste o modal de agendamento novamente

## Arquivos Modificados

- `src/domains/users/hooks/use-funcionarios-publicos.ts` - Hook melhorado
- `src/domains/users/components/client/NovoAgendamentoModal.tsx` - Modal melhorado
- `src/debug-barbeiros-component.tsx` - Componente de debug (temporário)
- `GUIA_DEBUG_BARBEIROS.md` - Este guia (temporário)
