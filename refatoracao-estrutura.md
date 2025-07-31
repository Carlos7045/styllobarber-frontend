# Análise da Estrutura de Diretórios - StylloBarber Frontend

## Problemas Identificados na Estrutura Atual

### 1. Inconsistências na Organização de Componentes

#### Duplicação de Conceitos
- `components/agendamento/` vs `components/appointments/` - Mesmo domínio, nomes diferentes
- `components/client/` vs `components/clients/` - Singular vs plural inconsistente

#### Mistura de Responsabilidades
- `components/admin/` contém 26+ arquivos com responsabilidades muito variadas
- `components/debug/` com 23 arquivos de debug misturados com código de produção
- `components/financial/` tem sua própria estrutura interna completa (hooks, services, etc.)

#### Componentes Órfãos
- `components/common/` com apenas 2 arquivos genéricos
- `components/monitoring/` com 3 arquivos específicos
- `components/operational/` com apenas 1 arquivo

### 2. Estrutura de Hooks Desorganizada

#### Todos os Hooks em Uma Pasta Plana
- 35+ hooks em uma única pasta sem categorização
- Nomes inconsistentes (use-admin-* vs use-*-data vs use-*)
- Hooks de backup e debug misturados com produção

#### Padrões de Nomenclatura Inconsistentes
- `use-admin-agendamentos.ts` vs `use-appointments.ts`
- `use-funcionarios-especialidades.ts` vs `use-services.ts`
- `use-session-manager-simple.ts` vs `use-minimal-session-manager.ts`

### 3. Lib/ Desorganizada

#### Arquivos Sem Categorização Clara
- 25+ arquivos utilitários sem organização por domínio
- Funcionalidades similares espalhadas (auth-*, validation-*, etc.)
- Arquivos de configuração misturados com utilities

### 4. Estrutura Proposta vs Realidade

#### Financial/ Como Exemplo de Boa Estrutura
```
components/financial/
├── components/     # Componentes específicos
├── hooks/         # Hooks do domínio
├── services/      # Services do domínio
├── types/         # Tipos específicos
├── utils/         # Utilities específicas
└── examples/      # Exemplos e demos
```

## Nova Estrutura Proposta

### 1. Reorganização por Domínio

```
src/
├── domains/                    # Domínios de negócio
│   ├── auth/                  # Autenticação
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── appointments/          # Agendamentos (unificado)
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   ├── users/                 # Usuários (admin + client)
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   └── client/
│   │   ├── hooks/
│   │   └── services/
│   ├── financial/             # Financeiro (já bem estruturado)
│   ├── notifications/         # Notificações
│   └── services/              # Serviços da barbearia
├── shared/                    # Código compartilhado
│   ├── components/            # Componentes reutilizáveis
│   │   ├── ui/               # Design system
│   │   ├── layout/           # Layout components
│   │   ├── forms/            # Form components
│   │   └── feedback/         # Loading, errors, etc.
│   ├── hooks/                # Hooks genéricos
│   ├── services/             # Services base
│   ├── utils/                # Utilities gerais
│   └── types/                # Tipos compartilhados
├── lib/                      # Configurações e setup
│   ├── api/                  # Configuração de APIs
│   ├── auth/                 # Setup de autenticação
│   ├── database/             # Configuração do banco
│   └── config/               # Configurações gerais
└── app/                      # Next.js App Router (mantido)
```

### 2. Migração Detalhada

#### Domínio: Auth
**Mover para `domains/auth/`:**
- `components/auth/*` → `domains/auth/components/`
- `hooks/use-auth*` → `domains/auth/hooks/`
- `lib/auth-*` → `domains/auth/services/`
- `types/auth.ts` → `domains/auth/types/`

#### Domínio: Appointments (Unificado)
**Consolidar em `domains/appointments/`:**
- `components/agendamento/*` → `domains/appointments/components/`
- `components/appointments/*` → `domains/appointments/components/`
- `components/calendar/*` → `domains/appointments/components/calendar/`
- `hooks/use-*agendamento*` → `domains/appointments/hooks/`
- `hooks/use-appointments*` → `domains/appointments/hooks/`

#### Domínio: Users
**Consolidar em `domains/users/`:**
- `components/admin/User*` → `domains/users/components/admin/`
- `components/admin/*Management*` → `domains/users/components/admin/`
- `components/client/*` → `domains/users/components/client/`
- `components/clients/*` → `domains/users/components/client/`
- `hooks/use-admin-clientes*` → `domains/users/hooks/`
- `hooks/use-admin-funcionarios*` → `domains/users/hooks/`

#### Domínio: Notifications
**Consolidar em `domains/notifications/`:**
- `components/admin/Notification*` → `domains/notifications/components/`
- `hooks/use-admin-notificacoes*` → `domains/notifications/hooks/`
- `types/notifications.ts` → `domains/notifications/types/`

#### Shared Components
**Reorganizar em `shared/components/`:**
- `components/ui/*` → `shared/components/ui/` (mantido)
- `components/layout/*` → `shared/components/layout/`
- `components/forms/*` → `shared/components/forms/`
- `components/common/*` → `shared/components/feedback/`

### 3. Limpeza de Arquivos

#### Remover Imediatamente
- `components/debug/` (mover para pasta separada de desenvolvimento)
- `hooks/*.backup` (arquivos de backup)
- `examples/` (mover para documentação)
- Componentes duplicados de notificações

#### Consolidar
- Session managers (manter apenas 1 implementação)
- Hooks de especialidades (manter apenas versão simples)
- Validation files (unificar em um local)

### 4. Atualização dos Steering Files

#### Arquivos Atuais para Revisar
- `structure.md` - Atualizar com nova organização
- `tech.md` - Atualizar padrões de import/export
- `product.md` - Manter atualizado
- `language.md` - Verificar se ainda relevante

#### Novos Steering Files Necessários
- `domains.md` - Explicar organização por domínios
- `imports.md` - Padrões de import/export
- `testing.md` - Estratégias de teste
- `performance.md` - Guidelines de performance

## Benefícios da Nova Estrutura

### 1. Organização Clara
- Cada domínio é auto-contido
- Fácil localização de código relacionado
- Separação clara entre shared e domain-specific

### 2. Escalabilidade
- Novos domínios podem ser adicionados facilmente
- Estrutura consistente entre domínios
- Facilita trabalho em equipe

### 3. Manutenibilidade
- Reduz acoplamento entre domínios
- Facilita refatoração de domínios específicos
- Melhora testabilidade

### 4. Performance
- Permite code splitting por domínio
- Reduz bundle size através de tree shaking
- Facilita lazy loading

## Plano de Migração

### Fase 1: Preparação
1. Criar nova estrutura de pastas
2. Configurar barrel exports
3. Atualizar tsconfig paths

### Fase 2: Migração por Domínio
1. Auth (menor risco)
2. Notifications (componentes duplicados)
3. Users (consolidação complexa)
4. Appointments (unificação)

### Fase 3: Shared Components
1. Reorganizar UI components
2. Consolidar utilities
3. Atualizar imports

### Fase 4: Limpeza e Otimização
1. Remover arquivos não utilizados
2. Atualizar steering files
3. Validar build e testes