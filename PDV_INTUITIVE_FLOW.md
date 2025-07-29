# PDV - Fluxo Intuitivo de Seleção de Serviços

## Nova Lógica Implementada

O sistema PDV agora funciona de forma mais intuitiva, similar a um carrinho de compras, onde os serviços são adicionados e as quantidades podem ser ajustadas em tempo real.

## Fluxo de Funcionamento

### 1. **Seleção de Serviços**

#### **Primeiro Clique** - Adiciona ao Carrinho
```
1. Usuário clica em um serviço
2. Serviço fica selecionado (visual destacado)
3. Aparece seletor de quantidade
4. Valor é adicionado ao total
5. Descrição é atualizada
```

#### **Segundo Clique** - Remove do Carrinho
```
1. Usuário clica novamente no mesmo serviço
2. Serviço é removido completamente
3. Valor é subtraído do total
4. Seletor de quantidade desaparece
```

### 2. **Controle de Quantidade**

#### **Botão +** - Incrementa
```
1. Usuário clica no botão +
2. Quantidade aumenta em 1
3. Valor é somado ao total (preço × nova quantidade)
4. Descrição atualizada (ex: "2x Corte")
```

#### **Botão -** - Decrementa
```
1. Usuário clica no botão -
2. Quantidade diminui em 1 (mínimo 1)
3. Valor é subtraído do total
4. Descrição atualizada
```

### 3. **Múltiplos Serviços**

#### **Adicionar Outro Serviço**
```
1. Usuário clica em outro serviço
2. Novo serviço é ADICIONADO ao carrinho
3. Valor é SOMADO ao total existente
4. Descrição combina todos: "Corte + Barba"
```

### 4. **Agendamentos**

#### **Cliente com Agendamento**
```
1. Usuário seleciona cliente com agendamento
2. Serviços do agendamento são ADICIONADOS ao carrinho
3. Valor é SOMADO ao total existente (se houver)
4. Pode adicionar mais serviços normalmente
5. Total = serviços anteriores + agendamento + extras
```

## Implementação Técnica

### 1. **Estados Gerenciados**

```typescript
// Serviços efetivamente no carrinho
const [servicosSelecionados, setServicosSelecionados] = useState<ServicoSelecionado[]>([])

// Quantidades para controle dos botões +/-
const [servicoQuantidades, setServicoQuantidades] = useState<Record<string, number>>({})
```

### 2. **Função Principal - Toggle de Serviços**

```typescript
const handleServiceToggle = (servico: any) => {
  const servicoExistente = servicosSelecionados.find(s => s.id === servico.id)
  
  if (servicoExistente) {
    // Remove completamente do carrinho
    const novosServicos = servicosSelecionados.filter(s => s.id !== servico.id)
    // Recalcula totais e atualiza interface
  } else {
    // Adiciona ao carrinho com quantidade 1
    const novoServico = { /* dados do serviço */ }
    const novosServicos = [...servicosSelecionados, novoServico]
    // Recalcula totais e atualiza interface
  }
}
```

### 3. **Função de Quantidade - Atualização em Tempo Real**

```typescript
const handleQuantidadeChange = (servicoId: string, novaQuantidade: number) => {
  // Atualiza quantidade do serviço específico
  const novosServicos = servicosSelecionados.map(s => 
    s.id === servicoId 
      ? { ...s, quantidade: novaQuantidade, precoTotal: s.preco * novaQuantidade }
      : s
  )
  
  // Recalcula totais imediatamente
  const { valorTotal, descricao } = calcularTotais(novosServicos)
  
  // Atualiza todos os estados
  setServicosSelecionados(novosServicos)
  setTransaction(prev => ({ ...prev, valor: valorTotal, descricao }))
}
```

### 4. **Cálculo Centralizado**

```typescript
const calcularTotais = (servicos: ServicoSelecionado[]) => {
  const valorTotal = servicos.reduce((total, s) => total + s.precoTotal, 0)
  const descricao = servicos.map(s => 
    s.quantidade > 1 ? `${s.quantidade}x ${s.nome}` : s.nome
  ).join(' + ')
  
  return { valorTotal, descricao }
}
```

## Interface Visual

### 1. **Estados dos Cards**

#### **Não Selecionado**
- Borda cinza
- Fundo branco
- Sem controles de quantidade
- Preço normal

#### **Selecionado**
- Borda verde (serviços normais) ou amarela (extras)
- Fundo colorido
- Controles de quantidade visíveis
- Indicador de quantidade atual

### 2. **Controles de Quantidade**

#### **Botão -** (Vermelho)
- Diminui quantidade
- Mínimo 1
- Cor vermelha para indicar subtração

#### **Botão +** (Verde)
- Aumenta quantidade
- Máximo 10
- Cor verde para indicar adição

#### **Display Central**
- Mostra quantidade atual
- Atualizado em tempo real

### 3. **Feedback Visual**

#### **Valor Total**
- Atualizado instantaneamente
- Mostra soma de todos os serviços

#### **Descrição**
- Lista todos os serviços selecionados
- Formato: "2x Corte + Barba + 3x Sobrancelha"

#### **Lista de Selecionados**
- Badges removíveis
- Quantidade e preço total por serviço
- Botão X para remoção individual

## Cenários de Uso

### 1. **Venda Simples**
```
1. Cliente chega
2. Clica em "Corte" → Selecionado, R$ 25,00
3. Clica em "+" → 2x Corte, R$ 50,00
4. Clica em "Barba" → Corte + Barba, R$ 70,00
5. Processa pagamento
```

### 2. **Cliente com Agendamento**
```
1. Busca cliente → Agendamento: Corte + Barba (R$ 45,00)
2. Cliente quer adicionar Sobrancelha
3. Clica em "Sobrancelha" → Total: R$ 60,00
4. Processa pagamento do total
```

### 3. **Correções**
```
1. Selecionou serviço errado
2. Clica novamente no serviço → Remove completamente
3. Ou usa botão X na lista de selecionados
4. Valor ajustado automaticamente
```

## Benefícios da Nova Lógica

### 1. **Intuitividade**
- ✅ **Comportamento familiar**: Como carrinho de compras
- ✅ **Feedback imediato**: Valores atualizados em tempo real
- ✅ **Controles claros**: + para adicionar, - para diminuir
- ✅ **Estados visuais**: Fácil identificar o que está selecionado

### 2. **Flexibilidade**
- ✅ **Múltiplos serviços**: Adiciona quantos quiser
- ✅ **Quantidades variadas**: Cada serviço com sua quantidade
- ✅ **Correção fácil**: Remove ou ajusta facilmente
- ✅ **Agendamentos**: Soma ao carrinho existente

### 3. **Consistência**
- ✅ **Cálculos precisos**: Sempre corretos e atualizados
- ✅ **Estados sincronizados**: Interface sempre consistente
- ✅ **Comportamento previsível**: Mesma lógica em todo lugar

### 4. **Eficiência**
- ✅ **Menos cliques**: Seleção direta com toggle
- ✅ **Ajustes rápidos**: Quantidade com +/-
- ✅ **Visão clara**: Lista de tudo selecionado
- ✅ **Correção rápida**: Remove com um clique

## Comparação: Antes vs Depois

### **Antes** (Confuso):
```
1. Seleciona serviço → Substitui anterior
2. Modo agendamento → Lógica diferente
3. Extras → Função separada
4. Quantidade → Só antes de selecionar
```

### **Depois** (Intuitivo):
```
1. Clica serviço → Adiciona ao carrinho
2. Clica novamente → Remove do carrinho
3. Botões +/- → Ajusta quantidade em tempo real
4. Agendamento → Soma ao carrinho existente
5. Mesma lógica → Em todos os cenários
```

## Conclusão

A nova lógica torna o PDV muito mais intuitivo e eficiente, funcionando como um carrinho de compras moderno onde:

- **Clique = Adiciona/Remove**
- **+/- = Ajusta quantidade**
- **Valores = Atualizados em tempo real**
- **Agendamentos = Somam ao total**

O fluxo agora é consistente, previsível e familiar para qualquer usuário que já usou um e-commerce ou aplicativo de delivery.

**Status**: ✅ Implementação Completa
**Lógica**: ✅ Intuitiva e Consistente
**UX**: ✅ Significativamente Melhorada
**Eficiência**: ✅ Operação Mais Rápida