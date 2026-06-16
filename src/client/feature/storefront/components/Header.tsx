import { useState, useCallback } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Search, Phone, X, Menu } from 'lucide-react';

const navLinks = [
  { slug: 'hauts-unisexe', label: 'Hauts' },
  { slug: 'outerwear', label: 'Outerwear' },
  { slug: 'accessoires', label: 'Accessoires' },
  { slug: 'professionnel', label: 'Professionnel' },
] as const;

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-charcoal-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              to="/fr"
              className="font-heading text-xl sm:text-2xl tracking-tight text-charcoal-900 hover:text-accent transition-colors shrink-0"
            >
              Made by <span className="text-accent">Algerians</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              <Link
                to="/fr"
                activeProps={{ className: 'px-3 py-2 text-sm font-medium rounded-md bg-red-50 text-accent' }}
                inactiveProps={{ className: 'px-3 py-2 text-sm font-medium rounded-md text-charcoal-600 hover:text-charcoal-900 hover:bg-charcoal-50 transition-colors' }}
              >
                Accueil
              </Link>
              {navLinks.map(({ slug, label }) => (
                <Link
                  key={slug}
                  to="/fr/categories/$slug"
                  params={{ slug }}
                  activeProps={{ className: 'px-3 py-2 text-sm font-medium rounded-md bg-red-50 text-accent' }}
                  inactiveProps={{ className: 'px-3 py-2 text-sm font-medium rounded-md text-charcoal-600 hover:text-charcoal-900 hover:bg-charcoal-50 transition-colors' }}
                >
                  {label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setSearchOpen((p) => !p)}
                aria-label="Rechercher"
                className="p-2 rounded-md text-charcoal-600 hover:text-charcoal-900 hover:bg-charcoal-50 transition-colors"
              >
                {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
              </button>

              <a
                href="tel:+213557396987"
                className="hidden sm:flex items-center gap-1.5 text-sm text-charcoal-600 hover:text-accent transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span className="hidden md:inline">+213 557 39 69 87</span>
              </a>

              <button
                onClick={() => setMobileOpen(true)}
                aria-label="Menu"
                className="lg:hidden p-2 -mr-1 rounded-md text-charcoal-600 hover:text-charcoal-900 hover:bg-charcoal-50 transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>

          {searchOpen && (
            <div className="pb-3 lg:hidden">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const input = form.querySelector('input') as HTMLInputElement;
                  if (input.value.trim()) {
                    navigate({ to: '/fr/search', search: { q: input.value.trim() } });
                  }
                }}
              >
                <input
                  type="search"
                  placeholder="Rechercher un produit..."
                  className="w-full px-4 py-2.5 text-sm bg-charcoal-50/50 border border-charcoal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent focus:bg-white transition-all duration-200 placeholder:text-charcoal-400"
                  autoFocus
                />
              </form>
            </div>
          )}
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" onClick={closeMobile}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <nav className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl p-6 flex flex-col gap-1">
            <div className="flex justify-end mb-4">
              <button onClick={closeMobile} className="p-2 rounded-md text-charcoal-600 hover:text-charcoal-900">
                <X className="h-5 w-5" />
              </button>
            </div>
            <Link
              to="/fr"
              onClick={closeMobile}
              activeProps={{ className: 'block px-3 py-3 rounded-lg text-base font-medium bg-red-50 text-accent' }}
              inactiveProps={{ className: 'block px-3 py-3 rounded-lg text-base font-medium text-charcoal-700 hover:text-charcoal-900 hover:bg-charcoal-50 transition-colors' }}
            >
              Accueil
            </Link>
            {navLinks.map(({ slug, label }) => (
              <Link
                key={slug}
                to="/fr/categories/$slug"
                params={{ slug }}
                onClick={closeMobile}
                activeProps={{ className: 'block px-3 py-3 rounded-lg text-base font-medium bg-red-50 text-accent' }}
                inactiveProps={{ className: 'block px-3 py-3 rounded-lg text-base font-medium text-charcoal-700 hover:text-charcoal-900 hover:bg-charcoal-50 transition-colors' }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
