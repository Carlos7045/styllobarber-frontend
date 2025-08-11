import { Metadata } from 'next'
import { Suspense } from 'react'
import { ResetPasswordHandler } from '@/shared/components/forms/auth/reset-password-handler'

// Metadados da página
export const metadata: Metadata = {
  title: 'Redefinir Senha - StylloBarber',
  description: 'Redefina sua senha do StylloBarber. Insira sua nova senha para continuar.',
  robots: {
    index: false, // Não indexar páginas de auth
    follow: false,
  },
}

// Página de Redefinição de Senha
export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-md mx-auto animate-fade-in-up">
      <Suspense fallback={<div>Carregando...</div>}>
        <ResetPasswordHandler />
      </Suspense>
    </div>
  )
}