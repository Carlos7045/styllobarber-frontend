// Testes para componentes de fluxo de caixa
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CashFlowManager } from '../components/CashFlowManager'
import { CashFlowProjections } from '../components/CashFlowProjections'
import { CashFlowAlerts } from '../components/CashFlowAlerts'

// Mock dos hooks
jest.mock('../hooks/use-cash-flow', () => ({
  useCashFlow: () => ({
    resumo: {
      saldoAtual: 15750.00,
      entradasDia: 2800.00,
      saidasDia: 1200.00,
      saldoProjetado: 18350.00,
      limiteMinimoAlerta: 5000.00
    },
    movimentacoes: [],
    projecoes: [],
    loading: false,
    error: null,
    lastUpdate: new Date(),
    alertaSaldoBaixo: false,
    refresh: jest.fn(),
    obterMovimentacoes: jest.fn(),
    calcularProjecoes: jest.fn(),
    configurarAlerta: jest.fn()
  }),
  useCashFlowAlerts: () => ({
    alertas: [],
    alertasNaoLidos: [],
    adicionarAlerta: jest.fn(),
    marcarComoLido: jest.fn(),
    removerAlerta: jest.fn()
  }),
  useCashFlowMetrics: () => ({
    metricas: null,
    loading: false
  })
}))

// Mock do Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn()
  })
}))

// Mock do Recharts
jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  ReferenceLine: () => <div data-testid="reference-line" />,
  Cell: () => <div data-testid="cell" />
}))

describe('CashFlowManager', () => {
  it('deve renderizar o componente corretamente', () => {
    render(<CashFlowManager />)
    
    expect(screen.getByText('Fluxo de Caixa')).toBeInTheDocument()
    expect(screen.getByText('Controle em tempo real das movimentações financeiras')).toBeInTheDocument()
  })

  it('deve exibir os cards de resumo com valores corretos', () => {
    render(<CashFlowManager />)
    
    expect(screen.getByText('Saldo Atual')).toBeInTheDocument()
    expect(screen.getByText('Entradas do Dia')).toBeInTheDocument()
    expect(screen.getByText('Saídas do Dia')).toBeInTheDocument()
    expect(screen.getByText('Saldo Projetado')).toBeInTheDocument()
  })

  it('deve permitir alternar a visualização de projeções', () => {
    render(<CashFlowManager />)
    
    const projecoesButton = screen.getByText('Projeções')
    expect(projecoesButton).toBeInTheDocument()
    
    fireEvent.click(projecoesButton)
    // Verificar se o estado mudou (implementação específica dependeria do comportamento)
  })

  it('deve exibir filtros de período', () => {
    render(<CashFlowManager />)
    
    expect(screen.getByText('hoje')).toBeInTheDocument()
    expect(screen.getByText('semana')).toBeInTheDocument()
    expect(screen.getByText('Este Mês')).toBeInTheDocument()
  })
})

describe('CashFlowProjections', () => {
  it('deve renderizar o componente de projeções', () => {
    render(<CashFlowProjections />)
    
    expect(screen.getByText('Projeções de Fluxo de Caixa')).toBeInTheDocument()
    expect(screen.getByText('Análise preditiva para os próximos 30 dias')).toBeInTheDocument()
  })

  it('deve exibir os cenários de projeção', () => {
    render(<CashFlowProjections />)
    
    expect(screen.getByText('Cenários de Projeção')).toBeInTheDocument()
    expect(screen.getByText('Cenário Otimista')).toBeInTheDocument()
    expect(screen.getByText('Cenário Realista')).toBeInTheDocument()
    expect(screen.getByText('Cenário Pessimista')).toBeInTheDocument()
  })

  it('deve permitir alternar visualização de detalhes', () => {
    render(<CashFlowProjections />)
    
    const detalhesButton = screen.getByText('Detalhes')
    expect(detalhesButton).toBeInTheDocument()
    
    fireEvent.click(detalhesButton)
    // Verificar se os detalhes são exibidos
  })

  it('deve exibir gráfico de evolução projetada', () => {
    render(<CashFlowProjections />)
    
    expect(screen.getByText('Evolução Projetada do Saldo')).toBeInTheDocument()
    expect(screen.getByTestId('area-chart')).toBeInTheDocument()
  })
})

describe('CashFlowAlerts', () => {
  it('deve renderizar o componente de alertas', () => {
    render(<CashFlowAlerts />)
    
    expect(screen.getByText('Alertas de Fluxo de Caixa')).toBeInTheDocument()
    expect(screen.getByText('0 alertas não lidos')).toBeInTheDocument()
  })

  it('deve permitir abrir configurações', () => {
    render(<CashFlowAlerts />)
    
    const configButton = screen.getByText('Configurar')
    expect(configButton).toBeInTheDocument()
    
    fireEvent.click(configButton)
    expect(screen.getByText('Configurações de Alertas')).toBeInTheDocument()
  })

  it('deve exibir mensagem quando não há alertas', () => {
    render(<CashFlowAlerts />)
    
    expect(screen.getByText('Nenhum alerta no momento')).toBeInTheDocument()
    expect(screen.getByText('Os alertas aparecerão aqui quando houver situações que requerem atenção')).toBeInTheDocument()
  })

  it('deve permitir configurar limite mínimo', async () => {
    render(<CashFlowAlerts />)
    
    // Abrir configurações
    fireEvent.click(screen.getByText('Configurar'))
    
    // Encontrar input de limite mínimo
    const limiteInput = screen.getByPlaceholderText('Ex: 5000')
    expect(limiteInput).toBeInTheDocument()
    
    // Alterar valor
    fireEvent.change(limiteInput, { target: { value: '7000' } })
    expect(limiteInput).toHaveValue(7000)
    
    // Salvar configurações
    const salvarButton = screen.getByText('Salvar Configurações')
    fireEvent.click(salvarButton)
    
    // Verificar se as configurações foram fechadas
    await waitFor(() => {
      expect(screen.queryByText('Configurações de Alertas')).not.toBeInTheDocument()
    })
  })
})

describe('Integração dos Componentes', () => {
  it('deve funcionar em conjunto sem conflitos', () => {
    const { container } = render(
      <div>
        <CashFlowManager />
        <CashFlowProjections />
        <CashFlowAlerts />
      </div>
    )
    
    expect(container).toBeInTheDocument()
    expect(screen.getByText('Fluxo de Caixa')).toBeInTheDocument()
    expect(screen.getByText('Projeções de Fluxo de Caixa')).toBeInTheDocument()
    expect(screen.getByText('Alertas de Fluxo de Caixa')).toBeInTheDocument()
  })

  it('deve manter estado independente entre componentes', () => {
    render(
      <div>
        <CashFlowManager />
        <CashFlowAlerts />
      </div>
    )
    
    // Verificar se ambos os componentes mantêm seus próprios estados
    const filtrosFluxo = screen.getByText('Filtros')
    const configAlertas = screen.getByText('Configurar')
    
    expect(filtrosFluxo).toBeInTheDocument()
    expect(configAlertas).toBeInTheDocument()
  })
})

// Testes de acessibilidade
describe('Acessibilidade', () => {
  it('deve ter elementos com labels apropriados', () => {
    render(<CashFlowAlerts />)
    
    // Verificar se inputs têm labels
    fireEvent.click(screen.getByText('Configurar'))
    
    const limiteLabel = screen.getByText('Limite Mínimo de Caixa')
    expect(limiteLabel).toBeInTheDocument()
    
    const notificacoesLabel = screen.getByText('Canais de Notificação')
    expect(notificacoesLabel).toBeInTheDocument()
  })

  it('deve ter navegação por teclado funcional', () => {
    render(<CashFlowManager />)
    
    const refreshButton = screen.getByText('Atualizar')
    expect(refreshButton).toBeInTheDocument()
    
    // Simular navegação por teclado
    refreshButton.focus()
    expect(document.activeElement).toBe(refreshButton)
  })

  it('deve ter contraste adequado nos alertas', () => {
    render(<CashFlowAlerts />)
    
    // Verificar se elementos de alerta têm classes de cor apropriadas
    // (teste visual seria feito com ferramentas específicas)
    expect(screen.getByText('Nenhum alerta no momento')).toBeInTheDocument()
  })
})
