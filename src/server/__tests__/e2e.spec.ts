import { test, expect } from 'playwright/test';

test.describe('Storefront — Homepage', () => {
  test('should load the homepage and display "Made by Algerians"', async ({ page }) => {
    await page.goto('/fr');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Made by Algerians').first()).toBeVisible();
  });

  test('should render the hero section', async ({ page }) => {
    await page.goto('/fr');
    await page.waitForLoadState('networkidle');

    const hero = page.locator('section').filter({ has: page.locator('h1') }).first();
    await expect(hero).toBeVisible();

    await expect(hero.locator('h1')).toContainText(/excellence|textile/i);
  });
});

test.describe('Storefront — Navigation', () => {
  test('should navigate to a category when clicking a nav link', async ({ page }) => {
    await page.goto('/fr');
    await page.waitForLoadState('networkidle');

    const hautsLink = page.getByRole('link', { name: 'Hauts' }).first();
    await expect(hautsLink).toBeVisible();

    await hautsLink.click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/fr\/categories\/hauts-unisexe/);
  });

  test('should navigate to Outerwear category', async ({ page }) => {
    await page.goto('/fr');
    await page.waitForLoadState('networkidle');

    const outerwearLink = page.getByRole('link', { name: 'Outerwear' }).first();
    await expect(outerwearLink).toBeVisible();

    await outerwearLink.click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/fr\/categories\/outerwear/);
  });
});

test.describe('Storefront — Product Page', () => {
  test('should load product detail with "Commander" button', async ({ page }) => {
    await page.goto('/fr/products/t-shirt-classique');
    await page.waitForLoadState('networkidle');

    const commanderBtn = page.getByRole('button', { name: /Commander/i });
    await expect(commanderBtn).toBeVisible({ timeout: 10000 });
  });

  test('should display color and size selectors when variants exist', async ({ page }) => {
    await page.goto('/fr/products/t-shirt-classique');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/Couleur/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Taille/i)).toBeVisible();
  });

  test('should show error state for non-existent product', async ({ page }) => {
    await page.goto('/fr/products/produit-inconnu-12345');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/introuvable|erreur/i)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Storefront — Search', () => {
  test('should redirect to search page on submit', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/fr');
    await page.waitForLoadState('networkidle');

    const searchBtn = page.getByRole('button', { name: 'Rechercher' });
    await expect(searchBtn).toBeVisible();
    await searchBtn.click();

    const searchInput = page.getByPlaceholder('Rechercher un produit');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('t-shirt');
    await searchInput.press('Enter');

    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/fr\/search\?q=t-shirt/);
  });

  test('should navigate directly to search page with query', async ({ page }) => {
    await page.goto('/fr/search?q=t-shirt');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('textbox', { name: /rechercher/i }).or(
      page.getByPlaceholder('Rechercher un produit'),
    )).toBeVisible();
  });
});

test.describe('Storefront — Responsive Mobile', () => {
  test('should show hamburger menu on iPhone viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/fr');
    await page.waitForLoadState('networkidle');

    const menuBtn = page.getByRole('button', { name: 'Menu' });
    await expect(menuBtn).toBeVisible();

    await menuBtn.click();

    const mobileNav = page.locator('nav').last();
    await expect(mobileNav).toBeVisible();

    const accueilLink = mobileNav.getByRole('link', { name: 'Accueil' });
    await expect(accueilLink).toBeVisible();

    const hautsLink = mobileNav.getByRole('link', { name: 'Hauts' });
    await expect(hautsLink).toBeVisible();
  });
});

test.describe('Storefront — Cookie Consent Banner', () => {
  test('should display cookie banner and accept it', async ({ page, context }) => {
    const entry = await context.storageState();
    if (entry.cookies.length > 0) {
      await context.clearCookies();
    }

    await page.goto('/fr');
    await page.waitForLoadState('networkidle');

    const banner = page.getByText(/Nous utilisons des cookies/i);
    await expect(banner).toBeVisible({ timeout: 8000 });

    const acceptBtn = page.getByRole('button', { name: 'Accepter' });
    await expect(acceptBtn).toBeVisible();
    await acceptBtn.click();

    await expect(banner).not.toBeVisible();
  });

  test('should dismiss banner when rejecting cookies', async ({ page }) => {
    await page.goto('/fr');
    await page.waitForLoadState('networkidle');

    const banner = page.getByText(/Nous utilisons des cookies/i);
    await expect(banner).toBeVisible({ timeout: 8000 });

    const rejectBtn = page.getByRole('button', { name: 'Refuser' });
    await expect(rejectBtn).toBeVisible();
    await rejectBtn.click();

    await expect(banner).not.toBeVisible();
  });
});

test.describe('Storefront — 404 Page', () => {
  test('should show 404 for a missing route', async ({ page }) => {
    await page.goto('/fr/page-inexistante');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('404')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Page introuvable/i)).toBeVisible();
  });

  test('should have a link back to homepage from 404', async ({ page }) => {
    await page.goto('/fr/page-inexistante');
    await page.waitForLoadState('networkidle');

    const homeLink = page.getByRole('link', { name: /Retour à l'accueil/i });
    await expect(homeLink).toBeVisible();
  });
});

test.describe('Admin — Login Page', () => {
  test('should render login form with email and password fields', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');

    const emailInput = page.getByLabel('Email');
    await expect(emailInput).toBeVisible();

    const passwordInput = page.getByLabel('Mot de passe');
    await expect(passwordInput).toBeVisible();

    const submitBtn = page.getByRole('button', { name: /Se connecter/i });
    await expect(submitBtn).toBeVisible();
  });

  test('should display admin branding on login page', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('MBA Admin')).toBeVisible();
    await expect(page.getByText(/Connexion administrateur/i)).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');

    await page.getByLabel('Email').fill('fake@email.com');
    await page.getByLabel('Mot de passe').fill('wrongpassword');
    await page.getByRole('button', { name: /Se connecter/i }).click();

    await expect(page.getByText(/erreur|incorrect/i)).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Storefront — Footer', () => {
  test('should contain "Made by Algerians" branding', async ({ page }) => {
    await page.goto('/fr');
    await page.waitForLoadState('networkidle');

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    await expect(footer.getByText('Made by Algerians')).toBeVisible();
  });

  test('should contain contact information', async ({ page }) => {
    await page.goto('/fr');
    await page.waitForLoadState('networkidle');

    const footer = page.locator('footer');
    await expect(footer.getByText(/\+213/)).toBeVisible();
    await expect(footer.getByText(/madebyalgerians@gmail.com/)).toBeVisible();
  });

  test('should contain navigation links', async ({ page }) => {
    await page.goto('/fr');
    await page.waitForLoadState('networkidle');

    const footer = page.locator('footer');
    await expect(footer.getByRole('link', { name: 'Accueil' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Hauts' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Accessoires' })).toBeVisible();
    await expect(footer.getByRole('link', { name: /Politique de confidentialité/i })).toBeVisible();
  });
});
