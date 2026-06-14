import { Link, useParams } from '@tanstack/react-router'
import { CircleCheck, Camera, Globe, ArrowLeft } from 'lucide-react'
import { Header } from '@client/feature/storefront/components/Header'
import { Footer } from '@client/feature/storefront/components/Footer'

export function ConfirmationPage() {
  const params = useParams({ from: '/fr/confirmation/$orderId' } as never)
  const orderId = (params as { orderId: string }).orderId

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 mb-8">
          <CircleCheck className="h-10 w-10 text-green-600" />
        </div>

        <h1 className="font-heading text-3xl sm:text-4xl text-charcoal-900 mb-4">
          Commande confirmée !
        </h1>

        <p className="text-lg font-medium text-charcoal-700 mb-2">
          Votre commande{' '}
          <span className="font-mono text-accent">#EC-{orderId}</span>
        </p>

        <p className="text-charcoal-500 leading-relaxed max-w-md mx-auto mt-4">
          Nous avons bien reçu votre commande. Notre équipe vous contactera dans les plus brefs
          délais.
        </p>

        {/* Social Links */}
        <div className="mt-12 pt-8 border-t border-charcoal-200">
          <h2 className="font-heading text-lg text-charcoal-900 mb-4">
            Suivez-nous sur les réseaux sociaux
          </h2>
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://instagram.com/madebyalgerians"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-charcoal-50 text-charcoal-600 hover:bg-charcoal-100 hover:text-charcoal-900 transition-colors"
            >
              <Camera className="h-5 w-5" />
              <span className="text-sm font-medium">Instagram</span>
            </a>
            <a
              href="https://facebook.com/madebyalgerians"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-charcoal-50 text-charcoal-600 hover:bg-charcoal-100 hover:text-charcoal-900 transition-colors"
            >
              <Globe className="h-5 w-5" />
              <span className="text-sm font-medium">Facebook</span>
            </a>
          </div>
        </div>

        {/* Return CTA */}
        <Link
          to="/fr"
          className="inline-flex items-center gap-2 mt-10 px-6 py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent-hover transition-colors shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l&rsquo;accueil
        </Link>
      </main>

      <Footer />
    </div>
  )
}
