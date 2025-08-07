import Link from 'next/link'
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@/shared/components/ui'
import { Container, Section, Grid, Header, HeaderContent, HeaderLogo } from '@/shared/components/layout'
import { BarChart3, Calendar, Users } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-black via-secondary-graphite to-primary-black">
      {/* Header */}
      <Header variant="transparent" className="border-none">
        <HeaderContent>
          <HeaderLogo>
            <span className="heading-display text-2xl">STYLLOBARBER</span>
          </HeaderLogo>
          <div className="flex items-center gap-4">
            <Badge variant="success">Em Desenvolvimento</Badge>
            <Button variant="outline" size="sm">
              Documentação
            </Button>
          </div>
        </HeaderContent>
      </Header>

      {/* Hero Section */}
      <Section spacing="xl" background="transparent">
        <Container>
          <div className="text-center">
            {/* Logo/Título */}
            <h1 className="heading-display text-6xl md:text-8xl text-primary-gold mb-4 animate-fade-in">
              STYLLOBARBER
            </h1>
            
            {/* Slogan */}
            <p className="text-xl md:text-2xl text-neutral-white mb-8 text-interface animate-fade-in-up">
              Mais cortes, menos complicação
            </p>
            
            {/* Descrição */}
            <div className="max-w-2xl mx-auto mb-12">
              <p className="text-neutral-medium-gray text-lg leading-relaxed animate-fade-in-up">
                Sistema premium de gestão para barbearias. Agendamento inteligente, 
                gestão de clientes e análises de negócio em uma plataforma moderna e elegante.
              </p>
            </div>
            
            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/login">
                <Button size="lg" className="animate-scale-in">
                  Começar Agora
                </Button>
              </Link>
              <Link href="/cadastro">
                <Button variant="outline" size="lg" className="animate-scale-in">
                  Ver Demo
                </Button>
              </Link>
            </div>

            {/* Setup SaaS Owner */}
            <div className="mb-8">
              <Link href="/setup-saas">
                <Button variant="outline" size="sm" className="text-amber-400 border-amber-400 hover:bg-amber-400 hover:text-black">
                  🔧 Setup SaaS Owner
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      {/* Features Section */}
      <Section spacing="lg" background="transparent">
        <Container>
          <Grid cols={3} gap="lg" className="max-w-4xl mx-auto">
            <Card 
              variant="dark" 
              hover="glow" 
              className="animate-fade-in-up border-primary-gold/20 hover:border-primary-gold/40"
            >
              <CardHeader>
                <div className="w-12 h-12 bg-primary-gold rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-primary-black" />
                </div>
                <CardTitle className="text-primary-gold">Agendamento Inteligente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-medium-gray">
                  Calendário drag-and-drop com disponibilidade em tempo real
                </p>
              </CardContent>
            </Card>
            
            <Card 
              variant="dark" 
              hover="glow" 
              className="animate-fade-in-up border-primary-gold/20 hover:border-primary-gold/40"
            >
              <CardHeader>
                <div className="w-12 h-12 bg-primary-gold rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary-black" />
                </div>
                <CardTitle className="text-primary-gold">Gestão de Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-medium-gray">
                  CRM completo com histórico e programa de fidelidade
                </p>
              </CardContent>
            </Card>
            
            <Card 
              variant="dark" 
              hover="glow" 
              className="animate-fade-in-up border-primary-gold/20 hover:border-primary-gold/40"
            >
              <CardHeader>
                <div className="w-12 h-12 bg-primary-gold rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-primary-black" />
                </div>
                <CardTitle className="text-primary-gold">Dashboard Financeiro</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-medium-gray">
                  Análises de receita, comissões e métricas de negócio
                </p>
              </CardContent>
            </Card>
          </Grid>
        </Container>
      </Section>

      {/* Status Section */}
      <Section spacing="lg" background="transparent">
        <Container>
          <Card 
            variant="dark" 
            size="lg" 
            className="max-w-2xl mx-auto border-primary-gold/30 animate-scale-in"
          >
            <CardHeader>
              <CardTitle className="text-primary-gold text-center text-2xl">
                Status do Desenvolvimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge variant="success" size="sm">✅</Badge>
                  <span className="text-neutral-white">Configuração inicial do projeto</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="success" size="sm">✅</Badge>
                  <span className="text-neutral-white">Sistema de design e componentes base</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="success" size="sm">✅</Badge>
                  <span className="text-neutral-white">Sistema de layout responsivo</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="success" size="sm">✅</Badge>
                  <span className="text-neutral-white">Sistema de autenticação e navegação</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="warning" size="sm">🔄</Badge>
                  <span className="text-neutral-medium-gray">Módulo de agendamentos (próximo)</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" size="sm">⏳</Badge>
                  <span className="text-neutral-medium-gray">Gestão de clientes (CRM)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Container>
      </Section>
    </div>
  );
}
