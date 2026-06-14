import { createRouter, createRootRoute, createRoute } from '@tanstack/react-router';
import { HomePage } from '@client/feature/storefront/pages/HomePage';
import { CategoryPage } from '@client/feature/storefront/pages/CategoryPage';
import { ProductPage } from '@client/feature/storefront/pages/ProductPage';
import { SearchPage } from '@client/feature/storefront/pages/SearchPage';
import { ConfirmationPage } from '@client/feature/storefront/pages/ConfirmationPage';
import { PrivacyPage } from '@client/feature/storefront/pages/PrivacyPage';
import { Header } from '@client/feature/storefront/components/Header';
import { Footer } from '@client/feature/storefront/components/Footer';
import { CookieBanner } from '@client/feature/storefront/components/CookieBanner';

const rootRoute = createRootRoute({
  component: () => (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <CookieBanner />
      </main>
      <Footer />
    </div>
  ),
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/fr/',
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

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  homeRoute,
  categoryRoute,
  productRoute,
  searchRoute,
  confirmationRoute,
  privacyRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
