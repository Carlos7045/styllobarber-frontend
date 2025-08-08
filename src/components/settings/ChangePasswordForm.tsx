
'use client'
/**
 * Componente para alteração de senha
 */


import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Lock, Check, X } from 'lucide-react'
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'
import { useSettings } from '@/hooks/use-settings'

// Schema de validação
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
    newPassword: z
      .string()
      .min(6, 'Nova senha deve ter pelo menos 6 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Nova senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'
      ),
    confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

interface ChangePasswordFormProps {
  onSuccess?: () => void
}

export function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const { changePassword, loading } = useSettings()
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  })

  const newPassword = watch('newPassword')

  // Validações de força da senha
  const passwordStrength = {
    length: newPassword?.length >= 6,
    lowercase: /[a-z]/.test(newPassword || ''),
    uppercase: /[A-Z]/.test(newPassword || ''),
    number: /\d/.test(newPassword || ''),
  }

  const strengthScore = Object.values(passwordStrength).filter(Boolean).length

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      const success = await changePassword(data)

      if (success) {
        setSuccess(true)
        reset()
        onSuccess?.()

        // Limpar mensagem de sucesso após 3 segundos
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
            <Lock className="h-5 w-5 text-blue-600" />
          </div>
          Alterar Senha
        </CardTitle>
      </CardHeader>
      <CardContent>
        {success && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
            <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
              <Check className="h-4 w-4" />
              <span className="text-sm font-medium">Senha alterada com sucesso!</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Senha Atual */}
          <div>
            <label className="mb-2 block text-sm font-medium">Senha Atual</label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="Digite sua senha atual"
                {...register('currentPassword')}
                className={errors.currentPassword ? 'border-red-500' : ''}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="mt-1 text-xs text-red-500">{errors.currentPassword.message}</p>
            )}
          </div>

          {/* Nova Senha */}
          <div>
            <label className="mb-2 block text-sm font-medium">Nova Senha</label>
            <div className="relative">
              <Input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Digite sua nova senha"
                {...register('newPassword')}
                className={errors.newPassword ? 'border-red-500' : ''}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-xs text-red-500">{errors.newPassword.message}</p>
            )}

            {/* Indicador de força da senha */}
            {newPassword && (
              <div className="mt-2 space-y-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full ${
                        strengthScore >= level
                          ? strengthScore <= 2
                            ? 'bg-red-500'
                            : strengthScore === 3
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  ))}
                </div>
                <div className="space-y-1 text-xs">
                  <div
                    className={`flex items-center gap-2 ${passwordStrength.length ? 'text-green-600' : 'text-gray-500'}`}
                  >
                    {passwordStrength.length ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    Pelo menos 6 caracteres
                  </div>
                  <div
                    className={`flex items-center gap-2 ${passwordStrength.lowercase ? 'text-green-600' : 'text-gray-500'}`}
                  >
                    {passwordStrength.lowercase ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    Uma letra minúscula
                  </div>
                  <div
                    className={`flex items-center gap-2 ${passwordStrength.uppercase ? 'text-green-600' : 'text-gray-500'}`}
                  >
                    {passwordStrength.uppercase ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    Uma letra maiúscula
                  </div>
                  <div
                    className={`flex items-center gap-2 ${passwordStrength.number ? 'text-green-600' : 'text-gray-500'}`}
                  >
                    {passwordStrength.number ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    Um número
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirmar Nova Senha */}
          <div>
            <label className="mb-2 block text-sm font-medium">Confirmar Nova Senha</label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirme sua nova senha"
                {...register('confirmPassword')}
                className={errors.confirmPassword ? 'border-red-500' : ''}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting || loading} className="flex-1">
              {isSubmitting ? 'Alterando...' : 'Alterar Senha'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={isSubmitting || loading}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
