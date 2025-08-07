import { Suspense } from 'react'
import { createLazyComponent, ModalLoading } from '@/shared/utils/lazy-loading'

// Lazy loading dos modais principais
export const LazyNovoAgendamentoModal = createLazyComponent(
  () => import('@/domains/users/components/client/NovoAgendamentoModal').then(module => ({
    default: module.NovoAgendamentoModal
  })),
  'NovoAgendamentoModal'
)

export const LazyServicoFormModal = createLazyComponent(
  () => import('@/domains/users/components/admin/ServicoFormModal').then(module => ({
    default: module.ServicoFormModal
  })),
  'ServicoFormModal'
)

export const LazyNovoFuncionarioModal = createLazyComponent(
  () => import('@/domains/users/components/admin/NovoFuncionarioModal').then(module => ({
    default: module.NovoFuncionarioModal
  })),
  'NovoFuncionarioModal'
)

export const LazyUserEditModal = createLazyComponent(
  () => import('@/domains/users/components/admin/UserEditModal').then(module => ({
    default: module.UserEditModal
  })),
  'UserEditModal'
)

export const LazyEspecialidadesModal = createLazyComponent(
  () => import('@/domains/users/components/admin/EspecialidadesModal').then(module => ({
    default: module.EspecialidadesModal
  })),
  'EspecialidadesModal'
)

export const LazyCriarFuncionarioModal = createLazyComponent(
  () => import('@/domains/users/components/admin/CriarFuncionarioModal').then(module => ({
    default: module.CriarFuncionarioModal
  })),
  'CriarFuncionarioModal'
)

export const LazyHistoricoPrecoModal = createLazyComponent(
  () => import('@/domains/users/components/admin/HistoricoPrecoModal').then(module => ({
    default: module.HistoricoPrecoModal
  })),
  'HistoricoPrecoModal'
)

export const LazyPrimeiroAcessoModal = createLazyComponent(
  () => import('@/domains/auth/components/PrimeiroAcessoModal').then(module => ({
    default: module.PrimeiroAcessoModal
  })),
  'PrimeiroAcessoModal'
)

// Wrapper com Suspense para modais
interface LazyModalWrapperProps {
  children: React.ReactNode
}

export function LazyModalWrapper({ children }: LazyModalWrapperProps) {
  return (
    <Suspense fallback={<ModalLoading />}>
      {children}
    </Suspense>
  )
}