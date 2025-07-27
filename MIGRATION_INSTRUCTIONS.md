# 🚀 Como Ativar o Sistema de Especialidades

## ⚠️ Status Atual
O sistema de especialidades está **quase pronto**! Só falta aplicar a migração do banco de dados.

## 🎯 Solução Rápida (5 minutos)

### **Passo 1: Acesse o Supabase**
1. Vá para [supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione seu projeto **StylloBarber**

### **Passo 2: Abra o SQL Editor**
1. No menu lateral esquerdo, clique em **"SQL Editor"**
2. Clique no botão **"New Query"**

### **Passo 3: Execute a Migração**
1. **Copie** todo o código do arquivo `scripts/apply-migration.sql`
2. **Cole** no editor SQL do Supabase
3. Clique no botão **"Run"** (ou pressione Ctrl+Enter)

### **Passo 4: Verificar Sucesso**
- ✅ Deve aparecer: "Migração aplicada com sucesso!"
- ✅ Na aba "Table Editor", você verá a nova tabela `funcionario_servicos`

### **Passo 5: Testar**
1. Volte para `/dashboard/funcionarios`
2. Clique no ícone de tesoura (especialidades)
3. Selecione alguns serviços
4. Clique em "Salvar Especialidades"
5. ✅ Deve salvar sem erros!

### Opção 2: Via CLI do Supabase

```bash
# Se você tem o Supabase CLI instalado
supabase db push

# Ou aplicar migração específica
supabase migration up
```

## ✅ Como Verificar se Funcionou

1. **No Dashboard do Supabase:**
   - Vá para "Table Editor"
   - Procure pela tabela `funcionario_servicos`
   - Deve ter as colunas: `id`, `funcionario_id`, `service_id`, `created_at`, `updated_at`

2. **Na Aplicação:**
   - Acesse `/dashboard/funcionarios`
   - Clique no ícone de tesoura de um funcionário
   - Selecione algumas especialidades
   - Clique em "Salvar Especialidades"
   - Deve aparecer mensagem de sucesso

## 🔧 Funcionalidades Após a Migração

- ✅ **Salvar especialidades** - Funcionários podem ter especialidades definidas
- ✅ **Filtros inteligentes** - Agendamentos mostram apenas combinações válidas
- ✅ **Seleção por funcionário** - Mostra apenas serviços que ele faz
- ✅ **Seleção por serviço** - Mostra apenas funcionários que fazem aquele serviço

## 🆘 Problemas Comuns

### "Tabela de especialidades não existe"
- **Causa:** Migração não foi aplicada
- **Solução:** Execute os passos acima

### "Erro de permissão"
- **Causa:** Políticas RLS não foram criadas
- **Solução:** Execute novamente o script completo

### "Relacionamento não existe"
- **Causa:** Tabelas `profiles` ou `services` não existem
- **Solução:** Verifique se as tabelas base existem no banco

## 📞 Suporte

Se tiver problemas, verifique:
1. Se você tem permissões de admin no Supabase
2. Se as tabelas `profiles` e `services` existem
3. Se o script foi executado completamente

Após aplicar a migração, o sistema de especialidades funcionará completamente! 🎯