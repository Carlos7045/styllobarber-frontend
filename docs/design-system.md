# StylloBarber - Design System

## 📋 Visão Geral

Este documento define o sistema de design do StylloBarber, garantindo consistência visual e experiência de usuário em toda a aplicação. Siga rigorosamente estes padrões para manter a identidade visual premium e masculina da marca.

**Tagline:** "Mais cortes, menos complicação"

---

## 🎨 Paleta de Cores

### Cores Primárias

```css
/* Dourado - Cor principal da marca */
--primary-gold: #d4af37 --primary-gold-light: #e6c757 --primary-gold-dark: #b8941f
  /* Preto - Cor de contraste */ --primary-black: #000000;
```

### Cores Secundárias

```css
/* Grafite - Tons escuros elegantes */
--secondary-graphite: #1f1f1f --secondary-graphite-light: #2a2a2a --secondary-graphite-dark: #0f0f0f
  --secondary-graphite-card: #252525 --secondary-graphite-hover: #2f2f2f
  /* Petróleo - Tons azul-esverdeados */ --secondary-petrol: #1b4d4d
  --secondary-petrol-light: #2a6b6b --secondary-petrol-dark: #0f3333;
```

### Cores de Estado (Semânticas)

```css
/* Sucesso */
--success: #10b981 --success-light: #34d399 --success-dark: #059669 /* Aviso */ --warning: #f59e0b
  --warning-light: #fbbf24 --warning-dark: #d97706 /* Erro */ --error: #ef4444
  --error-light: #f87171 --error-dark: #dc2626 /* Informação */ --info: #3b82f6
  --info-light: #60a5fa --info-dark: #2563eb;
```

### Cores para Cards de Métricas

**Sequência padrão para cards de estatísticas:**

1. **Âmbar** - `text-amber-600` + `bg-amber-50`
2. **Verde** - `text-green-600` + `bg-green-50`
3. **Azul** - `text-blue-600` + `bg-blue-50`
4. **Roxo** - `text-purple-600` + `bg-purple-50`
5. **Laranja** - `text-orange-600` + `bg-orange-50`
6. **Esmeralda** - `text-emerald-600` + `bg-emerald-50`
7. **Índigo** - `text-indigo-600` + `bg-indigo-50`
8. **Rosa** - `text-pink-600` + `bg-pink-50`

---

## 🔤 Tipografia

### Famílias de Fonte

```css
/* Títulos e Headings */
font-family: 'Montserrat', sans-serif;

/* Texto do corpo */
font-family: 'Inter', sans-serif;

/* Interface e botões */
font-family: 'Poppins', sans-serif;

/* Display (títulos grandes) */
font-family: 'Bebas Neue', sans-serif;
```

### Hierarquia Tipográfica

```css
/* Títulos de página */
.page-title {
  font-size: 2.25rem; /* 36px */
  font-weight: 700;
  font-family: 'Montserrat';
}

/* Subtítulos */
.page-subtitle {
  font-size: 1.125rem; /* 18px */
  font-weight: 500;
  color: #6b7280;
}

/* Títulos de seção */
.section-title {
  font-size: 1.5rem; /* 24px */
  font-weight: 600;
}

/* Texto do corpo */
.body-text {
  font-size: 1rem; /* 16px */
  font-weight: 400;
  line-height: 1.5;
}
```

---

## 📦 Componentes

### Cards de Métricas/Estatísticas

**Estrutura padrão:**

```tsx
<Card className="transition-shadow hover:shadow-md">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
    <div className={`rounded-full p-2 ${bgColorClass}`}>
      <Icon className={`h-4 w-4 ${colorClass}`} />
    </div>
  </CardHeader>
  <CardContent>
    <div className="mb-1 text-2xl font-bold">{value}</div>
    <p className="text-xs text-muted-foreground">{subtitle}</p>
  </CardContent>
</Card>
```

**Classes CSS:**

- Container: `hover:shadow-md transition-shadow`
- Header: `flex flex-row items-center justify-between space-y-0 pb-2`
- Título: `text-sm font-medium text-muted-foreground`
- Ícone container: `p-2 rounded-full bg-{color}-50`
- Ícone: `h-4 w-4 text-{color}-600`
- Valor: `text-2xl font-bold mb-1`
- Subtítulo: `text-xs text-muted-foreground`

### Cards de Dashboard (Estilo Alternativo)

**Para cards principais do dashboard:**

```tsx
<div className="border-l-{color}-500 rounded-lg border-l-4 bg-gradient-to-br from-white to-gray-50 p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl dark:from-secondary-graphite-light dark:to-secondary-graphite">
  <div className="flex items-center justify-between">
    <div className="flex-1">
      <div className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">{title}</div>
      <div className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</div>
    </div>
    <div className="bg-{color}-100 dark:bg-{color}-900/30 rounded-xl p-4">
      <Icon className="text-{color}-600 text-2xl" />
    </div>
  </div>
</div>
```

### Headers de Página

**Estrutura padrão:**

```tsx
<div className="mb-8">
  <div className="mb-6 flex items-center justify-between">
    <div className="flex items-center space-x-4">
      <div className="rounded-2xl bg-gradient-to-br from-primary-gold to-primary-gold-dark p-4 shadow-xl">
        <Icon className="h-10 w-10 text-primary-black" />
      </div>
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{title}</h1>
        <p className="text-lg font-medium text-gray-600 dark:text-gray-300">{subtitle}</p>
      </div>
    </div>

    {/* Ações do header */}
    <div className="flex items-center gap-3">{actions}</div>
  </div>

  {/* Linha decorativa */}
  <div className="mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-primary-gold to-primary-gold-dark"></div>
</div>
```

### Botões

**Botão Primário (Dourado):**

```tsx
<Button className="bg-primary-gold text-primary-black hover:bg-primary-gold-dark">
  <Icon className="mr-2 h-4 w-4" />
  {text}
</Button>
```

**Botão Secundário (Outline):**

```tsx
<Button
  variant="outline"
  className="border-primary-gold text-primary-gold hover:bg-primary-gold/10"
>
  <Icon className="mr-2 h-4 w-4" />
  {text}
</Button>
```

**Botão de Ação (Colorido):**

```tsx
<Button variant="ghost" size="sm" className="text-{color} hover:text-{color}">
  <Icon className="h-4 w-4" />
</Button>
```

---

## 🎭 Ícones

### Biblioteca Padrão

**Lucide React** - Ícones consistentes e modernos

### Ícones por Contexto

**Serviços:**

- `Scissors` - Ícone principal de serviços
- `DollarSign` - Preços e receita
- `Clock` - Duração e tempo
- `BarChart3` - Estatísticas
- `Users` - Agendamentos/clientes

**Navegação:**

- `Plus` - Adicionar/criar
- `Edit` - Editar
- `Trash2` - Excluir
- `Eye` / `EyeOff` - Mostrar/ocultar
- `Filter` - Filtros
- `History` - Histórico

**Estados:**

- `Check` - Sucesso/confirmação
- `X` - Cancelar/fechar
- `AlertTriangle` - Aviso
- `AlertCircle` - Erro
- `Info` - Informação

### Tamanhos de Ícones

```css
/* Ícones pequenos (botões, inline) */
.icon-sm {
  width: 1rem;
  height: 1rem;
} /* h-4 w-4 */

/* Ícones médios (cards, formulários) */
.icon-md {
  width: 1.25rem;
  height: 1.25rem;
} /* h-5 w-5 */

/* Ícones grandes (headers) */
.icon-lg {
  width: 2.5rem;
  height: 2.5rem;
} /* h-10 w-10 */
```

---

## 🎨 Efeitos e Animações

### Transições Padrão

```css
/* Hover suave */
.transition-hover {
  transition: all 0.2s ease-in-out;
}

/* Hover com escala */
.hover-scale:hover {
  transform: scale(1.05);
}

/* Sombra no hover */
.hover-shadow:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
```

### Animações de Loading

```tsx
/* Skeleton loading */
<div className="h-8 animate-pulse rounded bg-gray-200 dark:bg-secondary-graphite" />

/* Spinner */
<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-gold" />
```

### Gradientes

```css
/* Gradiente dourado */
.gradient-gold {
  background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%);
}

/* Gradiente de card */
.gradient-card {
  background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%);
}

/* Gradiente escuro */
.gradient-dark {
  background: linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%);
}
```

---

## 📱 Layout e Responsividade

### Grid System

```css
/* Cards de métricas */
.metrics-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 768px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .metrics-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

### Container Padrão

```tsx
<Container className="py-8">
  <div className="mx-auto max-w-7xl">{/* Conteúdo */}</div>
</Container>
```

### Espaçamentos

```css
/* Espaçamento entre seções */
.section-spacing {
  margin-bottom: 2rem;
} /* mb-8 */

/* Espaçamento entre cards */
.card-spacing {
  gap: 1rem;
} /* gap-4 */

/* Espaçamento interno de cards */
.card-padding {
  padding: 1.5rem;
} /* p-6 */
```

---

## 🌙 Modo Escuro

### Classes de Tema

```css
/* Backgrounds */
.bg-primary {
  @apply bg-white dark:bg-secondary-graphite;
}
.bg-secondary {
  @apply bg-gray-50 dark:bg-secondary-graphite-light;
}
.bg-card {
  @apply bg-white dark:bg-secondary-graphite-card;
}

/* Textos */
.text-primary {
  @apply text-gray-900 dark:text-white;
}
.text-secondary {
  @apply text-gray-600 dark:text-gray-300;
}
.text-muted {
  @apply text-gray-500 dark:text-gray-400;
}

/* Bordas */
.border-default {
  @apply border-gray-200 dark:border-secondary-graphite-card/50;
}
```

---

## ✅ Checklist de Implementação

### Para cada nova página/componente:

**Layout:**

- [ ] Header com ícone dourado e título
- [ ] Linha decorativa dourada
- [ ] Container responsivo (`max-w-7xl`)
- [ ] Espaçamento consistente (`py-8`, `mb-8`)

**Cards de Métricas:**

- [ ] Usar estrutura padrão de CardHeader/CardContent
- [ ] Seguir sequência de cores (âmbar, verde, azul, roxo...)
- [ ] Ícones de 4x4 (`h-4 w-4`)
- [ ] Hover suave (`hover:shadow-md transition-shadow`)

**Botões:**

- [ ] Primário: dourado com texto preto
- [ ] Secundário: outline dourado
- [ ] Ícones de 4x4 com margem (`mr-2 h-4 w-4`)

**Tipografia:**

- [ ] Títulos: `text-4xl font-bold`
- [ ] Subtítulos: `text-lg font-medium text-gray-600`
- [ ] Texto muted: `text-muted-foreground`

**Responsividade:**

- [ ] Grid responsivo (1 col → 2 cols → 4 cols)
- [ ] Espaçamentos adaptativos
- [ ] Teste em mobile, tablet e desktop

**Modo Escuro:**

- [ ] Todas as cores têm variante dark
- [ ] Backgrounds e textos adaptáveis
- [ ] Contraste adequado

---

## 🎯 Exemplos de Uso

### Card de Métrica Completo

```tsx
const MetricCard = ({ title, value, subtitle, icon: Icon, colorClass, bgColorClass }) => (
  <Card className="transition-shadow hover:shadow-md">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className={`rounded-full p-2 ${bgColorClass}`}>
        <Icon className={`h-4 w-4 ${colorClass}`} />
      </div>
    </CardHeader>
    <CardContent>
      <div className="mb-1 text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </CardContent>
  </Card>
)
```

### Header de Página Completo

```tsx
const PageHeader = ({ title, subtitle, icon: Icon, actions }) => (
  <div className="mb-8">
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="rounded-2xl bg-gradient-to-br from-primary-gold to-primary-gold-dark p-4 shadow-xl">
          <Icon className="h-10 w-10 text-primary-black" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-300">{subtitle}</p>
        </div>
      </div>

      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>

    <div className="mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-primary-gold to-primary-gold-dark"></div>
  </div>
)
```

---

**🎨 Mantenha sempre a consistência visual e a identidade premium do StylloBarber!**
