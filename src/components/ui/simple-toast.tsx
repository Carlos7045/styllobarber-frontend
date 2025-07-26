'use client'

// Sistema de toast simples usando alerts por enquanto
export interface SimpleToast {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
}

export function useSimpleToast() {
  const addToast = (toast: SimpleToast) => {
    const message = toast.description 
      ? `${toast.title}\n${toast.description}`
      : toast.title
    
    // Por enquanto usar alert, depois implementaremos toast visual
    alert(message)
  }

  return { addToast }
}

// Placeholder para compatibilidade
export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}