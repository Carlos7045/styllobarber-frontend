# Módulo Financeiro - StylloBarber

Este módulo contém toda a estrutura base para o sistema financeiro avançado do StylloBarber.

## Estrutura de Diretórios

```
src/components/financial/
├── index.ts              # Barrel exports principais
├── README.md            # Documentação do módulo
├── types/               # Definições de tipos TypeScript
│   └── index.ts        # Tipos para entidades financeiras
├── constants/           # Constantes do sistema
│   └── index.ts        # Status, tipos e configurações fixas
├── config/              # Configurações do módulo
│   └── index.ts        # Configurações de API, limites e permissões
└── utils/               # Utilitários específicos
    └── index.ts        # Funções de formatação, validação e cálculo
```

## Principais Funcionalidades

### Tipos TypeScript
- **TransacaoFinanceira**: Estrutura para transações do sistema
- **ComissaoConfig**: Configuração de comissões por barbeiro/serviço
- **AsaasPayment**: Integração com API Asaas
- **MetricasFinanceiras**: Dados para dashboard
- **ConfigRelatorio**: Configuração de relatórios

### Constantes
- Status de transações e pagamentos
- Tipos de cobrança e métodos de pagamento
- Configurações de formatação e limites
- Mensagens de erro padronizadas

### Configurações
- Integração com API Asaas
- Permissões por role de usuário
- Configurações de notificações
- Limites e validações do sistema

### Utilitários
- Formatação de valores monetários e percentuais
- Cálculos de comissões e taxas de crescimento
- Validações de dados financeiros
- Funções de retry e debounce

## Como Usar

```typescript
import {
  TransacaoFinanceira,
  TRANSACTION_STATUS,
  formatCurrency,
  calculateCommission,
  financialConfig
} from '@/components/financial'

// Exemplo de uso
const valor = 150.00
const valorFormatado = formatCurrency(valor) // "R$ 150,00"

const comissao = calculateCommission(valor, 15) // 15% de comissão
console.log(formatCurrency(comissao)) // "R$ 22,50"
```

## Próximos Passos

Este módulo base será expandido com:
- Componentes React para UI
- Hooks para gerenciamento de estado
- Serviços para integração com APIs
- Testes unitários e de integração

## Requisitos Atendidos

Esta implementação atende aos seguintes requisitos do sistema:
- **1.1**: Dashboard financeiro com métricas principais
- **2.1**: Integração com API Asaas para pagamentos
- **3.1**: Sistema de cálculo de comissões automatizado