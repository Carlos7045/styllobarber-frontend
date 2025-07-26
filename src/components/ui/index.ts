/**
 * Barrel exports para componentes UI do StylloBarber
 * Facilita a importação dos componentes
 */

// Componente Button
export {
  Button,
  buttonVariants,
  type ButtonProps,
} from './button'

// Componente Input
export {
  Input,
  inputVariants,
  type InputProps,
} from './input'

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
export {
  ToastProvider,
  useToast,
  type Toast,
  type ToastType,
} from './toast'

// Componente Textarea
export {
  Textarea,
  textareaVariants,
  type TextareaProps,
} from './textarea'

// Componentes Badge
export {
  Badge,
  BadgeGroup,
  BadgeStatus,
  badgeVariants,
  type BadgeProps,
} from './badge'