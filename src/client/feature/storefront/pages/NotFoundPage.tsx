import { Link } from '@tanstack/react-router';
import { Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 pt-16">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-charcoal-100 mb-6">
          <span className="font-heading text-4xl text-charcoal-400">404</span>
        </div>
        <h1 className="font-heading text-2xl text-charcoal-900 mb-3">Page introuvable</h1>
        <p className="text-charcoal-500 text-sm leading-relaxed mb-8">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <Link
          to="/fr"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover transition-all duration-200 shadow-md shadow-accent/20 hover:-translate-y-px"
        >
          <Home className="h-4 w-4" />
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
