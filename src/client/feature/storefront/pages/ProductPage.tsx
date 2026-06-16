import { useState, useMemo } from 'react'
import { Link, useParams, useNavigate } from '@tanstack/react-router'
import { ChevronRight, Minus, Plus, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { useProduct, useSubmitOrder } from '@shared/lib/hooks'
import {
  Button,
  Input,
  Textarea,
  PriceRange,
  StockBadge,
  ProductDetailSkeleton,
} from '@shared/components'
import { formatPrice, cn } from '@shared/lib/utils'
import type { Variant, PricingTier, OrderFormData } from '@shared/types'

function PricingTiersTable({ tiers }: { tiers: PricingTier[] }) {
  if (tiers.length === 0) return null

  return (
    <div className="mt-4 p-4 bg-charcoal-50 rounded-lg">
      <p className="text-sm font-medium text-charcoal-700 mb-3">Tarifs dégressifs</p>
      <div className="overflow-hidden rounded-lg border border-charcoal-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-charcoal-100">
              <th className="px-3 py-2 text-left font-medium text-charcoal-600">Quantité min.</th>
              <th className="px-3 py-2 text-left font-medium text-charcoal-600">Prix unitaire</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-charcoal-200">
            {tiers.map((tier) => (
              <tr key={tier.id} className="bg-white">
                <td className="px-3 py-2 text-charcoal-800">{tier.minQuantity}+</td>
                <td className="px-3 py-2 font-medium text-charcoal-900">
                  {formatPrice(tier.price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function ProductPage() {
  const params = useParams({ from: '/fr/produits/$slug' } as never)
  const slug = (params as { slug: string }).slug
  const navigate = useNavigate()

  const { data, isLoading, isError, error } = useProduct(slug)
  const submitOrder = useSubmitOrder()

  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)

  const [customerName, setCustomerName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [zip, setZip] = useState('')
  const [country, setCountry] = useState('Algérie')
  const [notes, setNotes] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const product = data?.data
  const variants: Variant[] = product?.variants ?? []
  const pricingTiers: PricingTier[] = product?.pricingTiers ?? []

  const colors = useMemo(() => [...new Set(variants.map((v) => v.color))], [variants])
  const sizes = useMemo(() => [...new Set(variants.map((v) => v.size))], [variants])

  const availableSizesForColor = useMemo(() => {
    if (!selectedColor) return sizes
    return [...new Set(variants.filter((v) => v.color === selectedColor).map((v) => v.size))]
  }, [selectedColor, variants, sizes])

  const availableColorsForSize = useMemo(() => {
    if (!selectedSize) return colors
    return [...new Set(variants.filter((v) => v.size === selectedSize).map((v) => v.color))]
  }, [selectedSize, variants, colors])

  const selectedVariant = useMemo(() => {
    if (!selectedColor || !selectedSize) return null
    return variants.find((v) => v.color === selectedColor && v.size === selectedSize) ?? null
  }, [selectedColor, selectedSize, variants])

  const isOutOfStock = selectedVariant !== null && selectedVariant.stock === 0

  function handleColorSelect(color: string) {
    setSelectedColor(color)
    const sizesForColor = variants
      .filter((v) => v.color === color)
      .map((v) => v.size)
    if (selectedSize && !sizesForColor.includes(selectedSize)) {
      setSelectedSize(null)
    }
  }

  function handleSizeSelect(size: string) {
    setSelectedSize(size)
    const colorsForSize = variants
      .filter((v) => v.size === size)
      .map((v) => v.color)
    if (selectedColor && !colorsForSize.includes(selectedColor)) {
      setSelectedColor(null)
    }
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {}

    if (!customerName.trim() || customerName.trim().length < 2) {
      errors.customerName = 'Nom requis (min 2 caractères)'
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Email invalide'
    }
    if (!phone.trim() || phone.trim().length < 6) {
      errors.phone = 'Téléphone requis (min 6 caractères)'
    }
    if (!address.trim() || address.trim().length < 5) {
      errors.address = 'Adresse requise (min 5 caractères)'
    }
    if (!city.trim() || city.trim().length < 2) {
      errors.city = 'Ville requise (min 2 caractères)'
    }
    if (!zip.trim() || zip.trim().length < 2) {
      errors.zip = 'Code postal requis (min 2 caractères)'
    }
    if (!selectedVariant) {
      errors.variant = 'Veuillez sélectionner une couleur et une taille'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validateForm() || !selectedVariant || !product) return

    const orderData: OrderFormData = {
      customerName: customerName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      zip: zip.trim(),
      country: country.trim() || 'Algérie',
      notes: notes.trim() || undefined,
      items: [{ variantId: selectedVariant.id, quantity }],
    }

    submitOrder.mutate(orderData, {
      onSuccess: (res: { data: { orderId: number }; message: string }) => {
        toast.success('Commande confirmée avec succès !')
        navigate({ to: '/fr/confirmation/$orderId', params: { orderId: String(res.data.orderId) } })
      },
      onError: (err: Error) => {
        toast.error((err as Error)?.message || 'Erreur lors de la commande')
      },
    })
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-white">
        
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-charcoal-500 mb-4">
            {(error as Error)?.message || 'Produit introuvable.'}
          </p>
          <Link to="/fr" className="text-accent hover:underline text-sm">
            Retour à l&rsquo;accueil
          </Link>
        </main>
        
      </div>
    )
  }

  if (isLoading || !product) {
    return (
      <div className="min-h-screen bg-white">
        
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <ProductDetailSkeleton />
        </main>
        
      </div>
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
          {product.category && (
            <>
              <Link
                to="/fr/categories/$slug"
                params={{ slug: product.category.slug }}
                className="hover:text-accent transition-colors"
              >
                {product.category.name}
              </Link>
              <ChevronRight className="h-3 w-3" />
            </>
          )}
          <span className="text-charcoal-900 font-medium truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Left Column: Images */}
          <div>
            <div className="aspect-square bg-charcoal-100 rounded-lg flex items-center justify-center text-charcoal-400">
              {selectedVariant?.imageUrl ? (
                <img
                  src={selectedVariant.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <span className="text-sm">Image du produit</span>
              )}
            </div>

            {/* Variant color thumbnails */}
            {colors.length > 0 && (
              <div className="flex gap-2 mt-4">
                {colors.map((color) => {
                  const variantWithColor = variants.find((v) => v.color === color)
                  return (
                    <button
                      key={color}
                      onClick={() => handleColorSelect(color)}
                      className={cn(
                        'w-12 h-12 rounded-md border-2 overflow-hidden transition-all',
                        selectedColor === color
                          ? 'border-accent ring-2 ring-accent/20'
                          : 'border-charcoal-200 hover:border-charcoal-400',
                      )}
                    >
                      {variantWithColor?.imageUrl ? (
                        <img
                          src={variantWithColor.imageUrl}
                          alt={color}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full"
                          style={{ backgroundColor: color.toLowerCase() }}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right Column: Info + Order Form */}
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl text-charcoal-900 leading-tight">
              {product.name}
            </h1>

            {product.category && (
              <Link
                to="/fr/categories/$slug"
                params={{ slug: product.category.slug }}
                className="inline-block mt-2 text-sm text-accent hover:underline"
              >
                {product.category.name}
              </Link>
            )}

            {product.description && (
              <p className="mt-4 text-charcoal-600 leading-relaxed">{product.description}</p>
            )}

            {/* Price */}
            {variants.length > 0 && (
              <div className="mt-6">
                <PriceRange variants={variants} />
              </div>
            )}

            {/* Pricing Tiers */}
            {pricingTiers.length > 0 && <PricingTiersTable tiers={pricingTiers} />}

            {/* Variant Selectors */}
            {variants.length > 0 && (
              <div className="mt-6 space-y-4">
                {/* Color Selector */}
                {colors.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-charcoal-700 mb-2">
                      Couleur{selectedColor ? ` : ${selectedColor}` : ''}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {colors.map((color) => {
                        const isAvailable = availableColorsForSize.includes(color)
                        return (
                          <button
                            key={color}
                            disabled={!isAvailable}
                            onClick={() => handleColorSelect(color)}
                            className={cn(
                              'w-10 h-10 rounded-full border-2 transition-all',
                              selectedColor === color
                                ? 'border-accent ring-2 ring-accent/20 scale-110'
                                : 'border-charcoal-200',
                              !isAvailable && 'opacity-30 cursor-not-allowed',
                            )}
                            style={{ backgroundColor: color.toLowerCase() }}
                            title={color}
                          />
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Size Selector */}
                {sizes.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-charcoal-700 mb-2">
                      Taille{selectedSize ? ` : ${selectedSize}` : ''}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {sizes.map((size) => {
                        const isAvailable = availableSizesForColor.includes(size)
                        return (
                          <button
                            key={size}
                            disabled={!isAvailable}
                            onClick={() => handleSizeSelect(size)}
                            className={cn(
                              'px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all',
                              selectedSize === size
                                ? 'border-accent bg-red-50 text-accent'
                                : 'border-charcoal-200 text-charcoal-700 hover:border-charcoal-400',
                              !isAvailable && 'opacity-30 cursor-not-allowed',
                            )}
                          >
                            {size}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Stock badge */}
            {selectedVariant && (
              <div className="mt-4">
                <StockBadge stock={selectedVariant.stock} />
                {selectedVariant.stock > 0 && selectedVariant.stock < 5 && (
                  <p className="text-xs text-charcoal-500 mt-1">
                    {selectedVariant.stock} restant{selectedVariant.stock > 1 ? 's' : ''} en stock
                  </p>
                )}
              </div>
            )}

            {formErrors.variant && (
              <p className="text-xs text-red-600 mt-2">{formErrors.variant}</p>
            )}

            {/* Quantity Selector */}
            {selectedVariant && selectedVariant.stock > 0 && (
              <div className="mt-6">
                <p className="text-sm font-medium text-charcoal-700 mb-2">Quantité</p>
                <div className="inline-flex items-center border-2 border-charcoal-200 rounded-lg">
                  <button
                    type="button"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-2.5 text-charcoal-600 hover:text-charcoal-900 disabled:opacity-30"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const val = parseInt(e.target.value, 10)
                      if (!isNaN(val) && val >= 1 && val <= selectedVariant.stock) {
                        setQuantity(val)
                      }
                    }}
                    min={1}
                    max={selectedVariant.stock}
                    className="w-14 text-center text-sm font-medium border-x-2 border-charcoal-200 py-2.5 focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={quantity >= selectedVariant.stock}
                    onClick={() => setQuantity((q) => Math.min(selectedVariant.stock, q + 1))}
                    className="p-2.5 text-charcoal-600 hover:text-charcoal-900 disabled:opacity-30"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Order Form */}
            <form onSubmit={handleSubmit} className="mt-8 space-y-4 border-t border-charcoal-200 pt-6">
              <h3 className="font-heading text-lg text-charcoal-900">Passer commande</h3>

              <Input
                label="Nom complet"
                placeholder="Votre nom"
                value={customerName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerName(e.target.value)}
                error={formErrors.customerName}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="vous@email.com"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  error={formErrors.email}
                  required
                />
                <Input
                  label="Téléphone"
                  type="tel"
                  placeholder="0555555555"
                  value={phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                  error={formErrors.phone}
                  required
                />
              </div>

              <Input
                label="Adresse"
                placeholder="Adresse de livraison"
                value={address}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddress(e.target.value)}
                error={formErrors.address}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Ville"
                  placeholder="Ville"
                  value={city}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCity(e.target.value)}
                  error={formErrors.city}
                  required
                />
                <Input
                  label="Code postal"
                  placeholder="16000"
                  value={zip}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setZip(e.target.value)}
                  error={formErrors.zip}
                  required
                />
                <Input
                  label="Pays"
                  placeholder="Algérie"
                  value={country}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCountry(e.target.value)}
                />
              </div>

              <Textarea
                label="Notes (optionnel)"
                placeholder="Précisions sur votre commande..."
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
              />

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isOutOfStock || !selectedVariant || submitOrder.isPending}
              >
                {isOutOfStock ? (
                  'Rupture de stock'
                ) : submitOrder.isPending ? (
                  'Envoi en cours...'
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Commander
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>

      
    </div>
  )
}
