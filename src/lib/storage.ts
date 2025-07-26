import { supabase } from './supabase'

/**
 * Utilitários para gerenciamento de arquivos no Supabase Storage
 */

// Configurações de upload
const AVATAR_BUCKET = 'avatars'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/**
 * Interface para resultado de upload
 */
export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Valida se o arquivo é válido para upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Verificar tamanho
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'Arquivo muito grande. Tamanho máximo: 5MB'
    }
  }

  // Verificar tipo
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo de arquivo não suportado. Use: JPEG, PNG, WebP ou GIF'
    }
  }

  return { valid: true }
}

/**
 * Verifica se o bucket existe e cria se necessário
 */
async function ensureBucketExists(): Promise<boolean> {
  try {
    // Verificar se o bucket existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Erro ao listar buckets:', listError)
      return false
    }

    const bucketExists = buckets?.some(bucket => bucket.name === AVATAR_BUCKET)
    
    if (!bucketExists) {
      console.log('Bucket não existe, tentando criar...')
      // Tentar criar o bucket
      const { error: createError } = await supabase.storage.createBucket(AVATAR_BUCKET, {
        public: true,
        allowedMimeTypes: ALLOWED_TYPES,
        fileSizeLimit: MAX_FILE_SIZE
      })

      if (createError) {
        console.error('Erro ao criar bucket:', createError)
        return false
      }

      console.log('Bucket criado com sucesso')
    }

    return true
  } catch (error) {
    console.error('Erro ao verificar/criar bucket:', error)
    return false
  }
}

/**
 * Faz upload de avatar para o Supabase Storage
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<UploadResult> {
  try {
    console.log('🔄 Iniciando upload de avatar:', { userId, fileName: file.name, fileSize: file.size })

    // Validar arquivo
    const validation = validateFile(file)
    if (!validation.valid) {
      console.error('❌ Arquivo inválido:', validation.error)
      return {
        success: false,
        error: validation.error
      }
    }

    // Verificar se bucket existe
    const bucketReady = await ensureBucketExists()
    if (!bucketReady) {
      return {
        success: false,
        error: 'Erro na configuração do storage'
      }
    }

    // Gerar nome único para o arquivo
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `${fileName}` // Remover pasta avatars/ pois já está no bucket

    console.log('📁 Fazendo upload para:', filePath)

    // Fazer upload
    const { data, error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (error) {
      console.error('❌ Erro no upload:', error)
      return {
        success: false,
        error: `Erro no upload: ${error.message}`
      }
    }

    console.log('✅ Upload realizado:', data)

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(data.path)

    console.log('🔗 URL pública gerada:', urlData.publicUrl)

    return {
      success: true,
      url: urlData.publicUrl
    }
  } catch (error) {
    console.error('❌ Erro inesperado no upload de avatar:', error)
    return {
      success: false,
      error: 'Erro inesperado no upload'
    }
  }
}

/**
 * Remove avatar antigo do storage
 */
export async function removeAvatar(avatarUrl: string): Promise<boolean> {
  try {
    // Extrair path da URL
    const url = new URL(avatarUrl)
    const pathParts = url.pathname.split('/')
    const bucketIndex = pathParts.findIndex(part => part === AVATAR_BUCKET)
    
    if (bucketIndex === -1) {
      return false
    }

    const filePath = pathParts.slice(bucketIndex + 1).join('/')

    // Remover arquivo
    const { error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .remove([filePath])

    if (error) {
      console.error('Erro ao remover avatar:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Erro ao remover avatar:', error)
    return false
  }
}

/**
 * Redimensiona imagem antes do upload (opcional)
 */
export function resizeImage(
  file: File,
  maxWidth: number = 400,
  maxHeight: number = 400,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calcular dimensões mantendo proporção
      let { width, height } = img
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }

      // Configurar canvas
      canvas.width = width
      canvas.height = height

      // Desenhar imagem redimensionada
      ctx?.drawImage(img, 0, 0, width, height)

      // Converter para blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(resizedFile)
          } else {
            resolve(file)
          }
        },
        file.type,
        quality
      )
    }

    img.src = URL.createObjectURL(file)
  })
}