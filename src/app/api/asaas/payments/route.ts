import { NextRequest, NextResponse } from 'next/server'

// CORREÇÃO TEMPORÁRIA: Hardcode da API key para resolver o problema
const ASAAS_BASE_URL = 'https://sandbox.asaas.com/api/v3'
const ASAAS_API_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmFkYzI4MjQzLTAwYzYtNGJmNi1iZTYzLWFmODg1ZjYyYzAzYTo6JGFhY2hfZWQ4NGUwYmQtYzgwNC00ZDNhLWIzMTUtODY2OTlhYWY0MjNi'

console.log('🔧 API Route Payments - Config:', {
  baseUrl: ASAAS_BASE_URL,
  hasApiKey: !!ASAAS_API_KEY,
  apiKeyLength: ASAAS_API_KEY.length,
  apiKeyPreview: ASAAS_API_KEY ? `${ASAAS_API_KEY.substring(0, 15)}...` : 'VAZIA',
  usingHardcodedKey: true
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('🔄 API Route: Criando cobrança no Asaas:', {
      customer: body.customer,
      billingType: body.billingType,
      value: body.value,
      url: `${ASAAS_BASE_URL}/payments`,
      hasApiKey: !!ASAAS_API_KEY,
      apiKeyLength: ASAAS_API_KEY.length
    })

    // Validar campos obrigatórios
    if (!body.customer || !body.billingType || !body.value) {
      return NextResponse.json(
        { error: 'Customer, billingType e value são obrigatórios' },
        { status: 400 }
      )
    }

    // Formatar dados para API do Asaas
    const paymentData: Record<string, any> = {
      customer: body.customer,
      billingType: body.billingType,
      value: parseFloat(body.value),
      dueDate: body.dueDate || new Date().toISOString().split('T')[0], // Hoje se não especificado
      description: body.description || 'Pagamento de serviço',
      externalReference: body.externalReference || '',
      installmentCount: body.installmentCount || undefined,
      installmentValue: body.installmentValue || undefined,
      discount: body.discount || undefined,
      interest: body.interest || undefined,
      fine: body.fine || undefined,
      postalService: body.postalService || false
    }

    // Remover campos undefined
    Object.keys(paymentData).forEach(key => {
      if (paymentData[key] === undefined) {
        delete paymentData[key]
      }
    })

    console.log('📤 Dados formatados para Asaas:', paymentData)

    const response = await fetch(`${ASAAS_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY,
        'User-Agent': 'StylloBarber/1.0'
      },
      body: JSON.stringify(paymentData),
    })

    console.log('📊 Resposta da API Asaas:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
      console.error('❌ Erro ao criar cobrança:', {
        status: response.status,
        statusText: response.statusText,
        error: error,
        url: `${ASAAS_BASE_URL}/payments`,
        hasApiKey: !!ASAAS_API_KEY,
        sentData: paymentData
      })
      
      // Log detalhado dos erros específicos
      if (error.errors && Array.isArray(error.errors)) {
        console.error('🔍 Erros específicos da API Asaas (Payments):')
        error.errors.forEach((err: any, index: number) => {
          console.error(`  ${index + 1}. ${err.code}: ${err.description}`)
        })
      }
      
      return NextResponse.json({
        error: error.message || error.description || 'Erro ao criar cobrança',
        details: error,
        specificErrors: error.errors || []
      }, { status: response.status })
    }

    const data = await response.json()
    console.log('✅ Cobrança criada com sucesso:', {
      id: data.id,
      status: data.status,
      billingType: data.billingType,
      hasPix: !!data.pixTransaction
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Erro na API route de pagamentos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('id')

    if (!paymentId) {
      return NextResponse.json({ error: 'ID do pagamento é obrigatório' }, { status: 400 })
    }

    console.log('🔍 API Route: Buscando pagamento:', paymentId)

    const response = await fetch(`${ASAAS_BASE_URL}/payments/${paymentId}`, {
      headers: {
        'access_token': ASAAS_API_KEY,
        'User-Agent': 'StylloBarber/1.0'
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
      console.error('❌ Erro ao buscar pagamento:', error)
      return NextResponse.json({ error: error.message }, { status: response.status })
    }

    const data = await response.json()
    console.log('✅ Pagamento encontrado:', {
      id: data.id,
      status: data.status,
      value: data.value
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Erro na API route de busca de pagamento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}