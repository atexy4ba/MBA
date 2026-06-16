import { createRouter, createRootRoute, createRoute, Outlet, useRouterState } from '@tanstack/react-router';
import { lazy } from 'react';
import { HomePage } from '@client/feature/storefront/pages/HomePage';
import { CategoryPage } from '@client/feature/storefront/pages/CategoryPage';
import { ProductPage } from '@client/feature/storefront/pages/ProductPage';
import { SearchPage } from '@client/feature/storefront/pages/SearchPage';
import { ConfirmationPage } from '@client/feature/storefront/pages/ConfirmationPage';
import { PrivacyPage } from '@client/feature/storefront/pages/PrivacyPage';
import { NotFoundPage } from '@client/feature/storefront/pages/NotFoundPage';
import { Header } from '@client/feature/storefront/components/Header';
import { Footer } from '@client/feature/storefront/components/Footer';
import { CookieBanner } from '@client/feature/storefront/components/CookieBanner';
import { AdminLayout } from '@client/feature/admin/components/AdminLayout';

const LoginPage = lazy(() => import('@client/feature/admin/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('@client/feature/admin/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const OrdersPage = lazy(() => import('@client/feature/admin/pages/OrdersPage').then((m) => ({ default: m.OrdersPage })));
const OrderDetailPage = lazy(() => import('@client/feature/admin/pages/OrderDetailPage').then((m) => ({ default: m.OrderDetailPage })));
const ProductsPage = lazy(() => import('@client/feature/admin/pages/ProductsPage').then((m) => ({ default: m.ProductsPage })));
const ProductFormPage = lazy(() => import('@client/feature/admin/pages/ProductFormPage').then((m) => ({ default: m.ProductFormPage })));
const CategoriesPage = lazy(() => import('@client/feature/admin/pages/CategoriesPage').then((m) => ({ default: m.CategoriesPage })));
const SettingsPage = lazy(() => import('@client/feature/admin/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));

const rootRoute = createRootRoute({
  component: () => {
    const pathname = useRouterState({ select: (s) => s.location.pathname });
    const isAdmin = pathname.startsWith('/admin');

    if (isAdmin) {
      return (
        <div className="flex flex-col min-h-screen">
          <main className="flex-1">
            <CookieBanner />
            <Outlet />
          </main>
        </div>
      );
    }

    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 pt-16">
          <CookieBanner />
          <Outlet />
        </main>
        <Footer />
      </div>
    );
  },
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/fr',
  component: HomePage,
});

const categoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/fr/categories/$slug',
  component: CategoryPage,
});

const productRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/fr/products/$slug',
  component: ProductPage,
});

const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/fr/search',
  component: SearchPage,
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) || '',
  }),
});

const confirmationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/fr/confirmation/$orderId',
  component: ConfirmationPage,
});

const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/fr/privacy',
  component: PrivacyPage,
});

const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'admin-layout',
  component: AdminLayout,
});

const adminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/login',
  component: LoginPage,
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin',
  component: DashboardPage,
});

const adminOrdersRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/commandes',
  component: OrdersPage,
});

const adminOrderDetailRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/commandes/$id',
  component: OrderDetailPage,
});

const adminProductsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/produits',
  component: ProductsPage,
});

const adminProductNewRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/produits/new',
  component: ProductFormPage,
});

const adminProductEditRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/produits/$id/edit',
  component: ProductFormPage,
});

const adminCategoriesRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/categories',
  component: CategoriesPage,
});

const adminSettingsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/parametres',
  component: SettingsPage,
});

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '*',
  component: NotFoundPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  homeRoute,
  categoryRoute,
  productRoute,
  searchRoute,
  confirmationRoute,
  privacyRoute,
  adminLoginRoute,
  adminLayoutRoute.addChildren([
    adminDashboardRoute,
    adminOrdersRoute,
    adminOrderDetailRoute,
    adminProductsRoute,
    adminProductNewRoute,
    adminProductEditRoute,
    adminCategoriesRoute,
    adminSettingsRoute,
  ]),
  notFoundRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
