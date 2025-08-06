import { cn, formatarTelefone } from '../utils'

describe('Utilitários', () => {
  describe('cn (className utility)', () => {
    it('deve combinar classes corretamente', () => {
      const resultado = cn('base-class', 'additional-class')
      expect(resultado).toBe('base-class additional-class')
    })

    it('deve remover classes duplicadas', () => {
      const resultado = cn('text-red-500', 'text-blue-500')
      expect(resultado).toBe('text-blue-500')
    })

    it('deve lidar com classes condicionais', () => {
      const isActive = true
      const resultado = cn('base-class', isActive && 'active-class')
      expect(resultado).toBe('base-class active-class')
    })

    it('deve ignorar valores falsy', () => {
      const resultado = cn('base-class', null, undefined, false, 'valid-class')
      expect(resultado).toBe('base-class valid-class')
    })

    it('deve lidar com objetos de classes condicionais', () => {
      const resultado = cn('base-class', {
        'active-class': true,
        'inactive-class': false,
      })
      expect(resultado).toBe('base-class active-class')
    })
  })

  describe('formatarTelefone', () => {
    it('deve formatar telefone com 11 dígitos', () => {
      const resultado = formatarTelefone('11999999999')
      expect(resultado).toBe('(11) 99999-9999')
    })

    it('deve formatar telefone com 10 dígitos', () => {
      const resultado = formatarTelefone('1199999999')
      expect(resultado).toBe('(11) 9999-9999')
    })

    it('deve manter formatação parcial durante digitação', () => {
      expect(formatarTelefone('11')).toBe('(11')
      expect(formatarTelefone('119')).toBe('(11) 9')
      expect(formatarTelefone('11999')).toBe('(11) 999')
      expect(formatarTelefone('1199999')).toBe('(11) 9999-9')
      expect(formatarTelefone('119999999')).toBe('(11) 9999-999')
      expect(formatarTelefone('1199999999')).toBe('(11) 9999-9999')
    })

    it('deve remover caracteres não numéricos', () => {
      const resultado = formatarTelefone('(11) 99999-9999')
      expect(resultado).toBe('(11) 99999-9999')
    })

    it('deve lidar com string vazia', () => {
      const resultado = formatarTelefone('')
      expect(resultado).toBe('')
    })

    it('deve lidar com apenas um dígito', () => {
      const resultado = formatarTelefone('1')
      expect(resultado).toBe('(1')
    })

    it('deve limitar a 11 dígitos', () => {
      const resultado = formatarTelefone('119999999999999')
      expect(resultado).toBe('(11) 99999-9999')
    })

    it('deve formatar números com caracteres especiais', () => {
      const resultado = formatarTelefone('11-99999-9999')
      expect(resultado).toBe('(11) 99999-9999')
    })

    it('deve formatar números com espaços', () => {
      const resultado = formatarTelefone('11 99999 9999')
      expect(resultado).toBe('(11) 99999-9999')
    })

    it('deve formatar números com parênteses e hífen', () => {
      const resultado = formatarTelefone('(11)99999-9999')
      expect(resultado).toBe('(11) 99999-9999')
    })

    it('deve lidar com números incompletos', () => {
      expect(formatarTelefone('1199')).toBe('(11) 99')
      expect(formatarTelefone('11999999')).toBe('(11) 9999-99')
    })

    it('deve manter formatação consistente', () => {
      const numeroCompleto = '11999999999'
      const resultado1 = formatarTelefone(numeroCompleto)
      const resultado2 = formatarTelefone(resultado1)
      expect(resultado1).toBe(resultado2)
    })
  })
})
