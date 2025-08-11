# Debug Final: Token Hash

## Problema Persistente

O link ainda está expirando imediatamente, mesmo com a correção PKCE. Vamos fazer um debug mais profundo.

## Teste Específico

### 1. **Quando receber o próximo email:**

**NÃO CLIQUE NO LINK DIRETAMENTE**

Em vez disso:
1. **Copie o link completo** do email
2. **Substitua** `/auth/reset-password` por `/auth/debug-token`
3. **Cole no navegador**

**Exemplo:**
```
❌ Link original: localhost:3000/auth/reset-password?token_hash=pkce_...
✅ Link debug:    localhost:3000/auth/debug-token?token_hash=pkce_...
```

### 2. **Analise os resultados:**

A página de debug vai mostrar:
- ✅ **Parâmetros da URL**: Se o token está chegando
- ✅ **verifyOtp**: Se o método funciona
- ✅ **getSession**: Se a sessão é criada
- ✅ **Análise do Token**: Detalhes técnicos

### 3. **Me informe:**
- Screenshot da página de debug
- Logs do console (F12)
- Resultado de cada teste

## Possíveis Problemas

### 1. **Configuração do Supabase**
- Site URL incorreta
- Redirect URLs não configuradas
- Template de email incorreto

### 2. **Versão do Supabase**
- Método `verifyOtp` pode não existir
- API diferente da documentação

### 3. **Timing/Expiração**
- Token expirando no servidor
- Timezone incorreto

## Configurações Necessárias no Supabase

### Authentication > Settings:
```
Site URL: http://localhost:3000
Redirect URLs: 
- http://localhost:3000/auth/reset-password
- http://localhost:3000/auth/**
```

### Authentication > Email Templates > Reset Password:
```html
<h2>Reset your password</h2>
<p>Follow this link to reset the password for your user:</p>
<p><a href="{{ .SiteURL }}/auth/reset-password?token_hash={{ .TokenHash }}&type=recovery">Reset Password</a></p>
```

## Próximos Passos

1. **Execute o teste** na página `/auth/debug-token`
2. **Verifique configurações** no painel Supabase
3. **Me mostre os resultados** do debug

Com essas informações, posso identificar exatamente onde está o problema e implementar a solução correta.

## Suspeitas Principais

1. **Configuração incorreta** no painel Supabase
2. **Método de verificação** não suportado na versão atual
3. **Template de email** gerando tokens inválidos
4. **Timezone/expiração** no servidor

Vamos descobrir qual é! 🕵️‍♂️