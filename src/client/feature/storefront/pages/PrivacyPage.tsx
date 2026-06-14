import { Header } from '@client/feature/storefront/components/Header'
import { Footer } from '@client/feature/storefront/components/Footer'

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="mx-auto max-w-prose px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="font-heading text-3xl sm:text-4xl text-charcoal-900 mb-2">
          Politique de confidentialité
        </h1>
        <p className="text-sm text-charcoal-500 mb-10">
          Dernière mise à jour : Juin 2026
        </p>

        <div className="prose prose-charcoal max-w-none space-y-10">
          <section>
            <h2 className="font-heading text-xl text-charcoal-900 mb-4">
              1. Collecte des données
            </h2>
            <p className="text-charcoal-600 leading-relaxed mb-3">
              Dans le cadre de l&rsquo;utilisation de notre site internet
              <strong> Made by Algerians</strong>, nous sommes amenés à collecter les
              données personnelles suivantes :
            </p>
            <ul className="list-disc list-inside text-charcoal-600 leading-relaxed space-y-1">
              <li>Nom et prénom</li>
              <li>Adresse email</li>
              <li>Numéro de téléphone</li>
              <li>Adresse postale (adresse, ville, code postal, pays)</li>
              <li>Notes de commande éventuelles</li>
              <li>Données de navigation (cookies)</li>
            </ul>
            <p className="text-charcoal-600 leading-relaxed mt-3">
              Ces données sont collectées lors du passage d&rsquo;une commande via notre
              formulaire dédié ou lors de la navigation sur notre site.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl text-charcoal-900 mb-4">
              2. Utilisation des données
            </h2>
            <p className="text-charcoal-600 leading-relaxed mb-3">
              Les données personnelles collectées sont utilisées exclusivement pour :
            </p>
            <ul className="list-disc list-inside text-charcoal-600 leading-relaxed space-y-1">
              <li>Le traitement et la livraison de vos commandes</li>
              <li>La communication avec vous concernant votre commande</li>
              <li>L&rsquo;amélioration de nos services et de votre expérience utilisateur</li>
              <li>Le respect de nos obligations légales et comptables</li>
            </ul>
            <p className="text-charcoal-600 leading-relaxed mt-3">
              Nous ne vendons, ne louons ni ne partageons vos données personnelles avec des tiers
              à des fins commerciales. Aucune donnée n&rsquo;est transférée hors d&rsquo;Algérie.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl text-charcoal-900 mb-4">
              3. Cookies
            </h2>
            <p className="text-charcoal-600 leading-relaxed mb-3">
              Notre site utilise des cookies strictement nécessaires à son fonctionnement :
            </p>
            <ul className="list-disc list-inside text-charcoal-600 leading-relaxed space-y-1">
              <li>
                <strong>Cookies de session :</strong> nécessaires au maintien de votre session de
                navigation et au bon fonctionnement du panier
              </li>
              <li>
                <strong>Cookies de préférences :</strong> conservation de vos préférences de
                navigation (langue)
              </li>
            </ul>
            <p className="text-charcoal-600 leading-relaxed mt-3">
              Nous n&rsquo;utilisons pas de cookies publicitaires ni de cookies de suivi tiers.
              Vous pouvez à tout moment désactiver les cookies dans les paramètres de votre
              navigateur.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl text-charcoal-900 mb-4">
              4. Vos droits
            </h2>
            <p className="text-charcoal-600 leading-relaxed mb-3">
              Conformément à la législation algérienne et aux principes du RGPD, vous disposez
              des droits suivants concernant vos données personnelles :
            </p>
            <ul className="list-disc list-inside text-charcoal-600 leading-relaxed space-y-1">
              <li>
                <strong>Droit d&rsquo;accès :</strong> obtenir la confirmation que vos données sont
                traitées et en recevoir une copie
              </li>
              <li>
                <strong>Droit de rectification :</strong> faire corriger des données inexactes
              </li>
              <li>
                <strong>Droit à l&rsquo;effacement :</strong> demander la suppression de vos données
              </li>
              <li>
                <strong>Droit d&rsquo;opposition :</strong> vous opposer au traitement de vos
                données
              </li>
              <li>
                <strong>Droit à la portabilité :</strong> recevoir vos données dans un format
                structuré
              </li>
            </ul>
            <p className="text-charcoal-600 leading-relaxed mt-3">
              Pour exercer ces droits, contactez-nous à l&rsquo;adresse indiquée ci-dessous.
              Nous nous engageons à répondre dans un délai maximal de 30 jours.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl text-charcoal-900 mb-4">
              5. Sécurité des données
            </h2>
            <p className="text-charcoal-600 leading-relaxed">
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour
              protéger vos données contre tout accès non autorisé, modification, divulgation ou
              destruction. Les données sont stockées sur des serveurs sécurisés et toutes les
              transmissions sont chiffrées via HTTPS.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl text-charcoal-900 mb-4">
              6. Durée de conservation
            </h2>
            <p className="text-charcoal-600 leading-relaxed">
              Vos données personnelles sont conservées pendant la durée strictement nécessaire à
              la réalisation des finalités pour lesquelles elles ont été collectées, à savoir :
              la durée de traitement de votre commande augmentée des délais légaux de
              prescription applicables (généralement 5 ans pour les obligations comptables).
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl text-charcoal-900 mb-4">
              7. Contact
            </h2>
            <p className="text-charcoal-600 leading-relaxed mb-3">
              Pour toute question relative à cette politique de confidentialité ou pour exercer
              vos droits, vous pouvez nous contacter :
            </p>
            <ul className="list-none text-charcoal-600 leading-relaxed space-y-1">
              <li>
                <strong>Email :</strong>{' '}
                <a
                  href="mailto:madebyalgerians@gmail.com"
                  className="text-accent hover:underline"
                >
                  madebyalgerians@gmail.com
                </a>
              </li>
              <li>
                <strong>Téléphone :</strong>{' '}
                <a href="tel:+213557396987" className="text-accent hover:underline">
                  +213 557 39 69 87
                </a>
              </li>
              <li>
                <strong>Responsable du traitement :</strong> Made by Algerians
              </li>
            </ul>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
