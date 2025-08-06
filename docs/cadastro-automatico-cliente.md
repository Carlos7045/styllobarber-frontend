# Cadastro Automático de Clientes no PDV

## Visão Geral

A funcionalidade de cadastro automático de clientes permite que funcionários da barbearia cadastrem rapidamente novos clientes durante o atendimento no PDV, criando automaticamente uma conta de usuário com credenciais temporárias.

## Como Funciona

### 1. Fluxo no PDV

1. **Identificação do Cliente**: Funcionário identifica que o cliente não possui cadastro
2. **Cadastro Rápido**: Clica em "Novo Cliente" no PDV
3. **Preenchimento de Dados**: Preenche informações básicas (nome, telefone, email opcional)
4. **Verificação de Duplicatas**: Sistema verifica se já existe cliente com dados similares
5. **Criação Automática**: Sistema cria perfil do cliente e usuário com senha padrão "bemvindo"
6. **Envio de Credenciais**: Credenciais são enviadas por SMS ou email
7. **Associação à Venda**: Cliente é automaticamente associado à transação

### 2. Primeiro Acesso do Cliente

1. **Login**: Cliente faz login com telefone/email e senha padrão "bemvindo"
2. **Modal de Boas-vindas**: Sistema exibe informações da conta
3. **Alteração Obrigatória**: Cliente deve alterar a senha antes de continuar
4. **Acesso Liberado**: Após alterar a senha, cliente pode usar o sistema normalmente

## Componentes Principais

### 1. CadastroRapidoCliente.tsx

Modal para cadastro rápido de clientes no PDV.

**Funcionalidades:**

- Formulário simplificado com validação
- Busca automática por clientes similares
- Definição de senha padrão "bemvindo"
- Confirmação antes de salvar
- Feedback visual do processo

### 2. PrimeiroAcessoModal.tsx

Modal que aparece no primeiro acesso do cliente.

**Funcionalidades:**

- Tela de boas-vindas com informações da conta
- Formulário para alteração de senha
- Validação de força da senha
- Opções de reenvio de credenciais

### 3. ClienteCadastroService.ts

Serviço para gerenciar o cadastro automático.

**Funcionalidades:**

- Validação de dados
- Verificação de duplicatas
- Criação de usuário no Supabase Auth
- Criação de perfil no banco
- Envio de credenciais por SMS/Email
- Logging de operações

### 4. CadastroAutomaticoStats.tsx

Dashboard com estatísticas de cadastros automáticos.

**Funcionalidades:**

- Total de cadastros por período
- Taxa de sucesso de envio
- Ranking de funcionários
- Cadastros recentes
- Gráficos e métricas

## Configuração do Banco de Dados

### Tabelas Criadas

1. **profiles** (colunas adicionadas):
   - `cadastro_automatico`: boolean
   - `senha_alterada`: boolean
   - `cadastrado_por`: UUID

2. **logs_cadastro_automatico**:
   - Registra todos os cadastros automáticos
   - Inclui dados originais e funcionário responsável

3. **logs_envio_credenciais**:
   - Registra tentativas de envio de credenciais
   - Controla status (enviado, falha, pendente)

4. **logs_alteracao_senha**:
   - Registra alterações de senha
   - Inclui IP e user agent para auditoria

### Políticas RLS

- Admins podem ver todos os logs
- Funcionários podem ver logs que criaram
- Clientes podem ver apenas seus próprios logs

## Integração com Provedores Externos

### SMS (Exemplo com Twilio)

```typescript
const enviarSMS = async (telefone: string, mensagem: string) => {
  const client = twilio(accountSid, authToken)

  await client.messages.create({
    body: mensagem,
    from: '+1234567890',
    to: telefone,
  })
}
```

### Email (Exemplo com SendGrid)

```typescript
const enviarEmail = async (email: string, assunto: string, conteudo: string) => {
  const msg = {
    to: email,
    from: 'noreply@styllobarber.com',
    subject: assunto,
    html: conteudo,
  }

  await sgMail.send(msg)
}
```

## Segurança

### Validações Implementadas

1. **Dados de Entrada**:
   - Nome mínimo 2 caracteres
   - Telefone formato brasileiro válido
   - Email formato válido (se fornecido)

2. **Senhas Padrão**:
   - Senha padrão "bemvindo" para facilitar acesso
   - Deve ser alterada obrigatoriamente no primeiro acesso
   - Validação de força na nova senha

3. **Auditoria**:
   - Todos os cadastros são logados
   - IP e user agent registrados
   - Funcionário responsável identificado

### Políticas de Segurança

1. **Primeiro Acesso**:
   - Modal não pode ser fechado
   - Senha deve ser alterada obrigatoriamente
   - Validação de força da senha

2. **Prevenção de Duplicatas**:
   - Busca automática por telefone/email
   - Sugestão de clientes similares
   - Confirmação antes de criar duplicata

## Monitoramento

### Métricas Disponíveis

1. **Cadastros**:
   - Total por período
   - Média por dia
   - Por funcionário

2. **Envio de Credenciais**:
   - Taxa de sucesso
   - Falhas por tipo
   - Tentativas de reenvio

3. **Primeiro Acesso**:
   - Clientes que alteraram senha
   - Tempo médio para alteração
   - Clientes pendentes

### Alertas Recomendados

1. **Taxa de falha > 10%** no envio de credenciais
2. **Clientes sem alteração de senha > 7 dias**
3. **Picos anômalos** de cadastros por funcionário

## Manutenção

### Tarefas Periódicas

1. **Reenvio de Credenciais**:

   ```typescript
   // Executar diariamente
   await clienteCadastroService.reenviarCredenciaisPendentes()
   ```

2. **Limpeza de Logs**:

   ```sql
   -- Manter logs por 1 ano
   DELETE FROM logs_cadastro_automatico
   WHERE created_at < NOW() - INTERVAL '1 year';
   ```

3. **Relatórios Mensais**:
   ```typescript
   const stats = await clienteCadastroService.obterEstatisticasCadastros({
     inicio: startOfMonth(new Date()),
     fim: endOfMonth(new Date()),
   })
   ```

## Troubleshooting

### Problemas Comuns

1. **Credenciais não chegam**:
   - Verificar configuração do provedor SMS/Email
   - Checar logs de envio
   - Validar número/email do cliente

2. **Cliente não consegue alterar senha**:
   - Verificar se é primeiro acesso
   - Checar políticas RLS
   - Validar token de sessão

3. **Duplicatas sendo criadas**:
   - Revisar lógica de busca por similares
   - Ajustar sensibilidade da busca
   - Treinar funcionários

### Logs Úteis

```typescript
// Verificar cadastros de um funcionário
SELECT * FROM logs_cadastro_automatico
WHERE funcionario_id = 'uuid-funcionario'
ORDER BY created_at DESC;

// Verificar falhas de envio
SELECT * FROM logs_envio_credenciais
WHERE status = 'falha'
ORDER BY created_at DESC;

// Clientes pendentes de alteração
SELECT p.nome, p.telefone, p.created_at
FROM profiles p
WHERE p.cadastro_automatico = true
AND p.senha_alterada = false;
```

## Roadmap

### Melhorias Futuras

1. **Integração com WhatsApp** para envio de credenciais
2. **QR Code** para facilitar primeiro acesso
3. **Notificações push** para lembrar alteração de senha
4. **Dashboard em tempo real** com WebSockets
5. **Integração com CRM** para enriquecimento de dados
6. **Machine Learning** para detecção de duplicatas

### Otimizações

1. **Cache** de consultas frequentes
2. **Batch processing** para envios em massa
3. **Rate limiting** para prevenir spam
4. **Compressão** de logs antigos
5. **Índices** otimizados para consultas
