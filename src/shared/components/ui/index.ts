/**
 * Barrel exports para componentes UI compartilhados
 */

export { Badge } from './badge'
export { Button } from './button'
export { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
export { ConfirmDialog, useConfirmDialog, DeleteConfirmDialog, CancelConfirmDialog, SaveConfirmDialog } from './confirm-dialog'
export { DatePicker } from './date-picker'
export { Input } from './input'
export { Label } from './label'
export { LoadingSpinner, LoadingOverlay, LoadingButton } from './loading-spinner'
export { Modal } from './modal'
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
export { useSimpleToast } from './simple-toast'
export type { SimpleToast } from './simple-toast'
export { Switch } from './switch'
export { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'
export { Textarea } from './textarea'
export { TimePicker } from './time-picker'
export { ToastProvider, useToast } from './toast'
export type { Toast } from './toast'

// Re-export types
export type { ButtonProps } from './button'
export type { CardProps } from './card'
export type { InputProps } from './input'
export type { ModalProps } from './modal'
