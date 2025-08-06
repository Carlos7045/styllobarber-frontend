import * as React from 'react'
import { z } from 'zod'
import { User, Mail, Phone, Calendar, MapPin } from 'lucide-react'
import { 
  Form, 
  FormField, 
  FormFieldGroup 
} from '@/shared/components/forms'
import { 
  Input, 
  Textarea, 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/shared/components/ui'
import { useForm } from '@/shared/hooks/ui'

/**
 * Schema de validação para o formulário de usuário
 */
const userSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Formato: (11) 99999-9999'),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  role: z.enum(['admin', 'barber', 'client'], {
    message: 'Selecione um tipo de usuário'
  }),
  bio: z.string().max(500, 'Bio deve ter no máximo 500 caracteres').optional(),
})

type UserFormData = z.infer<typeof userSchema>

/**
 * Props do componente
 */
interface UserFormExampleProps {
  initialData?: Partial<UserFormData>
  onSubmit: (data: UserFormData) => Promise<void>
  onCancel?: () => void
  mode?: 'create' | 'edit'
}

/**
 * Exemplo de formulário usando os novos componentes
 * 
 * @description
 * Demonstra o uso completo do sistema de formulários com validação,
 * agrupamento de campos e tratamento de estados.
 */
export function UserFormExample({
  initialData,
  onSubmit,
  onCancel,
  mode = 'create'
}: UserFormExampleProps) {
  // Estado para simular loading
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  // Hook do formulário
  const form = useForm<UserFormData>({
    initialValues: {
      name: '',
      email: '',
      phone: '',
      birthDate: '',
      address: '',
      role: 'client' as const,
      bio: '',
      ...initialData,
    },
    validationSchema: userSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      setIsLoading(true)
      setError(null)
      setSuccess(null)

      try {
        await onSubmit(values)
        setSuccess(
          mode === 'create' 
            ? 'Usuário criado com sucesso!' 
            : 'Usuário atualizado com sucesso!'
        )
      } catch (err) {
        setError(
          err instanceof Error 
            ? err.message 
            : 'Erro inesperado. Tente novamente.'
        )
      } finally {
        setIsLoading(false)
      }
    },
    onSuccess: () => {
      // Limpar formulário se for criação
      if (mode === 'create') {
        setTimeout(() => {
          form.reset()
          setSuccess(null)
        }, 2000)
      }
    },
  })

  return (
    <Form
      title={mode === 'create' ? 'Novo Usuário' : 'Editar Usuário'}
      description={
        mode === 'create' 
          ? 'Preencha os dados do novo usuário' 
          : 'Atualize as informações do usuário'
      }
      icon={<User className="h-5 w-5" />}
      layout="card"
      size="lg"
      centered
      onSubmit={form.handleSubmit}
      submitText={mode === 'create' ? 'Criar Usuário' : 'Salvar Alterações'}
      onCancel={onCancel}
      isSubmitting={isLoading}
      submitDisabled={!form.isValid}
      error={error}
      success={success}
    >
      {/* Informações Pessoais */}
      <FormFieldGroup
        title="Informações Pessoais"
        description="Dados básicos do usuário"
        columns={2}
      >
        <FormField
          label="Nome Completo"
          required
          error={form.errors.name}
          htmlFor="name"
          icon={<User className="h-4 w-4" />}
        >
          <Input
            id="name"
            placeholder="Digite o nome completo"
            {...form.register('name')}
          />
        </FormField>

        <FormField
          label="Email"
          required
          error={form.errors.email}
          htmlFor="email"
          icon={<Mail className="h-4 w-4" />}
          helperText="Email será usado para login"
        >
          <Input
            id="email"
            type="email"
            placeholder="email@exemplo.com"
            {...form.register('email')}
          />
        </FormField>

        <FormField
          label="Telefone"
          required
          error={form.errors.phone}
          htmlFor="phone"
          icon={<Phone className="h-4 w-4" />}
        >
          <Input
            id="phone"
            placeholder="(11) 99999-9999"
            {...form.register('phone')}
          />
        </FormField>

        <FormField
          label="Data de Nascimento"
          error={form.errors.birthDate}
          htmlFor="birthDate"
          icon={<Calendar className="h-4 w-4" />}
        >
          <Input
            id="birthDate"
            type="date"
            {...form.register('birthDate')}
          />
        </FormField>
      </FormFieldGroup>

      {/* Informações de Acesso */}
      <FormFieldGroup
        title="Informações de Acesso"
        description="Configurações de perfil e permissões"
        columns={1}
      >
        <FormField
          label="Tipo de Usuário"
          required
          error={form.errors.role}
          htmlFor="role"
        >
          <Select
            value={form.values.role}
            onValueChange={(value) => form.setValue('role', value as UserFormData['role'])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo de usuário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="barber">Barbeiro</SelectItem>
              <SelectItem value="client">Cliente</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <FormField
          label="Endereço"
          error={form.errors.address}
          htmlFor="address"
          icon={<MapPin className="h-4 w-4" />}
          helperText="Endereço completo (opcional)"
        >
          <Input
            id="address"
            placeholder="Rua, número, bairro, cidade"
            {...form.register('address')}
          />
        </FormField>

        <FormField
          label="Biografia"
          error={form.errors.bio}
          htmlFor="bio"
          helperText={`${form.values.bio?.length || 0}/500 caracteres`}
        >
          <Textarea
            id="bio"
            placeholder="Conte um pouco sobre você..."
            rows={4}
            maxLength={500}
            {...form.register('bio')}
          />
        </FormField>
      </FormFieldGroup>

      {/* Debug info em desenvolvimento */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <summary className="cursor-pointer font-medium mb-2">
            Debug Info (Development)
          </summary>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Form State:</strong>
              <pre className="mt-1 text-xs overflow-auto">
                {JSON.stringify({
                  isValid: form.isValid,
                  isDirty: form.isDirty,
                  isSubmitting: form.isSubmitting,
                  submitCount: form.submitCount,
                  errorCount: Object.keys(form.errors).length,
                }, null, 2)}
              </pre>
            </div>
            <div>
              <strong>Values:</strong>
              <pre className="mt-1 text-xs overflow-auto">
                {JSON.stringify(form.values, null, 2)}
              </pre>
            </div>
            <div>
              <strong>Errors:</strong>
              <pre className="mt-1 text-xs overflow-auto">
                {JSON.stringify(form.errors, null, 2)}
              </pre>
            </div>
          </div>
        </details>
      )}
    </Form>
  )
}

/**
 * Exemplo de uso do componente
 */
export function UserFormExampleUsage() {
  const handleSubmit = async (data: UserFormData) => {
    // Simular API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    console.log('Dados submetidos:', data)
  }

  const handleCancel = () => {
    console.log('Formulário cancelado')
  }

  return (
    <div className="p-8">
      <UserFormExample
        mode="create"
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  )
}
