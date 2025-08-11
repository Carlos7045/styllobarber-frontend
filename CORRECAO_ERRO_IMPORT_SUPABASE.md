# 🔧 Correção: Erro de Import Supabase

## ❌ **Problema Identificado**

```
Module not found: Can't resolve '@/lib/supabase'
```

## ✅ **Causa do Erro**

O arquivo de configuração do Supabase está localizado em:
- **Localização correta**: `src/lib/api/supabase.ts`
- **Import incorreto usado**: `@/lib/supabase`
- **Import correto**: `@/lib/api/supabase`

## 🔧 **Correções Aplicadas**

### **1. Arquivos Corrigidos:**
- ✅ `src/app/auth/test-supabase/page.tsx`
- ✅ `src/app/auth/reset-admin/page.tsx`
- ✅ `src/app/auth/reset-sql/page.tsx`

### **2. Import Corrigido:**
```typescript
// ❌ Antes (incorreto)
import { supabase } from '@/lib/supabase'

// ✅ Depois (correto)
import { supabase } from '@/lib/api/supabase'
```

### **3. Variáveis de Ambiente:**
Criado arquivo `.env.local` com as configurações corretas:
```env
NEXT_PUBLIC_SUPABASE_URL=https://qekicxjdhehwzisjpupt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_LOCALE=pt-BR
NODE_ENV=development
```

### **4. Configuração do Supabase Verificada:**
O arquivo `src/lib/api/supabase.ts` está correto:
- ✅ Usa `createBrowserClient` para SSR
- ✅ Validação de variáveis de ambiente
- ✅ Export correto do cliente

## 🚀 **Teste Agora**

1. **Reinicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

2. **Acesse as páginas corrigidas:**
   - `http://localhost:3000/auth/test-supabase`
   - `http://localhost:3000/auth/reset-admin`
   - `http://localhost:3000/auth/reset-sql`

## ✅ **Resultado Esperado**

Agora todas as páginas devem carregar sem erro e você poderá:
- ✅ Executar testes do Supabase
- ✅ Usar o reset de senha admin
- ✅ Usar o reset SQL de emergência

## 🔍 **Verificação**

Se ainda houver problemas, verifique:
1. **Servidor reiniciado**: `Ctrl+C` e `npm run dev`
2. **Cache limpo**: `Ctrl+Shift+R` no navegador
3. **Console do navegador**: F12 para ver logs

**🎯 Teste imediatamente: `http://localhost:3000/auth/test-supabase`**