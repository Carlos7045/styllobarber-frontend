# Setup do Usuário SaaS Owner - Carlos Henrique Pereira Salgado

## 1. Criação do Usuário SaaS Owner

Execute os seguintes comandos SQL no Supabase Dashboard:

```sql
-- 1. Criar usuário no auth.users
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  'carlos.salgado@styllobarber.com',
  crypt('StyLLo2024!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"role": "saas_owner", "nome": "Carlos Henrique Pereira Salgado"}'::jsonb
);

-- 2. Criar perfil correspondente
INSERT INTO profiles (
  id,
  nome,
  email,
  role,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'carlos.salgado@styllobarber.com'),
  'Carlos Henrique Pereira Salgado',
  'carlos.salgado@styllobarber.com',
  'saas_owner',
  now(),
  now()
);
```

## 2. Credenciais de Acesso

- **Email**: carlos.salgado@styllobarber.com
- **Senha**: StyLLo2024!
- **Role**: saas_owner

## 3. Rotas para Testar

- Dashboard Principal: http://localhost:3000/saas-admin/
- Gestão de Barbearias: http://localhost:3000/saas-admin/barbearias
- Gestão de Administradores: http://localhost:3000/saas-admin/administradores
- Relatórios Financeiros: http://localhost:3000/saas-admin/financeiro

## 4. Validações a Realizar

### ✅ Fluxo de Login
- [ ] Login com credenciais do Carlos
- [ ] Redirecionamento correto para /saas-admin/
- [ ] Verificação do role no contexto de autenticação
- [ ] Persistência da sessão após refresh

### ✅ Proteção de Rotas
- [ ] Acesso permitido apenas para saas_owner
- [ ] Bloqueio de outros roles (admin, funcionario, cliente)
- [ ] Redirecionamento correto em caso de acesso negado

### ✅ Interface do SaaS Owner
- [ ] Header específico com nome do Carlos
- [ ] Sidebar com navegação correta
- [ ] Dados mockados aparecendo corretamente
- [ ] Responsividade em diferentes telas

### ✅ Funcionalidades
- [ ] Dashboard com métricas gerais
- [ ] Listagem de barbearias
- [ ] Criação de novos administradores
- [ ] Relatórios financeiros consolidados