/**
 * Barrel exports para componentes de formulário compartilhados
 */

// Core form components
export { 
  Form, 
  FormProvider, 
  useFormContext 
} from './form'

export { 
  FormField, 
  FormFieldGroup, 
  FormActions, 
  FormSkeleton 
} from './form-field'

// Legacy components
export { ValidatedEmployeeForm } from './ValidatedEmployeeForm'

// Auth forms
export { LoginForm, LoginFormSkeleton } from './auth/login-form'
export { SignUpForm, SignUpFormSkeleton } from './auth/signup-form'
export { ResetPasswordForm } from './auth/reset-password-form'
export { NewPasswordForm } from './auth/new-password-form'

// Error handling
export { 
  FormErrorBoundary, 
  withFormErrorBoundary, 
  useFormErrorBoundary 
} from './FormErrorBoundary'

// Re-export types
export type { FormProps } from './form'
export type { FormFieldProps } from './form-field'
