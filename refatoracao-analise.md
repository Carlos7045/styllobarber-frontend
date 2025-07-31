# Análise de Refatoração - StylloBarber Frontend

## Arquivos Não Utilizados Identificados

### 1. Arquivos de Exemplo e Debug
- `src/examples/validation-example.tsx` - Apenas referenciado em documentação
- `src/app/debug-logout/` - Pasta de debug, pode ser removida em produção
- `src/app/debug-saas/` - Pasta de debug, pode ser removida em produção  
- `src/app/test-route-guard/` - Pasta de teste, pode ser removida em produção
- `src/app/test-saas/` - Pasta de teste, pode ser removida em produção

### 2. Arquivos Backup
- `src/hooks/use-session-manager.ts.backup` - Arquivo de backup, pode ser removido

### 3. Hooks Duplicados/Não Utilizados
- `src/hooks/use-funcionarios-especialidades.ts` - Versão não utilizada
- `src/hooks/use-funcionarios-especialidades-debug.ts` - Versão de debug não utilizada
- `src/hooks/use-stable-session-manager.ts` - Não está sendo importado em lugar nenhum

## Hooks com Funcionalidades Similares (Candidatos à Consolidação)

### 1. Session Management
- `use-minimal-session-manager.ts` - Versão simplificada (EM USO)
- `use-session-manager-simple.ts` - Outra versão simplificada
- `use-stable-session-manager.ts` - Versão otimizada (NÃO UTILIZADA)

### 2. Funcionários e Especialidades
- `use-funcionarios-especialidades.ts` - Versão completa (NÃO UTILIZADA)
- `use-funcionarios-especialidades-simple.ts` - Versão simplificada (EM USO)
- `use-funcionarios-especialidades-debug.ts` - Versão debug (NÃO UTILIZADA)

### 3. Hooks de Dados Admin
Múltiplos hooks com padrões similares que podem ser consolidados:
- `use-admin-agendamentos.ts`
- `use-admin-clientes.ts`
- `use-admin-funcionarios.ts`
- `use-admin-horarios.ts`
- `use-admin-servicos.ts`

## Estrutura de Diretórios - Problemas Identificados

### 1. Inconsistências na Organização
- Componentes misturados entre `components/admin/`, `components/client/`, etc.
- Alguns componentes em pastas genéricas como `components/common/`
- Hooks todos em uma pasta plana sem categorização

### 2. Duplicação de Funcionalidades
- Múltiplos componentes de notificações
- Vários hooks de session management
- Componentes similares em diferentes pastas

### 3. Arquivos de Configuração Espalhados
- Constantes em `lib/constants.ts`
- Design tokens em `lib/design-tokens.ts`
- Validações em `lib/validations.ts` e `lib/validation-schemas.ts`

## Imports Não Utilizados (Amostra)

### Componentes com Imports Desnecessários
Baseado na análise anterior do ESLint, há 160+ warnings de imports não utilizados, incluindo:
- Ícones do Lucide React não utilizados
- Hooks importados mas não usados
- Tipos TypeScript não referenciados
- Componentes UI importados mas não utilizados

## Recomendações de Limpeza Imediata

### 1. Remoção Segura (Baixo Risco)
- Remover arquivos de backup (.backup)
- Remover pastas de debug e test em produção
- Remover arquivo de exemplo não utilizado

### 2. Consolidação de Hooks (Médio Risco)
- Manter apenas `use-funcionarios-especialidades-simple.ts`
- Consolidar hooks de session management
- Criar hook base para operações CRUD admin

### 3. Limpeza de Imports (Baixo Risco)
- Executar linter para remover imports não utilizados
- Limpar comentários obsoletos
- Remover código comentado

## Próximos Passos

1. **Fase 1**: Remover arquivos claramente não utilizados
2. **Fase 2**: Consolidar hooks duplicados
3. **Fase 3**: Reorganizar estrutura de diretórios
4. **Fase 4**: Limpar imports e otimizar código