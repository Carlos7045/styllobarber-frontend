import { Metadata } from 'next'
import { LoginForm } from '@/shared/components/forms'

// Metadados da página
export const metadata: Metadata = {
  title: 'Login - StylloBarber',
  description: 'Faça login na sua conta StylloBarber para acessar o sistema.',
  robots: {
    index: false, // Não indexar páginas de auth
    follow: false,
  },
}

// Página de Login
export default function LoginPage() {
  return (
    <div className="w-full max-w-md mx-auto animate-fade-in-up">
      <LoginForm />
    </div>
  )
}