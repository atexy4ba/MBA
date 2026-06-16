import { Link, Outlet, useNavigate, useLocation } from '@tanstack/react-router';
import { LayoutDashboard, ShoppingBag, Package, Tags, Settings, LogOut, Menu, X } from 'lucide-react';
import { useAuthStore } from '@client/feature/auth/stores';
import { useState } from 'react';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/commandes', icon: ShoppingBag, label: 'Commandes' },
  { to: '/admin/produits', icon: Package, label: 'Produits' },
  { to: '/admin/categories', icon: Tags, label: 'Catégories' },
  { to: '/admin/parametres', icon: Settings, label: 'Paramètres' },
];

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);

  if (!isAuthenticated) {
    navigate({ to: '/admin/login' });
    return null;
  }

  const currentPath = location.pathname;

  return (
    <div className="flex h-screen bg-charcoal-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-charcoal-900 text-white shrink-0">
        <div className="p-5 border-b border-charcoal-800">
          <Link to="/admin" className="font-heading text-lg tracking-tight">
            MBA <span className="text-accent">Admin</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                currentPath === to || (to !== '/admin' && currentPath.startsWith(to))
                  ? 'bg-accent text-white'
                  : 'text-charcoal-300 hover:text-white hover:bg-charcoal-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-charcoal-800">
          <button
            onClick={() => {
              logout();
              localStorage.removeItem('mba-auth');
              navigate({ to: '/admin/login' });
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-charcoal-400 hover:text-white hover:bg-charcoal-800 transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-30 bg-charcoal-900 text-white h-14 flex items-center px-4">
        <button onClick={() => setMobileOpen(true)} className="p-2 text-charcoal-300 hover:text-white">
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-heading text-base ml-3">MBA Admin</span>
      </div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <nav className="absolute left-0 top-0 bottom-0 w-64 bg-charcoal-900 text-white p-4">
            <div className="flex justify-between items-center mb-6">
              <span className="font-heading text-lg">MBA Admin</span>
              <button onClick={() => setMobileOpen(false)} className="p-1 text-charcoal-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-1">
              {navItems.map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    currentPath === to || (to !== '/admin' && currentPath.startsWith(to))
                      ? 'bg-accent text-white'
                      : 'text-charcoal-300 hover:text-white hover:bg-charcoal-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-y-auto lg:pt-0 pt-14">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
