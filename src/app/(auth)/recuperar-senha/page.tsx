import { Metadata } from 'next'
import { ResetPasswordForm } from '@/components/forms/auth'

// Metadados da página
export const metadata: Metadata = {
  title: 'Recuperar Senha - StylloBarber',
  description: 'Recupere sua senha do StylloBarber. Enviaremos um link para redefinir sua senha por email.',
  robots: {
    index: false, // Não indexar páginas de auth
    follow: false,
  },
}

// Página de Recuperação de Senha
export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-md mx-auto animate-fade-in-up">
      <ResetPasswordForm />
    </div>
  )
}