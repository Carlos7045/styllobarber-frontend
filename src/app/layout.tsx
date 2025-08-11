import type { Metadata } from 'next'
import { Inter, Montserrat, Poppins } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ErrorProvider } from '@/shared/components/ErrorProvider'
import { ToastProvider } from '@/shared/components/ui'
import { QueryProvider } from '@/shared/components/providers/QueryProvider'

// Configuração das fontes do StylloBarber
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'StylloBarber - Mais cortes, menos complicação',
  description:
    'Sistema premium de gestão para barbearias. Agendamento inteligente, gestão de clientes e análises de negócio.',
  keywords: ['barbearia', 'agendamento', 'gestão', 'barbeiro', 'corte', 'masculino'],
  authors: [{ name: 'StylloBarber Team' }],
  creator: 'StylloBarber',
  publisher: 'StylloBarber',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'StylloBarber - Sistema de Gestão para Barbearias',
    description: 'Mais cortes, menos complicação. Sistema completo para gestão de barbearias.',
    type: 'website',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StylloBarber - Sistema de Gestão para Barbearias',
    description: 'Mais cortes, menos complicação. Sistema completo para gestão de barbearias.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Adicionar códigos de verificação quando necessário
    // google: 'código_google',
    // yandex: 'código_yandex',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${montserrat.variable} ${poppins.variable}`}>
      <body className="antialiased" suppressHydrationWarning={true}>
        <ErrorProvider
          enableGlobalErrorHandling={true}
          enableUnhandledRejectionHandling={true}
          enableNetworkErrorHandling={true}
          enablePerformanceMonitoring={process.env.NODE_ENV === 'development'}
        >
          <QueryProvider
            showDevtools={process.env.NODE_ENV === 'development'}
            clientConfig={{
              defaultStaleTime: 5 * 60 * 1000, // 5 minutos
              defaultCacheTime: 10 * 60 * 1000, // 10 minutos
              defaultRetry: 3,
              refetchOnWindowFocus: false,
              refetchOnReconnect: true,
            }}
          >
            <ToastProvider>
              <AuthProvider>
                <div id="root">{children}</div>
              </AuthProvider>
            </ToastProvider>
          </QueryProvider>
        </ErrorProvider>
      </body>
    </html>
  )
}
