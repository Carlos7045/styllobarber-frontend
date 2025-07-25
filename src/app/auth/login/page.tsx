import { redirect } from 'next/navigation'

// Redirecionamento de fallback para URLs antigas
export default function AuthLoginRedirect() {
  redirect('/login')
}