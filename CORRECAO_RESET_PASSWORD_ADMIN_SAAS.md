# Correção do Reset Password para Admin SaaS

## Problema Identificado
- Admin SaaS tentando recuperar senha via link do email
- Link expirando ou sendo inválido (error=access_denied&error_code=otp_expired)
- Página mostrando formulário de solicitação em vez de formulário de nova senha

## Soluções Implementadas

### 1. Componente Handler Inteligente
```typescript
// src/shared/components/forms/auth/reset-password-handler.tsx
export function ResetPasswordHandler() {
  const [mode, setMode] = useState<'loading' | 'request' | 'reset'>('loading')
  
  useEffect(() => {
    const checkResetMode = async () => {
      // Detecta se há erro na URL
      const error = searchParams.get('error')
      
      // Detecta tokens de recuperação válidos
      const accessToken = searchParams.get('access_token')
      const refreshToken = searchParams.get('refresh_token')
      const type = searchParams.get('type')

      if (accessToken && refreshToken && type === 'recovery') {
        // Configura sessão e mostra formulário de nova senha
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        setMode('reset')
      } else {
        // Mostra formulário de solicitação
        setMode('request')
      }
    }
  }, [searchParams])
}
```

### 2. Formulário de Nova Senha
```typescript
// src/shared/components/forms/auth/new-password-form.tsx
export function NewPasswordForm() {
  // Detecta erros na URL (link expirado)
  useEffect(() => {
    const urlError = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    
    if (urlError === 'access_denied' && errorDescription?.includes('expired')) {
      setError('O link de recuperação expirou. Solicite um novo link.')
    }
  }, [searchParams])

  // Atualiza senha via Supabase
  const onSubmit = async (data) => {
    const { error } = await supabase.auth.updateUser({
      password: data.password
    })
  }
}
```

### 3. Validação Robusta de Senha
```typescript
const schemaNewPassword = z.object({
  password: z.string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Senha deve conter maiúscula, minúscula e número'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
})
```

### 4. Estados de Interface
- **Loading**: Enquanto detecta o tipo de operação
- **Request**: Formulário para solicitar reset (email)
- **Reset**: Formulário para definir nova senha
- **Success**: Confirmação de senha atualizada
- **Error**: Link expirado ou inválido

## Fluxo Completo para Admin SaaS

### 1. Solicitação de Reset
1. Admin acessa `/auth/reset-password`
2. Insere email da conta SaaS
3. Sistema envia email via Supabase
4. Email contém link: `localhost:3000/auth/reset-password?access_token=...&refresh_token=...&type=recovery`

### 2. Processamento do Link
1. Handler detecta tokens na URL
2. Configura sessão temporária no Supabase
3. Mostra formulário de nova senha
4. Valida senha com critérios de segurança

### 3. Atualização da Senha
1. Usuário define nova senha
2. Sistema atualiza via `supabase.auth.updateUser()`
3. Mostra confirmação de sucesso
4. Redireciona para login após 3 segundos

### 4. Tratamento de Erros
- **Link expirado**: Mostra mensagem específica + botão para novo link
- **Link inválido**: Redireciona para formulário de solicitação
- **Erro de validação**: Mostra erros específicos por campo
- **Erro de rede**: Mensagem genérica de erro

## Melhorias de UX

### 1. Feedback Visual
- Loading states durante detecção
- Ícones específicos para cada estado
- Mensagens claras e em português
- Botões de ação bem definidos

### 2. Navegação
- Links para voltar ao login
- Botão para solicitar novo link
- Redirecionamento automático após sucesso

### 3. Segurança
- Validação robusta de senha
- Campos de senha com toggle de visibilidade
- Confirmação de senha obrigatória
- Limpeza de tokens após uso

## Estrutura Final

```
src/shared/components/forms/auth/
├── reset-password-handler.tsx    # Handler inteligente
├── reset-password-form.tsx       # Formulário de solicitação
├── new-password-form.tsx         # Formulário de nova senha
└── index.ts                      # Exports
```

## Resultado
- ✅ Link de reset funciona corretamente para Admin SaaS
- ✅ Detecção automática de tipo de operação
- ✅ Formulário apropriado para cada situação
- ✅ Tratamento de erros específicos
- ✅ UX melhorada com feedback claro
- ✅ Validação robusta de senha
- ✅ Redirecionamento automático após sucesso

## Teste Recomendado
1. Acesse `/auth/reset-password`
2. Insira email do Admin SaaS
3. Verifique email recebido
4. Clique no link do email
5. Defina nova senha
6. Confirme redirecionamento para login