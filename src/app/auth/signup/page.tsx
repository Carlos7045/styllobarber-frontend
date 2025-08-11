import { Metadata } from 'next'
import { SignUpForm } from '@/shared/components/forms'

// Metadados da página
export const metadata: Metadata = {
  title: 'Cadastro - StylloBarber',
  description: 'Crie sua conta StylloBarber e comece a agendar seus cortes.',
  robots: {
    index: false, // Não indexar páginas de auth
    follow: false,
  },
}

// Página de Cadastro
export default function SignUpPage() {
  return (
    <div className="w-full max-w-md mx-auto animate-fade-in-up">
      <SignUpForm />
    </div>
  )
}