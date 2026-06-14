import { Link } from '@tanstack/react-router'
import { Shield, Factory, Truck, Award, ArrowRight } from 'lucide-react'
import { useInfiniteProducts, useCategories } from '@shared/lib/hooks'
import { ProductCardSkeleton } from '@shared/components'
import { Header } from '@client/feature/storefront/components/Header'
import { Footer } from '@client/feature/storefront/components/Footer'
import { ProductCard } from '@client/feature/storefront/components/ProductCard'
import type { CategoryTree, ProductWithVariants } from '@shared/types'
const TRUST_BADGES = [
  { icon: Shield, title: "7 ans d'expérience", desc: 'Savoir-faire éprouvé depuis 2019' },
  { icon: Factory, title: 'Fabrication locale', desc: '100% fabriqué en Algérie' },
  { icon: Truck, title: 'Livraison rapide', desc: 'Expédition sous 48h' },
  { icon: Award, title: 'Qualité garantie', desc: 'Tissus premium certifiés' },
] as const

export function HomePage() {
  const { data: categoriesData } = useCategories()
  const categories: CategoryTree[] = categoriesData?.data ?? []

  const newArrivals = useInfiniteProducts({ sort: 'createdAt_desc', limit: 4 })
  const bestSellers = useInfiniteProducts({ sort: 'createdAt_desc', limit: 4 })

  const arrivalsProducts = newArrivals.data?.pages.flatMap((p: { data: ProductWithVariants[] }) => p.data) ?? []
  const sellersProducts = bestSellers.data?.pages.flatMap((p: { data: ProductWithVariants[] }) => p.data) ?? []

  const isLoadingArrivals = newArrivals.isLoading
  const isErrorArrivals = newArrivals.isError

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        {/* Hero */}
        <section className="bg-charcoal-900 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
            <div className="max-w-2xl">
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl leading-tight tracking-tight">
                L&rsquo;excellence textile algérienne
              </h1>
              <p className="mt-6 text-lg text-charcoal-300 leading-relaxed max-w-xl">
                Avec plus de 7 ans d&rsquo;expérience, nous créons des vêtements et textiles
                personnalisés fabriqués avec passion en Algérie.
              </p>
              <Link
                to="/fr/categories/$slug" params={{ slug: 'hauts-unisexe' }}
                className="inline-flex items-center gap-2 mt-8 px-7 py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent-hover transition-colors shadow-sm"
              >
                Découvrir nos produits
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Categories */}
        {categories.length > 0 && (
          <section className="py-16 sm:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h2 className="font-heading text-2xl sm:text-3xl text-charcoal-900 mb-8">
                Catégories
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:px-6 lg:px-8 scrollbar-hide">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to="/fr/categories/$slug" params={{ slug: cat.slug }}
                    className="flex-shrink-0 w-44 sm:w-56 group"
                  >
                    <div className="aspect-square bg-charcoal-100 rounded-lg overflow-hidden">
                      {cat.imageUrl ? (
                        <img
                          src={cat.imageUrl}
                          alt={cat.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-charcoal-400">
                          <Factory className="h-10 w-10" />
                        </div>
                      )}
                    </div>
                    <p className="mt-3 text-sm font-medium text-charcoal-800 group-hover:text-accent transition-colors">
                      {cat.name}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* New Arrivals */}
        <section className="py-16 sm:py-20 bg-charcoal-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-2xl sm:text-3xl text-charcoal-900 mb-8">
              Nouveautés
            </h2>

            {isErrorArrivals ? (
              <p className="text-charcoal-500 text-sm">
                Impossible de charger les nouveautés. Veuillez réessayer plus tard.
              </p>
            ) : isLoadingArrivals ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : arrivalsProducts.length === 0 ? (
              <p className="text-charcoal-500 text-sm">Aucune nouveauté pour le moment.</p>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {arrivalsProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Best Sellers */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-2xl sm:text-3xl text-charcoal-900 mb-8">
              Meilleures ventes
            </h2>

            {bestSellers.isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : sellersProducts.length === 0 ? (
              <p className="text-charcoal-500 text-sm">Aucun produit pour le moment.</p>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {sellersProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Trust Badges */}
        <section className="py-16 sm:py-20 bg-charcoal-900 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-2xl sm:text-3xl text-white mb-12 text-center">
              Pourquoi nous choisir
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
              {TRUST_BADGES.map((badge) => (
                <div key={badge.title} className="text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent mb-4">
                    <badge.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-heading text-base text-white mb-2">{badge.title}</h3>
                  <p className="text-sm text-charcoal-400">{badge.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
