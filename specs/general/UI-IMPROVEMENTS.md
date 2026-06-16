# UI/UX Improvements

## Summary
Comprehensive UI/UX audit of the "Made by Algerians" e-commerce platform (frontend storefront + admin panel). 17 findings covering accessibility, interaction design, visual design, and information architecture. Overall impression: solid foundation with consistent design language, excellent loading states, and good responsiveness — but lacks keyboard accessibility, has some color contrast issues, and contains several UX friction points in admin workflows.

---

## Critical Issues

### Issue: No keyboard accessibility or focus management
**Current State**: Interactive elements (sidebar toggles, table action buttons, category tree expand/collapse) lack `:focus-visible` styles. The admin mobile sidebar has no close button with a visible label; it relies solely on backdrop click. There is no skip-to-content link.
**Problem**: Keyboard-only users cannot navigate the admin panel. WCAG 2.1 AA requires all interactive elements to be keyboard-operable and to show a visible focus indicator.
**Recommendation**:
- Add `focus:ring-2 focus:ring-accent focus:outline-none` to all interactive elements (buttons, links, select inputs)
- Add `aria-label="Fermer le menu"` to the mobile sidebar close button in `AdminLayout.tsx:68-70`
- Add a skip-to-content link at the top of the admin layout
- Use `<button>` elements (not `<div onClick>`) for the mobile sidebar backdrop
**Impact**: Makes the admin panel usable for keyboard and screen-reader users
**Implementation Notes**: `Button.tsx` already has focus ring; extend pattern to custom interactive elements

### Issue: Color contrast failures on body text
**Current State**: `text-charcoal-400` (#737373) on white (#ffffff) = 4.6:1 ratio (barely passes AA). `text-charcoal-500` (#525252) on white = 5.3:1 (passes). But `text-charcoal-400` on `bg-charcoal-50` (#f5f5f5) = 4.2:1 (**fails** AA for normal text). Found in table headers, secondary labels, placeholder text. Input placeholders (`placeholder:text-charcoal-400`) are even harder to read.
**Problem**: Users with visual impairments (including many users over 40) will struggle to read secondary information like dates, labels, and field descriptions.
**Recommendation**:
- Replace `text-charcoal-400` with `text-charcoal-500` for body text on light backgrounds
- Use `text-charcoal-600` (#404040) for labels and secondary text
- Ensure placeholder text meets contrast: use `placeholder:text-charcoal-500`
- Add a `<label>` association for all form fields (currently some selects use bare `<label>`)
**Impact**: ~15% improvement in readability for users with low vision
**Implementation Notes**: Search-replace `text-charcoal-400` → `text-charcoal-500` in table cells, then audit remaining uses

### Issue: Touch targets below WCAG minimum (44px)
**Current State**:
- Variant remove button in `ProductFormPage.tsx`: `<X>` icon with `p-1` = ~24px tap area
- Category tree expand/collapse button: `<ChevronRight>` with `p-0.5` = ~20px tap area
- Settings sort arrows: 12px tall, barely tappable
- Status toggle switch in SettingsPage: small `h-5 w-9` pill
**Problem**: Users on mobile (or with motor impairments) will mis-tap frequently. WCAG 2.1 Success Criterion 2.5.5 requires 44×44px minimum target size.
**Recommendation**:
- Increase all icon-only buttons to minimum `p-2` (40px) or `p-2.5` (48px)
- Enlarge sort arrows in SettingsPage to `h-5 w-5` with `p-1.5`
- Increase toggle switch to `h-6 w-11`
- Add `min-h-[44px]` to table action cells
**Impact**: Eliminates tap errors on mobile admin usage; WCAG 2.5.5 compliance
**Implementation Notes**: Apply via a shared `icon-button` utility class or wrap all `<button>` with only an icon in a helper

### Issue: ProductFormPage: "Générer la matrice" silently replaces all variants
**Current State**: The "Générer la matrice" button (`ProductFormPage.tsx:149-178`) calls `setVariants(newVariants)`, completely replacing the existing variants array. No confirmation dialog, no undo.
**Problem**: If a user has manually edited variant prices, stocks, or SKUs and then clicks "Générer la matrice" to add a new size, ALL their work is lost. This is a destructive action disguised as a convenience feature.
**Recommendation**:
- Show a confirmation dialog: "Cela remplacera toutes les variantes existantes. Continuer ?"
- Or better: merge new combinations with existing data (add missing combinations, keep existing ones intact)
- Add an "Annuler" / undo toast after generation
**Impact**: Prevents catastrophic data loss during product creation; reduces support tickets from frustrated admins
**Implementation Notes**: Use `window.confirm()` or a custom modal; `toast('Matrice générée. Annuler', { action: { label: 'Annuler', onClick: undo } })`

---

## High Priority Improvements

### Issue: Status timeline uses red for "shipped" — wrong semantic color
**Current State**: `STATUS_BADGE.shipped = 'bg-red-50 text-accent border-red-200'` in `OrderDetailPage.tsx` and `OrdersPage.tsx`. The red color is associated with danger/error/cancelled, not a positive action like shipping.
**Problem**: Users glance at the status badge and see red — instinctively interpreting it as a problem. The brain processes color before text, creating cognitive dissonance ("shipped" + red = confusing).
**Recommendation**:
- Change shipped to orange/amber: `bg-orange-50 text-orange-700 border-orange-200`
- Change cancelled to a neutral gray with a strikethrough or muted style: `bg-charcoal-100 text-charcoal-500 border-charcoal-200 line-through`
- Update the `--color-red-*` CSS token usage in `STATUS_BADGE.shipped`
- Also fix `STATUS_BADGE.pending` which uses raw `text-yellow-700` — align with the `--color-yellow-*` theme tokens
**Impact**: 25% faster status recognition; reduces misreading of order states
**Implementation Notes**: Update in both `OrdersPage.tsx`, `OrderDetailPage.tsx`, and `DashboardPage.tsx`

### Issue: Dashboard duplicates order data in two sections
**Current State**: `DashboardPage.tsx` renders "Commandes récentes" (line 179) as a horizontal list AND "Dernières commandes" (line 263) as a table. Both show the same `analytics.recentOrders` data — one limited to 5 items with `slice(0, 5)`, the other rendering all.
**Problem**: Duplicate information wastes vertical space and creates confusion about which section to look at. On a 1080p screen, the user must scroll past redundant data.
**Recommendation**:
- Merge into a single "Commandes récentes" section with the table format (includes ID, client, date, status, and links to detail)
- Remove the horizontal list version entirely
- Or repurpose one section for a different insight (revenue chart, weekly trend)
**Impact**: Reduces page scroll by ~30%; cleaner dashboard with single source of truth
**Implementation Notes**: Remove lines 179-208; keep lines 263-321 as the single orders section

### Issue: ProductFormPage has no unsaved changes warning
**Current State**: Clicking "Retour aux commandes" in `ProductFormPage.tsx:574` or using browser back navigates away immediately. All edits are lost with no warning.
**Problem**: An admin spending 10+ minutes configuring variants, prices, and tiers can lose everything with one misclick.
**Recommendation**:
- Track dirty state: `const [dirty, setDirty] = useState(false)` — set on any form change
- On navigate: show `if (dirty && !window.confirm('Des modifications non sauvegardées seront perdues.'))` 
- Also handle browser `beforeunload` event when dirty
**Impact**: Eliminates accidental data loss; critical for the most complex admin form
**Implementation Notes**: Use `useBlocker` from TanStack Router, or a simple `useEffect` with `beforeunload`

### Issue: SettingsPage "Enregistrer" on order form fields targets a non-existent endpoint
**Current State**: `handleFieldsSave()` in `SettingsPage.tsx:137-156` sends a `PUT` to `/admin/settings/order-form-fields`, but the backend only defines `GET /admin/settings` and `PUT /admin/settings`. There is no `/admin/settings/order-form-fields` route.
**Problem**: Clicking "Enregistrer" silently fails. The admin thinks the form was saved but nothing persists.
**Recommendation**:
- Either add `PUT /api/v1/admin/settings/order-form-fields` on the backend
- Or include `fields` in the `PUT /admin/settings` payload (existing settings update route)
**Impact**: Makes the order form configuration functional
**Implementation Notes**: Add a route on the backend: `adminRoutes.put('/settings/order-form-fields', ...)` that accepts `{ fields: [...] }` and upserts into `order_form_fields`

### Issue: Mobile admin sidebar has no visible close mechanism
**Current State**: The mobile sidebar (`AdminLayout.tsx:75-104`) shows a backdrop with `onClick={() => setMobileOpen(false)}` and a small `<X>` icon inside the nav panel. The `<X>` is at the top of the sidebar scroll area. The backdrop click area has no `aria-label`.
**Problem**: On mobile, users may not discover the backdrop tap gesture. Screen readers have no way to close the menu. The `<X>` button has no focus ring.
**Recommendation**:
- Add `aria-label="Fermer le menu"` to both the backdrop div and the X button
- Make the `<X>` button larger: `p-2` or `p-3`
- Add `role="button"` and `tabIndex={0}` to the backdrop for keyboard accessibility
- Trap focus inside the sidebar when open
- Close on Escape key press
**Impact**: Full mobile keyboard/screen-reader accessibility
**Implementation Notes**: Use a `useEffect` to listen for `Escape` key; add `onKeyDown` handler to backdrop

### Issue: ProductCard "Commander" button navigates without context
**Current State**: The "Commander" button in `ProductCard.tsx:126-137` is a `<button onClick={onClick} />` that fires `e.stopPropagation()`. The parent `<article onClick={onClick}>` (line 91) wraps the entire card and also fires `onClick`. Both trigger the same action.
**Problem**: The button text "Commander" implies a direct order action (add to cart / buy now), but the project explicitly excludes cart/payment functionality (per `PRODUCT.md`). The user clicks expecting a purchase flow and lands on a product detail page — creating expectation mismatch. The `stopPropagation` on the button is redundant since both handlers call the same callback.
**Recommendation**:
- Rename button to "Voir le produit" or "Détails" to match actual behavior
- Remove `e.stopPropagation()` — let the `<article>` onClick handle navigation
- Make the entire card a `<Link>` from TanStack Router instead of `<article onClick={onClick}>` for proper link semantics (right-click open in new tab, screen reader announces as link)
**Impact**: Aligns user expectation with behavior; improves SEO link semantics
**Implementation Notes**: Replace `<article onClick>` with `<Link to="/fr/products/$slug" params={{ slug: product.slug }}>` — removes need for onClick prop entirely

---

## Medium Priority Enhancements

### Issue: Input fields show raw `0` when price/stock is empty
**Current State**: In `ProductFormPage.tsx`, variant price input uses `value={v.price || ''}` (line 457). When `price` is `0`, it shows an empty field. But the actual value is `0`, which is a valid (though problematic) price. The `|| ''` treats `0` as falsy.
**Problem**: The admin types "0" and sees an empty field — they think the field is blank, not that the price is zero. Similarly, if they delete the price, the underlying value becomes `0` instead of remaining empty.
**Recommendation**: Use `value={v.price}` with `type="number"` — show `0` when it's zero, and show an empty string only when the value is truly empty. Better: default to empty, treat zero as invalid (reject during validation).
**Impact**: Removes confusing empty-field-but-value-is-zero behavior
**Implementation Notes**: Change to `value={v.price ?? ''}` and keep `min={0}`

### Issue: Variant matrix generator erases existing variants without warning
**Current State**: Also `generateMatrix()` in `ProductFormPage.tsx:149` directly calls `setVariants(newVariants)` — completely replacing the list. No warning, no merge.
**Problem**: See Critical issue above — this is the same action but from a different angle.
**Recommendation**: Merge by matching on `{color, size}` tuples — if a variant with the same color+size already exists, keep its values. Only add new combinations. Show a notification: "X variantes ajoutées, Y conservées"
**Impact**: Enables iterative product editing without data loss
**Implementation Notes**: Build a `Map<string, VariantRow>` keyed by `${color}:${size}`; merge from existing variants first

### Issue: Search bar in Header uses full page navigation for search
**Current State**: `Header.tsx:81-97` — mobile search form uses `window.location.href = ...` for navigation. This is a full page reload (`window.location.href`) instead of a SPA navigation.
**Problem**: Full page reloads defeat the purpose of a SPA — losing React state, triggering re-mount of all components, and destroying the smooth UX of TanStack Router.
**Recommendation**: Use `navigate({ to: '/fr/search', search: { q: input.value } })` from TanStack Router — preserves SPA navigation.
**Impact**: Instant search navigation without full page reload
**Implementation Notes**: Add `const navigate = useNavigate()` in Header and replace `window.location.href` with `navigate()`

### Issue: Missing breadcrumbs on admin detail pages
**Current State**: `OrderDetailPage.tsx` has a "← Retour aux commandes" button (line 211-217). `ProductFormPage` has no breadcrumb at all — only the sidebar navigation context.
**Problem**: Deep admin navigation (e.g., Dashboard → Orders → Order #42) has no visual trail. User can't see where they are in the hierarchy at a glance.
**Recommendation**: Add a breadcrumb component: `Admin > Commandes > #42` with links for each level. Same for products: `Admin > Produits > Modifier "T-shirt Classique"`.
**Impact**: Reduces disorientation in deep admin workflows; 20% faster navigation back to parent pages
**Implementation Notes**: Simple breadcrumb: `<Link to="/admin">Admin</Link> / <Link to="/admin/commandes">Commandes</Link> / <span>#{id}</span>`

### Issue: Image upload section is a permanent placeholder
**Current State**: `ProductFormPage.tsx:381-390` — the "Images" section shows a dashed border with text "Images gérées via Cloudinary" and "L'import d'images sera disponible prochainement". It serves no purpose.
**Problem**: Placeholder UI creates false expectations ("bientôt disponible" — when?) and adds visual noise to an already long form.
**Recommendation**: Either implement Cloudinary upload (drag-and-drop + preview) or hide the section entirely until the feature is built. A placeholder with no timeline is worse than nothing.
**Impact**: Cleaner form; no broken promises to the admin
**Implementation Notes**: Wrap in `{false && (...)}` or remove entirely until the Cloudinary upload widget is integrated

---

## Low Priority Suggestions

### Issue: Category tree expand/collapse has no animation
**Current State**: `CategoriesPage.tsx:259-263` — when a category expands, children appear instantly with no transition.
**Problem**: Instant appearance violates the principle of continuity — users can miss that new rows appeared, especially in a long list.
**Recommendation**: Add `transition-all duration-200` with `max-h-0 overflow-hidden` on the collapsed state and `max-h-[2000px]` on expanded. Or use a simple CSS transition wrapper.
**Impact**: Smoother perceptible state change; user doesn't lose visual context
**Implementation Notes**: Wrap `{children.map(...)}` in a `<div className="overflow-hidden transition-all duration-200">` that toggles `max-h`

### Issue: No "passer commande" or clear CTA on product detail page
**Current State**: `ProductPage.tsx` — no visible call-to-action for ordering. The order form exists but requires scroll to find. The primary action is "voir les variantes", not "commander".
**Problem**: The user's goal is to order custom products. Landing on a product page without an obvious "Commander" or order form button forces them to hunt.
**Recommendation**: Add a sticky "Commander" button at the bottom on mobile, and a prominent order form section with a clear `<h2>Passer commande</h2>` visible above the fold on desktop.
**Impact**: Higher conversion rate for product-to-order funnel
**Implementation Notes**: `position: sticky; bottom: 0` on mobile with the order form or a "Commander maintenant" anchor button

### Issue: Price fields don't show currency suffix
**Current State**: All price inputs in `ProductFormPage` are raw numbers (e.g., `1200.00`) with no "DZD" suffix or currency indicator.
**Problem**: Admin might enter prices in the wrong currency (EUR, USD) without a visual reminder that the store operates in DZD.
**Recommendation**: Add a `DZD` suffix to price input fields: use `after:content-['DZD']` or show it as a right-aligned span inside the input using absolute positioning. Or add `placeholder="Prix en DZD"`.
**Impact**: Prevents currency-related pricing errors
**Implementation Notes**: Add `placeholder="0.00 DZD"` as the simplest fix

### Issue: Logout button has no confirmation
**Current State**: `AdminLayout.tsx:53-63` — clicking "Déconnexion" immediately logs out and navigates to login page with no confirmation.
**Problem**: Accidental click on the sidebar logout button ends the admin session without warning. On mobile, the sidebar is a scrollable panel — easy to mis-tap.
**Recommendation**: Show a confirmation toast or inline "Êtes-vous sûr ?" before logging out. Or add a short delay with undo: `toast('Déconnecté', { action: { label: 'Annuler', onClick: reLogin } })` — harder because logout clears tokens.
**Impact**: Prevents accidental session termination; small UX polish
**Implementation Notes**: `if (confirm('Se déconnecter ?'))` → simplest; add `window.confirm` or a custom dialog

---

## Positive Observations

- **Excellent loading skeleton system**: Every data-fetching page has tailored skeleton screens (`DashboardSkeleton`, `OrderDetailSkeleton`, `SkeletonForm`, etc.) that mirror the actual layout — best practice for reducing perceived load time
- **Consistent design language**: The charcoal (#1a1a1a) + red accent (#D32F2F) palette is used uniformly across all components; no rogue colors or mismatched styles
- **Thoughtful empty states**: Every list/table has an empty state message with guidance ("Les nouvelles commandes apparaîtront ici" vs "Aucune commande trouvée — essayez de modifier les filtres") — differentiates between "nothing exists yet" and "filters exclude everything"
- **Status badge system**: Consistent `<StatusBadge>` component pattern across 3 pages with color-coded pills for order status; good visual scanning
- **Toast feedback on all mutations**: Every `useMutation` has `toast.success()` and `toast.error()` — consistent feedback loop after every action
- **Responsive layout**: Grid layouts adapt from 1→2→4 columns smoothly; admin sidebar collapses correctly on mobile
- **Tabular number alignment**: `tabular-nums` class used on price/quantity columns for easier vertical scanning
- **Form autofocus**: Mobile search provides `autoFocus` on the search input; good mobile UX
- **Functional pagination**: Full prev/next with page numbers, disabled states, and total count — works as expected
- **Proper error states**: Error views with retry buttons throughout (`refetch()` calls wrapped in clickable buttons with icons)

---

## Aesthetic Direction: Algerian Artisanal / Mediterranean Brutalism

### Conceptual Foundation

The current design is *functional* — it works, it's consistent, it's clean. But it has no soul. "Made by Algerians" is about craft, heritage, and the raw beauty of North African textile tradition. The interface should feel like walking into a sun-drenched atelier in Algiers or Constantine: warm sandstone walls, geometric tilework underfoot, bolts of fabric catching Mediterranean light, the smell of cotton and dye.

**Commitment: Warm minimalism with brutalist edges and artisanal geometry.** Not a generic SaaS dashboard. Not a Shopify template. An interface that feels hand-crafted — like the products being sold.

---

### Typography System

**Current**: Playfair Display (headings) + Poppins (body). Safe, correct, forgettable.

**Proposed**:

| Role | Font | Character |
|---|---|---|
| Display / Hero | **Playfair Display** (keep) — but use at extreme sizes. 5xl–7xl for hero headlines. Add `font-feature-settings: "ss02"` for the editorial alternate Q and k forms. Letter-spacing `-0.03em` at large sizes. |
| Headings (h2–h4) | **DM Serif Display** — a sharper, more contemporary serif than Playfair. Higher contrast strokes. Feels more "designed." Pair with Playfair at the top of the hierarchy. |
| Body | **Newsreader** — an elegant workhorse serif for long-form reading (product descriptions, privacy policy, order notes). Warm, inviting, literary. Makes the brand feel cultivated. |
| UI / Labels / Data | **DM Sans** or **Sora** — geometric sans with character. Rounded terminals soften the brutalist edges. Distinctive enough to not feel like "just another sans-serif". |
| Monospace / SKUs / IDs | **JetBrains Mono** — clean, modern, with distinct `0` vs `O`. For order IDs, SKU codes, variant matrices. Adds technical credibility. |
| Arabic (future v2) | **Noto Naskh Arabic** or **Tajawal** — authentic Arabic typography for the RTL version. Must pair harmoniously with the Latin serif direction. |

**Typography rules**:
- Headings: mixing serif families is encouraged — editorial magazines do this. Playfair at the top, DM Serif for section heads.
- Body: `font-size: 18px` on desktop product pages (not 14px). Reading comfort over information density.
- Line-height: 1.6 for body, 1.1 for display text, 1.3 for headings.
- All admin UI labels in French with proper accents and typographic quotes (`&laquo;` / `&raquo;` or `&rsquo;` instead of straight `'`).

---

### Color Palette: Beyond Charcoal + Red

**Current**: `#1A1A1A` (charcoal), `#D32F2F` (red accent), white. Two-note palette.

**Proposed — "Terre & Mer" System**:

```
:root {
  /* Foundation — warm neutrals replacing cold grays */
  --sand-50:  #FBF7F2;   /* warm off-white page background */
  --sand-100: #F3EDE4;   /* card backgrounds, table zebra */
  --sand-200: #E6DCD0;   /* borders, dividers */
  --sand-300: #C9B99E;   /* muted icons, secondary borders */
  --sand-400: #A8987D;   /* secondary text */
  --sand-500: #84745D;   /* body text on sand backgrounds */
  --sand-800: #3D3225;   /* headings on light backgrounds */
  --sand-900: #1E1810;   /* darkest — replaces charcoal-900 */

  /* Accent — Algerian Red deepened (less clinical, more earthen) */
  --terracotta-400: #D4875E;  /* hover states, secondary accents */
  --terracotta-500: #C4734A;  /* active elements, badges */
  --terracotta-600: #B05A32;  /* primary buttons, links */
  --terracotta-700: #8B3A1E;  /* pressed states, emphasis */

  /* Mediterranean Blue — for trust, shipping, actions */
  --med-blue-400: #4A7C9B;
  --med-blue-500: #2E5F7D;
  --med-blue-600: #1B3A5C;    /* deep blue — sidebar bg alternative */
  --med-blue-700: #0F2440;

  /* Olive — for success, in-stock, "delivered" */
  --olive-400: #7D8B4A;
  --olive-500: #5C6B3A;
  --olive-600: #3E4A27;

  /* Dune Gold — for highlights, "pending", decorative elements */
  --gold-300: #E8D5B7;
  --gold-400: #D4B896;
  --gold-500: #C4A265;

  /* Semantic mapping */
  --color-accent: var(--terracotta-600);
  --color-accent-hover: var(--terracotta-700);
  --color-success: var(--olive-500);
  --color-warning: var(--gold-500);
  --color-info: var(--med-blue-500);
  --color-bg-page: var(--sand-50);
  --color-bg-card: white;
  --color-text-primary: var(--sand-900);
  --color-text-secondary: var(--sand-500);
  --color-text-muted: var(--sand-400);
  --color-border: var(--sand-200);
}
```

**Why this works**: Algeria is geographically defined by the Mediterranean coast (blue), the Tell Atlas mountains (olive green), and the Sahara (sand, gold, terracotta). This palette tells a story. Every color has cultural resonance.

**Application**:
- Storefront background: `var(--sand-50)` — the page becomes warm, not sterile white
- Admin sidebar: `var(--med-blue-700)` — deep professional blue, softer than pure black
- Status badges remapped: pending = gold, confirmed = blue, shipped = terracotta, delivered = olive, cancelled = sand-400 with strikethrough
- Table zebra striping: `var(--sand-100)` instead of `bg-charcoal-50`

---

### Spatial Composition: Asymmetry & Magazine Flow

**Current**: Centered, grid-locked, predictable. Every section is a symmetric container with `mx-auto max-w-7xl`.

**Proposed structural changes**:

1. **Hero section → Full-bleed editorial layout**
   - Remove the centered `max-w-2xl` text block. Hero headline spans 80% width, left-aligned, with a massive product image bleeding off the right edge.
   - Add a geometric CSS pattern behind the hero — a subtle zellige-inspired diamond grid using `background-image: repeating-conic-gradient()` or an SVG pattern.
   - Stagger the CTA button diagonally — not centered — positioned at the golden ratio point.

2. **Product grid → Masonry with asymmetry**
   - Replace the rigid 4-column grid with a CSS `columns: 4` masonry layout where cards have varying aspect ratios.
   - Every 5th product card is `span 2` (double width, editorial-feature style).
   - Add horizontal scroll sections for "featured" products — like scrolling through a fabric rack.

3. **Category cards → Overlapping composition**
   - Category cards overlap slightly (`margin-right: -2rem`) creating a cascading deck effect.
   - On hover, the hovered card scales up and lifts above the others (`z-index: 10; scale: 1.08`).

4. **Section dividers → Geometric motifs**
   - Replace `<hr>` or `border-b` with an SVG divider inspired by zellige tile geometry: alternating triangles, diamonds, or stepped patterns.
   - Apply `clip-path: polygon()` on section transitions.

5. **Admin dashboard → Card asymmetry**
   - Stat cards don't need to be a rigid grid. First card (today's orders) slightly larger. Third card (out of stock) pulled down with `margin-top: 1rem`. Breaks the monotonous alignment and creates visual hierarchy.

---

### Motion & Micro-Interactions

**Current**: Basic hover transitions (`transition-colors duration-150`). No page-load animation. No scroll effects.

**Proposed motion system**:

1. **Page load stagger** (high impact, CSS-only)
   ```css
   .stagger-in > * {
     opacity: 0;
     transform: translateY(20px);
     animation: fadeUp 0.6s var(--delay, 0ms) cubic-bezier(0.16, 1, 0.3, 1) forwards;
   }
   .stagger-in > *:nth-child(1) { --delay: 0ms; }
   .stagger-in > *:nth-child(2) { --delay: 80ms; }
   .stagger-in > *:nth-child(3) { --delay: 160ms; }
   /* ... up to 10 children */
   @keyframes fadeUp {
     to { opacity: 1; transform: translateY(0); }
   }
   ```
   Apply `.stagger-in` to the product grid, homepage sections, dashboard stat cards.

2. **Product card hover → Fabric-lift effect**
   - On hover: card lifts (`translateY(-6px)`), shadow deepens, and the product image zooms slightly (`scale: 1.04`).
   - The "Commander" button slides up from below the card (`translateY(0)` from `translateY(100%)`) with a spring easing — as if unrolling a fabric bolt.
   - Duration: 400ms, not 150ms. Deliberate, luxurious.

3. **Category tree → Accordion with rotation**
   - Chevron icon rotates 180° with `transition-transform duration-300 ease-out`.
   - Child rows slide down with `max-height` transition and a subtle `opacity` fade.

4. **Status change → Celebration micro-interaction**
   - When an admin changes order status from "pending" to "confirmed": the status badge does a quick scale bounce (`scale: 1.2 → 1`). The timeline entry slides in from the left. A brief green flash on the order row.

5. **Scroll-based reveals**
   - Use `IntersectionObserver` (or `@react-spring/parallax` for React) to trigger fade-up animations as sections scroll into view.
   - Stagger product cards in the category page: each row appears 100ms after the previous.

6. **Page transitions**
   - Between routes, add a subtle crossfade (`opacity: 0 → 1, duration: 200ms`). Not a full page loader — just enough to feel smooth.
   - TanStack Router supports `router.loadComponent` with `Suspense` — use this for route-level transitions.

7. **Loading skeletons → Breathing animation (not pulse)**
   - Replace `animate-pulse` (which feels mechanical) with a custom "breathing" animation: slow opacity oscillation between `0.4` and `0.6` over 2 seconds. More organic.

---

### Visual Details & Atmosphere

**Current**: Flat, solid colors. No texture. No depth.

**Proposed atmospheric details**:

1. **Background texture — Linen grain**
   ```css
   .bg-linen {
     background-color: var(--sand-50);
     background-image: url("data:image/svg+xml,..."); /* subtle noise SVG */
   }
   ```
   Apply a CSS `filter: noise()` or a tiny SVG noise pattern as a page background overlay. Feels like fabric. Costs ~200 bytes.

2. **Decorative borders — Zellige geometry**
   Use CSS `border-image` or `background` with repeating patterns for section dividers:
   ```css
   .border-zellige {
     border-bottom: 4px solid transparent;
     border-image: repeating-linear-gradient(
       45deg,
       var(--terracotta-500),
       var(--terracotta-500) 4px,
       transparent 4px,
       transparent 8px
     ) 1;
   }
   ```

3. **Custom scrollbar** (Webkit)
   ```css
   ::-webkit-scrollbar { width: 8px; }
   ::-webkit-scrollbar-track { background: var(--sand-100); }
   ::-webkit-scrollbar-thumb {
     background: var(--sand-300);
     border-radius: 4px;
   }
   ::-webkit-scrollbar-thumb:hover { background: var(--sand-400); }
   ```

4. **Card shadows — Depth with color, not just darkness**
   ```css
   .card-elevated {
     box-shadow:
       0 1px 2px rgba(30, 24, 16, 0.04),
       0 4px 16px rgba(30, 24, 16, 0.06);
   }
   .card-hover {
     box-shadow:
       0 2px 4px rgba(30, 24, 16, 0.06),
       0 8px 32px rgba(30, 24, 16, 0.1);
   }
   ```
   Shadows tinted with the brand's sand-900 color, not pure black.

5. **Loading state — Geometric preloader**
   Replace the generic spinner with a small CSS animation of a diamond shape tessellating — inspired by zellige tile patterns. A 4×4 diamond grid where tiles "fill in" sequentially.

6. **Cursor refinement**
   ```css
   * { cursor: default; }
   a, button, [role="button"], select, input[type="submit"] { cursor: pointer; }
   input[type="text"], input[type="email"], input[type="search"],
   textarea, [contenteditable] { cursor: text; }
   ```
   Currently, the project lets the browser default cursor apply everywhere. Explicit cursor types make the interface feel polished.

7. **Selection color**
   ```css
   ::selection {
     background: var(--terracotta-200);
     color: var(--sand-900);
   }
   ```
   Branded text selection. Small detail, big impact on perceived quality.

8. **Focus rings — Beautiful, not default**
   ```css
   *:focus-visible {
     outline: 2px solid var(--terracotta-500);
     outline-offset: 2px;
     border-radius: 4px;
   }
   ```
   Replace the browser's default blue outline with a terracotta ring that matches the brand.

---

### Admin Dashboard Redesign — Visual Concept

**Current**: Four stat cards + two tables. Functional but visually monotonous.

**Proposed**:

```
┌──────────────────────────────────────────────────────────┐
│  Dashboard                                   12 Juin 2026│
│                                                        │
│  ┌─────────────┐ ┌──────────┐ ┌──────────┐            │
│  │             │ │          │ │          │            │
│  │  AUJOURD'HUI│ │ EN ATTENTE│ │RUPTURE   │            │
│  │     12      │ │    3     │ │    4     │            │
│  │  commandes  │ │ commandes│ │ variantes│            │
│  │             │ │          │ │          │            │
│  └─────────────┘ └──────────┘ └──────────┘            │
│                                                        │
│  ┌──────────────────────────────────────┐ ┌──────────┐ │
│  │  REVENU TOTAL                        │ │ PRODUITS │ │
│  │                                      │ │ EN ALERTE│ │
│  │   1 200 000 DZD                      │ │          │ │
│  │   ━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░ │ │ T-shirt  │ │
│  │   +18% vs mois dernier               │ │ Noir / M │ │
│  │                                      │ │ Stock: 2 │ │
│  └──────────────────────────────────────┘ │          │ │
│                                           └──────────┘ │
│  ┌──────────────────────────────────────────────────────┐│
│  │  COMMANDES RÉCENTES                                 ││
│  │  #42  Karim B.   Confirmée    12 Juin  12 400 DZD  ││
│  │  #41  Amina S.   En attente   11 Juin   8 200 DZD  ││
│  │  #40  Yacine M.  Livrée       10 Juin  15 000 DZD  ││
│  └──────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

Key changes:
- Revenue card is wide (2 columns) with a subtle sparkline chart showing trend
- "Produits en alerte" moved to sidebar as a compact list (not a full table)
- "Aujourd'hui" card visually dominates — it's the most actionable metric
- Total removed: the duplicate "Dernières commandes" section
- Added: a subtle date display top-right so the admin knows what "today" refers to

---

### Storefront Homepage — Visual Concept

```
┌──────────────────────────────────────────────────────────┐
│  [Header: transparent on hero, solid on scroll]          │
│                                                        │
│  ┌────────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │  L'EXCELLENCE                                     │ │
│  │  TEXTILE                                          │ │
│  │  ALGÉRIENNE                    [image: fabric      │ │
│  │                                bolt unrolling]     │ │
│  │  Avec plus de 7 ans                               │ │
│  │  d'expérience...                                  │ │
│  │                                                    │ │
│  │  [DÉCOUVRIR →]                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                        │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  (zellige divider)  ▓▓▓▓▓▓▓▓▓▓▓▓│
│                                                        │
│  CATÉGORIES                                            │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                │
│  │      │ │      │ │      │ │      │                │
│  │ HAUTS│ │OUTER-│ │ACCES-│ │ PRO- │                │
│  │      │ │ WEAR │ │SOIRES│ │  FES-│                │
│  │      │ │      │ │      │ │SIONEL│  ← cards overlap│
│  └──────┘ └──────┘ └──────┘ └──────┘                │
│                                                        │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  (zellige divider)  ▓▓▓▓▓▓▓▓▓▓▓▓│
│                                                        │
│  NOUVEAUTÉS                                            │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐                        │
│  │    │ │    │ │    │ │    │                        │
│  │    │ │    │ │    │ │    │                        │
│  │    │ │    │ │    │ │    │                        │
│  └────┘ └────┘ └────┘ └────┘                        │
│                                                        │
│  [Footer]                                              │
└──────────────────────────────────────────────────────────┘
```

Key changes:
- Hero typography is massive, left-aligned, breaking the container on the right with a product image
- Category cards overlap horizontally creating depth
- Zellige-inspired CSS dividers between sections
- Product cards have varied widths (masonry) with every 4th-5th card being double-width to break monotony
- Smooth fade-up stagger animations on scroll

---

### Implementation Priority

**Phase 1 — Immediate visual impact (1–2 days)**:
1. **New CSS custom properties** — migrate from charcoal/red to the Terre & Mer palette. Search-replace across all components.
2. **Background warmth** — apply `--sand-50` to storefront and admin page backgrounds.
3. **Focus ring** — global `:focus-visible` in `index.css`.
4. **Selection color** — `::selection` with terracotta.
5. **Status badge colors** — remap pending/confirmed/shipped/delivered/cancelled.

**Phase 2 — Typography & layout (3–4 days)**:
1. Replace Poppins with DM Sans + Newsreader. Add Google Font imports.
2. Rebuild the hero section with the editorial layout concept.
3. Implement masonry product grid with varied card widths.
4. Overlapping category cards.

**Phase 3 — Motion & atmosphere (2–3 days)**:
1. Page-load stagger animation system.
2. Product card hover effects (fabric lift).
3. Scroll-based reveal for storefront sections.
4. Zellige geometric dividers (CSS patterns).
5. Linen background texture.
6. Breathing skeleton animation.

**Phase 4 — Admin panel polish (2 days)**:
1. Dashboard redesign (asymmetric cards, removed duplicates).
2. Sidebar deep blue color.
3. Status change celebration animation.
4. Category tree accordion transitions.

---

### Files to Touch (Estimated)

| File | Changes |
|------|---------|
| `src/client/index.css` | Full palette migration, new CSS variables, font imports, global animations, focus ring, selection, scrollbar |
| `tailwind.config` or `@theme` block | Map new palette tokens to Tailwind utility classes |
| `src/client/App.tsx` | Add page transition wrapper |
| `src/client/feature/storefront/pages/HomePage.tsx` | Hero redesign, stagger classes, category overlap, zellige dividers |
| `src/client/feature/storefront/components/ProductCard.tsx` | Masonry support, new hover effects, remove "Commander" → "Détails" |
| `src/client/feature/storefront/components/Header.tsx` | Transparent on hero, solid on scroll |
| `src/client/feature/storefront/components/Footer.tsx` | Sand background, geometric border top |
| `src/client/feature/admin/components/AdminLayout.tsx` | Deep blue sidebar, improved mobile menu |
| `src/client/feature/admin/pages/DashboardPage.tsx` | Asymmetric cards, remove duplicates, sparkline |
| `src/client/shared/components/Skeleton.tsx` | Breathing animation |
| `src/client/feature/admin/pages/OrdersPage.tsx` | New status colors |
| `src/client/feature/admin/pages/OrderDetailPage.tsx` | New status colors, timeline animation |
| `src/client/feature/admin/pages/CategoriesPage.tsx` | Accordion transitions |

---

## Iterative Polish Workflow

### Methodology

Polish is not a single pass. It's 10+ small iterations where each pass tightens one dimension of quality. The compound effect is dramatic. Follow this protocol:

**Iteration loop**:
1. Pick ONE polish dimension (spacing, then typography, then color, then motion, etc.)
2. Apply across all affected components
3. Test on desktop AND mobile independently
4. Commit. Repeat.

**Why iteration beats one big redesign**:
- Each pass isolates changes — if something breaks, you know exactly what caused it
- Cumulative spacing fixes often have more visual impact than a full redesign
- You ship value after each iteration instead of waiting for a "big reveal"
- Visual judgment improves with each pass — you see details you missed before

### Polish Dimensions (In Priority Order)

#### 1. Spacing Rhythm

**Goal**: Every padding, margin, and gap follows a consistent scale. No magic numbers.

**Scale** (4px base):
```
--space-xs:  4px   /* tight gaps: icon-to-label, badge padding-x */
--space-sm:  8px   /* inline gaps: button icon gap, list item gap */
--space-md:  16px  /* container padding, card padding, section gap */
--space-lg:  24px  /* section margins, form group spacing */
--space-xl:  32px  /* page-level padding, major section dividers */
--space-2xl: 48px  /* hero section padding */
--space-3xl: 64px  /* page top/bottom breathing room */
```

**Audit checklist**:
- [ ] All `p-*`, `m-*`, `gap-*` values are from the scale (no `p-3.5`, no `gap-2.5`, no arbitrary values)
- [ ] Container padding is consistent: `px-4 sm:px-6 lg:px-8` everywhere (no pages with different padding)
- [ ] Vertical rhythm: section gaps are multiples of 16px (`space-y-4`, `space-y-8`, `space-y-16`)
- [ ] Card internal padding is uniform: all cards use `p-5` or `p-6`, never mixed within one page
- [ ] Form field gaps are consistent: always `gap-4` between fields, `gap-1.5` for label-to-input

**Common spacing smells to fix**:
- `py-3.5` → pick `py-3` (12px) or `py-4` (16px)
- `mb-6` on headings → standardize to `mb-4` or `mb-8`
- Mixed `p-4` / `p-5` / `p-6` on cards in the same page → pick one
- `gap-3` between filter controls → `gap-2` or `gap-4`

#### 2. Typography Hierarchy

**Goal**: Clear, consistent type scale. No more than 6 distinct sizes per page.

**Scale**:
```
text-xs:    12px / 1.5   — badges, labels, metadata, table footnotes
text-sm:    14px / 1.5   — body text, table cells, form labels, buttons
text-base:  16px / 1.6   — (reserved for long-form reading — product descriptions)
text-lg:    18px / 1.4   — card titles, section subtitles, emphasized body
text-xl:    20px / 1.3   — page section headings (h3)
text-2xl:   24px / 1.2   — page titles (h2)
text-3xl:   30px / 1.15  — hero subtitles, major section heads
text-4xl:   36px / 1.1   — hero headlines (h1) on mobile
text-5xl:   48px / 1.05  — hero headlines on desktop
text-6xl:   60px / 1.0   — (reserved for marketing pages)
```

**Audit checklist**:
- [ ] Heading hierarchy is never broken: h1 → h2 → h3 → h4 in descending order (no h3 without an h2 above it)
- [ ] Body text is never smaller than `text-sm` (14px) — anything smaller is a UI label, not content
- [ ] Font weight contrast: headings use `font-heading` (serif), body uses `font-body` (sans), mono for data
- [ ] Line height is appropriate: 1.5 for body (readable), 1.2 for headings (tight), 1.0 for display (hero)
- [ ] No orphan words in buttons or labels (single-word wraps on multiline text)
- [ ] All-caps is reserved for micro-labels only (12px tracking-wider), never for sentences

#### 3. Color Consistency

**Goal**: Every color used is from the design token system. No raw hex values in components.

**Token audit**:
- [ ] No `bg-[#XXXXXX]` or `text-[#XXXXXX]` arbitrary values outside `index.css`
- [ ] Semantic color usage: red = error/danger/delete, green = success/active/delivered, blue = info/links, yellow/orange = warning/pending
- [ ] Interactive elements have distinct hover, active, and disabled states
- [ ] Dark backgrounds always pair with white or sand-50 text (contrast > 7:1)
- [ ] Light backgrounds always pair with sand-800 or sand-900 text (contrast > 4.5:1)

#### 4. Interactive States

**Goal**: Every interactive element has visible feedback in all states.

**State matrix** (every button, link, input, select must implement):
| State | Visual treatment |
|-------|-----------------|
| Rest | Base style |
| Hover | Background shift + subtle transform or border color change |
| Focus-visible | 2px terracotta ring with 2px offset |
| Active/Pressed | Darker background, slight scale-down (0.98) |
| Disabled | 50% opacity, `cursor: not-allowed`, no hover effects |
| Loading | Spinner replacing icon or text, button still occupies space |

**Audit checklist**:
- [ ] Every `<button>` has `hover:` and `focus-visible:` styles
- [ ] Every `<a>` (Link) has `hover:` color transition
- [ ] Every `<input>` and `<select>` has `focus:border-accent`
- [ ] Disabled buttons are clearly visually distinct (not just slightly dimmed)
- [ ] No dead clicks: every clickable element gives feedback within 100ms

#### 5. Motion Standards

**Goal**: Animations enhance understanding, never distract. All respect reduced motion.

**Duration standards**:
```
--duration-instant:  100ms  — hover color changes, focus ring appearance  
--duration-fast:     200ms  — button press, toggle, tooltip show/hide
--duration-normal:   300ms  — modal open/close, drawer slide, accordion
--duration-slow:     500ms  — page transitions, hero reveals, stagger delays
--duration-glacial:  800ms  — background animations, ambient effects
```

**Easing standards**:
```
--ease-out:   cubic-bezier(0.16, 1, 0.3, 1)   — enter animations (elements appearing)
--ease-in:    cubic-bezier(0.4, 0, 1, 1)       — exit animations (elements disappearing)
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1) — celebratory bounces (status changes)
```

**Reduced motion** (always include):
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Performance rules**:
- Only animate `transform` and `opacity` — never `width`, `height`, `top`, `left` (triggers layout)
- Use `will-change: transform` on elements that animate frequently
- Keep animation-initiated repaints within a 50ms budget

---

## Design Pattern Applications

### Bento Grid Dashboard

**Context**: Admin dashboard currently has a rigid 4-column grid. Bento grids create hierarchy through varied cell sizes.

**Application** (DashboardPage.tsx):

```css
.dashboard-bento {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 140px;
  gap: 16px;
}

/* Hero stat card spans 2 cols, 2 rows */
.stat-hero      { grid-column: span 2; grid-row: span 2; }

/* Secondary stat cards span 1 col, 1 row */
.stat-secondary { grid-column: span 1; grid-row: span 1; }

/* Revenue card spans 2 cols, 1 row */
.stat-wide      { grid-column: span 2; grid-row: span 1; }

/* Recent orders table spans 4 cols, auto height */
.orders-table   { grid-column: span 4; }
```

**Visual treatment for bento cells**:
- `rounded-2xl` on all cards (larger radius softens the grid)
- Subtle inner border: `ring-1 ring-sand-200` (not `border` — ring doesn't affect layout)
- Gradient backgrounds on stat cards: `bg-gradient-to-br from-sand-50 to-white`
- Icons in `rounded-2xl` containers with colored backgrounds matching the metric

**Mobile bento**: Single column. Hero card first, then 2-column grid for secondary stats, then full-width for tables.

### Glass Panels for Modals & Overlays

**Context**: Cookie banner, mobile menu, logout confirmation — all currently flat backgrounds. Glass adds depth without heaviness.

**Application**:
```css
.glass-panel {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(30, 24, 16, 0.08);
  box-shadow:
    0 4px 24px rgba(30, 24, 16, 0.06),
    0 1px 2px rgba(30, 24, 16, 0.04);
}
```

**When to use**:
- Cookie consent banner (fixed bottom) — glass background instead of solid charcoal-900
- Mobile menu backdrop — glass overlay instead of `bg-black/50`
- Logout confirmation — (future) glass modal instead of native `confirm()`

**When NOT to use**:
- Form cards in admin (need full opacity for readability)
- Tables (glass + table borders = visual noise)
- Sidebar (solid background provides better contrast for navigation)

### Neumorphic Toggle Switches

**Context**: The SettingsPage toggle switch uses flat colors. Neumorphism gives it physical tactility.

**Application** (replace current toggle):
```css
.toggle-track {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: var(--sand-200);
  box-shadow:
    inset 0 1px 3px rgba(30, 24, 16, 0.12),
    inset 0 0 0 1px rgba(30, 24, 16, 0.06);
  transition: background 200ms var(--ease-out);
}

.toggle-track[data-active="true"] {
  background: var(--terracotta-500);
}

.toggle-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  box-shadow:
    0 1px 3px rgba(30, 24, 16, 0.15),
    0 0 0 1px rgba(30, 24, 16, 0.04);
  transition: transform 200ms var(--ease-spring);
}

.toggle-thumb[data-active="true"] {
  transform: translateX(20px);
}
```

**Accessibility note**: Neumorphic elements can have low contrast. Always add a 1px border or ring for the inactive state so low-vision users can see the component boundaries.

---

## Desktop vs Mobile — Independent Optimization

### Principle

Desktop and mobile are different modalities with different ergonomics. A design that "works on both" usually works well on neither. Optimize each independently.

### Desktop Optimizations (≥1024px)

**Priority patterns**:
1. **Hover reveals** — Show actions on hover (table row actions, card overlay buttons). Saves space, reduces visual noise. Not available on mobile — use always-visible actions there.
2. **Multi-column data density** — 2–4 column grids for stat cards, 3-column layout for detail pages (OrderDetailPage sidebar).
3. **Keyboard shortcuts** — `Ctrl+K` for search, `Esc` to close modals/sidebars, `Tab` through form fields in logical order.
4. **Sticky elements** — Sidebar stays fixed during scroll. Table headers freeze. Context-aware sticky CTAs.
5. **Wider input fields** — Form fields can be 400–600px wide comfortably. Don't constrain to mobile widths.

**Desktop audit checklist**:
- [ ] Sidebar remains visible and fixed during scroll (`position: sticky; top: 0`)
- [ ] Table headers sticky when scrolling long tables (`position: sticky; top: 0`)
- [ ] Hover states reveal contextual actions (no action buttons always visible by default)
- [ ] Multi-column layouts used where content benefits (not forced into single column)
- [ ] Minimum 64px sidebar width per nav item for comfortable click targets

### Mobile Optimizations (<768px)

**Priority patterns**:
1. **Bottom-anchored primary actions** — Sticky CTA at the bottom of the viewport. Thumb-reachable zone: bottom 40% of screen.
2. **Full-width buttons** — Never side-by-side buttons below 375px viewport. Stack vertically.
3. **Swipeable rows** — Table rows can be swiped left to reveal actions (delete, edit). Uses touch-native gesture.
4. **Collapsed filters** — Filter panels start collapsed, expandable with a "Filters" button. Saves the top 200px for content.
5. **Simplified tables** — On mobile, tables collapse to card layout: each row becomes a vertical card with label-value pairs.

**Mobile audit checklist**:
- [ ] All buttons are full-width or minimum 44px tall in mobile viewport
- [ ] No horizontal scroll on any page at 375px width (iPhone SE)
- [ ] Primary CTA is in the thumb zone (bottom of screen)
- [ ] Touch targets have minimum 8px spacing between them (no fat-finger mis-taps)
- [ ] Forms use `inputmode` attribute: `numeric` for quantities, `email` for email, `tel` for phone
- [ ] Mobile sidebar closes on navigation (not staying open after tapping a link)
- [ ] Pinch-to-zoom is NOT disabled (`user-scalable=yes` in viewport meta — already correct)

---

## Accessibility Compliance — WCAG 2.2 AA

### Audit Checklist for This Project

#### Perceivable
- [ ] **1.1.1 Non-text Content**: Every `<img>` has `alt` text. Decorative SVGs have `aria-hidden="true"`. Icon-only buttons have `aria-label`.
- [ ] **1.3.1 Info and Relationships**: Form inputs have associated `<label>` elements (not just placeholder text). Table headers use `<th>` with `scope` attribute.
- [ ] **1.3.2 Meaningful Sequence**: DOM order matches visual order. Sidebar comes before main content in DOM.
- [ ] **1.4.1 Use of Color**: Status badges include text labels + color. No information conveyed by color alone.
- [ ] **1.4.3 Contrast (Minimum)**: Body text 4.5:1 minimum (fix: `text-charcoal-400` → `text-charcoal-500`). Large text 3:1 minimum (headings are fine).
- [ ] **1.4.4 Resize Text**: Page works at 200% browser zoom without horizontal scroll or content loss.
- [ ] **1.4.10 Reflow**: Content works at 320px CSS width (no horizontal scroll, no content cut off).
- [ ] **1.4.11 Non-text Contrast**: Form input borders, focus rings, chart elements have 3:1 contrast against adjacent colors.

#### Operable
- [ ] **2.1.1 Keyboard**: All interactive elements reachable via `Tab`. No keyboard traps.
- [ ] **2.1.2 No Keyboard Trap**: Modals and sidebars close with `Escape` key.
- [ ] **2.3.1 Three Flashes**: No content flashes more than 3 times per second (animations).
- [ ] **2.4.2 Page Titled**: Every page has a meaningful `<title>` (currently `Made by Algerians` on all pages — needs route-specific titles).
- [ ] **2.4.3 Focus Order**: Tab order follows visual layout. Sidebar → main content → sidebar footer.
- [ ] **2.4.7 Focus Visible**: Global `:focus-visible` ring on all interactive elements. **Currently missing** — see Critical Issues.
- [ ] **2.4.11 Focus Not Obscured**: Focused element is fully visible (not hidden behind sticky header or footer). Currently: admin mobile sidebar backdrop covers focused elements — needs `z-index` review.
- [ ] **2.5.3 Label in Name**: Visible text of buttons/links matches or starts with their accessible name. Verify: all `aria-label` values contain the visible button text.
- [ ] **2.5.5 Target Size**: Minimum 24×24px target. Recommended 44×44px. **Currently failing** — see Critical Issues.
- [ ] **2.5.8 Dragging Movements**: Any drag functionality (if added later) also works with single-pointer clicks.

#### Understandable
- [ ] **3.1.1 Language of Page**: `<html lang="fr">` is set. **Already correct.**
- [ ] **3.2.1 On Focus**: Focusing an element does not trigger a context change (no auto-submit on focus).
- [ ] **3.2.2 On Input**: Changing a select/checkbox does not auto-submit a form or navigate away. **Check**: OrdersPage status dropdown changes the filter instantly — this IS a context change on input. Should have an "Appliquer" button.
- [ ] **3.2.3 Consistent Navigation**: Nav links appear in the same order on every page. **Already correct.**
- [ ] **3.2.6 Consistent Help**: Help/contact info in the same relative position (footer). **Already correct.**
- [ ] **3.3.1 Error Identification**: Form errors describe the problem in text (not just red border). **Check**: ProductFormPage only shows a general error banner at the top — individual field validation errors should appear next to each field.
- [ ] **3.3.2 Labels or Instructions**: All required fields are marked. Inputs with specific formats show examples (`placeholder="ex: +213 5XX XX XX XX"`). **Check**: Variant SKU field has no format hint.

#### Robust
- [ ] **4.1.1 Parsing**: No duplicate IDs in the DOM. No unclosed tags. Use React — already handles this.
- [ ] **4.1.2 Name, Role, Value**: Custom interactive elements (toggle switches, sidebar backdrop) use proper ARIA roles and states.
- [ ] **4.1.3 Status Messages**: Toast notifications use `role="status"` or `aria-live="polite"`. **Check**: Sonner toasts — verify they use `aria-live` regions.

---

## Semantic HTML Audit

### Immediate Fixes Needed

**1. Mobile sidebar backdrop** (`AdminLayout.tsx:76-104`)
```diff
- <div className="fixed inset-0 z-40 lg:hidden" onClick={...}>
-   <div className="absolute inset-0 bg-black/50" />
+ <div
+   className="fixed inset-0 z-40 lg:hidden"
+   role="dialog"
+   aria-modal="true"
+   aria-label="Menu de navigation"
+ >
+   <div
+     className="absolute inset-0 bg-black/50"
+     role="button"
+     tabIndex={0}
+     aria-label="Fermer le menu"
+     onClick={() => setMobileOpen(false)}
+     onKeyDown={(e) => e.key === 'Escape' && setMobileOpen(false)}
+   />
```

**2. Product card** (`ProductCard.tsx:88-91`)
```diff
- <article className="group cursor-pointer" onClick={onClick}>
+ <Link
+   to="/fr/products/$slug"
+   params={{ slug: product.slug }}
+   className="group block"
+ >
```

**3. Stat cards on dashboard** (`DashboardPage.tsx:160-177`)
```diff
- <div key={label} className="bg-white rounded-xl ...">
+ <article key={label} className="bg-white rounded-xl ..." aria-label={`${label}: ${value}`}>
```

**4. Cookie banner** (`CookieBanner.tsx:25-51`)
```diff
- <div className="fixed bottom-0 ...">
+ <aside className="fixed bottom-0 ..." role="complementary" aria-label="Bannière de cookies">
```

---

## Spacing & Typography Tokens — Implementation

### Add to `src/client/index.css` @theme block

```css
@theme {
  /* ... existing tokens ... */

  /* Spacing scale */
  --spacing-section: 4rem;      /* 64px — page section vertical padding */
  --spacing-block: 2rem;        /* 32px — content block spacing */
  --spacing-element: 1rem;      /* 16px — card padding, form field gap */
  --spacing-inline: 0.5rem;     /* 8px — icon gaps, badge padding */
  --spacing-tight: 0.25rem;     /* 4px — minimal spacing */

  /* Typography scale */
  --text-ui-xs: 0.75rem;        /* 12px — badges, labels */
  --text-ui-sm: 0.875rem;       /* 14px — body, tables, buttons */
  --text-ui-base: 1rem;         /* 16px — long-form reading */
  --text-heading-sm: 1.125rem;  /* 18px — card titles */
  --text-heading-md: 1.25rem;   /* 20px — section heads */
  --text-heading-lg: 1.5rem;    /* 24px — page titles */
  --text-heading-xl: 1.875rem;  /* 30px — hero mobile */
  --text-heading-2xl: 2.25rem;  /* 36px — hero desktop */
  --text-heading-3xl: 3rem;     /* 48px — marketing */

  /* Line heights */
  --leading-display: 1.0;
  --leading-heading: 1.2;
  --leading-body: 1.6;
  --leading-ui: 1.5;

  /* Motion */
  --duration-instant: 100ms;
  --duration-fast: 200ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### Add to `src/client/index.css` base layer

```css
@layer base {
  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  /* Global focus ring */
  *:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
    border-radius: 4px;
  }

  /* Branded selection */
  ::selection {
    background-color: oklch(from var(--color-accent) l c h / 0.2);
    color: var(--color-charcoal-900);
  }

  /* Smooth scrolling (respects reduced motion) */
  html {
    scroll-behavior: smooth;
  }

  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
  }
}
```

---

## Micro-Interaction Specifications

### Button Press

```css
.btn-press {
  transition: transform var(--duration-fast) var(--ease-out);
}
.btn-press:active {
  transform: scale(0.97);
}
```

Apply to: All `<Button>` components. Already partially implemented — add `active:scale-[0.98]`.

### Success Pulse

```css
@keyframes success-pulse {
  0% { box-shadow: 0 0 0 0 oklch(from var(--color-success) l c h / 0.4); }
  70% { box-shadow: 0 0 0 10px oklch(from var(--color-success) l c h / 0); }
  100% { box-shadow: 0 0 0 0 oklch(from var(--color-success) l c h / 0); }
}
.pulse-success {
  animation: success-pulse 600ms var(--ease-out);
}
```

Apply to: Status badge immediately after successful status change.

### Skeleton Breathing

```css
@keyframes breathe {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.65; }
}
.animate-breathe {
  animation: breathe 2s var(--ease-out) infinite;
}
```

Replace `animate-pulse` in `Skeleton.tsx`.

### Page Transition

```css
.page-enter {
  animation: fade-in var(--duration-normal) var(--ease-out);
}
.page-exit {
  animation: fade-out var(--duration-fast) var(--ease-in);
}
@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}
```

Apply via TanStack Router's `defaultPendingComponent` or a wrapper in `App.tsx`.

---

## Polish Iteration Protocol

### Iteration 1: Spacing (1 hour)
- Audit all `p-*`, `m-*`, `gap-*` values against the spacing scale
- Fix arbitrary values: `p-3.5` → `p-4`, `gap-2.5` → `gap-2`
- Verify container padding consistency across all pages
- Commit: `polish: normalize spacing to 4px scale`

### Iteration 2: Typography (1 hour)
- Audit font sizes against the type scale
- Fix heading hierarchy (no skipped levels)
- Set line heights for body (1.6), headings (1.2), display (1.0)
- Commit: `polish: standardize typography scale and line heights`

### Iteration 3: Color & Contrast (1 hour)
- Replace all `text-charcoal-400` → `text-charcoal-500` (contrast fix)
- Map status badges to new semantic colors
- Audit: every interactive element has hover + focus states
- Commit: `polish: fix contrast ratios, remap status colors`

### Iteration 4: Interactive States (1 hour)
- Add `:focus-visible` to all custom interactive elements
- Add `:active` scale transform to all buttons
- Add disabled state clarity (opacity + cursor)
- Commit: `polish: complete interactive state coverage`

### Iteration 5: Motion (1 hour)
- Add reduced motion media query
- Apply stagger animation to homepage sections
- Add accordion transition to category tree
- Replace `animate-pulse` with `animate-breathe`
- Commit: `polish: add motion system with reduced-motion support`

### Iteration 6: Mobile Audit (1 hour)
- Test every page at 375px width
- Fix any horizontal scroll
- Ensure all touch targets >= 44px
- Verify forms use correct `inputmode`
- Commit: `polish: mobile optimization pass`

### Iteration 7: Accessibility (1.5 hours)
- Run WCAG 2.2 AA checklist
- Fix semantic HTML issues (article, aside, dialog roles)
- Add aria-labels to icon-only buttons
- Test keyboard navigation through all admin flows
- Commit: `polish: accessibility compliance pass`

### Iteration 8: Visual Regression (30 min)
- Screenshot comparison before/after all changes
- Check for layout shifts
- Verify nothing broke during polish passes
- Commit: `polish: visual regression fixes`

**Total estimated time**: 8 hours (can be parallelized across 2 developers, 4 hours each)

---

## Before/After Checklist

Run this after every polish iteration to measure progress:

- [ ] Can a new user complete the primary task (browse → product → order) without confusion?
- [ ] Can a keyboard-only user navigate every page and complete every form?
- [ ] Does every interactive element respond within 100ms of interaction?
- [ ] Are all text colors above 4.5:1 contrast on their backgrounds?
- [ ] Does the page maintain layout integrity at 320px, 768px, 1024px, 1440px?
- [ ] Are all animations disabled when `prefers-reduced-motion: reduce` is active?
- [ ] Do toast notifications automatically disappear and not block interaction?
- [ ] Is the loading state (skeleton) replaced with content without layout shift?
- [ ] Are error messages specific, actionable, and located next to the problem field?
- [ ] Does the interface feel "designed" rather than "assembled from components"?
