import { useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { SlidersHorizontal, X, ChevronRight } from 'lucide-react'
import { useCategories, useCategoryProducts } from '@shared/lib/hooks'
import { ProductCardSkeleton, Button } from '@shared/components'
import { ProductCard } from '@client/feature/storefront/components/ProductCard'
import type { CategoryTree, ProductWithVariants } from '@shared/types'
import { cn } from '@shared/lib/utils'

export function CategoryPage() {
  const params = useParams({ from: '/fr/categories/$slug' } as never)
  const slug = (params as { slug: string }).slug

  const { data: categoriesData, isLoading: catsLoading } = useCategories()
  const categories: CategoryTree[] = categoriesData?.data ?? []

  const {
    data: productsData,
    isLoading: productsLoading,
    isError: productsError,
    error: productsErr,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useCategoryProducts(slug)

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  const products = productsData?.pages.flatMap((p: { data: { products: ProductWithVariants[] }; pagination: { total: number } }) => p.data.products) ?? []
  const categoryName = productsData?.pages[0]?.data?.category
    ? (productsData.pages[0].data.category as { name: string }).name
    : slug
  const totalProducts = productsData?.pages[0]?.pagination?.total ?? 0

  function renderCategoryTree(items: CategoryTree[], depth = 0) {
    return (
      <ul className={cn('space-y-0.5', depth > 0 && 'ml-4')}>
        {items.map((cat) => (
          <li key={cat.id}>
            <Link
              to="/fr/categories/$slug" params={{ slug: cat.slug }}
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
                cat.slug === slug
                  ? 'bg-red-50 text-accent font-medium'
                  : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-charcoal-50',
              )}
            >
              <ChevronRight className={cn('h-3 w-3 shrink-0 transition-transform', cat.children.length > 0 && '')} />
              {cat.name}
            </Link>
            {cat.children.length > 0 && renderCategoryTree(cat.children as CategoryTree[], depth + 1)}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-charcoal-500 mb-6">
          <Link to="/fr" className="hover:text-accent transition-colors">
            Accueil
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-charcoal-900 font-medium">{categoryName}</span>
        </nav>

        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 space-y-6">
              <h3 className="font-heading text-lg text-charcoal-900">Catégories</h3>
              {catsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-8 bg-charcoal-100 rounded-md animate-pulse" />
                  ))}
                </div>
              ) : (
                <nav>{renderCategoryTree(categories)}</nav>
              )}

              <div className="border-t border-charcoal-200 pt-6">
                <h3 className="font-heading text-lg text-charcoal-900 mb-4">Prix</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-charcoal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
                  />
                  <span className="text-charcoal-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-charcoal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Mobile Filter Bar */}
            <div className="lg:hidden sticky top-16 z-30 bg-white pb-3 mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMobileFilterOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-charcoal-50 border border-charcoal-200 rounded-full hover:bg-charcoal-100 transition-colors"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtres
                </button>
                {totalProducts > 0 && (
                  <span className="text-sm text-charcoal-500">{totalProducts} produit{totalProducts > 1 ? 's' : ''}</span>
                )}
              </div>
            </div>

            {/* Desktop header */}
            <div className="hidden lg:flex items-center justify-between mb-6">
              <h2 className="font-heading text-2xl text-charcoal-900">{categoryName}</h2>
              {totalProducts > 0 && (
                <span className="text-sm text-charcoal-500">{totalProducts} produit{totalProducts > 1 ? 's' : ''}</span>
              )}
            </div>

            {/* Error state */}
            {productsError && (
              <div className="text-center py-16">
                <p className="text-charcoal-500 mb-4">
                  {(productsErr as Error)?.message || 'Une erreur est survenue.'}
                </p>
                <Button variant="outline" onClick={() => refetch()}>
                  Réessayer
                </Button>
              </div>
            )}

            {/* Loading state */}
            {productsLoading && !productsError && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!productsLoading && !productsError && products.length === 0 && (
              <div className="text-center py-16">
                <p className="text-charcoal-500 text-lg">Aucun produit dans cette catégorie</p>
              </div>
            )}

            {/* Product Grid */}
            {!productsLoading && !productsError && products.length > 0 && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Load More */}
                {hasNextPage && (
                  <div className="mt-10 text-center">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                    >
                      {isFetchingNextPage ? 'Chargement...' : 'Voir plus de produits'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Filter Panel */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={() => setMobileFilterOpen(false)} />
          <div className="fixed top-0 right-0 bottom-0 w-80 bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-5 h-16 border-b border-charcoal-200">
              <span className="font-heading text-lg text-charcoal-900">Filtres</span>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-2 rounded-md text-charcoal-600 hover:text-charcoal-900 hover:bg-charcoal-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
              <div>
                <h3 className="font-heading text-base text-charcoal-900 mb-3">Catégories</h3>
                {catsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-8 bg-charcoal-100 rounded-md animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <nav>{renderCategoryTree(categories)}</nav>
                )}
              </div>

              <div className="border-t border-charcoal-200 pt-6">
                <h3 className="font-heading text-base text-charcoal-900 mb-3">Prix</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-charcoal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
                  />
                  <span className="text-charcoal-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-charcoal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      
    </div>
  )
}
