/**
 * Barrel exports para services compartilhados
 */

// Base classes e utilitários
export { BaseService } from './base/BaseService'
export { ErrorHandler, ServiceError, ErrorType, ErrorSeverity } from './base/ErrorHandler'
export { ServiceInterceptors, serviceInterceptors } from './base/ServiceInterceptors'

// Services específicos
export { UserService, userService } from './UserService'

// Services de domínios
export * from '@/domains/appointments/services'
export * from '@/domains/auth/services'
export * from '@/domains/users/services'

// Re-export types
export type {
  ServiceConfig,
  ServiceResult,
  ServiceListResult,
  QueryFilters,
  SortOptions,
  PaginationOptions,
} from './base/BaseService'

export type {
  ErrorContext,
  ErrorHandlerConfig,
} from './base/ErrorHandler'

export type {
  RequestContext,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  InterceptorConfig,
} from './base/ServiceInterceptors'

export type {
  User,
  CreateUserData,
  UpdateUserData,
  UserFilters,
} from './UserService'
