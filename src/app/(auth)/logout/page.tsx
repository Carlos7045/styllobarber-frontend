import type { Metadata } from 'next'
import { LogoutPage } from '@/domains/auth/components/LogoutPage'

export const metadata: Metadata = {
  title: 'Logout - StylloBarber',
  description: 'Saindo do sistema StylloBarber',
  robots: {
    index: false,
    follow: false,
  },
}

/**
 * Página de logout
 * Permite logout manual ou automático
 */
export default function Logout() {
  return <LogoutPage />
}
