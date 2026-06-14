import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Search, X, ChevronRight } from 'lucide-react'
import { useSearch, useCategories } from '@shared/lib/hooks'
import { ProductCardSkeleton } from '@shared/components'
import { Header } from '@client/feature/storefront/components/Header'
import { Footer } from '@client/feature/storefront/components/Footer'
import { ProductCard } from '@client/feature/storefront/components/ProductCard'
import type { Category, ProductWithVariants } from '@shared/types'
import { cn } from '@shared/lib/utils'

export function SearchPage() {
  const navigate = useNavigate()
  const urlParams = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams()
  const initialQ = urlParams.get('q') ?? ''

  const [searchInput, setSearchInput] = useState(initialQ)
  const [activeQuery, setActiveQuery] = useState(initialQ)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>()

  const { data: categoriesData } = useCategories()
  const categories = categoriesData?.data ?? []

  const {
    data: searchData,
    isLoading,
    isError,
    error,
  } = useSearch(activeQuery, selectedCategoryId ? { categoryId: selectedCategoryId } : undefined)

  const results = searchData?.data ?? []

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = searchInput.trim()
    if (!trimmed) return
    setActiveQuery(trimmed)
    navigate({ to: '/fr/search', search: { q: trimmed } })
  }

  function clearSearch() {
    setSearchInput('')
    setActiveQuery('')
    setSelectedCategoryId(undefined)
  }

  function flattenCategories(cats: (Category & { children?: Category[] })[]): Category[] {
    const flat: Category[] = []
    for (const cat of cats) {
      flat.push(cat)
      if (cat.children) {
        flat.push(...flattenCategories(cat.children))
      }
    }
    return flat
  }

  const allCategories = flattenCategories(categories)

  function getCategoryName(id: number): string {
    return allCategories.find((c) => c.id === id)?.name ?? ''
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-charcoal-500 mb-6">
          <Link to="/fr" className="hover:text-accent transition-colors">
            Accueil
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-charcoal-900 font-medium">Recherche</span>
        </nav>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="relative max-w-2xl mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-charcoal-400" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-12 pr-10 py-3 text-sm bg-white border-2 border-charcoal-200 rounded-xl focus:outline-none focus:border-accent transition-colors placeholder:text-charcoal-400"
          />
          {searchInput && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-charcoal-400 hover:text-charcoal-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        {/* Category Filter Pills */}
        {allCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setSelectedCategoryId(undefined)}
              className={cn(
                'px-4 py-1.5 text-sm font-medium rounded-full border transition-colors',
                !selectedCategoryId
                  ? 'bg-accent text-white border-accent'
                  : 'bg-white text-charcoal-600 border-charcoal-200 hover:border-charcoal-400',
              )}
            >
              Tout
            </button>
            {allCategories.slice(0, 10).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={cn(
                  'px-4 py-1.5 text-sm font-medium rounded-full border transition-colors',
                  selectedCategoryId === cat.id
                    ? 'bg-accent text-white border-accent'
                    : 'bg-white text-charcoal-600 border-charcoal-200 hover:border-charcoal-400',
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Active query indicator */}
        {activeQuery && (
          <p className="text-sm text-charcoal-500 mb-6">
            {results.length > 0
              ? `${results.length} résultat${results.length > 1 ? 's' : ''} pour "${activeQuery}"${
                  selectedCategoryId ? ` dans ${getCategoryName(selectedCategoryId)}` : ''
                }`
              : ''}
          </p>
        )}

        {/* Error state */}
        {isError && (
          <div className="text-center py-16">
            <p className="text-charcoal-500 mb-2">
              {(error as Error)?.message || 'Une erreur est survenue.'}
            </p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && activeQuery.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && activeQuery.length > 0 && results.length === 0 && (
          <div className="text-center py-16">
            <p className="text-charcoal-500 text-lg">
              Aucun résultat pour &lsquo;{activeQuery}&rsquo;
            </p>
            <p className="text-charcoal-400 text-sm mt-2">
              Essayez avec d&rsquo;autres termes ou parcourez nos catégories.
            </p>
          </div>
        )}

        {/* Initial state — no query */}
        {!activeQuery && !isLoading && (
          <div className="text-center py-16">
            <Search className="h-12 w-12 text-charcoal-300 mx-auto mb-4" />
            <p className="text-charcoal-500">Entrez un terme de recherche pour commencer.</p>
          </div>
        )}

        {/* Results Grid */}
        {!isLoading && !isError && results.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {results.map((product: ProductWithVariants) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
