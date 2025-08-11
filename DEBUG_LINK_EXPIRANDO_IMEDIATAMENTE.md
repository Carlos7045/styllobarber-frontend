# Debug: Link Expirando Imediatamente

## Problema Identificado

O link de reset está sendo marcado como expirado **imediatamente** após ser clicado, mesmo sendo aberto em segundos. Isso não é comportamento normal.

## Possíveis Causas

### 1. **Configuração do Supabase**
- URL de redirect não configurada no painel
- Domínio não autorizado
- Configurações de email template incorretas

### 2. **Problema de Timezone**
- Servidor e cliente com timezones diferentes
- Token sendo gerado com timestamp incorreto

### 3. **Configuração de Desenvolvimento**
- localhost não configurado como domínio válido
- Configurações de desenvolvimento vs produção

## Testes para Executar

### Teste 1: Página de Debug
1. Acesse: `http://localhost:3000/auth/test-reset`
2. Digite o email do Admin SaaS
3. Clique em "Executar Testes"
4. Observe os logs no console
5. **Me informe os resultados**

### Teste 2: Verificar Configurações do Supabase
1. Acesse o painel do Supabase
2. Vá em **Authentication > Settings**
3. Verifique **Site URL**: deve ser `http://localhost:3000`
4. Verifique **Redirect URLs**: deve incluir `http://localhost:3000/auth/reset-password`

### Teste 3: Logs Detalhados
1. Abra o console (F12)
2. Vá para `/auth/reset-password`
3. Solicite reset
4. Observe os logs:
   - `🔄 Iniciando reset de senha para:`
   - `📊 Resultado do resetPasswordForEmail:`
   - `✅ Reset enviado com sucesso`

### Teste 4: Verificar Email Recebido
1. Copie o link completo do email
2. **NÃO CLIQUE AINDA**
3. Analise o formato do link
4. Me envie o link (pode mascarar tokens sensíveis)

## Formatos de Link Esperados

### Formato Correto:
```
http://localhost:3000/auth/reset-password?access_token=XXXXX&expires_at=1234567890&refresh_token=XXXXX&token_hash=XXXXX&type=recovery
```

### Formato com Hash:
```
http://localhost:3000/auth/reset-password#access_token=XXXXX&expires_at=1234567890&refresh_token=XXXXX&token_hash=XXXXX&type=recovery
```

### Formato com Erro (problemático):
```
http://localhost:3000/auth/reset-password?error=access_denied&error_code=otp_expired
```

## Verificações no Painel Supabase

### Authentication > Settings
- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: 
  - `http://localhost:3000/auth/reset-password`
  - `http://localhost:3000/**` (wildcard)

### Authentication > Email Templates
- Verificar se o template de "Reset Password" está usando a URL correta
- Template deve ter: `{{ .SiteURL }}/auth/reset-password?token_hash={{ .TokenHash }}&type=recovery`

## Soluções Possíveis

### Solução 1: Configurar URLs no Supabase
```
Site URL: http://localhost:3000
Redirect URLs: 
- http://localhost:3000/auth/reset-password
- http://localhost:3000/auth/**
```

### Solução 2: Usar URL Absoluta
```typescript
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: 'http://localhost:3000/auth/reset-password',
})
```

### Solução 3: Verificar Template de Email
No painel Supabase > Authentication > Email Templates > Reset Password:
```html
<a href="{{ .SiteURL }}/auth/reset-password?token_hash={{ .TokenHash }}&type=recovery&access_token={{ .Token }}&refresh_token={{ .RefreshToken }}">
  Reset Password
</a>
```

## Próximos Passos

1. **Execute o Teste 1** na página `/auth/test-reset`
2. **Verifique as configurações** no painel Supabase
3. **Me informe**:
   - Resultados dos testes
   - Configurações atuais do Supabase
   - Formato do link no email
   - Logs do console

Com essas informações, posso identificar exatamente onde está o problema e corrigi-lo.

## Suspeita Principal

Acredito que o problema seja uma das seguintes:
1. **URL não configurada** no painel Supabase
2. **Template de email** usando formato incorreto
3. **Timezone/timestamp** incorreto no servidor

Vamos descobrir qual é! 🕵️‍♂️