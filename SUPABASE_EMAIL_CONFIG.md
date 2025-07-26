# Configuração de Email no Supabase para Desenvolvimento

## 🚫 Desabilitar Confirmação de Email (Desenvolvimento)

Para facilitar o desenvolvimento, você pode desabilitar a confirmação de email no Supabase:

### Passos:

1. **Acesse o Dashboard do Supabase**
   - Vá para [supabase.com](https://supabase.com)
   - Faça login na sua conta
   - Selecione seu projeto

2. **Navegue para Authentication**
   - No menu lateral, clique em "Authentication"
   - Clique em "Settings"

3. **Desabilitar Confirmação de Email**
   - Procure por "Email confirmation"
   - **Desmarque** a opção "Enable email confirmations"
   - Clique em "Save"

4. **Configurações Adicionais (Opcional)**
   - Você também pode desabilitar "Enable email change confirmations"
   - E "Enable phone confirmations" se não estiver usando

### ⚠️ Importante:

- **Apenas para desenvolvimento**: Reative a confirmação em produção
- **Segurança**: Sem confirmação, qualquer email pode ser usado
- **Teste**: Após desabilitar, teste o cadastro e login

## 🔄 Reabilitar para Produção

Quando for para produção:

1. **Reative a confirmação de email**
2. **Configure templates de email personalizados**
3. **Configure domínio de email personalizado**
4. **Teste o fluxo completo de confirmação**

## 📧 Configurar Email Templates (Produção)

1. **Vá para Authentication > Email Templates**
2. **Personalize os templates**:
   - Confirm signup
   - Reset password
   - Magic link
   - Email change

3. **Configure variáveis**:
   - `{{ .SiteURL }}` - URL do seu site
   - `{{ .Token }}` - Token de confirmação
   - `{{ .TokenHash }}` - Hash do token

## 🎨 Template de Exemplo

```html
<h2>Confirme seu email</h2>
<p>Olá! Clique no link abaixo para confirmar sua conta:</p>
<a href="{{ .SiteURL }}/auth/confirm?token={{ .TokenHash }}&type=signup">
  Confirmar Email
</a>
```

## 🔧 Configuração de Redirect URLs

Em **Authentication > URL Configuration**:

- **Site URL**: `http://localhost:3000` (dev) / `https://seudominio.com` (prod)
- **Redirect URLs**: 
  - `http://localhost:3000/auth/callback`
  - `https://seudominio.com/auth/callback`