/**
 * Sistema de fallback para upload de avatar usando base64
 * Usado quando o Supabase Storage não está disponível
 */

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Converte arquivo para base64 (fallback temporário)
 */
export async function uploadAvatarFallback(
  userId: string,
  file: File
): Promise<UploadResult> {
  try {
    console.log('🔄 Usando fallback para upload de avatar')

    // Validar arquivo
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

    if (file.size > maxSize) {
      return {
        success: false,
        error: 'Arquivo muito grande. Tamanho máximo: 5MB'
      }
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Tipo de arquivo não suportado. Use: JPEG, PNG, WebP ou GIF'
      }
    }

    // Converter para base64
    const base64 = await fileToBase64(file)
    
    // Por enquanto, retornar a própria base64 como URL
    // Em produção, isso seria enviado para um serviço de storage
    return {
      success: true,
      url: base64
    }
  } catch (error) {
    console.error('❌ Erro no fallback de upload:', error)
    return {
      success: false,
      error: 'Erro ao processar imagem'
    }
  }
}

/**
 * Converte arquivo para base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Erro ao converter arquivo'))
      }
    }
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
    reader.readAsDataURL(file)
  })
}

/**
 * Remove avatar (no fallback, apenas retorna sucesso)
 */
export async function removeAvatarFallback(avatarUrl: string): Promise<boolean> {
  // Fallback: Removendo avatar (simulado)
  return true
}
