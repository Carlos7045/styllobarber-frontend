# Scripts de Otimização - StylloBarber

Este diretório contém scripts para análise e otimização de performance do projeto StylloBarber.

## 📋 Scripts Disponíveis

### 🚀 Script Principal

#### `optimize-all.js`
**Comando:** `npm run optimize-all`

Script principal que executa todas as otimizações em sequência:
1. Análise do bundle atual
2. Otimização de imagens
3. Análise de dependências
4. Otimização do webpack
5. Análise final e comparação
6. Geração de relatório consolidado

**Uso:**
```bash
npm run optimize-all
```

### 📊 Scripts de Análise

#### `analyze-bundle.js`
**Comando:** `npm run analyze-bundle`

Analisa o bundle do Next.js e identifica:
- Tamanho dos chunks
- Páginas mais pesadas
- Dependências que impactam o bundle
- Oportunidades de otimização

**Uso:**
```bash
npm run analyze-bundle
# ou após build
npm run build:analyze
```

#### `analyze-dependencies.js`
**Comando:** `npm run analyze-dependencies`

Analisa as dependências do projeto:
- Dependências não utilizadas
- Dependências duplicadas
- Dependências pesadas (>500KB)
- Oportunidades de substituição

**Uso:**
```bash
npm run analyze-dependencies
```

### 🖼️ Scripts de Otimização

#### `optimize-images.js`
**Comando:** `npm run optimize-images`

Otimiza imagens do projeto:
- Compressão de JPEG/PNG
- Geração de formatos modernos (WebP, AVIF)
- Análise de economia de espaço
- Recomendações de uso

**Uso:**
```bash
npm run optimize-images
```

**Dependências:** Instala automaticamente `sharp` se necessário.

#### `optimize-webpack.js`
**Comando:** `npm run optimize-webpack`

Otimiza configurações do webpack/Next.js:
- Bundle splitting otimizado
- Configurações de imagem avançadas
- Tree shaking melhorado
- Headers de cache e compressão

**Uso:**
```bash
npm run optimize-webpack
```

#### `optimize-tailwind.js`
**Comando:** `npm run optimize-tailwind`

Analisa e otimiza uso do Tailwind CSS:
- Classes utilizadas vs não utilizadas
- Padrões de uso de cores e espaçamento
- Configuração otimizada sugerida
- Classes customizadas desnecessárias

**Uso:**
```bash
npm run optimize-tailwind
```

## 📄 Relatórios Gerados

Cada script gera relatórios detalhados em JSON:

- `optimization-report.json` - Relatório consolidado
- `bundle-analysis-report.json` - Análise do bundle
- `image-optimization-report.json` - Otimização de imagens
- `dependency-analysis-report.json` - Análise de dependências
- `tailwind-optimization-report.json` - Análise do Tailwind

## 🔧 Configurações Aplicadas

### Next.js Config
Os scripts podem modificar `next.config.ts` com:
- Bundle splitting otimizado
- Configurações de imagem avançadas
- Headers de performance
- Configurações experimentais

### Webpack Config
Gera `webpack.config.js` adicional com:
- Otimizações de tree shaking
- Configurações de performance
- Aliases de resolução

## 📊 Métricas Monitoradas

### Bundle Size
- Tamanho total do bundle
- Tamanho por chunk
- Tamanho por página
- Dependências mais pesadas

### Imagens
- Economia de espaço (KB/MB)
- Formatos gerados
- Imagens otimizadas vs total
- Recomendações de lazy loading

### Dependências
- Total vs utilizadas
- Dependências não utilizadas
- Duplicações
- Oportunidades de substituição

### Performance
- Tempo de build
- Métricas de otimização
- Comparações antes/depois

## 🎯 Recomendações de Uso

### Desenvolvimento Diário
```bash
# Análise rápida do bundle
npm run analyze-bundle

# Análise de dependências
npm run analyze-dependencies
```

### Otimização Semanal
```bash
# Otimização de imagens
npm run optimize-images

# Análise do Tailwind
npm run optimize-tailwind
```

### Otimização Mensal
```bash
# Otimização completa
npm run optimize-all
```

### Antes de Deploy
```bash
# Build com análise
npm run build:analyze

# Verificar otimizações
npm run optimize-webpack
```

## 🚨 Cuidados Importantes

### Backup Automático
- Scripts fazem backup de configurações antes de modificar
- Backups ficam com timestamp: `next.config.ts.backup.1234567890`

### Dependências
- `optimize-images` instala `sharp` automaticamente
- Outros scripts usam apenas dependências já instaladas

### Validação
- Sempre teste a aplicação após otimizações
- Execute `npm run build` para verificar se não há erros
- Monitore métricas de performance em produção

## 🔍 Troubleshooting

### Erro de Build
```bash
# Restaurar configuração anterior
cp next.config.ts.backup.TIMESTAMP next.config.ts
npm run build
```

### Dependências Quebradas
```bash
# Reinstalar dependências
npm ci
```

### Imagens Corrompidas
```bash
# Restaurar do git
git checkout -- public/
```

## 📈 Resultados Esperados

### Bundle Size
- Redução de 20-40% no tamanho total
- Melhor cache splitting
- Carregamento mais rápido

### Imagens
- Redução de 30-60% no tamanho
- Formatos modernos disponíveis
- Melhor experiência de carregamento

### Dependências
- Remoção de código não utilizado
- Resolução de duplicações
- Bundle mais limpo

### Performance Geral
- Melhores métricas de Web Vitals
- Tempo de carregamento reduzido
- Melhor experiência do usuário

## 🔗 Links Úteis

- [Next.js Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [Sharp Image Processing](https://sharp.pixelplumbing.com/)
- [Webpack Bundle Analysis](https://webpack.js.org/guides/code-splitting/)
- [Web Vitals](https://web.dev/vitals/)

## 📝 Changelog

### v1.0.0 (2025-01-30)
- Scripts iniciais de otimização
- Análise de bundle e dependências
- Otimização de imagens
- Configurações de webpack
- Análise do Tailwind CSS
- Relatórios consolidados