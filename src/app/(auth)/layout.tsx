import { Link as LinkIcon } from 'lucide-react'

import { Suspense } from 'react'
import Link from 'next/link'
import { Container, Section } from '@/shared/components/layout'

// Componente de loading para páginas de auth
function AuthPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-black via-secondary-graphite to-primary-black flex items-center justify-center">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-background-primary rounded-lg shadow-lg p-8 animate-pulse">
          <div className="text-center mb-6">
            <div className="h-8 bg-neutral-light-gray rounded mb-2" />
            <div className="h-4 bg-neutral-light-gray rounded w-3/4 mx-auto" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index}>
                <div className="h-4 bg-neutral-light-gray rounded w-20 mb-2" />
                <div className="h-10 bg-neutral-light-gray rounded" />
              </div>
            ))}
            <div className="h-12 bg-neutral-light-gray rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Layout para páginas de autenticação
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-black via-secondary-graphite to-primary-black">
        {/* Header simples */}
        <header className="absolute top-0 left-0 right-0 z-10">
          <Container>
            <div className="flex items-center justify-between py-6">
              {/* Logo */}
              <Link
                href="/"
                className="font-display text-2xl font-bold text-primary-gold hover:text-primary-gold-dark transition-colors"
              >
                STYLLOBARBER
              </Link>

              {/* Link para home */}
              <Link
                href="/"
                className="text-sm text-neutral-white hover:text-primary-gold transition-colors"
              >
                ← Voltar ao início
              </Link>
            </div>
          </Container>
        </header>

        {/* Conteúdo principal */}
        <Section spacing="none" className="min-h-screen flex items-center justify-center pt-20">
          <Container>
            <Suspense fallback={<AuthPageSkeleton />}>
              {children}
            </Suspense>
          </Container>
        </Section>

        {/* Footer simples */}
        <footer className="absolute bottom-0 left-0 right-0">
          <Container>
            <div className="py-6 text-center">
              <p className="text-xs text-neutral-medium-gray">
                © 2025 StylloBarber. Todos os direitos reservados.
              </p>
            </div>
          </Container>
        </footer>
      </div>
  )
}
