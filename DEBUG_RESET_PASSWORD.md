# Debug do Reset Password

## Como Testar

### 1. Abra o Console do Navegador
- Pressione F12 ou Ctrl+Shift+I
- Vá para a aba "Console"

### 2. Acesse a Página de Reset
- Vá para: `http://localhost:3000/auth/reset-password`
- Observe os logs no console

### 3. Solicite um Novo Reset
1. Digite o email do Admin SaaS
2. Clique em "Enviar Link de Recuperação"
3. Verifique se aparece a mensagem de sucesso

### 4. Verifique o Email
- Abra o email recebido
- **NÃO CLIQUE NO LINK AINDA**
- Copie o link completo do email

### 5. Analise o Link
O link deve ter um formato similar a:
```
http://localhost:3000/auth/reset-password?access_token=XXXXX&expires_at=XXXXX&refresh_token=XXXXX&token_hash=XXXXX&type=recovery
```

OU pode ter formato com hash:
```
http://localhost:3000/auth/reset-password#access_token=XXXXX&expires_at=XXXXX&refresh_token=XXXXX&token_hash=XXXXX&type=recovery
```

### 6. Teste o Link
1. Cole o link copiado em uma nova aba
2. Observe os logs no console
3. Procure por estas mensagens:
   - `🔍 Todos os parâmetros da URL:`
   - `🔑 Verificando tokens:`
   - `✅ Tokens de recuperação detectados` (se funcionou)
   - `❌ Erro detectado na URL:` (se expirou)

## Logs Esperados

### Se o Link Estiver Válido:
```
🔍 Todos os parâmetros da URL: {access_token: "...", refresh_token: "...", type: "recovery"}
🔑 Verificando tokens: {hasAccessToken: true, hasRefreshToken: true, type: "recovery"}
✅ Tokens de recuperação detectados, configurando sessão...
✅ Sessão configurada com sucesso, modo reset
```

### Se o Link Estiver Expirado:
```
🔍 Todos os parâmetros da URL: {error: "access_denied", error_code: "otp_expired"}
❌ Erro detectado na URL: {error: "access_denied", errorCode: "otp_expired"}
```

### Se Não Houver Tokens:
```
🔍 Todos os parâmetros da URL: {}
ℹ️ Nenhum token válido detectado, modo request
```

## Possíveis Problemas

### 1. Link Expirando Muito Rápido
- Os tokens do Supabase expiram em 1 hora por padrão
- Se demorar muito para clicar, vai expirar

### 2. Configuração do Email Template
- O Supabase pode estar usando template padrão
- Verificar se o redirectTo está correto

### 3. Configuração do Projeto
- Verificar se as URLs estão configuradas no painel do Supabase

## Próximos Passos

Dependendo dos logs que aparecerem, podemos:

1. **Se aparecer "Tokens detectados" mas não funcionar**: Problema na configuração da sessão
2. **Se aparecer "Link expirado"**: Problema de timing, solicitar novo link
3. **Se não aparecer tokens**: Problema no formato do link do email
4. **Se não aparecer logs**: Problema no componente handler

## Teste Alternativo

Se o link do email não funcionar, teste manualmente:

1. Vá para: `http://localhost:3000/auth/reset-password?type=recovery&access_token=test&refresh_token=test`
2. Deve aparecer no console: "Tokens de recuperação detectados"
3. Vai dar erro na sessão, mas confirma que a detecção funciona

## Informações para Reportar

Quando testar, me informe:

1. **URL completa** que aparece no navegador quando clica no link
2. **Logs do console** (copie e cole)
3. **Formato do link** no email (com ou sem #)
4. **Tempo** entre solicitar e clicar no link
5. **Se o email chegou** e em quanto tempo