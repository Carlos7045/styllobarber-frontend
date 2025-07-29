/**
 * Exemplo de formulário com validação robusta e tratamento de erros
 * Demonstra o uso completo do sistema de validação implementado
 */

'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Textarea,
} from '@/components/ui'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  DollarSign,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react'
import { useFormValidation } from '@/hooks/use-form-validation'
import { funcionarioSchema, type FuncionarioFormData } from '@/lib/validation-schemas'
import { useErrorSystem } from '@/components/providers/ErrorProvider'
import { OperationResult } from '@/lib/error-handler'
import { executeWithRetry, RETRY_STRATEGIES } from '@/lib/network-retry'

interface ValidatedEmployeeFormProps {
  onSubmit: (data: FuncionarioFormData) => Promise<OperationResult<any>>
  onCancel: () => void
  onSuccess?: (data: any) => void
  initialData?: Partial<FuncionarioFormData>
  mode?: 'create' | 'edit'
}

export function ValidatedEmployeeForm({
  onSubmit,
  onCancel,
  onSuccess,
  initialData,
  mode = 'create',
}: ValidatedEmployeeFormProps) {
  const { logUserAction, startPerformanceTracking, endPerformanceTracking } = useErrorSystem()

  // Especialidades disponíveis
  const especialidadesDisponiveis = [
    'Corte Masculino',
    'Corte Feminino',
    'Barba',
    'Bigode',
    'Sobrancelha',
    'Coloração',
    'Luzes',
    'Escova',
    'Penteado',
  ]

  // Configurar formulário com validação
  const {
    register,
    handleSubmit,
    formState,
    watch,
    setValue,
    getValues,
    setFieldValue,
    getFieldState,
    clearFieldError,
    resetForm,
  } = useFormValidation<FuncionarioFormData>({
    schema: funcionarioSchema,
    defaultValues: {
      nome: '',
      email: '',
      telefone: '',
      endereco: '',
      data_nascimento: '',
      cargo: '',
      salario: '',
      comissao: '',
      especialidades: [],
      observacoes: '',
      ...initialData,
    },
    onSubmit: async (data) => {
      // Log da ação do usuário
      logUserAction(
        mode === 'create' ? 'create_employee' : 'update_employee',
        'ValidatedEmployeeForm',
        { employeeData: { nome: data.nome, cargo: data.cargo } }
      )

      // Tracking de performance
      const performanceId = `employee-${mode}-${Date.now()}`
      startPerformanceTracking(performanceId)

      try {
        // Executar com retry automático
        const result = await executeWithRetry(
          `employee-${mode}`,
          () => onSubmit(data),
          RETRY_STRATEGIES.STANDARD
        )

        endPerformanceTracking(performanceId, {
          success: result.success,
          employeeName: data.nome,
        })

        return result
      } catch (error) {
        endPerformanceTracking(performanceId, {
          success: false,
          error: (error as Error).message,
        })
        throw error
      }
    },
    onSuccess: (data) => {
      if (onSuccess) {
        onSuccess(data)
      }
    },
    successMessage:
      mode === 'create' ? 'Funcionário criado com sucesso!' : 'Funcionário atualizado com sucesso!',
  })

  // Observar especialidades para controle manual
  const especialidades = watch('especialidades') || []

  // Adicionar especialidade
  const addEspecialidade = (especialidade: string) => {
    if (!especialidades.includes(especialidade)) {
      const novasEspecialidades = [...especialidades, especialidade]
      setValue('especialidades', novasEspecialidades)
      clearFieldError('especialidades')
    }
  }

  // Remover especialidade
  const removeEspecialidade = (especialidade: string) => {
    const novasEspecialidades = especialidades.filter((e) => e !== especialidade)
    setValue('especialidades', novasEspecialidades)
  }

  // Função para obter classe de erro
  const getFieldErrorClass = (fieldName: keyof FuncionarioFormData) => {
    const fieldState = getFieldState(fieldName)
    return fieldState.hasError ? 'border-red-500 focus:border-red-500' : ''
  }

  // Função para renderizar erro de campo
  const renderFieldError = (fieldName: keyof FuncionarioFormData) => {
    const fieldState = getFieldState(fieldName)
    if (fieldState.hasError) {
      return (
        <div className="mt-1 flex items-center gap-1">
          <AlertCircle className="h-3 w-3 text-red-500" />
          <p className="text-sm text-red-500">{fieldState.errorMessage}</p>
        </div>
      )
    }
    return null
  }

  // Função para renderizar sucesso de campo
  const renderFieldSuccess = (fieldName: keyof FuncionarioFormData) => {
    const fieldState = getFieldState(fieldName)
    const value = getValues(fieldName)

    if (!fieldState.hasError && value && fieldState.isTouched) {
      return (
        <div className="mt-1 flex items-center gap-1">
          <CheckCircle className="h-3 w-3 text-green-500" />
          <p className="text-sm text-green-500">Válido</p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="mx-auto w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {mode === 'create' ? 'Novo Funcionário' : 'Editar Funcionário'}
        </CardTitle>
        <CardDescription>
          {mode === 'create'
            ? 'Preencha as informações do novo funcionário'
            : 'Atualize as informações do funcionário'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Erro geral do formulário */}
          {formState.errors.root && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/10">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-800 dark:text-red-200">
                  {formState.errors.root.message}
                </p>
              </div>
            </div>
          )}

          {/* Informações Pessoais */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <User className="h-4 w-4" />
              Informações Pessoais
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  {...register('nome')}
                  placeholder="Digite o nome completo"
                  className={getFieldErrorClass('nome')}
                  disabled={formState.isSubmitting}
                />
                {renderFieldError('nome')}
                {renderFieldSuccess('nome')}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="email@exemplo.com"
                  className={getFieldErrorClass('email')}
                  disabled={formState.isSubmitting}
                />
                {renderFieldError('email')}
                {renderFieldSuccess('email')}
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone *</Label>
                <Input
                  id="telefone"
                  {...register('telefone')}
                  placeholder="(11) 99999-9999"
                  className={getFieldErrorClass('telefone')}
                  disabled={formState.isSubmitting}
                />
                {renderFieldError('telefone')}
                {renderFieldSuccess('telefone')}
              </div>

              {/* Data de Nascimento */}
              <div className="space-y-2">
                <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                <Input
                  id="data_nascimento"
                  type="date"
                  {...register('data_nascimento')}
                  className={getFieldErrorClass('data_nascimento')}
                  disabled={formState.isSubmitting}
                />
                {renderFieldError('data_nascimento')}
                {renderFieldSuccess('data_nascimento')}
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                {...register('endereco')}
                placeholder="Rua, número, bairro, cidade"
                className={getFieldErrorClass('endereco')}
                disabled={formState.isSubmitting}
              />
              {renderFieldError('endereco')}
              {renderFieldSuccess('endereco')}
            </div>
          </div>

          {/* Informações Profissionais */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Briefcase className="h-4 w-4" />
              Informações Profissionais
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Cargo */}
              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo *</Label>
                <Select
                  value={watch('cargo')}
                  onValueChange={(value) => setFieldValue('cargo', value)}
                  disabled={formState.isSubmitting}
                >
                  <SelectTrigger className={getFieldErrorClass('cargo')}>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="barbeiro">Barbeiro</SelectItem>
                    <SelectItem value="cabeleireiro">Cabeleireiro</SelectItem>
                    <SelectItem value="manicure">Manicure</SelectItem>
                    <SelectItem value="recepcionista">Recepcionista</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                  </SelectContent>
                </Select>
                {renderFieldError('cargo')}
                {renderFieldSuccess('cargo')}
              </div>

              {/* Salário */}
              <div className="space-y-2">
                <Label htmlFor="salario">Salário Base</Label>
                <Input
                  id="salario"
                  {...register('salario')}
                  placeholder="0,00"
                  className={getFieldErrorClass('salario')}
                  disabled={formState.isSubmitting}
                />
                {renderFieldError('salario')}
                {renderFieldSuccess('salario')}
              </div>

              {/* Comissão */}
              <div className="space-y-2">
                <Label htmlFor="comissao">Comissão (%)</Label>
                <Input
                  id="comissao"
                  {...register('comissao')}
                  placeholder="0"
                  className={getFieldErrorClass('comissao')}
                  disabled={formState.isSubmitting}
                />
                {renderFieldError('comissao')}
                {renderFieldSuccess('comissao')}
              </div>
            </div>
          </div>

          {/* Especialidades */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Especialidades</h3>

            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {especialidadesDisponiveis.map((especialidade) => (
                  <Button
                    key={especialidade}
                    type="button"
                    variant={especialidades.includes(especialidade) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      if (especialidades.includes(especialidade)) {
                        removeEspecialidade(especialidade)
                      } else {
                        addEspecialidade(especialidade)
                      }
                    }}
                    disabled={formState.isSubmitting}
                  >
                    {especialidades.includes(especialidade) ? (
                      <X className="mr-1 h-3 w-3" />
                    ) : (
                      <Plus className="mr-1 h-3 w-3" />
                    )}
                    {especialidade}
                  </Button>
                ))}
              </div>

              {especialidades.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Especialidades selecionadas:</p>
                  <div className="flex flex-wrap gap-1">
                    {especialidades.map((especialidade) => (
                      <Badge key={especialidade} variant="secondary">
                        {especialidade}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              {...register('observacoes')}
              placeholder="Informações adicionais sobre o funcionário..."
              rows={3}
              className={getFieldErrorClass('observacoes')}
              disabled={formState.isSubmitting}
            />
            {renderFieldError('observacoes')}
            {renderFieldSuccess('observacoes')}
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 border-t pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={formState.isSubmitting}
            >
              Cancelar
            </Button>

            <Button type="submit" disabled={!formState.canSubmit} className="min-w-[140px]">
              {formState.isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === 'create' ? 'Criando...' : 'Salvando...'}
                </div>
              ) : mode === 'create' ? (
                'Criar Funcionário'
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </div>

          {/* Informações de debug (apenas em desenvolvimento) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
              <summary className="mb-2 cursor-pointer text-sm font-medium">
                Debug Info (Development Only)
              </summary>
              <div className="space-y-2 text-xs">
                <div>
                  <strong>Form State:</strong>
                  <pre className="mt-1 whitespace-pre-wrap">
                    {JSON.stringify(
                      {
                        isValid: formState.isValid,
                        isSubmitting: formState.isSubmitting,
                        isValidating: formState.isValidating,
                        canSubmit: formState.canSubmit,
                        submitCount: formState.submitCount,
                        errorCount: Object.keys(formState.errors).length,
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
                <div>
                  <strong>Current Values:</strong>
                  <pre className="mt-1 whitespace-pre-wrap">
                    {JSON.stringify(getValues(), null, 2)}
                  </pre>
                </div>
              </div>
            </details>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
