import {
  schemaLogin,
  schemaCadastro,
  schemaUsuario,
  schemaServico,
  schemaAgendamento,
  schemaHorarioTrabalho,
} from '../validations'

describe('Validações', () => {
  describe('schemaLogin', () => {
    it('deve validar dados de login válidos', () => {
      const dadosValidos = {
        email: 'test@example.com',
        senha: 'password123',
      }

      const resultado = schemaLogin.safeParse(dadosValidos)
      expect(resultado.success).toBe(true)
    })

    it('deve rejeitar email inválido', () => {
      const dadosInvalidos = {
        email: 'email-invalido',
        senha: 'password123',
      }

      const resultado = schemaLogin.safeParse(dadosInvalidos)
      expect(resultado.success).toBe(false)
      
      if (!resultado.success) {
        expect(resultado.error.issues[0].message).toBe('Email inválido')
      }
    })

    it('deve rejeitar senha muito curta', () => {
      const dadosInvalidos = {
        email: 'test@example.com',
        senha: '123',
      }

      const resultado = schemaLogin.safeParse(dadosInvalidos)
      expect(resultado.success).toBe(false)
      
      if (!resultado.success) {
        expect(resultado.error.issues[0].message).toBe('Senha deve ter pelo menos 6 caracteres')
      }
    })

    it('deve rejeitar campos vazios', () => {
      const dadosInvalidos = {
        email: '',
        senha: '',
      }

      const resultado = schemaLogin.safeParse(dadosInvalidos)
      expect(resultado.success).toBe(false)
      
      if (!resultado.success) {
        expect(resultado.error.issues).toHaveLength(2)
      }
    })
  })

  describe('schemaCadastro', () => {
    it('deve validar dados de cadastro válidos', () => {
      const dadosValidos = {
        nome: 'João Silva',
        email: 'joao@example.com',
        telefone: '(11) 99999-9999',
        senha: 'password123',
        confirmarSenha: 'password123',
      }

      const resultado = schemaCadastro.safeParse(dadosValidos)
      expect(resultado.success).toBe(true)
    })

    it('deve rejeitar senhas que não coincidem', () => {
      const dadosInvalidos = {
        nome: 'João Silva',
        email: 'joao@example.com',
        telefone: '(11) 99999-9999',
        senha: 'password123',
        confirmarSenha: 'password456',
      }

      const resultado = schemaCadastro.safeParse(dadosInvalidos)
      expect(resultado.success).toBe(false)
      
      if (!resultado.success) {
        const senhaError = resultado.error.issues.find(issue => issue.path.includes('confirmarSenha'))
        expect(senhaError?.message).toBe('Senhas não coincidem')
      }
    })

    it('deve rejeitar nome muito curto', () => {
      const dadosInvalidos = {
        nome: 'A',
        email: 'joao@example.com',
        telefone: '(11) 99999-9999',
        senha: 'password123',
        confirmarSenha: 'password123',
      }

      const resultado = schemaCadastro.safeParse(dadosInvalidos)
      expect(resultado.success).toBe(false)
      
      if (!resultado.success) {
        const nomeError = resultado.error.issues.find(issue => issue.path.includes('nome'))
        expect(nomeError?.message).toBe('Nome deve ter pelo menos 2 caracteres')
      }
    })

    it('deve rejeitar telefone em formato inválido', () => {
      const dadosInvalidos = {
        nome: 'João Silva',
        email: 'joao@example.com',
        telefone: '11999999999',
        senha: 'password123',
        confirmarSenha: 'password123',
      }

      const resultado = schemaCadastro.safeParse(dadosInvalidos)
      expect(resultado.success).toBe(false)
      
      if (!resultado.success) {
        const telefoneError = resultado.error.issues.find(issue => issue.path.includes('telefone'))
        expect(telefoneError?.message).toBe('Formato de telefone inválido: (XX) XXXXX-XXXX')
      }
    })
  })

  describe('schemaUsuario', () => {
    it('deve validar usuário válido', () => {
      const usuarioValido = {
        nome: 'Maria Santos',
        email: 'maria@example.com',
        telefone: '(11) 98888-8888',
      }

      const resultado = schemaUsuario.safeParse(usuarioValido)
      expect(resultado.success).toBe(true)
    })

    it('deve rejeitar nome muito longo', () => {
      const usuarioInvalido = {
        nome: 'A'.repeat(101),
        email: 'maria@example.com',
        telefone: '(11) 98888-8888',
      }

      const resultado = schemaUsuario.safeParse(usuarioInvalido)
      expect(resultado.success).toBe(false)
      
      if (!resultado.success) {
        const nomeError = resultado.error.issues.find(issue => issue.path.includes('nome'))
        expect(nomeError?.message).toBe('Nome deve ter no máximo 100 caracteres')
      }
    })
  })

  describe('schemaServico', () => {
    it('deve validar serviço válido', () => {
      const servicoValido = {
        nome: 'Corte Masculino',
        duracao: 30,
        preco: 25.00,
        pausaApos: 15,
        categoria: 'Cortes',
        descricao: 'Corte tradicional masculino',
      }

      const resultado = schemaServico.safeParse(servicoValido)
      expect(resultado.success).toBe(true)
    })

    it('deve rejeitar duração muito curta', () => {
      const servicoInvalido = {
        nome: 'Corte Masculino',
        duracao: 10,
        preco: 25.00,
        pausaApos: 15,
        categoria: 'Cortes',
      }

      const resultado = schemaServico.safeParse(servicoInvalido)
      expect(resultado.success).toBe(false)
      
      if (!resultado.success) {
        const duracaoError = resultado.error.issues.find(issue => issue.path.includes('duracao'))
        expect(duracaoError?.message).toBe('Duração mínima é 15 minutos')
      }
    })

    it('deve rejeitar preço negativo', () => {
      const servicoInvalido = {
        nome: 'Corte Masculino',
        duracao: 30,
        preco: -10,
        pausaApos: 15,
        categoria: 'Cortes',
      }

      const resultado = schemaServico.safeParse(servicoInvalido)
      expect(resultado.success).toBe(false)
      
      if (!resultado.success) {
        const precoError = resultado.error.issues.find(issue => issue.path.includes('preco'))
        expect(precoError?.message).toBe('Preço deve ser positivo')
      }
    })
  })

  describe('schemaAgendamento', () => {
    const dataFutura = new Date()
    dataFutura.setDate(dataFutura.getDate() + 1)

    it('deve validar agendamento válido', () => {
      const agendamentoValido = {
        servicoId: 'service-123',
        data: dataFutura,
        horaInicio: '14:30',
        barbeiroId: 'barber-123',
        observacoes: 'Corte baixo nas laterais',
      }

      const resultado = schemaAgendamento.safeParse(agendamentoValido)
      expect(resultado.success).toBe(true)
    })

    it('deve rejeitar data no passado', () => {
      const dataPassada = new Date()
      dataPassada.setDate(dataPassada.getDate() - 1)

      const agendamentoInvalido = {
        servicoId: 'service-123',
        data: dataPassada,
        horaInicio: '14:30',
        barbeiroId: 'barber-123',
      }

      const resultado = schemaAgendamento.safeParse(agendamentoInvalido)
      expect(resultado.success).toBe(false)
      
      if (!resultado.success) {
        const dataError = resultado.error.issues.find(issue => issue.path.includes('data'))
        expect(dataError?.message).toBe('Data deve ser futura')
      }
    })

    it('deve rejeitar formato de hora inválido', () => {
      const agendamentoInvalido = {
        servicoId: 'service-123',
        data: dataFutura,
        horaInicio: '25:30',
        barbeiroId: 'barber-123',
      }

      const resultado = schemaAgendamento.safeParse(agendamentoInvalido)
      expect(resultado.success).toBe(false)
      
      if (!resultado.success) {
        const horaError = resultado.error.issues.find(issue => issue.path.includes('horaInicio'))
        expect(horaError?.message).toBe('Formato de hora inválido')
      }
    })
  })

  describe('schemaHorarioTrabalho', () => {
    it('deve validar horário de trabalho válido', () => {
      const horarioValido = {
        ativo: true,
        inicio: '08:00',
        fim: '18:00',
        intervaloInicio: '12:00',
        intervaloFim: '13:00',
      }

      const resultado = schemaHorarioTrabalho.safeParse(horarioValido)
      expect(resultado.success).toBe(true)
    })

    it('deve validar horário inativo', () => {
      const horarioInativo = {
        ativo: false,
        inicio: '08:00',
        fim: '06:00', // Fim antes do início, mas como está inativo, deve passar
      }

      const resultado = schemaHorarioTrabalho.safeParse(horarioInativo)
      expect(resultado.success).toBe(true)
    })

    it('deve rejeitar horário com fim antes do início quando ativo', () => {
      const horarioInvalido = {
        ativo: true,
        inicio: '18:00',
        fim: '08:00',
      }

      const resultado = schemaHorarioTrabalho.safeParse(horarioInvalido)
      expect(resultado.success).toBe(false)
      
      if (!resultado.success) {
        const fimError = resultado.error.issues.find(issue => issue.path.includes('fim'))
        expect(fimError?.message).toBe('Hora de início deve ser anterior à hora de fim')
      }
    })

    it('deve rejeitar formato de hora inválido', () => {
      const horarioInvalido = {
        ativo: true,
        inicio: '25:00',
        fim: '18:00',
      }

      const resultado = schemaHorarioTrabalho.safeParse(horarioInvalido)
      expect(resultado.success).toBe(false)
      
      if (!resultado.success) {
        const inicioError = resultado.error.issues.find(issue => issue.path.includes('inicio'))
        expect(inicioError?.message).toBe('Formato de hora inválido')
      }
    })
  })
})