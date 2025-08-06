# 🚀 **EXEMPLOS DE USO - HOOKS DA FASE 5**

## 📋 **Guia Prático dos Novos Hooks Otimizados**

Este documento mostra como usar os 10 hooks otimizados criados na Fase 5.

---

## 🔐 **HOOKS DE AUTENTICAÇÃO**

### **1. useAuthOptimized - Hook Consolidado de Autenticação**

```typescript
import { useAuthOptimized } from '@/shared/hooks/auth'

function LoginComponent() {
  const {
    user,
    session,
    status,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshAuth
  } = useAuthOptimized({
    enableCache: true,        // Cache inteligente
    cacheTTL: 5 * 60 * 1000, // 5 minutos
    autoRefresh: true,        // Refresh automático
    onLogin: (user) => {
      console.log('Usuário logado:', user.email)
      // Redirecionar para dashboard
    },
    onLogout: () => {
      console.log('Usuário deslogado')
      // Limpar dados locais
    },
    onError: (error) => {
      console.error('Erro de autenticação:', error)
    }
  })

  const handleLogin = async () => {
    const result = await login('user@example.com', 'password')
    if (result.success) {
      console.log('Login realizado com sucesso!')
    } else {
      console.error('Erro no login:', result.error)
    }
  }

  if (isLoading) return <div>Carregando...</div>
  
  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Bem-vindo, {user?.email}!</p>
          <button onClick={logout}>Sair</button>
        </div>
      ) : (
        <button onClick={handleLogin}>Entrar</button>
      )}
    </div>
  )
}
```

### **2. useSessionManager - Gerenciador Avançado de Sessão**

```typescript
import { useSessionManager } from '@/shared/hooks/auth'

function SessionMonitor() {
  const {
    session,
    status,
    isValid,
    isExpired,
    needsRefresh,
    expiresIn,
    refreshSession
  } = useSessionManager({
    checkInterval: 60 * 1000,     // Verificar a cada 1 minuto
    refreshBeforeExpiry: 5 * 60 * 1000, // Refresh 5 min antes
    maxRefreshAttempts: 3,        // Máximo 3 tentativas
    autoRefresh: true,            // Refresh automático
    onSessionExpired: () => {
      alert('Sua sessão expirou. Faça login novamente.')
      // Redirecionar para login
    },
    onRefreshFailed: (error) => {
      console.error('Falha no refresh:', error)
      // Forçar logout
    }
  })

  const formatTimeRemaining = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60))
    return minutes > 0 ? `${minutes} minutos` : 'Menos de 1 minuto'
  }

  return (
    <div className="session-monitor">
      <div>Status: {status}</div>
      <div>Válida: {isValid ? 'Sim' : 'Não'}</div>
      {needsRefresh && (
        <div className="warning">
          ⚠️ Sessão expira em: {formatTimeRemaining(expiresIn || 0)}
          <button onClick={refreshSession}>Renovar Agora</button>
        </div>
      )}
    </div>
  )
}
```

---

## 📊 **HOOKS DE DADOS**

### **3. useCrudBase - Operações CRUD Reutilizáveis**

```typescript
import { useCrudBase } from '@/shared/hooks/data'

interface User {
  id: string
  name: string
  email: string
}

function UserManagement() {
  const {
    data: users,
    loading,
    error,
    create,
    update,
    remove,
    refetch
  } = useCrudBase<User>({
    tableName: 'users',
    select: 'id, name, email',
    orderBy: { column: 'name', ascending: true },
    onSuccess: (operation, data) => {
      console.log(`${operation} realizado com sucesso:`, data)
    },
    onError: (operation, error) => {
      console.error(`Erro em ${operation}:`, error)
    }
  })

  const handleCreateUser = async () => {
    const newUser = await create({
      name: 'João Silva',
      email: 'joao@example.com'
    })
    
    if (newUser) {
      console.log('Usuário criado:', newUser)
    }
  }

  const handleUpdateUser = async (id: string) => {
    const updatedUser = await update(id, {
      name: 'João Santos'
    })
    
    if (updatedUser) {
      console.log('Usuário atualizado:', updatedUser)
    }
  }

  if (loading) return <div>Carregando usuários...</div>
  if (error) return <div>Erro: {error}</div>

  return (
    <div>
      <button onClick={handleCreateUser}>Criar Usuário</button>
      <button onClick={refetch}>Atualizar Lista</button>
      
      {users?.map(user => (
        <div key={user.id}>
          <span>{user.name} - {user.email}</span>
          <button onClick={() => handleUpdateUser(user.id)}>
            Editar
          </button>
          <button onClick={() => remove(user.id)}>
            Excluir
          </button>
        </div>
      ))}
    </div>
  )
}
```

### **4. usePagination - Sistema de Paginação**

```typescript
import { usePagination } from '@/shared/hooks/data'

function PaginatedList() {
  const {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    previousPage,
    goToPage,
    setPageSize,
    getPageInfo
  } = usePagination({
    initialPage: 1,
    initialPageSize: 10,
    totalItems: 150
  })

  const pageInfo = getPageInfo()

  return (
    <div className="pagination">
      <div>
        Mostrando {pageInfo.startItem} - {pageInfo.endItem} de {totalItems}
      </div>
      
      <div className="pagination-controls">
        <button 
          onClick={previousPage} 
          disabled={!hasPreviousPage}
        >
          Anterior
        </button>
        
        <span>Página {currentPage} de {totalPages}</span>
        
        <button 
          onClick={nextPage} 
          disabled={!hasNextPage}
        >
          Próxima
        </button>
      </div>
      
      <select 
        value={pageSize} 
        onChange={(e) => setPageSize(Number(e.target.value))}
      >
        <option value={10}>10 por página</option>
        <option value={25}>25 por página</option>
        <option value={50}>50 por página</option>
      </select>
    </div>
  )
}
```

---

## ⚡ **HOOKS UTILITÁRIOS**

### **5. useLocalStorage - LocalStorage Tipado**

```typescript
import { useLocalStorage, useSimpleLocalStorage } from '@/shared/hooks/utils'

function SettingsComponent() {
  // LocalStorage complexo com configuração
  const [userSettings, setUserSettings, removeSettings] = useLocalStorage(
    'userSettings',
    {
      theme: 'light',
      language: 'pt-BR',
      notifications: true
    },
    {
      syncAcrossTabs: true,
      onValueChange: (newValue, oldValue) => {
        console.log('Configurações alteradas:', { newValue, oldValue })
      }
    }
  )

  // LocalStorage simples para valores primitivos
  const [theme, setTheme] = useSimpleLocalStorage('theme', 'light')
  const [isEnabled, setIsEnabled] = useSimpleLocalStorage('enabled', true)

  const toggleTheme = () => {
    setUserSettings(prev => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light'
    }))
  }

  const resetSettings = () => {
    removeSettings()
  }

  return (
    <div>
      <h3>Configurações</h3>
      <p>Tema atual: {userSettings.theme}</p>
      <p>Idioma: {userSettings.language}</p>
      <p>Notificações: {userSettings.notifications ? 'Ativadas' : 'Desativadas'}</p>
      
      <button onClick={toggleTheme}>
        Alternar Tema
      </button>
      
      <button onClick={resetSettings}>
        Resetar Configurações
      </button>
    </div>
  )
}
```

### **6. useThrottle - Sistema de Throttling**

```typescript
import { useThrottle, useThrottleValue } from '@/shared/hooks/utils'

function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('')
  
  // Throttle de função - para chamadas de API
  const throttledSearch = useThrottle((query: string) => {
    console.log('Buscando por:', query)
    // Fazer chamada para API
    searchAPI(query)
  }, { 
    delay: 500,
    leading: true,
    trailing: true 
  })

  // Throttle de valor - para inputs
  const throttledSearchTerm = useThrottleValue(searchTerm, { 
    delay: 300 
  })

  // Executar busca quando o valor throttled mudar
  useEffect(() => {
    if (throttledSearchTerm) {
      throttledSearch(throttledSearchTerm)
    }
  }, [throttledSearchTerm, throttledSearch])

  return (
    <div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Digite para buscar..."
      />
      <p>Termo atual: {searchTerm}</p>
      <p>Termo throttled: {throttledSearchTerm}</p>
    </div>
  )
}

// Exemplo com scroll throttling
function ScrollComponent() {
  const { scrollY, scrollDirection, isScrolling } = useScrollThrottle({
    delay: 100,
    onScroll: (scrollInfo) => {
      console.log('Scroll:', scrollInfo)
    }
  })

  return (
    <div style={{ height: '200vh' }}>
      <div style={{ position: 'fixed', top: 0, left: 0 }}>
        <p>Scroll Y: {scrollY}px</p>
        <p>Direção: {scrollDirection}</p>
        <p>Scrolling: {isScrolling ? 'Sim' : 'Não'}</p>
      </div>
    </div>
  )
}
```

### **7. useLoadingStates - Estados de Loading**

```typescript
import { useLoadingStates, useAsyncOperation } from '@/shared/hooks/utils'

function DataComponent() {
  const {
    state,
    isLoading,
    isSuccess,
    isError,
    error,
    data,
    setLoading,
    setSuccess,
    setError,
    reset,
    execute
  } = useLoadingStates({
    timeout: 10000, // 10 segundos
    onStateChange: (state, data, error) => {
      console.log('Estado mudou:', { state, data, error })
    },
    autoResetError: true
  })

  // Uso com execute (recomendado)
  const handleFetchData = () => {
    execute(async () => {
      const response = await fetch('/api/data')
      if (!response.ok) throw new Error('Falha na requisição')
      return response.json()
    })
  }

  // Uso manual
  const handleManualFetch = async () => {
    setLoading()
    try {
      const response = await fetch('/api/data')
      const result = await response.json()
      setSuccess(result)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <button onClick={handleFetchData} disabled={isLoading}>
        {isLoading ? 'Carregando...' : 'Buscar Dados'}
      </button>
      
      <button onClick={reset}>Resetar</button>
      
      {isError && (
        <div className="error">
          Erro: {error}
        </div>
      )}
      
      {isSuccess && data && (
        <div className="success">
          Dados carregados: {JSON.stringify(data)}
        </div>
      )}
      
      <div>Estado atual: {state}</div>
    </div>
  )
}

// Hook simplificado para operações assíncronas
function SimpleAsyncComponent() {
  const { execute, isLoading, error, data } = useAsyncOperation()

  const handleAction = () => {
    execute(async () => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      return 'Operação concluída!'
    })
  }

  return (
    <div>
      <button onClick={handleAction} disabled={isLoading}>
        {isLoading ? 'Executando...' : 'Executar Operação'}
      </button>
      
      {error && <div>Erro: {error}</div>}
      {data && <div>Resultado: {data}</div>}
    </div>
  )
}
```

### **8. usePerformance - Monitoramento de Performance**

```typescript
import { usePerformance, usePerformanceMeasure } from '@/shared/hooks/utils'

function PerformanceMonitor() {
  const {
    metrics,
    isSupported,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    measureOperation,
    getNavigationTiming
  } = usePerformance({
    collectWebVitals: true,
    monitorMemory: true,
    interval: 5000, // 5 segundos
    onMetricsUpdate: (metrics) => {
      console.log('Métricas atualizadas:', metrics)
    }
  })

  const handleExpensiveOperation = async () => {
    const duration = await measureOperation('heavy-calculation', async () => {
      // Simular operação pesada
      await new Promise(resolve => setTimeout(resolve, 1000))
      return 'Resultado da operação'
    })
    
    console.log(`Operação levou ${duration}ms`)
  }

  if (!isSupported) {
    return <div>Performance API não suportada</div>
  }

  return (
    <div className="performance-monitor">
      <h3>Monitor de Performance</h3>
      
      <div>
        <button onClick={startMonitoring} disabled={isMonitoring}>
          Iniciar Monitoramento
        </button>
        <button onClick={stopMonitoring} disabled={!isMonitoring}>
          Parar Monitoramento
        </button>
      </div>
      
      <button onClick={handleExpensiveOperation}>
        Executar Operação Pesada
      </button>
      
      <div className="metrics">
        <h4>Web Vitals:</h4>
        <p>FCP: {metrics.fcp?.toFixed(2)}ms</p>
        <p>LCP: {metrics.lcp?.toFixed(2)}ms</p>
        <p>FID: {metrics.fid?.toFixed(2)}ms</p>
        <p>CLS: {metrics.cls?.toFixed(4)}</p>
        <p>TTFB: {metrics.ttfb?.toFixed(2)}ms</p>
        
        {metrics.memoryUsage && (
          <div>
            <h4>Uso de Memória:</h4>
            <p>Usado: {(metrics.memoryUsage.used / 1024 / 1024).toFixed(2)}MB</p>
            <p>Total: {(metrics.memoryUsage.total / 1024 / 1024).toFixed(2)}MB</p>
            <p>Percentual: {metrics.memoryUsage.percentage.toFixed(1)}%</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Hook simplificado para medir operações
function SimpleMeasureComponent() {
  const { measureAsync, measureSync } = usePerformanceMeasure()

  const handleAsyncOperation = async () => {
    const result = await measureAsync('api-call', async () => {
      const response = await fetch('/api/data')
      return response.json()
    })
    
    console.log('Resultado:', result)
  }

  const handleSyncOperation = () => {
    const result = measureSync('calculation', () => {
      // Cálculo pesado
      let sum = 0
      for (let i = 0; i < 1000000; i++) {
        sum += i
      }
      return sum
    })
    
    console.log('Resultado:', result)
  }

  return (
    <div>
      <button onClick={handleAsyncOperation}>
        Operação Assíncrona
      </button>
      <button onClick={handleSyncOperation}>
        Operação Síncrona
      </button>
    </div>
  )
}
```

---

## 🔄 **COMBINANDO HOOKS**

### **Exemplo Completo - Dashboard com Todos os Hooks**

```typescript
import { 
  useAuthOptimized, 
  useSessionManager,
  useCrudBase,
  usePagination,
  useLocalStorage,
  useThrottle,
  useLoadingStates,
  usePerformance
} from '@/shared/hooks'

function Dashboard() {
  // Autenticação
  const { user, isAuthenticated } = useAuthOptimized({
    enableCache: true,
    autoRefresh: true
  })

  // Sessão
  const { needsRefresh, expiresIn } = useSessionManager({
    autoRefresh: true
  })

  // Configurações locais
  const [dashboardSettings, setDashboardSettings] = useLocalStorage(
    'dashboardSettings',
    { layout: 'grid', itemsPerPage: 10 }
  )

  // Dados com CRUD
  const { data: items, loading, refetch } = useCrudBase({
    tableName: 'dashboard_items',
    select: '*'
  })

  // Paginação
  const pagination = usePagination({
    initialPageSize: dashboardSettings.itemsPerPage,
    totalItems: items?.length || 0
  })

  // Busca com throttle
  const [searchTerm, setSearchTerm] = useState('')
  const throttledSearch = useThrottle((query: string) => {
    // Implementar busca
    console.log('Buscando:', query)
  }, { delay: 300 })

  // Estados de loading
  const { execute, isLoading } = useLoadingStates()

  // Performance
  const { metrics } = usePerformance({
    collectWebVitals: true
  })

  // Efeitos
  useEffect(() => {
    if (searchTerm) {
      throttledSearch(searchTerm)
    }
  }, [searchTerm, throttledSearch])

  const handleRefresh = () => {
    execute(async () => {
      await refetch()
    })
  }

  if (!isAuthenticated) {
    return <div>Não autenticado</div>
  }

  return (
    <div className="dashboard">
      <header>
        <h1>Dashboard - {user?.email}</h1>
        
        {needsRefresh && (
          <div className="session-warning">
            ⚠️ Sessão expira em {Math.floor((expiresIn || 0) / 60000)} min
          </div>
        )}
        
        <div className="performance-info">
          LCP: {metrics.lcp?.toFixed(0)}ms
        </div>
      </header>

      <div className="controls">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar..."
        />
        
        <button onClick={handleRefresh} disabled={isLoading}>
          {isLoading ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      <div className="content">
        {loading ? (
          <div>Carregando dados...</div>
        ) : (
          <div>
            {/* Renderizar items paginados */}
            {items?.slice(
              (pagination.currentPage - 1) * pagination.pageSize,
              pagination.currentPage * pagination.pageSize
            ).map(item => (
              <div key={item.id}>{item.name}</div>
            ))}
          </div>
        )}
      </div>

      <div className="pagination">
        <button 
          onClick={pagination.previousPage}
          disabled={!pagination.hasPreviousPage}
        >
          Anterior
        </button>
        
        <span>
          Página {pagination.currentPage} de {pagination.totalPages}
        </span>
        
        <button 
          onClick={pagination.nextPage}
          disabled={!pagination.hasNextPage}
        >
          Próxima
        </button>
      </div>
    </div>
  )
}
```

---

## 📚 **DICAS DE USO**

### **1. Performance**
- Use `enableCache: true` no `useAuthOptimized` para melhor performance
- Configure `delay` apropriado no `useThrottle` (300-500ms para inputs)
- Use `usePerformance` apenas em desenvolvimento ou com métricas específicas

### **2. Tipagem**
- Sempre defina interfaces TypeScript para seus dados
- Use generics nos hooks de dados: `useCrudBase<User>`
- Configure tipos específicos no `useLocalStorage`

### **3. Error Handling**
- Sempre configure callbacks `onError` nos hooks
- Use `useLoadingStates` para operações críticas
- Implemente fallbacks para quando hooks não são suportados

### **4. Otimização**
- Combine hooks relacionados no mesmo componente
- Use `useMemo` e `useCallback` quando necessário
- Configure `autoRefresh` baseado na criticidade dos dados

---

## 🎯 **PRÓXIMOS PASSOS**

1. **Migração Gradual**: Substitua hooks antigos pelos novos
2. **Testes**: Implemente testes para componentes que usam os hooks
3. **Documentação**: Documente padrões específicos do seu projeto
4. **Monitoramento**: Use métricas de performance para otimizar

---

**Hooks da Fase 5:** ✅ **10 hooks otimizados prontos para uso!**