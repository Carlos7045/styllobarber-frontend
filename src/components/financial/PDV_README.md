# Sistema PDV (Ponto de Venda) - StylloBarber

## Visão Geral

O sistema PDV do StylloBarber é uma solução completa para registro rápido de transações financeiras, permitindo que barbeiros e administradores registrem entradas e saídas em tempo real, mantendo o fluxo de caixa sempre atualizado.

## Funcionalidades Principais

### 🎯 Registro de Entradas (Receitas)
- **Serviços Rápidos**: Botões pré-configurados com serviços mais comuns
- **Métodos de Pagamento**: Dinheiro, PIX, Cartão de Débito, Cartão de Crédito
- **Informações do Cliente**: Nome opcional para histórico
- **Seleção de Barbeiro**: Cálculo automático de comissões
- **Calculadora Integrada**: Para cálculos rápidos de valores

### 💸 Registro de Saídas (Despesas)
- **Categorização Automática**: Produtos, Equipamentos, Limpeza, Marketing, etc.
- **Descrição Detalhada**: Campo para especificar a despesa
- **Observações**: Campo opcional para informações adicionais
- **Validação de Dados**: Verificação automática antes do registro

### 📊 Estatísticas em Tempo Real
- **Transações do Dia**: Contador de transações realizadas
- **Valor Total**: Soma de todas as movimentações
- **Última Transação**: Informações da transação mais recente
- **Tendência**: Comparativo com períodos anteriores

### 📋 Histórico de Transações
- **Lista em Tempo Real**: Atualizações automáticas
- **Filtros Avançados**: Por período, categoria, barbeiro
- **Ações Rápidas**: Cancelamento de transações
- **Detalhes Completos**: Todas as informações da transação

## Componentes Técnicos

### `QuickTransactionPDV`
Componente principal do PDV com interface intuitiva para registro de transações.

**Props:**
- `onTransactionSaved`: Callback executado após salvar transação
- `className`: Classes CSS adicionais

**Funcionalidades:**
- Tabs para alternar entre Entrada e Saída
- Calculadora integrada com interface estilo PDV
- Validação em tempo real dos campos
- Seleção rápida de serviços e categorias
- Métodos de pagamento visuais

### `RecentTransactions`
Componente para exibir histórico de transações recentes.

**Props:**
- `limit`: Número máximo de transações a exibir
- `className`: Classes CSS adicionais

**Funcionalidades:**
- Estatísticas do dia em cards visuais
- Lista de transações com detalhes completos
- Ações de cancelamento com confirmação
- Indicadores visuais por tipo de transação
- Auto-refresh configurável

### `QuickTransactionService`
Serviço para gerenciar transações rápidas com integração ao Supabase.

**Métodos Principais:**
- `registrarTransacao()`: Registra nova transação
- `obterHistoricoRecente()`: Busca transações recentes
- `obterEstatisticasDia()`: Calcula estatísticas do dia
- `cancelarTransacao()`: Cancela transação existente
- `validarTransacao()`: Valida dados antes do registro

### `useQuickTransactions`
Hook personalizado para gerenciar estado das transações.

**Retorna:**
- `historicoRecente`: Array de transações recentes
- `estatisticasDia`: Objeto com estatísticas do dia
- `loading/saving`: Estados de carregamento
- `registrarTransacao()`: Função para registrar transação
- `cancelarTransacao()`: Função para cancelar transação
- `refresh()`: Função para atualizar dados

## Fluxo de Uso

### Registro de Entrada (Receita)
1. **Abrir PDV**: Clicar no botão "PDV" no dashboard
2. **Selecionar Serviço**: Clicar em um dos serviços rápidos ou inserir manualmente
3. **Informar Cliente**: Opcional - nome do cliente
4. **Selecionar Barbeiro**: Para cálculo automático de comissão
5. **Escolher Pagamento**: Dinheiro, PIX, Débito ou Crédito
6. **Confirmar**: Clicar em "Registrar Entrada"

### Registro de Saída (Despesa)
1. **Alternar para Saída**: Clicar na tab "Saída"
2. **Inserir Valor**: Usar teclado ou calculadora integrada
3. **Descrever Despesa**: Campo obrigatório
4. **Selecionar Categoria**: Produtos, Equipamentos, etc.
5. **Adicionar Observações**: Campo opcional
6. **Confirmar**: Clicar em "Registrar Saída"

## Integração com Sistema

### Fluxo de Caixa
- Transações são automaticamente refletidas no fluxo de caixa
- Atualizações em tempo real dos saldos
- Categorização automática das movimentações

### Sistema de Comissões
- Cálculo automático quando barbeiro é selecionado
- Baseado nas configurações de percentual por barbeiro
- Registro automático da comissão como transação separada

### Relatórios Financeiros
- Todas as transações são incluídas nos relatórios
- Filtros por método de pagamento, barbeiro, categoria
- Exportação em múltiplos formatos

## Configurações

### Serviços Rápidos
Configurados no arquivo do componente, podem ser personalizados:
```typescript
const servicos = [
  { id: '1', nome: 'Corte Simples', preco: 25.00 },
  { id: '2', nome: 'Corte + Barba', preco: 45.00 },
  // ... mais serviços
]
```

### Categorias de Despesas
Configuradas com cores personalizadas:
```typescript
const categoriasDespesas = [
  { id: '1', nome: 'Produtos', cor: '#EF4444' },
  { id: '2', nome: 'Equipamentos', cor: '#F59E0B' },
  // ... mais categorias
]
```

### Auto-refresh
Configurável no hook:
```typescript
const { ... } = useQuickTransactions({
  autoRefresh: true,
  refreshInterval: 10000 // 10 segundos
})
```

## Atalhos de Teclado

- **F1**: Nova Entrada
- **F2**: Nova Saída  
- **F3**: Abrir Calculadora
- **ESC**: Limpar formulário
- **Enter**: Confirmar transação (quando válida)

## Validações

### Campos Obrigatórios
- **Valor**: Deve ser maior que zero
- **Descrição**: Não pode estar vazio
- **Método de Pagamento**: Obrigatório para entradas
- **Categoria**: Obrigatória para saídas

### Regras de Negócio
- Valores devem ser positivos
- Descrições devem ter pelo menos 3 caracteres
- Barbeiro é opcional, mas recomendado para cálculo de comissões
- Cliente é sempre opcional

## Segurança

### Validação de Dados
- Sanitização de inputs antes do envio
- Validação de tipos de dados
- Verificação de valores mínimos e máximos

### Controle de Acesso
- Apenas usuários autenticados podem registrar transações
- Logs de auditoria para todas as operações
- Cancelamento apenas por usuários autorizados

## Performance

### Otimizações
- Debounce em campos de entrada
- Lazy loading de componentes pesados
- Cache de dados frequentemente acessados
- Paginação no histórico de transações

### Monitoramento
- Métricas de tempo de resposta
- Contadores de transações por minuto
- Alertas para falhas de sincronização

## Troubleshooting

### Problemas Comuns

**Transação não salva:**
- Verificar conexão com internet
- Validar se todos os campos obrigatórios estão preenchidos
- Conferir se o valor é maior que zero

**Calculadora não abre:**
- Verificar se não há modais sobrepostos
- Tentar usar F3 como atalho alternativo

**Histórico não atualiza:**
- Clicar no botão "Atualizar"
- Verificar se o auto-refresh está ativo
- Recarregar a página se necessário

### Logs de Debug
Ativar logs detalhados no console:
```typescript
localStorage.setItem('pdv-debug', 'true')
```

## Roadmap

### Próximas Funcionalidades
- [ ] Integração com impressora fiscal
- [ ] Código de barras para produtos
- [ ] Desconto e promoções
- [ ] Parcelamento de pagamentos
- [ ] Integração com delivery
- [ ] App mobile dedicado

### Melhorias Planejadas
- [ ] Interface touch-friendly para tablets
- [ ] Modo offline com sincronização
- [ ] Relatórios específicos do PDV
- [ ] Configuração de impostos
- [ ] Multi-loja/franquias

## Suporte

Para dúvidas ou problemas com o sistema PDV:
1. Consultar este README
2. Verificar logs no console do navegador
3. Testar em modo de desenvolvimento
4. Reportar bugs com detalhes da operação

---

**Versão:** 1.0.0  
**Última Atualização:** Janeiro 2025  
**Compatibilidade:** Next.js 15+, React 19+