# Configuração do Supabase

Este diretório contém as configurações e migrações do Supabase para o StylloBarber.

## Configuração Inicial

1. **Instale o Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Faça login no Supabase**
   ```bash
   supabase login
   ```

3. **Inicialize o projeto local**
   ```bash
   supabase init
   ```

4. **Conecte ao projeto remoto**
   ```bash
   supabase link --project-ref SEU_PROJECT_ID
   ```

## Comandos Úteis

```bash
# Iniciar Supabase local
supabase start

# Parar Supabase local  
supabase stop

# Resetar banco local
supabase db reset

# Gerar tipos TypeScript
supabase gen types typescript --project-id SEU_PROJECT_ID > ../src/types/database.ts

# Aplicar migrações
supabase db push

# Criar nova migração
supabase migration new nome_da_migracao
```

## Estrutura do Banco de Dados

### Tabelas Principais

1. **usuarios** - Dados dos usuários (admin, barbeiros, clientes)
2. **clientes** - Informações específicas dos clientes
3. **barbeiros** - Informações específicas dos barbeiros
4. **servicos** - Catálogo de serviços oferecidos
5. **agendamentos** - Registros de agendamentos
6. **pagamentos** - Histórico de pagamentos
7. **avaliacoes** - Avaliações dos serviços

### Configurações de Segurança

- Row Level Security (RLS) habilitado em todas as tabelas
- Políticas de acesso baseadas em roles
- Autenticação via Supabase Auth

## Próximos Passos

1. Configurar as tabelas do banco de dados
2. Implementar políticas RLS
3. Configurar triggers e funções
4. Configurar storage para imagens
5. Configurar real-time subscriptions