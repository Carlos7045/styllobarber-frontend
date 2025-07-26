import { supabase } from '@/lib/supabase'
import {
  uploadAvatar,
  removeAvatar,
  getAvatarUrl,
  validateImageFile,
  compressImage,
  generateFileName,
  STORAGE_CONFIG
} from '../storage'

// Mock do Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        remove: jest.fn(),
        getPublicUrl: jest.fn(),
      })),
    },
  },
}))

// Mock do canvas para compressão de imagem
const mockCanvas = {
  getContext: jest.fn(() => ({
    drawImage: jest.fn(),
  })),
  toBlob: jest.fn(),
  width: 0,
  height: 0,
}

const mockImage = {
  onload: null as any,
  onerror: null as any,
  src: '',
  width: 800,
  height: 600,
}

// Mock do DOM
Object.defineProperty(global, 'document', {
  value: {
    createElement: jest.fn((tag) => {
      if (tag === 'canvas') return mockCanvas
      if (tag === 'img') return mockImage
      return {}
    }),
  },
})

describe('Storage Utils', () => {
  const mockStorageBucket = {
    upload: jest.fn(),
    remove: jest.fn(),
    getPublicUrl: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    ;(supabase.storage.from as jest.Mock).mockReturnValue(mockStorageBucket)
  })

  describe('validateImageFile', () => {
    it('deve validar arquivo de imagem válido', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      const result = validateImageFile(file)
      
      expect(result.isValid).toBe(true)
      expect(result.error).toBeNull()
    })

    it('deve rejeitar arquivo muito grande', () => {
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { 
        type: 'image/jpeg' 
      })
      
      const result = validateImageFile(largeFile)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Arquivo muito grande. Máximo permitido: 5MB')
    })

    it('deve rejeitar tipo de arquivo inválido', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      
      const result = validateImageFile(file)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Tipo de arquivo não suportado. Use: JPEG, PNG, WebP ou GIF')
    })

    it('deve aceitar todos os tipos de imagem suportados', () => {
      const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      
      supportedTypes.forEach(type => {
        const file = new File(['test'], `test.${type.split('/')[1]}`, { type })
        
        const result = validateImageFile(file)
        
        expect(result.isValid).toBe(true)
      })
    })
  })

  describe('generateFileName', () => {
    it('deve gerar nome único com prefixo', () => {
      const userId = 'user123'
      const originalName = 'avatar.jpg'
      
      const fileName = generateFileName(userId, originalName)
      
      expect(fileName).toMatch(/^user123_\d+_avatar\.jpg$/)
    })

    it('deve preservar extensão do arquivo', () => {
      const fileName = generateFileName('user123', 'image.png')
      
      expect(fileName).toEndWith('.png')
    })

    it('deve lidar com nomes sem extensão', () => {
      const fileName = generateFileName('user123', 'image')
      
      expect(fileName).toMatch(/^user123_\d+_image$/)
    })

    it('deve sanitizar caracteres especiais', () => {
      const fileName = generateFileName('user123', 'my avatar!@#.jpg')
      
      expect(fileName).toMatch(/^user123_\d+_my avatar!@#\.jpg$/)
    })
  })

  describe('compressImage', () => {
    it('deve comprimir imagem grande', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockBlob = new Blob(['compressed'], { type: 'image/jpeg' })
      
      mockCanvas.toBlob.mockImplementation((callback) => {
        callback(mockBlob)
      })

      // Simular imagem grande
      mockImage.width = 2000
      mockImage.height = 1500

      const result = await compressImage(file, 800, 0.8)
      
      expect(result).toBeInstanceOf(File)
      expect(result.name).toBe('test.jpg')
    })

    it('deve manter imagem pequena sem compressão', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      // Simular imagem pequena
      mockImage.width = 400
      mockImage.height = 300

      const result = await compressImage(file, 800, 0.8)
      
      expect(result).toBe(file)
    })

    it('deve lidar com erro de carregamento de imagem', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      // Simular erro de carregamento
      setTimeout(() => {
        if (mockImage.onerror) {
          mockImage.onerror(new Error('Erro de carregamento'))
        }
      }, 10)

      await expect(compressImage(file, 800, 0.8)).rejects.toThrow('Erro de carregamento')
    })

    it('deve usar qualidade padrão quando não especificada', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockBlob = new Blob(['compressed'], { type: 'image/jpeg' })
      
      mockCanvas.toBlob.mockImplementation((callback, type, quality) => {
        expect(quality).toBe(0.9) // Qualidade padrão
        callback(mockBlob)
      })

      mockImage.width = 1000
      mockImage.height = 800

      await compressImage(file)
    })
  })

  describe('uploadAvatar', () => {
    it('deve fazer upload de avatar com sucesso', async () => {
      const file = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' })
      const userId = 'user123'
      const mockUrl = 'https://example.com/avatar.jpg'

      mockStorageBucket.upload.mockResolvedValue({
        data: { path: 'avatars/user123_123456_avatar.jpg' },
        error: null,
      })

      mockStorageBucket.getPublicUrl.mockReturnValue({
        data: { publicUrl: mockUrl },
      })

      const result = await uploadAvatar(file, userId)

      expect(result.success).toBe(true)
      expect(result.url).toBe(mockUrl)
      expect(result.error).toBeNull()
      expect(mockStorageBucket.upload).toHaveBeenCalled()
    })

    it('deve comprimir imagem antes do upload', async () => {
      const file = new File(['test'], 'large.jpg', { type: 'image/jpeg' })
      const userId = 'user123'
      const mockBlob = new Blob(['compressed'], { type: 'image/jpeg' })

      // Simular imagem grande que precisa de compressão
      mockImage.width = 2000
      mockImage.height = 1500
      
      mockCanvas.toBlob.mockImplementation((callback) => {
        callback(mockBlob)
      })

      mockStorageBucket.upload.mockResolvedValue({
        data: { path: 'avatars/compressed.jpg' },
        error: null,
      })

      mockStorageBucket.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/compressed.jpg' },
      })

      const result = await uploadAvatar(file, userId)

      expect(result.success).toBe(true)
      // Verificar se a compressão foi chamada
      expect(mockCanvas.toBlob).toHaveBeenCalled()
    })

    it('deve retornar erro para arquivo inválido', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      const userId = 'user123'

      const result = await uploadAvatar(file, userId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Tipo de arquivo não suportado. Use: JPEG, PNG, WebP ou GIF')
      expect(mockStorageBucket.upload).not.toHaveBeenCalled()
    })

    it('deve lidar com erro de upload', async () => {
      const file = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' })
      const userId = 'user123'

      mockStorageBucket.upload.mockResolvedValue({
        data: null,
        error: { message: 'Erro de upload' },
      })

      const result = await uploadAvatar(file, userId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Erro de upload')
    })

    it('deve remover avatar anterior se especificado', async () => {
      const file = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' })
      const userId = 'user123'
      const oldAvatarUrl = 'https://example.com/old-avatar.jpg'

      mockStorageBucket.upload.mockResolvedValue({
        data: { path: 'avatars/new-avatar.jpg' },
        error: null,
      })

      mockStorageBucket.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/new-avatar.jpg' },
      })

      mockStorageBucket.remove.mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await uploadAvatar(file, userId, oldAvatarUrl)

      expect(result.success).toBe(true)
      expect(mockStorageBucket.remove).toHaveBeenCalled()
    })
  })

  describe('removeAvatar', () => {
    it('deve remover avatar com sucesso', async () => {
      const avatarUrl = 'https://example.com/storage/v1/object/public/avatars/user123_avatar.jpg'

      mockStorageBucket.remove.mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await removeAvatar(avatarUrl)

      expect(result).toBe(true)
      expect(mockStorageBucket.remove).toHaveBeenCalledWith(['user123_avatar.jpg'])
    })

    it('deve lidar com erro de remoção', async () => {
      const avatarUrl = 'https://example.com/storage/v1/object/public/avatars/user123_avatar.jpg'

      mockStorageBucket.remove.mockResolvedValue({
        data: null,
        error: { message: 'Erro de remoção' },
      })

      const result = await removeAvatar(avatarUrl)

      expect(result).toBe(false)
    })

    it('deve lidar com URL inválida', async () => {
      const invalidUrl = 'https://invalid-url.com/avatar.jpg'

      const result = await removeAvatar(invalidUrl)

      expect(result).toBe(false)
      expect(mockStorageBucket.remove).not.toHaveBeenCalled()
    })

    it('deve extrair nome do arquivo corretamente', async () => {
      const avatarUrl = 'https://example.com/storage/v1/object/public/avatars/subfolder/user123_avatar.jpg'

      mockStorageBucket.remove.mockResolvedValue({
        data: null,
        error: null,
      })

      await removeAvatar(avatarUrl)

      expect(mockStorageBucket.remove).toHaveBeenCalledWith(['subfolder/user123_avatar.jpg'])
    })
  })

  describe('getAvatarUrl', () => {
    it('deve retornar URL pública do avatar', () => {
      const fileName = 'user123_avatar.jpg'
      const mockUrl = 'https://example.com/avatar.jpg'

      mockStorageBucket.getPublicUrl.mockReturnValue({
        data: { publicUrl: mockUrl },
      })

      const result = getAvatarUrl(fileName)

      expect(result).toBe(mockUrl)
      expect(mockStorageBucket.getPublicUrl).toHaveBeenCalledWith(fileName)
    })

    it('deve retornar null para erro', () => {
      const fileName = 'user123_avatar.jpg'

      mockStorageBucket.getPublicUrl.mockReturnValue({
        data: null,
        error: { message: 'Erro' },
      })

      const result = getAvatarUrl(fileName)

      expect(result).toBeNull()
    })
  })

  describe('STORAGE_CONFIG', () => {
    it('deve ter configurações corretas', () => {
      expect(STORAGE_CONFIG).toEqual({
        bucket: 'avatars',
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.9,
      })
    })
  })
})