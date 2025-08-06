'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, Upload, Trash2, User, X, Check } from 'lucide-react'
import { Button } from '@/shared/components/ui'
import { cn } from '@/shared/utils'

interface AvatarUploadProps {
  currentAvatar?: string
  userName: string
  onUpload: (file: File) => Promise<void>
  onRemove?: () => Promise<void>
  isLoading?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  disabled?: boolean
}

interface AvatarUploadState {
  preview: string | null
  isDragging: boolean
  error: string | null
  isUploading: boolean
}

const sizeClasses = {
  sm: 'w-12 h-12 text-sm',
  md: 'w-20 h-20 text-xl',
  lg: 'w-32 h-32 text-3xl',
  xl: 'w-40 h-40 text-4xl'
}

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
  xl: 'h-6 w-6'
}

export function AvatarUpload({
  currentAvatar,
  userName,
  onUpload,
  onRemove,
  isLoading = false,
  size = 'lg',
  className,
  disabled = false
}: AvatarUploadProps) {
  const [state, setState] = useState<AvatarUploadState>({
    preview: null,
    isDragging: false,
    error: null,
    isUploading: false
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // Validar arquivo
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Formato não suportado. Use JPEG, PNG, WebP ou GIF.'
      }
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'Arquivo muito grande. Máximo 5MB.'
      }
    }

    return { valid: true }
  }

  // Processar arquivo selecionado
  const processFile = useCallback(async (file: File) => {
    const validation = validateFile(file)
    
    if (!validation.valid) {
      setState(prev => ({ ...prev, error: validation.error!, preview: null }))
      return
    }

    // Criar preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setState(prev => ({
        ...prev,
        preview: e.target?.result as string,
        error: null
      }))
    }
    reader.readAsDataURL(file)
  }, [])

  // Handlers para drag & drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setState(prev => ({ ...prev, isDragging: true }))
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setState(prev => ({ ...prev, isDragging: false }))
    }
  }, [disabled])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (disabled) return

    setState(prev => ({ ...prev, isDragging: false }))
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      processFile(files[0])
    }
  }, [disabled, processFile])

  // Handler para seleção de arquivo
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }, [processFile])

  // Handler para upload
  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0] && !state.preview) return

    const file = fileInputRef.current?.files?.[0]
    if (!file) return

    try {
      setState(prev => ({ ...prev, isUploading: true, error: null }))
      await onUpload(file)
      setState(prev => ({ ...prev, preview: null, isUploading: false }))
      
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro no upload',
        isUploading: false
      }))
    }
  }

  // Handler para remover
  const handleRemove = async () => {
    if (!onRemove) return

    try {
      setState(prev => ({ ...prev, isUploading: true, error: null }))
      await onRemove()
      setState(prev => ({ ...prev, isUploading: false }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro ao remover',
        isUploading: false
      }))
    }
  }

  // Cancelar preview
  const handleCancelPreview = () => {
    setState(prev => ({ ...prev, preview: null, error: null }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const isProcessing = isLoading || state.isUploading
  const showPreview = state.preview && !isProcessing
  const showCurrent = currentAvatar && !showPreview && !isProcessing
  const showPlaceholder = !showPreview && !showCurrent

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Avatar Display */}
      <div
        ref={dropZoneRef}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'relative rounded-full border-4 border-primary-gold overflow-hidden transition-all duration-200',
          sizeClasses[size],
          {
            'border-primary-gold-dark scale-105': state.isDragging && !disabled,
            'opacity-50': disabled,
            'cursor-pointer': !disabled,
            'animate-pulse': isProcessing
          }
        )}
      >
        {/* Loading Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
          </div>
        )}

        {/* Preview Image */}
        {showPreview && (
          <img
            src={state.preview}
            alt="Preview do avatar"
            className="w-full h-full object-cover"
          />
        )}

        {/* Current Avatar */}
        {showCurrent && (
          <img
            src={currentAvatar}
            alt={`Avatar de ${userName}`}
            className="w-full h-full object-cover"
          />
        )}

        {/* Placeholder */}
        {showPlaceholder && (
          <div className="w-full h-full bg-neutral-dark-gray flex items-center justify-center text-primary-gold font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Drag Overlay */}
        {state.isDragging && !disabled && (
          <div className="absolute inset-0 bg-primary-gold/20 flex items-center justify-center">
            <Upload className={cn('text-primary-gold', iconSizes[size])} />
          </div>
        )}

        {/* Action Buttons Overlay */}
        {!disabled && !isProcessing && (
          <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
            <label className="cursor-pointer p-2 bg-primary-gold rounded-full hover:bg-primary-gold-dark transition-colors">
              <Camera className={iconSizes[size]} />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>

      {/* Error Message */}
      {state.error && (
        <div className="text-error text-sm text-center max-w-xs">
          {state.error}
        </div>
      )}

      {/* Action Buttons */}
      {!disabled && (
        <div className="flex gap-2">
          {/* Upload Button (when preview exists) */}
          {showPreview && (
            <>
              <Button
                size="sm"
                onClick={handleUpload}
                loading={state.isUploading}
                disabled={state.isUploading}
              >
                <Check className="h-3 w-3 mr-1" />
                Salvar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelPreview}
                disabled={state.isUploading}
              >
                <X className="h-3 w-3 mr-1" />
                Cancelar
              </Button>
            </>
          )}

          {/* Remove Button (when current avatar exists) */}
          {showCurrent && onRemove && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRemove}
              loading={state.isUploading}
              disabled={state.isUploading}
              className="text-error hover:text-error-dark"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Remover
            </Button>
          )}

          {/* Upload Button (when no preview) */}
          {!showPreview && (
            <label className="cursor-pointer">
              <Button size="sm" variant="outline" asChild>
                <span>
                  <Upload className="h-3 w-3 mr-1" />
                  Alterar Foto
                </span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          )}
        </div>
      )}

      {/* Help Text */}
      {!disabled && (
        <p className="text-xs text-text-muted text-center max-w-xs">
          Arraste uma imagem ou clique para selecionar
          <br />
          Formatos: JPEG, PNG, WebP, GIF (máx. 5MB)
        </p>
      )}
    </div>
  )
}
