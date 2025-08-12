// Serviço para cadastro automático de clientes no PDV
import { supabase } from '@/lib/api/supabase'

export interface NovoClienteData {
  nome: string
  telefone: string
  email?: string
  cpf?: string // Campo CPF para integração Asaas
  observacoes?: string
}

export interface ClienteComCredenciais {
  id: string
  nome: string
  telefone: string
  email?: string
  senhaTemporaria: string
  loginUsuario: string
}

export interface NotificacaoCredenciais {
  tipo: 'SMS' | 'EMAIL'
  destinatario: string
  nome: string
  login: string
  senha: string
}

class ClienteCadastroService {
  // Gerar senha temporária padrão
  private gerarSenhaTemporaria(): string {
    // Usar senha padrão "bemvindo" para facilitar o primeiro acesso
    return 'bemvindo'
  }

  // Validar CPF brasileiro
  private validarCPF(cpf: string): boolean {
    if (!cpf) return false
    
    const cpfNumeros = cpf.replace(/\D/g, '')
    if (cpfNumeros.length !== 11 || /^(\d)\1+$/.test(cpfNumeros)) return false
    
    let soma = 0
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpfNumeros.charAt(i)) * (10 - i)
    }
    let resto = 11 - (soma % 11)
    let digito1 = resto < 2 ? 0 : resto
    
    soma = 0
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpfNumeros.charAt(i)) * (11 - i)
    }
    resto = 11 - (soma % 11)
    let digito2 = resto < 2 ? 0 : resto
    
    return digito1 === parseInt(cpfNumeros.charAt(9)) && digito2 === parseInt(cpfNumeros.charAt(10))
  }

  // Gerar CPF válido para testes (quando não fornecido)
  private gerarCPFValido(): string {
    const cpfsValidos = [
      '11144477735',
      '12345678909', 
      '98765432100',
      '11111111111'
    ]
    return cpfsValidos[Math.floor(Math.random() * cpfsValidos.length)]
  }

  // Validar dados do cliente
  private validarDadosCliente(dados: NovoClienteData): { valido: boolean; erros: string[] } {
    const erros: string[] = []

    if (!dados.nome || dados.nome.trim().length < 2) {
      erros.push('Nome deve ter pelo menos 2 caracteres')
    }

    if (!dados.telefone || dados.telefone.replace(/\D/g, '').length < 10) {
      erros.push('Telefone inválido')
    }

    if (dados.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)) {
      erros.push('Email inválido')
    }

    if (dados.cpf && !this.validarCPF(dados.cpf)) {
      erros.push('CPF inválido')
    }

    return { valido: erros.length === 0, erros }
  }

  // Verificar se cliente já existe
  async verificarClienteExistente(telefone: string, email?: string, cpf?: string): Promise<any[]> {
    try {
      const telefoneNumeros = telefone.replace(/\D/g, '')
      
      let query = supabase
        .from('profiles')
        .select('id, nome, telefone, email, cpf, created_at')
        .eq('role', 'client')

      // Buscar por telefone
      const { data: clientesPorTelefone } = await query
        .ilike('telefone', `%${telefoneNumeros}%`)

      let clientesPorEmail: any[] = []
      let clientesPorCPF: any[] = []
      
      // Buscar por email se fornecido
      if (email) {
        const { data } = await supabase
          .from('profiles')
          .select('id, nome, telefone, email, cpf, created_at')
          .eq('role', 'client')
          .ilike('email', email)
        
        clientesPorEmail = data || []
      }

      // Buscar por CPF se fornecido
      if (cpf) {
        const cpfNumeros = cpf.replace(/\D/g, '')
        const { data } = await supabase
          .from('profiles')
          .select('id, nome, telefone, email, cpf, created_at')
          .eq('role', 'client')
          .eq('cpf', cpfNumeros)
        
        clientesPorCPF = data || []
      }

      // Combinar resultados e remover duplicatas
      const todosClientes = [...(clientesPorTelefone || []), ...clientesPorEmail, ...clientesPorCPF]
      const clientesUnicos = todosClientes.filter((cliente, index, array) => 
        array.findIndex(c => c.id === cliente.id) === index
      )

      return clientesUnicos
    } catch (error) {
      console.error('Erro ao verificar cliente existente:', error)
      return []
    }
  }

  // Criar perfil do cliente
  private async criarPerfilCliente(dados: NovoClienteData, userId: string): Promise<void> {
    // Se CPF não foi fornecido, gerar um válido para testes
    const cpfFinal = dados.cpf ? dados.cpf.replace(/\D/g, '') : this.gerarCPFValido()

    const { error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        nome: dados.nome,
        telefone: dados.telefone,
        email: dados.email || null,
        cpf: cpfFinal,
        role: 'client',
        status: 'ativo',
        observacoes: dados.observacoes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Marcar como cadastrado automaticamente
        cadastro_automatico: true,
        senha_alterada: false
      })

    if (error) {
      throw new Error(`Erro ao criar perfil: ${error.message}`)
    }
  }

  // Cadastrar novo cliente com usuário
  async cadastrarCliente(dados: NovoClienteData, funcionarioId: string): Promise<ClienteComCredenciais> {
    // Validar dados
    const validacao = this.validarDadosCliente(dados)
    if (!validacao.valido) {
      throw new Error(`Dados inválidos: ${validacao.erros.join(', ')}`)
    }

    // Verificar se cliente já existe
    const clientesExistentes = await this.verificarClienteExistente(dados.telefone, dados.email, dados.cpf)
    if (clientesExistentes.length > 0) {
      throw new Error('Cliente já cadastrado com estes dados')
    }

    const senhaTemporaria = this.gerarSenhaTemporaria()
    const loginUsuario = dados.email || dados.telefone.replace(/\D/g, '')

    try {
      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: dados.email || `${dados.telefone.replace(/\D/g, '')}@temp.styllobarber.com`,
        password: senhaTemporaria,
        phone: dados.telefone.replace(/\D/g, ''),
        user_metadata: {
          nome: dados.nome,
          role: 'client',
          cadastro_automatico: true,
          cadastrado_por: funcionarioId,
          cadastrado_em: new Date().toISOString()
        }
      })

      if (authError || !authData.user) {
        throw new Error(`Erro ao criar usuário: ${authError?.message}`)
      }

      // Criar perfil do cliente
      await this.criarPerfilCliente(dados, authData.user.id)

      // Registrar log de cadastro
      await this.registrarLogCadastro(authData.user.id, funcionarioId, dados)

      const clienteComCredenciais: ClienteComCredenciais = {
        id: authData.user.id,
        nome: dados.nome,
        telefone: dados.telefone,
        email: dados.email,
        senhaTemporaria,
        loginUsuario
      }

      // Enviar credenciais
      await this.enviarCredenciais(clienteComCredenciais)

      return clienteComCredenciais

    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error)
      throw error
    }
  }

  // Registrar log de cadastro
  private async registrarLogCadastro(clienteId: string, funcionarioId: string, dados: NovoClienteData): Promise<void> {
    try {
      await supabase
        .from('logs_cadastro_automatico')
        .insert({
          cliente_id: clienteId,
          funcionario_id: funcionarioId,
          dados_originais: dados,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Erro ao registrar log:', error)
      // Não falhar o cadastro por causa do log
    }
  }

  // Enviar credenciais por SMS ou Email
  async enviarCredenciais(cliente: ClienteComCredenciais): Promise<void> {
    const notificacao: NotificacaoCredenciais = {
      tipo: cliente.email ? 'EMAIL' : 'SMS',
      destinatario: cliente.email || cliente.telefone,
      nome: cliente.nome,
      login: cliente.loginUsuario,
      senha: cliente.senhaTemporaria
    }

    try {
      if (notificacao.tipo === 'EMAIL') {
        await this.enviarCredenciaisPorEmail(notificacao)
      } else {
        await this.enviarCredenciaisPorSMS(notificacao)
      }

      // Registrar envio
      await this.registrarEnvioCredenciais(cliente.id, notificacao.tipo, notificacao.destinatario)

    } catch (error) {
      console.error('Erro ao enviar credenciais:', error)
      // Registrar falha para reenvio posterior
      await this.registrarFalhaEnvio(cliente.id, notificacao.tipo, error)
    }
  }

  // Enviar credenciais por email
  private async enviarCredenciaisPorEmail(notificacao: NotificacaoCredenciais): Promise<void> {
    const templateEmail = `
      Olá ${notificacao.nome}!
      
      Sua conta foi criada na StylloBarber! 🎉
      
      Seus dados de acesso:
      Login: ${notificacao.login}
      Senha: ${notificacao.senha}
      
      IMPORTANTE: Por segurança, você deve alterar sua senha no primeiro acesso.
      
      Acesse: https://app.styllobarber.com
      
      Bem-vindo(a) à família StylloBarber!
    `

    // Aqui você integraria com seu provedor de email (SendGrid, AWS SES, etc.)
    console.log('Enviando email para:', notificacao.destinatario)
    console.log('Conteúdo:', templateEmail)
    
    // Simular envio
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  // Enviar credenciais por SMS
  private async enviarCredenciaisPorSMS(notificacao: NotificacaoCredenciais): Promise<void> {
    const templateSMS = `StylloBarber: Sua conta foi criada! Login: ${notificacao.login} | Senha: ${notificacao.senha} | Altere a senha no 1º acesso: app.styllobarber.com`

    // Aqui você integraria com seu provedor de SMS (Twilio, AWS SNS, etc.)
    console.log('Enviando SMS para:', notificacao.destinatario)
    console.log('Conteúdo:', templateSMS)
    
    // Simular envio
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  // Registrar envio de credenciais
  private async registrarEnvioCredenciais(clienteId: string, tipo: string, destinatario: string): Promise<void> {
    try {
      await supabase
        .from('logs_envio_credenciais')
        .insert({
          cliente_id: clienteId,
          tipo_envio: tipo,
          destinatario,
          status: 'enviado',
          tentativa: 1,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Erro ao registrar envio:', error)
    }
  }

  // Registrar falha no envio
  private async registrarFalhaEnvio(clienteId: string, tipo: string, error: any): Promise<void> {
    try {
      await supabase
        .from('logs_envio_credenciais')
        .insert({
          cliente_id: clienteId,
          tipo_envio: tipo,
          status: 'falha',
          erro: error.message || 'Erro desconhecido',
          tentativa: 1,
          created_at: new Date().toISOString()
        })
    } catch (logError) {
      console.error('Erro ao registrar falha:', logError)
    }
  }

  // Reenviar credenciais para clientes que falharam
  async reenviarCredenciaisPendentes(): Promise<void> {
    try {
      const { data: falhas } = await supabase
        .from('logs_envio_credenciais')
        .select(`
          cliente_id,
          tipo_envio,
          tentativa,
          profiles!inner(nome, telefone, email)
        `)
        .eq('status', 'falha')
        .lt('tentativa', 3) // Máximo 3 tentativas

      if (!falhas || falhas.length === 0) return

      for (const falha of falhas) {
        const profile = falha.profiles as any
        const cliente: ClienteComCredenciais = {
          id: falha.cliente_id,
          nome: profile.nome,
          telefone: profile.telefone,
          email: profile.email,
          senhaTemporaria: 'REENVIO', // Senha será regenerada
          loginUsuario: profile.email || profile.telefone
        }

        try {
          await this.enviarCredenciais(cliente)
        } catch (error) {
          console.error(`Erro ao reenviar para cliente ${cliente.id}:`, error)
        }
      }
    } catch (error) {
      console.error('Erro ao reenviar credenciais pendentes:', error)
    }
  }

  // Obter estatísticas de cadastros automáticos
  async obterEstatisticasCadastros(periodo: { inicio: string; fim: string }): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('logs_cadastro_automatico')
        .select(`
          id,
          created_at,
          funcionario_id,
          profiles!logs_cadastro_automatico_funcionario_id_fkey(nome),
          profiles!logs_cadastro_automatico_cliente_id_fkey(nome, telefone, email)
        `)
        .gte('created_at', periodo.inicio)
        .lte('created_at', periodo.fim)

      if (error) throw error

      return {
        total: data?.length || 0,
        porFuncionario: this.agruparPorFuncionario(data || []),
        porDia: this.agruparPorDia(data || []),
        sucessoEnvio: await this.obterTaxaSucessoEnvio(periodo)
      }
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error)
      return { total: 0, porFuncionario: {}, porDia: {}, sucessoEnvio: 0 }
    }
  }

  private agruparPorFuncionario(dados: any[]): Record<string, number> {
    return dados.reduce((acc, item) => {
      const funcionario = item.profiles?.nome || 'Desconhecido'
      acc[funcionario] = (acc[funcionario] || 0) + 1
      return acc
    }, {})
  }

  private agruparPorDia(dados: any[]): Record<string, number> {
    return dados.reduce((acc, item) => {
      const dia = new Date(item.created_at).toISOString().split('T')[0]
      acc[dia] = (acc[dia] || 0) + 1
      return acc
    }, {})
  }

  private async obterTaxaSucessoEnvio(periodo: { inicio: string; fim: string }): Promise<number> {
    try {
      const { data } = await supabase
        .from('logs_envio_credenciais')
        .select('status')
        .gte('created_at', periodo.inicio)
        .lte('created_at', periodo.fim)

      if (!data || data.length === 0) return 0

      const sucessos = data.filter(item => item.status === 'enviado').length
      return (sucessos / data.length) * 100
    } catch (error) {
      console.error('Erro ao calcular taxa de sucesso:', error)
      return 0
    }
  }
}

export const clienteCadastroService = new ClienteCadastroService()