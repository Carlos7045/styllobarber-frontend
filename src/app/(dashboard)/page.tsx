import { redirect } from 'next/navigation'

// Redirecionar /dashboard para /dashboard/dashboard (página principal)
export default function DashboardRedirect() {
  redirect('/dashboard/dashboard')
}