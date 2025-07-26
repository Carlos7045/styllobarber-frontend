import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Setup SaaS Owner - StylloBarber',
  description: 'Configuração inicial do sistema StylloBarber',
}

export default function SetupSaasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}