# PDV - Integração com Agendamentos

## Funcionalidades Implementadas

O sistema PDV agora possui integração completa com agendamentos, permitindo buscar clientes que fizeram agendamentos ainda não pagos e processar o pagamento de forma automatizada.

## Componentes Criados

### 1. **Hook `useAgendamentosPendentes`**
**Arquivo**: `src/hooks/use-agendamentos-pendentes.ts`

#### Funcionalidades:
- ✅ **Busca agendamentos** concluídos não pagos
- ✅ **Filtragem por cliente** com busca inteligente
- ✅ **Marcação como pago** automática
- ✅ **Sistema de fallback** para desenvolvimento
- ✅ **Refresh automático** dos dados

#### Interface:
```typescript
interface AgendamentoPendente {
  id: string
  cliente_nome: string
  cliente_telefone?: string
  barbeiro_id: string
  barbeiro_nome: string
  data_agendamento: string
  hora_inicio: string
  hora_fim: string
  servicos: Array<{
    id: string
    nome: string
    preco: number
    duracao: number
  }>
  valor_total: number
  status: 'CONCLUIDO'
  observacoes?: string
}
```

### 2. **Componente `ClienteAgendamentoPicker`**
**Arquivo**: `src/components/financial/components/ClienteAgendamentoPicker.tsx`

#### Funcionalidades:
- ✅ **Modal de busca** com interface moderna
- ✅ **Campo de busca** com autocomplete
- ✅ **Lista de agendamentos** com detalhes completos
- ✅ **Seleção visual** com animações
- ✅ **Informações detalhadas**: cliente, barbeiro, serviços, valor
- ✅ **Estados de loading** e erro

#### Interface Visual:
- **Header**: Título, descrição e botão fechar
- **Busca**: Campo com autocomplete de clientes
- **Lista**: Cards com informações completas
- **Footer**: Contador e botão cancelar

### 3. **PDV Atualizado**
**Arquivo**: `src/components/financial/components/QuickTransactionPDV.tsx`

#### Novas Funcionalidades:
- ✅ **Botão "Buscar Cliente"** para abrir modal
- ✅ **Preenchimento automático** com dados do agendamento
- ✅ **Seção de serviços extras** para adicionar mais serviços
- ✅ **Visualização dos serviços** do agendamento
- ✅ **Integração com pagamento** automático

## Fluxo de Uso

### 1. **Buscar Cliente com Agendamento**
```
1. Usuário clica em "Buscar Cliente"
2. Modal abre com campo de busca
3. Usuário digita nome do cliente
4. Sistema mostra agendamentos pendentes
5. Usuário seleciona agendamento
6. Dados preenchem automaticamente o PDV
```

### 2. **Adicionar Serviços Extras**
```
1. Com agendamento selecionado
2. Seção "Serviços Extras" aparece
3. Usuário pode adicionar/remover serviços
4. Valor total atualiza automaticamente
5. Descrição inclui todos os serviços
```

### 3. **Processar Pagamento**
```
1. Dados preenchidos automaticamente:
   - Cliente: Nome do agendamento
   - Barbeiro: Barbeiro do agendamento
   - Valor: Total dos serviços
   - Descrição: Lista de serviços
2. Usuário seleciona método de pagamento
3. Clica em "Salvar"
4. Sistema registra transação
5. Agendamento marcado como pago
```

## Consultas ao Banco

### Agendamentos Pendentes:
```sql
SELECT 
  a.id,
  a.cliente_nome,
  a.cliente_telefone,
  a.barbeiro_id,
  a.data_agendamento,
  a.hora_inicio,
  a.hora_fim,
  a.valor_total,
  a.status,
  a.observacoes,
  f.nome as barbeiro_nome,
  s.nome as servico_nome,
  s.preco as servico_preco,
  s.duracao as servico_duracao
FROM agendamentos a
LEFT JOIN funcionarios f ON a.barbeiro_id = f.id
LEFT JOIN agendamento_servicos as_rel ON a.id = as_rel.agendamento_id
LEFT JOIN servicos s ON as_rel.servico_id = s.id
WHERE a.status = 'CONCLUIDO' 
  AND a.pago = false
ORDER BY a.data_agendamento DESC
```

### Marcar como Pago:
```sql
UPDATE agendamentos 
SET 
  pago = true,
  transacao_pagamento_id = $1,
  data_pagamento = NOW(),
  updated_at = NOW()
WHERE id = $2
```

## Interface Visual

### Modal de Busca:
- **Design**: Modal centralizado com sombra
- **Busca**: Campo grande com ícone de lupa
- **Autocomplete**: Sugestões de clientes
- **Cards**: Informações organizadas visualmente
- **Animações**: Entrada suave dos elementos

### PDV Integrado:
- **Seção Azul**: Busca de cliente com agendamento
- **Seção Amarela**: Serviços extras (quando há agendamento)
- **Indicadores**: Badges e ícones para identificação
- **Estados**: Visual claro para selecionado/não selecionado

## Benefícios da Integração

### 1. **Eficiência Operacional**
- ✅ **Preenchimento automático** de dados
- ✅ **Redução de erros** manuais
- ✅ **Processo mais rápido** de pagamento
- ✅ **Sincronização automática** entre agendamento e financeiro

### 2. **Experiência do Usuário**
- ✅ **Interface intuitiva** para busca
- ✅ **Informações completas** do agendamento
- ✅ **Flexibilidade** para adicionar serviços extras
- ✅ **Feedback visual** claro

### 3. **Controle Financeiro**
- ✅ **Rastreabilidade** entre agendamento e pagamento
- ✅ **Histórico completo** de transações
- ✅ **Relatórios precisos** de receitas
- ✅ **Controle de inadimplência**

### 4. **Gestão de Agendamentos**
- ✅ **Status atualizado** automaticamente
- ✅ **Controle de pagamentos** em tempo real
- ✅ **Histórico de transações** vinculado
- ✅ **Relatórios integrados**

## Dados de Fallback

Para desenvolvimento e testes, o sistema inclui dados de fallback realistas:

```typescript
// 3 agendamentos de exemplo
// Diferentes clientes, barbeiros e combinações de serviços
// Valores e horários realistas
// Informações completas para teste
```

## Validações Implementadas

### 1. **Agendamentos**
- ✅ Status deve ser 'CONCLUIDO'
- ✅ Campo 'pago' deve ser false
- ✅ Deve ter barbeiro associado
- ✅ Deve ter pelo menos um serviço

### 2. **Busca**
- ✅ Busca case-insensitive
- ✅ Busca por nome parcial
- ✅ Autocomplete inteligente
- ✅ Limite de resultados

### 3. **Pagamento**
- ✅ Valor deve ser maior que zero
- ✅ Método de pagamento obrigatório
- ✅ Descrição automática dos serviços
- ✅ Vinculação com agendamento

## Próximas Melhorias Sugeridas

### 1. **Funcionalidades**
- 📋 **Histórico de pagamentos** por cliente
- 📋 **Desconto** em agendamentos
- 📋 **Pagamento parcial** de agendamentos
- 📋 **Reagendamento** com pagamento

### 2. **Interface**
- 📋 **Filtros avançados** (data, barbeiro, valor)
- 📋 **Ordenação** personalizável
- 📋 **Exportação** de dados
- 📋 **Impressão** de recibos

### 3. **Integrações**
- 📋 **Notificações** de pagamento
- 📋 **WhatsApp** para confirmação
- 📋 **Email** com recibo
- 📋 **SMS** de lembrete

## Conclusão

A integração do PDV com agendamentos transforma o sistema em uma solução completa de gestão, conectando o agendamento de serviços com o controle financeiro de forma seamless e eficiente.

**Status**: ✅ Implementação Completa
**Integração**: ✅ PDV ↔ Agendamentos
**Automação**: ✅ Pagamentos Automáticos
**UX**: ✅ Interface Intuitiva