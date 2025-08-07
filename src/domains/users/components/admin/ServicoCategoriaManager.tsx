'use client'

import React, { useState, useEffect } from 'react'
import { SimpleModal, SimpleModalContent, SimpleModalHeader, SimpleModalTitle, SimpleModalFooter } from '@/shared/components/ui/modal-simple'
import { Button, Input } from '@/shared/components/ui'
import { useAdminServicos } from '@/domains/users/hooks/use-admin-servicos'
import { supabase } from '@/lib/api/supabase'
import { Plus, Edit, Trash2, Check, X, Palette } from 'lucide-react'

interface Categoria {
  nome: string
  cor?: string
  total_servicos: number
}

interface ServicoCategoriaManagerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export const ServicoCategoriaManager: React.FC<ServicoCategoriaManagerProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { servicos, refetch } = useAdminServicos()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  // Estados para edição
  const [editandoCategoria, setEditandoCategoria] = useState<string>('')
  const [novaCategoria, setNovaCategoria] = useState('')
  const [nomeEditado, setNomeEditado] = useState('')

  // Cores disponíveis para categorias
  const coresDisponiveis = [
    '#F59E0B', // amber
    '#EF4444', // red
    '#10B981', // emerald
    '#3B82F6', // blue
    '#8B5CF6', // violet
    '#F97316', // orange
    '#06B6D4', // cyan
    '#84CC16', // lime
    '#EC4899', // pink
    '#6B7280', // gray
  ]

  // Carregar categorias quando modal abre
  useEffect(() => {
    if (isOpen) {
      loadCategorias()
    }
  }, [isOpen, servicos])

  const loadCategorias = () => {
    try {
      setLoading(true)
      setError(undefined)

      // Extrair categorias dos serviços existentes
      const categoriasMap = new Map<string, Categoria>()

      servicos.forEach((servico) => {
        if (servico.categoria) {
          const categoria = servico.categoria
          if (categoriasMap.has(categoria)) {
            categoriasMap.get(categoria)!.total_servicos++
          } else {
            categoriasMap.set(categoria, {
              nome: categoria,
              total_servicos: 1,
              cor: coresDisponiveis[categoriasMap.size % coresDisponiveis.length],
            })
          }
        }
      })

      const categoriasArray = Array.from(categoriasMap.values()).sort(
        (a, b) => b.total_servicos - a.total_servicos
      )

      setCategorias(categoriasArray)
    } catch (err) {
      console.error('Erro ao carregar categorias:', err)
      setError('Erro ao carregar categorias')
    } finally {
      setLoading(false)
    }
  }

  const handleAdicionarCategoria = async () => {
    if (!novaCategoria.trim()) return

    const nomeCategoria = novaCategoria.trim()

    // Verificar se categoria já existe
    if (categorias.some((c) => c.nome.toLowerCase() === nomeCategoria.toLowerCase())) {
      setError('Esta categoria já existe')
      return
    }

    try {
      setLoading(true)
      setError(undefined)

      // Adicionar categoria à lista local
      const novaCategoriaDados: Categoria = {
        nome: nomeCategoria,
        total_servicos: 0,
        cor: coresDisponiveis[categorias.length % coresDisponiveis.length],
      }

      setCategorias((prev) => [...prev, novaCategoriaDados])
      setNovaCategoria('')
    } catch (err) {
      console.error('Erro ao adicionar categoria:', err)
      setError('Erro ao adicionar categoria')
    } finally {
      setLoading(false)
    }
  }

  const handleEditarCategoria = async (categoriaAntiga: string, categoriaNova: string) => {
    if (!categoriaNova.trim() || categoriaAntiga === categoriaNova.trim()) {
      setEditandoCategoria('')
      setNomeEditado('')
      return
    }

    const nomeNovo = categoriaNova.trim()

    // Verificar se novo nome já existe
    if (
      categorias.some(
        (c) => c.nome.toLowerCase() === nomeNovo.toLowerCase() && c.nome !== categoriaAntiga
      )
    ) {
      setError('Esta categoria já existe')
      return
    }

    try {
      setLoading(true)
      setError(undefined)

      // Atualizar todos os serviços que usam esta categoria
      const { error: updateError } = await supabase
        .from('services')
        .update({ categoria: nomeNovo })
        .eq('categoria', categoriaAntiga)

      if (updateError) {
        throw updateError
      }

      // Atualizar lista local
      setCategorias((prev) =>
        prev.map((c) => (c.nome === categoriaAntiga ? { ...c, nome: nomeNovo } : c))
      )

      setEditandoCategoria('')
      setNomeEditado('')

      // Atualizar dados dos serviços
      refetch()
      onSuccess?.()
    } catch (err) {
      console.error('Erro ao editar categoria:', err)
      setError('Erro ao editar categoria')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoverCategoria = async (nomeCategoria: string) => {
    const categoria = categorias.find((c) => c.nome === nomeCategoria)
    if (!categoria) return

    if (categoria.total_servicos > 0) {
      const confirmar = window.confirm(
        `A categoria "${nomeCategoria}" possui ${categoria.total_servicos} serviço(s).\n\nAo remover a categoria, os serviços ficarão sem categoria.\n\nDeseja continuar?`
      )
      if (!confirmar) return
    }

    try {
      setLoading(true)
      setError(undefined)

      // Remover categoria dos serviços (definir como null)
      const { error: updateError } = await supabase
        .from('services')
        .update({ categoria: null })
        .eq('categoria', nomeCategoria)

      if (updateError) {
        throw updateError
      }

      // Remover da lista local
      setCategorias((prev) => prev.filter((c) => c.nome !== nomeCategoria))

      // Atualizar dados dos serviços
      refetch()
      onSuccess?.()
    } catch (err) {
      console.error('Erro ao remover categoria:', err)
      setError('Erro ao remover categoria')
    } finally {
      setLoading(false)
    }
  }

  const iniciarEdicao = (categoria: string) => {
    setEditandoCategoria(categoria)
    setNomeEditado(categoria)
  }

  const cancelarEdicao = () => {
    setEditandoCategoria('')
    setNomeEditado('')
  }

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title="Gerenciar Categorias de Serviços"
      size="md"
      className="max-h-[90vh]"
    >
      <SimpleModalHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary-gold/10 p-2">
            <Tag className="h-6 w-6 text-primary-gold" />
          </div>
          <div>
            <SimpleModalTitle>Categorias de Serviços</SimpleModalTitle>
            <p className="mt-1 text-sm text-text-secondary">Organize seus serviços em categorias</p>
          </div>
        </div>
      </SimpleModalHeader>

      <SimpleModalContent className="flex-1 overflow-y-auto">
        {/* Adicionar nova categoria */}
        <div className="border-border-default mb-6 rounded-lg border bg-background-secondary p-4">
          <h4 className="mb-3 flex items-center gap-2 font-medium text-text-primary">
            <Plus className="h-4 w-4" />
            Nova Categoria
          </h4>

          <div className="flex gap-2">
            <Input
              value={novaCategoria}
              onChange={(e) => setNovaCategoria(e.target.value)}
              placeholder="Nome da categoria"
              disabled={loading}
              onKeyPress={(e) => e.key === 'Enter' && handleAdicionarCategoria()}
            />
            <Button
              onClick={handleAdicionarCategoria}
              disabled={!novaCategoria.trim() || loading}
              className="bg-primary-gold text-primary-black hover:bg-primary-gold-dark"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Lista de categorias */}
        <div className="space-y-3">
          {loading && categorias.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-lg bg-neutral-light-gray dark:bg-background-dark-card"
                />
              ))}
            </div>
          ) : categorias.length === 0 ? (
            <div className="py-8 text-center">
              <Tag className="mx-auto mb-4 h-12 w-12 text-text-secondary" />
              <h3 className="mb-2 text-lg font-medium text-text-primary">
                Nenhuma categoria encontrada
              </h3>
              <p className="text-text-secondary">
                Adicione categorias para organizar seus serviços
              </p>
            </div>
          ) : (
            categorias.map((categoria) => (
              <div
                key={categoria.nome}
                className="border-border-default flex items-center justify-between rounded-lg border bg-background-primary p-4 transition-all hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: categoria.cor }}
                  />

                  {editandoCategoria === categoria.nome ? (
                    <Input
                      value={nomeEditado}
                      onChange={(e) => setNomeEditado(e.target.value)}
                      className="w-48"
                      autoFocus
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleEditarCategoria(categoria.nome, nomeEditado)
                        } else if (e.key === 'Escape') {
                          cancelarEdicao()
                        }
                      }}
                    />
                  ) : (
                    <div>
                      <h4 className="font-medium text-text-primary">{categoria.nome}</h4>
                      <p className="text-sm text-text-secondary">
                        {categoria.total_servicos} serviço(s)
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {editandoCategoria === categoria.nome ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditarCategoria(categoria.nome, nomeEditado)}
                        disabled={loading}
                        className="text-success hover:text-success"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={cancelarEdicao}
                        disabled={loading}
                        className="text-text-secondary hover:text-text-primary"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => iniciarEdicao(categoria.nome)}
                        disabled={loading}
                        title="Editar categoria"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoverCategoria(categoria.nome)}
                        disabled={loading}
                        className="text-error hover:text-error"
                        title="Remover categoria"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Erro */}
        {error && (
          <div className="mt-4 rounded-lg border border-error/20 bg-error/10 p-3 text-sm text-error">
            {error}
          </div>
        )}

        {/* Dicas */}
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <h4 className="mb-2 flex items-center gap-2 font-medium text-blue-900 dark:text-blue-100">
            <Palette className="h-4 w-4" />
            Dicas
          </h4>
          <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
            <li>• Use categorias para organizar seus serviços (ex: Corte, Barba, Combo)</li>
            <li>• Categorias ajudam clientes a encontrar serviços mais facilmente</li>
            <li>• Você pode editar ou remover categorias a qualquer momento</li>
            <li>• Serviços sem categoria continuam funcionando normalmente</li>
          </ul>
        </div>
      </SimpleModalContent>

      <SimpleModalFooter>
        <div className="flex w-full justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Fechar
          </Button>
        </div>
      </SimpleModalFooter>
    </SimpleModal>
  )
}

export default ServicoCategoriaManager
