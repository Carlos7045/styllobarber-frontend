# Arquivos Não Utilizados - StylloBarber

## 📊 Resumo da Análise

**Total de arquivos não utilizados: 307**
**Dependências não utilizadas: 20**

## 🚨 Dependências Não Utilizadas (20)

### Dependências de Produção (8)
1. `@hello-pangea/dnd` - Drag and drop
2. `@hookform/resolvers` - Resolvers para React Hook Form
3. `@radix-ui/react-alert-dialog` - Componente de diálogo
4. `@radix-ui/react-dialog` - Componente de modal
5. `@radix-ui/react-dropdown-menu` - Menu dropdown
6. `@radix-ui/react-slot` - Componente slot
7. `@radix-ui/react-tabs` - Componente de abas
8. `@radix-ui/react-toast` - Componente de toast

### Dependências Críticas Marcadas como "Não Utilizadas" (12)
⚠️ **ATENÇÃO**: Estas dependências são utilizadas mas não detectadas corretamente:
1. `@supabase/auth-helpers-nextjs` - **USADO** no middleware
2. `@supabase/ssr` - **USADO** para SSR
3. `@tanstack/react-query` - **USADO** para cache
4. `class-variance-authority` - **USADO** nos componentes UI
5. `clsx` - **USADO** para classes condicionais
6. `date-fns` - **USADO** para manipulação de datas
7. `framer-motion` - **USADO** para animações
8. `lucide-react` - **USADO** para ícones
9. `recharts` - **USADO** para gráficos
10. `tailwind-merge` - **USADO** para merge de classes
11. `zod` - **USADO** para validação
12. `zustand` - **PODE SER USADO** para estado global

## 📁 Arquivos Não Utilizados por Categoria

### 🐛 Componentes Debug (25 arquivos) - **REMOÇÃO PRIORITÁRIA**
```
src/components/debug/
├── AuthDebugPanel.tsx
├── AuthFlowTester.tsx
├── AuthHealthDashboard.tsx
├── AuthValidationPanel.tsx
├── DatabaseTestPanel.tsx
├── DateTestPanel.tsx
├── DirectAuthTest.tsx
├── EmergencyLogout.tsx
├── ForceLogoutTest.tsx
├── InteractivityTest.tsx
├── LogoutDebugger.tsx
├── PDVDataDebug.tsx
├── PerformanceDashboard.tsx
├── PerformanceMonitor.tsx
├── PermissionsDebug.tsx
├── ProfileTestPanel.tsx
├── QuickUserInfo.tsx
├── RoleDebugger.tsx
├── RouteGuardDebugger.tsx
├── SecurityMonitor.tsx
├── SimpleAuthTest.tsx
├── SystemHealthMonitor.tsx
├── TestButton.tsx
├── UserDebugInfo.tsx
├── UserRoleDebugger.tsx
```

### 🧪 Páginas de Teste (5 arquivos) - **REMOÇÃO PRIORITÁRIA**
```
src/app/dashboard/
├── debug/page.tsx
├── test-auth/page.tsx
├── test-permissions/page.tsx
└── debug-logout/page.tsx
└── test-route-guard/page.tsx
```

### 📊 Componentes Financeiros (50+ arquivos) - **REVISAR**
Muitos componentes do sistema financeiro não estão sendo utilizados:
```
src/components/financial/
├── components/ (22 arquivos)
├── examples/ (5 arquivos)
├── hooks/ (8 arquivos)
├── services/ (15 arquivos)
└── utils/ (3 arquivos)
```

### 🔧 Componentes Admin (23 arquivos) - **REVISAR**
```
src/components/admin/
├── BloqueioHorarioForm.tsx
├── ConfirmDialog.tsx
├── CreateEmployeeForm.tsx
├── CriarFuncionarioModal.tsx
├── EspecialidadesModal.tsx
├── FuncionarioManagement.tsx
├── HistoricoPrecoModal.tsx
├── HorarioFuncionamentoForm.tsx
├── HorariosManager.tsx
├── NotificacoesManager.tsx
├── NotificationCenter.tsx
├── NotificationLogs.tsx
├── NotificationSettings.tsx
├── NotificationStats.tsx
├── NovoFuncionarioModal.tsx
├── ScheduledNotifications.tsx
├── ServicoAnalyticsCard.tsx
├── ServicoCategoriaManager.tsx
├── ServicoFormModal.tsx
├── SystemStatusCard.tsx
├── TemplateEditor.tsx
├── UserEditModal.tsx
└── UserManagement.tsx
```

### 🔐 Componentes Auth (12 arquivos) - **REVISAR CUIDADOSAMENTE**
```
src/components/auth/
├── AuthFeedback.tsx
├── AuthFeedbackEnhanced.tsx
├── AuthLoadingState.tsx
├── AuthLoadingStates.tsx
├── AuthValidation.tsx
├── LogoutButton.tsx
├── LogoutPage.tsx
├── PermissionGuard.tsx
├── route-guard.tsx
├── SessionErrorBoundary.tsx
├── SessionProvider.tsx
├── SessionStatus.tsx
└── SimpleRouteGuard.tsx
```

### 📅 Componentes Calendar (4 arquivos) - **REVISAR**
```
src/components/calendar/
├── Calendar.tsx
├── CalendarFilters.tsx
├── CalendarStats.tsx
└── index.ts
```

### 🎯 Hooks Não Utilizados (32 arquivos) - **REVISAR**
```
src/hooks/
├── use-admin-agendamentos.ts
├── use-admin-clientes.ts
├── use-admin-funcionarios.ts
├── use-admin-horarios.ts
├── use-admin-notificacoes.ts
├── use-admin-servicos.ts
├── use-agendamentos-pendentes.ts
├── use-appointment-reports.ts
├── use-appointments.ts
├── use-auth-health.ts
├── use-barber-clients.ts
├── use-barber-financial-data.ts
├── use-barber-permissions.ts
├── use-cash-flow-data.ts
├── use-client-appointments.ts
├── use-client-reports.ts
├── use-dashboard-data.ts
├── use-debounce.ts
├── use-error-recovery.ts
├── use-error-toast.ts
├── use-financial-data.ts
├── use-form-validation.ts
├── use-funcionarios-especialidades-simple.ts
├── use-minimal-session-manager.ts
├── use-operational-reports.ts
├── use-pdv-data.ts
├── use-performance-monitor.ts
├── use-permissions.ts
├── use-profile-sync.ts
├── use-services.ts
├── use-settings.ts
└── index.ts
```

### 📚 Utilitários Lib (25 arquivos) - **REVISAR**
```
src/lib/
├── alert-system.ts
├── auth-interceptor.ts
├── auth-utils.ts
├── auth-validator.ts
├── cache-manager.ts
├── connection-pool.ts
├── constants.ts
├── date-utils.ts
├── design-tokens.ts
├── error-handler.ts
├── error-recovery.ts
├── logger.ts
├── logout-manager.ts
├── monitoring-permissions.ts
├── network-retry.ts
├── performance-monitor.ts
├── profile-sync.ts
├── query-optimizer.ts
├── rate-limiter-enhanced.ts
├── rate-limiter.ts
├── responsive.ts
├── security-logger.ts
├── session-manager.ts
├── storage-fallback.ts
├── storage.ts
├── validation-schemas.ts
└── validations.ts
```

## 🎯 Plano de Ação Recomendado

### Fase 1: Remoção Imediata (Segura)
1. **Remover pasta debug completa** (25 arquivos)
2. **Remover páginas de teste** (5 arquivos)
3. **Remover arquivos de exemplo** (10+ arquivos)

### Fase 2: Análise Detalhada (Cuidadosa)
1. **Revisar componentes admin** - Verificar se são usados em rotas específicas
2. **Revisar hooks** - Alguns podem ser importados dinamicamente
3. **Revisar componentes auth** - Críticos para segurança

### Fase 3: Consolidação
1. **Unificar componentes duplicados**
2. **Consolidar hooks similares**
3. **Reorganizar estrutura**

## ⚠️ Arquivos que PODEM ser Falsos Positivos

### Rotas Next.js (48 arquivos)
As páginas do Next.js são carregadas automaticamente pelo roteador, então podem não aparecer como "importadas" mas são utilizadas:
- Todas as páginas em `src/app/`
- Layouts e componentes de rota

### Componentes Críticos
- Componentes de autenticação
- Middleware
- Contextos
- Tipos TypeScript

## 📊 Impacto Estimado da Limpeza

- **Arquivos para remoção segura**: ~40 (debug + testes + exemplos)
- **Arquivos para análise**: ~200
- **Redução estimada de bundle**: 25-35%
- **Melhoria de build time**: 15-20%
- **Redução de complexidade**: Significativa

---

*Próximo passo: Iniciar remoção dos arquivos de debug e teste*