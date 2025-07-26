'use client'

import React, { Component, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: any
}

export class SessionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🚨 Session Error Boundary:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo,
    })

    // Log estruturado para monitoramento
    this.logError(error, errorInfo)
  }

  private logError(error: Error, errorInfo: any) {
    const errorData = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo,
      userAgent: navigator.userAgent,
      url: window.location.href,
    }

    // Em produção, enviar para serviço de monitoramento
    if (process.env.NODE_ENV === 'production') {
      // Exemplo: Sentry, LogRocket, etc.
      console.error('Production Error:', errorData)
    } else {
      console.group('🚨 Session Error Details')
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.error('Full Data:', errorData)
      console.groupEnd()
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Fallback padrão
      return (
        <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-error/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-error" />
                </div>
                <div>
                  <CardTitle className="text-error">Erro de Sessão</CardTitle>
                  <p className="text-sm text-text-muted">
                    Algo deu errado com o gerenciamento de sessão
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-text-muted text-sm">
                  {this.state.error?.message || 'Erro desconhecido'}
                </p>
                
                {process.env.NODE_ENV === 'development' && (
                  <details className="text-xs text-text-muted">
                    <summary className="cursor-pointer hover:text-text-primary">
                      Detalhes técnicos
                    </summary>
                    <pre className="mt-2 p-2 bg-background-secondary rounded text-xs overflow-auto">
                      {this.state.error?.stack}
                    </pre>
                  </details>
                )}
                
                <div className="flex gap-2">
                  <Button
                    onClick={this.handleRetry}
                    variant="primary"
                    size="sm"
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar Novamente
                  </Button>
                  <Button
                    onClick={this.handleReload}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    Recarregar Página
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Componente funcional para fallback simples
export function SessionErrorFallback({ 
  error, 
  onRetry 
}: { 
  error?: Error
  onRetry?: () => void 
}) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <AlertTriangle className="h-12 w-12 text-error mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          Erro de Sessão
        </h3>
        <p className="text-text-muted mb-4">
          {error?.message || 'Houve um problema com o gerenciamento de sessão'}
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="primary" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        )}
      </div>
    </div>
  )
}