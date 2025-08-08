/**
 * Tipos genéricos para componentes React
 */

import { ComponentProps, ElementType, ReactNode, RefObject } from 'react'
import { ComponentSize, ComponentVariant, ComponentColor } from './base'

// Tipos base para componentes
export interface BaseComponentProps {
  className?: string
  children?: ReactNode
  'data-testid'?: string
  'aria-label'?: string
  'aria-describedby'?: string
  id?: string
}

// Tipos para componentes polimórficos
export type PolymorphicRef<T extends ElementType> = ComponentProps<T>['ref']

export type PolymorphicComponentProps<
  T extends ElementType,
  Props = Record<string, unknown>
> = {
  as?: T
} & Props & 
  Omit<ComponentProps<T>, keyof Props | 'as'>

export type PolymorphicComponent<
  DefaultElement extends ElementType,
  Props = Record<string, unknown>
> = <T extends ElementType = DefaultElement>(
  props: PolymorphicComponentProps<T, Props> & {
    ref?: PolymorphicRef<T>
  }
) => ReactNode

// Tipos para componentes com variantes
export interface VariantProps {
  variant?: ComponentVariant
  size?: ComponentSize
  color?: ComponentColor
}

// Tipos para componentes de formulário
export interface FormComponentProps extends BaseComponentProps {
  name?: string
  disabled?: boolean
  required?: boolean
  readOnly?: boolean
  autoFocus?: boolean
  placeholder?: string
  'aria-invalid'?: boolean
  'aria-required'?: boolean
}

export interface InputProps extends FormComponentProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  onBlur?: () => void
  onFocus?: () => void
  onKeyDown?: (event: React.KeyboardEvent) => void
  onKeyUp?: (event: React.KeyboardEvent) => void
  min?: number
  max?: number
  step?: number
  pattern?: string
  maxLength?: number
  minLength?: number
  autoComplete?: string
  spellCheck?: boolean
}

export interface SelectProps<T = string> extends FormComponentProps {
  value?: T
  defaultValue?: T
  onChange?: (value: T) => void
  onBlur?: () => void
  onFocus?: () => void
  options: SelectOption<T>[]
  multiple?: boolean
  searchable?: boolean
  clearable?: boolean
  loading?: boolean
  loadingText?: string
  noOptionsText?: string
  placeholder?: string
}

export interface SelectOption<T = string> {
  value: T
  label: string
  disabled?: boolean
  description?: string
  icon?: ReactNode
  group?: string
}

export interface CheckboxProps extends FormComponentProps {
  checked?: boolean
  defaultChecked?: boolean
  onChange?: (checked: boolean) => void
  indeterminate?: boolean
  label?: string
  description?: string
}

export interface RadioProps extends FormComponentProps {
  checked?: boolean
  defaultChecked?: boolean
  onChange?: (checked: boolean) => void
  value: string
  label?: string
  description?: string
}

export interface TextareaProps extends FormComponentProps {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  onBlur?: () => void
  onFocus?: () => void
  rows?: number
  cols?: number
  resize?: 'none' | 'both' | 'horizontal' | 'vertical'
  maxLength?: number
  minLength?: number
  wrap?: 'hard' | 'soft' | 'off'
}

// Tipos para componentes de feedback
export interface LoadingProps extends BaseComponentProps {
  loading?: boolean
  size?: ComponentSize
  text?: string
  overlay?: boolean
  transparent?: boolean
}

export interface ErrorProps extends BaseComponentProps {
  error?: string | Error | null
  title?: string
  description?: string
  onRetry?: () => void
  retryText?: string
  showDetails?: boolean
  variant?: 'inline' | 'card' | 'page'
}

export interface EmptyStateProps extends BaseComponentProps {
  title?: string
  description?: string
  icon?: ReactNode
  action?: {
    label: string
    onClick: () => void
    variant?: ComponentVariant
  }
  variant?: 'default' | 'search' | 'error'
}

export interface SkeletonProps extends BaseComponentProps {
  width?: string | number
  height?: string | number
  variant?: 'text' | 'rectangular' | 'circular'
  animation?: 'pulse' | 'wave' | 'none'
  lines?: number
}

// Tipos para componentes de navegação
export interface BreadcrumbProps extends BaseComponentProps {
  items: BreadcrumbItem[]
  separator?: ReactNode
  maxItems?: number
  itemsBeforeCollapse?: number
  itemsAfterCollapse?: number
}

export interface BreadcrumbItem {
  label: string
  href?: string
  onClick?: () => void
  active?: boolean
  disabled?: boolean
  icon?: ReactNode
}

export interface TabsProps extends BaseComponentProps {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  orientation?: 'horizontal' | 'vertical'
  variant?: 'default' | 'pills' | 'underline'
  items: TabItem[]
}

export interface TabItem {
  value: string
  label: string
  content: ReactNode
  disabled?: boolean
  icon?: ReactNode
  badge?: string | number
}

// Tipos para componentes de layout
export interface ContainerProps extends BaseComponentProps {
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: boolean
  centered?: boolean
  fluid?: boolean
}

export interface GridProps extends BaseComponentProps {
  columns?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number }
  gap?: number | string
  rows?: number
  areas?: string[]
  autoFlow?: 'row' | 'column' | 'dense'
  alignItems?: 'start' | 'end' | 'center' | 'stretch'
  justifyContent?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly'
}

export interface FlexProps extends BaseComponentProps {
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  align?: 'start' | 'end' | 'center' | 'stretch' | 'baseline'
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly'
  gap?: number | string
  grow?: boolean | number
  shrink?: boolean | number
  basis?: string | number
}

// Tipos para componentes de overlay
export interface ModalProps extends BaseComponentProps {
  open?: boolean
  onClose?: () => void
  title?: string
  description?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  centered?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  preventScroll?: boolean
  trapFocus?: boolean
  restoreFocus?: boolean
  initialFocus?: RefObject<HTMLElement>
  finalFocus?: RefObject<HTMLElement>
}

export interface DrawerProps extends BaseComponentProps {
  open?: boolean
  onClose?: () => void
  title?: string
  placement?: 'top' | 'right' | 'bottom' | 'left'
  size?: ComponentSize | number | string
  overlay?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
}

export interface PopoverProps extends BaseComponentProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: ReactNode
  content: ReactNode
  placement?: 
    | 'top' | 'top-start' | 'top-end'
    | 'right' | 'right-start' | 'right-end'
    | 'bottom' | 'bottom-start' | 'bottom-end'
    | 'left' | 'left-start' | 'left-end'
  offset?: number
  crossAxisOffset?: number
  shouldFlip?: boolean
  containerPadding?: number
}

export interface TooltipProps extends BaseComponentProps {
  content: ReactNode
  placement?: PopoverProps['placement']
  delay?: number
  closeDelay?: number
  disabled?: boolean
  showArrow?: boolean
  offset?: number
}

// Tipos para componentes de dados
export interface TableProps<T = any> extends BaseComponentProps {
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  empty?: ReactNode
  keyExtractor?: (item: T, index: number) => string
  onRowClick?: (item: T, index: number) => void
  onRowDoubleClick?: (item: T, index: number) => void
  selectable?: boolean
  selectedRows?: string[]
  onSelectionChange?: (selectedRows: string[]) => void
  sortable?: boolean
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  pagination?: TablePagination
  stickyHeader?: boolean
  striped?: boolean
  bordered?: boolean
  compact?: boolean
}

export interface TableColumn<T = any> {
  key: string
  header: ReactNode
  accessor?: keyof T | ((item: T) => any)
  render?: (value: any, item: T, index: number) => ReactNode
  sortable?: boolean
  width?: string | number
  minWidth?: string | number
  maxWidth?: string | number
  align?: 'left' | 'center' | 'right'
  sticky?: boolean
  className?: string
  headerClassName?: string
}

export interface TablePagination {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  showSizeChanger?: boolean
  showQuickJumper?: boolean
  showTotal?: boolean
  pageSizeOptions?: number[]
}

export interface ListProps<T = any> extends BaseComponentProps {
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
  keyExtractor?: (item: T, index: number) => string
  loading?: boolean
  empty?: ReactNode
  divider?: boolean
  spacing?: ComponentSize
  orientation?: 'vertical' | 'horizontal'
  wrap?: boolean
}

// Tipos para componentes de mídia
export interface ImageProps extends BaseComponentProps {
  src: string
  alt: string
  width?: string | number
  height?: string | number
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  objectPosition?: string
  loading?: 'lazy' | 'eager'
  placeholder?: ReactNode
  fallback?: ReactNode
  onLoad?: () => void
  onError?: () => void
  crossOrigin?: 'anonymous' | 'use-credentials'
  decoding?: 'async' | 'auto' | 'sync'
  sizes?: string
  srcSet?: string
}

export interface AvatarProps extends BaseComponentProps {
  src?: string
  alt?: string
  name?: string
  size?: ComponentSize | number
  variant?: 'circular' | 'rounded' | 'square'
  fallback?: ReactNode
  showBorder?: boolean
  borderColor?: string
  status?: 'online' | 'offline' | 'away' | 'busy'
  statusPlacement?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

// Tipos para componentes de entrada avançada
export interface DatePickerProps extends FormComponentProps {
  value?: Date | string
  defaultValue?: Date | string
  onChange?: (date: Date | null) => void
  onBlur?: () => void
  onFocus?: () => void
  format?: string
  locale?: string
  minDate?: Date | string
  maxDate?: Date | string
  disabledDates?: Date[] | ((date: Date) => boolean)
  showTime?: boolean
  timeFormat?: string
  clearable?: boolean
  showToday?: boolean
  showWeekNumbers?: boolean
  firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

export interface TimePickerProps extends FormComponentProps {
  value?: string | Date
  defaultValue?: string | Date
  onChange?: (time: string) => void
  onBlur?: () => void
  onFocus?: () => void
  format?: '12h' | '24h'
  step?: number
  minTime?: string
  maxTime?: string
  clearable?: boolean
}

export interface ColorPickerProps extends FormComponentProps {
  value?: string
  defaultValue?: string
  onChange?: (color: string) => void
  onBlur?: () => void
  onFocus?: () => void
  format?: 'hex' | 'rgb' | 'hsl'
  presets?: string[]
  showAlpha?: boolean
  showInput?: boolean
  showPresets?: boolean
}

// Tipos para componentes de upload
export interface FileUploadProps extends FormComponentProps {
  accept?: string
  multiple?: boolean
  maxFiles?: number
  maxSize?: number
  minSize?: number
  onDrop?: (files: File[]) => void
  onReject?: (rejectedFiles: File[]) => void
  onRemove?: (file: File) => void
  validator?: (file: File) => string | null
  preview?: boolean
  showProgress?: boolean
  dragActiveText?: string
  dragRejectText?: string
  uploadText?: string
  browseText?: string
}

// Tipos para componentes de notificação
export interface AlertProps extends BaseComponentProps {
  variant?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  description?: string
  icon?: ReactNode
  closable?: boolean
  onClose?: () => void
  action?: {
    label: string
    onClick: () => void
  }
}

export interface ToastProps extends BaseComponentProps {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  description?: string
  duration?: number
  closable?: boolean
  onClose?: () => void
  action?: {
    label: string
    onClick: () => void
  }
  position?: 
    | 'top-left' | 'top-center' | 'top-right'
    | 'bottom-left' | 'bottom-center' | 'bottom-right'
}

// Tipos para componentes de progresso
export interface ProgressProps extends BaseComponentProps {
  value: number
  max?: number
  variant?: 'linear' | 'circular'
  size?: ComponentSize
  color?: ComponentColor
  showLabel?: boolean
  label?: string
  animated?: boolean
  striped?: boolean
}

export interface StepperProps extends BaseComponentProps {
  activeStep: number
  steps: StepItem[]
  orientation?: 'horizontal' | 'vertical'
  variant?: 'default' | 'dots' | 'progress'
  onStepClick?: (step: number) => void
  allowStepClick?: boolean
  showStepNumber?: boolean
  connector?: ReactNode
}

export interface StepItem {
  label: string
  description?: string
  icon?: ReactNode
  optional?: boolean
  disabled?: boolean
  error?: boolean
  completed?: boolean
}