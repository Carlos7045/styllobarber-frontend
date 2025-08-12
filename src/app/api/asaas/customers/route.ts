import { NextRequest, NextResponse } from 'next/server'

// CORREÇÃO TEMPORÁRIA: Hardcode da API key para resolver o problema
const ASAAS_BASE_URL = 'https://sandbox.asaas.com/api/v3'
const ASAAS_API_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmFkYzI4MjQzLTAwYzYtNGJmNi1iZTYzLWFmODg1ZjYyYzAzYTo6JGFhY2hfZWQ4NGUwYmQtYzgwNC00ZDNhLWIzMTUtODY2OTlhYWY0MjNi'

// Debug das variáveis de ambiente (para investigação)
console.log('🔍 Debug das variáveis de ambiente:', {
  'process.env.ASAAS_API_KEY': process.env.ASAAS_API_KEY ? 'DEFINIDA' : 'UNDEFINED',
  'process.env.NEXT_PUBLIC_ASAAS_API_KEY': process.env.NEXT_PUBLIC_ASAAS_API_KEY ? 'DEFINIDA' : 'UNDEFINED',
  'allEnvKeys': Object.keys(process.env).filter(key => key.includes('ASAAS')),
  'usingHardcodedKey': true
})

console.log('🔧 API Route Customers - Config:', {
  baseUrl: ASAAS_BASE_URL,
  hasApiKey: !!ASAAS_API_KEY,
  apiKeyLength: ASAAS_API_KEY.length,
  apiKeyPreview: ASAAS_API_KEY ? `${ASAAS_API_KEY.substring(0, 15)}...` : 'VAZIA',
  apiKeyValid: ASAAS_API_KEY.startsWith('$aact_'),
  envVars: {
    ASAAS_API_KEY: !!process.env.ASAAS_API_KEY,
    NEXT_PUBLIC_ASAAS_API_KEY: !!process.env.NEXT_PUBLIC_ASAAS_API_KEY
  }
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🔄 API Route: Criando cliente no Asaas:', body)
    
    // Validar campos obrigatórios
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Nome e email são obrigatórios' },
        { status: 400 }
      )
    }

    // Função para formatar telefone brasileiro
    const formatPhoneForAsaas = (phone: string): string => {
      if (!phone) return ''
      
      // Remove todos os caracteres não numéricos
      const cleanPhone = phone.replace(/\D/g, '')
      
      // Se tem 11 dígitos (celular com 9), formatar como (XX) 9XXXX-XXXX
      if (cleanPhone.length === 11) {
        return `(${cleanPhone.substring(0, 2)}) ${cleanPhone.substring(2, 7)}-${cleanPhone.substring(7)}`
      }
      
      // Se tem 10 dígitos (fixo), formatar como (XX) XXXX-XXXX
      if (cleanPhone.length === 10) {
        return `(${cleanPhone.substring(0, 2)}) ${cleanPhone.substring(2, 6)}-${cleanPhone.substring(6)}`
      }
      
      // Se não tem formato padrão, retornar vazio para evitar erro
      return ''
    }

    // Formatar dados para API do Asaas
    const customerData = {
      name: body.name,
      email: body.email,
      phone: formatPhoneForAsaas(body.phone || body.mobilePhone || ''),
      mobilePhone: formatPhoneForAsaas(body.mobilePhone || body.phone || ''),
      cpfCnpj: body.cpfCnpj || '',
      postalCode: body.postalCode || '',
      address: body.address || '',
      addressNumber: body.addressNumber || '',
      complement: body.complement || '',
      province: body.province || '',
      city: body.city || '',
      state: body.state || '',
      country: body.country || 'Brasil',
      observations: body.observations || ''
    }

    console.log('📤 Dados formatados para Asaas:', customerData)
    
    const response = await fetch(`${ASAAS_BASE_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY,
        'User-Agent': 'StylloBarber/1.0'
      },
      body: JSON.stringify(customerData),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
      console.error('❌ Erro ao criar cliente:', {
        status: response.status,
        statusText: response.statusText,
        error: error,
        url: `${ASAAS_BASE_URL}/customers`,
        hasApiKey: !!ASAAS_API_KEY,
        sentData: customerData
      })
      
      // Log detalhado dos erros específicos
      if (error.errors && Array.isArray(error.errors)) {
        console.error('🔍 Erros específicos da API Asaas:')
        error.errors.forEach((err, index) => {
          console.error(`  ${index + 1}. ${err.code}: ${err.description}`)
        })
      }
      
      return NextResponse.json({ 
        error: error.message || error.description || 'Erro ao criar cliente',
        details: error,
        specificErrors: error.errors || []
      }, { status: response.status })
    }

    const data = await response.json()
    console.log('✅ Cliente criado com sucesso:', data.id)
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Erro na API route de clientes:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }
    
    console.log('🔍 API Route: Buscando cliente por email:', email)
    
    const response = await fetch(`${ASAAS_BASE_URL}/customers?email=${email}`, {
      headers: {
        'access_token': ASAAS_API_KEY,
        'User-Agent': 'StylloBarber/1.0'
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
      console.error('❌ Erro ao buscar cliente:', error)
      return NextResponse.json({ error: error.message }, { status: response.status })
    }

    const data = await response.json()
    console.log('✅ Busca de cliente concluída:', data.data?.length || 0, 'encontrados')
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Erro na API route de busca de clientes:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}