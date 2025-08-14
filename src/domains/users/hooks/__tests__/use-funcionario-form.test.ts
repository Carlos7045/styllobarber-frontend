/**
 * Testes para o hook useFuncionarioForm
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useFuncionarioForm, usePhoneFormatter } from '../use-funcionario-form'
import { FuncionarioValidator } from '@/domains/users/services/funcionario-validator'

// Mock do FuncionarioValidator
jest.mock('@/domains/users/services/funcionario-validator', () => ({
  FuncionarioValidator: {
    validateCreate: jest.fn(),
    validateUpdate: jest.fn(),
  },
}))

const mockValidator = FuncionarioValidator as jest.Mocked<typeof FuncionarioValidator>

describe('useFuncionarioForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Modo criação', () => {
    it('deve inicializar com dados padrão', () => {
      const { result } = renderHook(() =>
        useFuncionarioForm({ mode: 'create' })
      )

      expect(result.current.data).toEqual({
        nome: '',
        email: '',
        telefone: '',
        role: 'barber',
        especialidades: []
      })
      expect(result.current.errors).toEqual({})
      expect(result.current.warnings).toEqual({})
      expect(result.current.isValid).toBe(true)
      expect(result.current.isDirty).toBe(false)
    })

    it('deve inicializar com dados iniciais', () => {
      const initialData = {
        nome: 'João Silva',
        email: 'joao@teste.com',
        role: 'admin' as const
      }

      const { result } = renderHook(() =>
        useFuncionarioForm({ mode: 'create', initialData })
      )

      expect(result.current.data.nome).toBe('João Silva')
      expect(result.current.data.email).toBe('joao@teste.com')
      expect(result.current.data.role).toBe('admin')
    })

    it('deve atualizar campo e marcar como dirty', () => {
      const { result } = renderHook(() =>
        useFuncionarioForm({ mode: 'create' })
      )

      act(() => {
        result.current.setField('nome', 'João Silva')
      })

      expect(result.current.data.nome).toBe('João Silva')
      expect(result.current.isDirty).toBe(true)
    })

    it('deve validar formulário completo', async () => {
      mockValidator.validateCreate.mockResolvedValue({
        isValid: true,
        errors: []
      })

      const { result } = renderHook(() =>
        useFuncionarioForm({ mode: 'create' })
      )

      act(() => {
        result.current.setData({
          nome: 'João Silva',
          email: 'joao@teste.com',
          role: 'barber'
        })
      })

      let validationResult
      await act(async () => {
        validationResult = await result.current.validate()
      })

      expect(validationResult?.isValid).toBe(true)
      expect(mockValidator.validateCreate).toHaveBeenCalledWith({
        nome: 'João Silva',
        email: 'joao@teste.com',
        telefone: '',
        role: 'barber',
        especialidades: []
      })
    })

    it('deve processar erros de validação', async () => {
      mockValidator.validateCreate.mockResolvedValue({
        isValid: false,
        errors: [
          { field: 'email', message: 'Email já está em uso', code: 'EMAIL_EXISTS' },
          { field: 'nome', message: 'Nome muito curto', code: 'NOME_SHORT' }
        ]
      })

      const { result } = renderHook(() =>
        useFuncionarioForm({ mode: 'create' })
      )

      await act(async () => {
        await result.current.validate()
      })

      expect(result.current.errors.email).toBe('Email já está em uso')
      expect(result.current.errors.nome).toBe('Nome muito curto')
      expect(result.current.isValid).toBe(false)
    })

    it('deve processar warnings de validação', async () => {
      mockValidator.validateCreate.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [
          { field: 'especialidades', message: 'Barbeiro sem especialidades', code: 'NO_ESPECIALIDADES' }
        ]
      })

      const { result } = renderHook(() =>
        useFuncionarioForm({ mode: 'create' })
      )

      await act(async () => {
        await result.current.validate()
      })

      expect(result.current.warnings.especialidades).toBe('Barbeiro sem especialidades')
      expect(result.current.isValid).toBe(true)
    })
  })

  describe('Modo atualização', () => {
    it('deve validar com ID do funcionário', async () => {
      mockValidator.validateUpdate.mockResolvedValue({
        isValid: true,
        errors: []
      })

      const { result } = renderHook(() =>
        useFuncionarioForm({ 
          mode: 'update', 
          funcionarioId: 'func-123' 
        })
      )

      act(() => {
        result.current.setField('nome', 'João Silva Santos')
      })

      await act(async () => {
        await result.current.validate()
      })

      expect(mockValidator.validateUpdate).toHaveBeenCalledWith({
        id: 'func-123',
        nome: 'João Silva Santos',
        email: '',
        telefone: '',
        role: 'barber',
        especialidades: []
      })
    })

    it('deve falhar sem ID do funcionário', async () => {
      const { result } = renderHook(() =>
        useFuncionarioForm({ mode: 'update' })
      )

      await act(async () => {
        const validationResult = await result.current.validate()
        expect(validationResult.isValid).toBe(false)
        expect(result.current.errors.general).toContain('ID do funcionário é obrigatório')
      })
    })
  })

  describe('getFieldProps', () => {
    it('deve retornar props corretas para campo', () => {
      const { result } = renderHook(() =>
        useFuncionarioForm({ mode: 'create' })
      )

      const fieldProps = result.current.getFieldProps('nome')

      expect(fieldProps.value).toBe('')
      expect(typeof fieldProps.onChange).toBe('function')
      expect(typeof fieldProps.onBlur).toBe('function')
      expect(fieldProps.error).toBeUndefined()
      expect(fieldProps.warning).toBeUndefined()
    })

    it('deve incluir erro e warning quando presentes', () => {
      const { result } = renderHook(() =>
        useFuncionarioForm({ mode: 'create' })
      )

      // Simular erro e warning
      act(() => {
        result.current.setField('nome', 'João Silva')
      })

      // Simular estado com erro e warning
      act(() => {
        // Isso seria normalmente definido pela validação
        result.current.errors.nome = 'Nome inválido'
        result.current.warnings.nome = 'Nome pode ser melhorado'
      })

      const fieldProps = result.current.getFieldProps('nome')

      expect(fieldProps.error).toBe('Nome inválido')
      expect(fieldProps.warning).toBe('Nome pode ser melhorado')
    })
  })

  describe('reset', () => {
    it('deve resetar formulário para estado inicial', () => {
      const initialData = { nome: 'João', email: 'joao@teste.com' }
      
      const { result } = renderHook(() =>
        useFuncionarioForm({ mode: 'create', initialData })
      )

      // Modificar dados
      act(() => {
        result.current.setField('nome', 'Pedro Silva')
        result.current.setField('email', 'pedro@teste.com')
      })

      expect(result.current.data.nome).toBe('Pedro Silva')
      expect(result.current.isDirty).toBe(true)

      // Reset
      act(() => {
        result.current.reset()
      })

      expect(result.current.data.nome).toBe('João')
      expect(result.current.data.email).toBe('joao@teste.com')
      expect(result.current.isDirty).toBe(false)
      expect(result.current.errors).toEqual({})
    })
  })

  describe('Callback de validação', () => {
    it('deve chamar callback quando validação muda', () => {
      const onValidationChange = jest.fn()

      const { result } = renderHook(() =>
        useFuncionarioForm({ 
          mode: 'create',
          onValidationChange 
        })
      )

      // Inicialmente válido
      expect(onValidationChange).toHaveBeenCalledWith(true)

      // Simular erro
      act(() => {
        result.current.errors.nome = 'Nome inválido'
      })

      // Deve chamar com false
      expect(onValidationChange).toHaveBeenCalledWith(false)
    })
  })
})

describe('usePhoneFormatter', () => {
  it('deve formatar telefone brasileiro corretamente', () => {
    const { result } = renderHook(() => usePhoneFormatter())

    expect(result.current.formatPhone('11')).toBe('11')
    expect(result.current.formatPhone('1199')).toBe('(11) 99')
    expect(result.current.formatPhone('119999')).toBe('(11) 9999')
    expect(result.current.formatPhone('11999999999')).toBe('(11) 99999-9999')
    expect(result.current.formatPhone('11999999999')).toBe('(11) 99999-9999')
  })

  it('deve remover caracteres não numéricos', () => {
    const { result } = renderHook(() => usePhoneFormatter())

    expect(result.current.formatPhone('(11) 99999-9999')).toBe('(11) 99999-9999')
    expect(result.current.formatPhone('11 99999 9999')).toBe('(11) 99999-9999')
    expect(result.current.formatPhone('+55 11 99999-9999')).toBe('(55) 11999-9999')
  })

  it('deve limitar a 11 dígitos', () => {
    const { result } = renderHook(() => usePhoneFormatter())

    expect(result.current.formatPhone('119999999999999')).toBe('(11) 99999-9999')
  })
})