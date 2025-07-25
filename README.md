# 💈 StylloBarber

> **Mais cortes, menos complicação**

Sistema premium de gestão para barbearias desenvolvido com Next.js 14, TypeScript e Supabase.

![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green?style=for-the-badge&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)

## ✨ Funcionalidades

### 🔐 **Sistema de Autenticação**
- Login/logout seguro com Supabase Auth
- Cadastro de usuários com validação
- Proteção de rotas por permissões (Admin, Barbeiro, Cliente)
- Middleware de autenticação robusto

### 📅 **Módulo de Agendamentos**
- Calendário interativo com visualizações (Dia/Semana/Mês)
- Sistema de filtros avançados
- Estatísticas em tempo real
- Gestão de status de agendamentos

### 👥 **Gestão de Usuários**
- Perfis de usuário com roles diferenciados
- Sistema de permissões granulares
- Interface adaptativa por tipo de usuário

### 🎨 **Design System**
- Interface moderna e responsiva
- Tema escuro com identidade visual masculina
- Componentes reutilizáveis com Tailwind CSS
- Animações suaves com Framer Motion

## 🚀 Tecnologias

### **Frontend**
- **Next.js 14+** - Framework React com App Router
- **TypeScript** - Type safety e melhor DX
- **Tailwind CSS** - Estilização utility-first
- **Framer Motion** - Animações e microinterações
- **Radix UI** - Componentes primitivos acessíveis
- **React Hook Form + Zod** - Formulários e validação

### **Backend & Database**
- **Supabase** - Backend-as-a-Service
  - PostgreSQL com Row Level Security (RLS)
  - Autenticação e gerenciamento de usuários
  - Realtime subscriptions
  - Storage para arquivos

### **Ferramentas de Desenvolvimento**
- **ESLint + Prettier** - Linting e formatação
- **date-fns** - Manipulação de datas
- **Lucide React** - Iconografia consistente

## 📦 Instalação

### **Pré-requisitos**
- Node.js 18+ 
- npm ou yarn
- Conta no Supabase

### **1. Clone o repositório**
```bash
git clone https://github.com/Carlos7045/styllobarber-frontend.git
cd styllobarber-frontend
```

### **2. Instale as dependências**
```bash
npm install
```

### **3. Configure as variáveis de ambiente**
```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` com suas credenciais do Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_supabase
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_LOCALE=pt-BR
```

### **4. Execute o projeto**
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

## 🗄️ Estrutura do Banco de Dados

### **Tabelas Principais**
- `profiles` - Perfis de usuário com roles
- `services` - Serviços oferecidos pela barbearia
- `appointments` - Agendamentos com status e relacionamentos

### **Configuração do Supabase**
O projeto inclui migrações SQL para configurar:
- Row Level Security (RLS)
- Triggers para criação automática de perfis
- Políticas de acesso por role
- Dados de exemplo

## 🎯 Roadmap

### ✅ **Concluído**
- [x] Sistema de autenticação
- [x] Proteção de rotas
- [x] Calendário base com filtros
- [x] Interface responsiva
- [x] Integração com Supabase

### 🔄 **Em Desenvolvimento**
- [ ] Drag & drop no calendário
- [ ] Sistema de bloqueio de horários
- [ ] Formulário público de agendamento

### 📋 **Planejado**
- [ ] Gestão de clientes (CRM)
- [ ] Sistema financeiro
- [ ] Relatórios e analytics
- [ ] PWA para clientes
- [ ] Sistema de notificações

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Carlos Henrique Pereira Salgado**
- GitHub: [@Carlos7045](https://github.com/Carlos7045)
- Email: salgadocarloshenrique@gmail.com

## 🙏 Agradecimentos

- [Next.js](https://nextjs.org/) pela excelente framework
- [Supabase](https://supabase.com/) pelo backend robusto
- [Tailwind CSS](https://tailwindcss.com/) pelo sistema de design
- [Radix UI](https://www.radix-ui.com/) pelos componentes acessíveis

---

<div align="center">
  <strong>StylloBarber - Mais cortes, menos complicação 💈</strong>
</div>