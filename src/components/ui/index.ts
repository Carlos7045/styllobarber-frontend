/**
 * Barrel exports para componentes UI do StylloBarber
 * Facilita a importação dos componentes
 */

// Componente Button
export { Button, buttonVariants, type ButtonProps } from './button'

// Componente Input
export { Input, inputVariants, type InputProps } from './input'

// Componentes Card
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardActions,
  CardImage,
  CardBadge,
  cardVariants,
  type CardProps,
} from './card'

// Componentes Toast (simplificado)
export { ToastProvider, useToast, type Toast, type ToastType } from './toast'

// Componente Textarea
export { Textarea, textareaVariants, type TextareaProps } from './textarea'

// Componentes Badge
export { Badge, BadgeGroup, BadgeStatus, badgeVariants, type BadgeProps } from './badge'

// Componentes Modal
export {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
  modalVariants,
  type ModalProps,
} from './modal'

// Componente DatePicker
export {
  DatePicker,
  datePickerVariants,
  type DatePickerProps,
  type DateAvailability,
} from './date-picker'

// Componente TimePicker
export { TimePicker, timePickerVariants, type TimePickerProps, type TimeSlot } from './time-picker'

// Componentes ConfirmDialog
export {
  ConfirmDialog,
  DeleteConfirmDialog,
  CancelConfirmDialog,
  SaveConfirmDialog,
  confirmDialogVariants,
  useConfirmDialog,
  type ConfirmDialogProps,
} from './confirm-dialog'

// Componente Switch
export { Switch, type SwitchProps } from './switch'

// Componente Label
export { Label, type LabelProps } from './label'

// Componentes Tabs
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs'

// Componente LoadingSpinner
export { LoadingSpinner, loadingSpinnerVariants, type LoadingSpinnerProps } from './loading-spinner'
