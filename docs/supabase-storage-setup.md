# Configuração do Supabase Storage para Avatars

## Configuração Necessária

Para que o upload de avatars funcione corretamente, é necessário configurar o Supabase Storage:

### 1. Criar Bucket de Avatars

No painel do Supabase, vá para Storage e crie um bucket chamado `avatars`:

```sql
-- Criar bucket para avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);
```

### 2. Configurar Políticas RLS

Adicione as seguintes políticas de Row Level Security:

```sql
-- Política para permitir visualização pública de avatars
CREATE POLICY "Avatars são publicamente visíveis"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Política para permitir upload de avatars pelos próprios usuários
CREATE POLICY "Usuários podem fazer upload de seus próprios avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir atualização de avatars pelos próprios usuários
CREATE POLICY "Usuários podem atualizar seus próprios avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir exclusão de avatars pelos próprios usuários
CREATE POLICY "Usuários podem deletar seus próprios avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3. Configurar CORS (se necessário)

Se houver problemas de CORS, configure no painel do Supabase:

```json
{
  "allowedOrigins": ["http://localhost:3000", "https://seudominio.com"],
  "allowedMethods": ["GET", "POST", "PUT", "DELETE"],
  "allowedHeaders": ["*"],
  "maxAge": 3600
}
```

### 4. Estrutura de Pastas

Os avatars serão organizados da seguinte forma:
```
avatars/
├── {user_id}-{timestamp}.jpg
├── {user_id}-{timestamp}.png
└── ...
```

### 5. Limitações Configuradas

- **Tamanho máximo**: 5MB por arquivo
- **Tipos permitidos**: JPEG, PNG, WebP, GIF
- **Redimensionamento**: Automático para 400x400px
- **Qualidade**: 80% para otimização

## Comandos SQL para Execução

Execute os seguintes comandos no SQL Editor do Supabase:

```sql
-- 1. Criar bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- 2. Habilitar RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas
CREATE POLICY "Avatars são publicamente visíveis"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Usuários podem fazer upload de seus próprios avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Usuários podem atualizar seus próprios avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Usuários podem deletar seus próprios avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## Verificação

Para verificar se tudo está funcionando:

1. Faça login na aplicação
2. Vá para a página de perfil
3. Tente fazer upload de uma imagem
4. Verifique se a imagem aparece corretamente
5. Teste a remoção do avatar

## Troubleshooting

### Erro: "Bucket não encontrado"
- Verifique se o bucket `avatars` foi criado
- Confirme se está marcado como público

### Erro: "Permissão negada"
- Verifique se as políticas RLS foram criadas corretamente
- Confirme se o usuário está autenticado

### Erro: "CORS"
- Configure CORS no painel do Supabase
- Adicione o domínio da aplicação nas origens permitidas