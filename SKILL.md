# SKILL.md — MBA E-Commerce Project

## Règle Globale

À **chaque début de phase** et à **chaque prompt**, les skills opencode pertinents doivent être chargés avant toute action. Ce fichier liste les skills obligatoires et contextuels par domaine.

---

## Skills Obligatoires (à chaque prompt)

Avant de commencer toute tâche de code, charger ces 3 skills :

| Skill | Pourquoi |
|---|---|
| `vercel-react-best-practices` | Optimisation React/Next.js — performance, data fetching, bundle |
| `uxui-principles` | 168 principes UX/UI — éviter les antipatterns |
| `web-design-guidelines` | Conformité Web Interface Guidelines — accessibilité, design |

---

## Skills par Domaine

### Frontend — Storefront & Admin (Phases 3, 4, 5)

| Skill | Quand le charger |
|---|---|
| `frontend-design` | Création de composants, pages, layouts — design distinctif non générique |
| `impeccable` | Design system, polissage UI, refonte, audit visuel |
| `ui-ux-designer` | Wireframes, design system, accessibilité |
| `ui-ux-polish` | Cycles d'amélioration itérative UI/UX, responsive desktop/mobile |
| `ui-ux-reviewer` | Évaluation UX des interfaces (CLI, web, mobile) |

### Planification & Design (Phase 1, début de chaque phase)

| Skill | Quand le charger |
|---|---|
| `grill-me` | Stress-test du plan ou design avant implémentation |
| `find-skills` | Découverte de nouveaux skills utiles au projet |

### Recherche & Veille (Optionnel)

| Skill | Quand le charger |
|---|---|
| `last30days` | Tendances e-commerce, design, UX des 30 derniers jours |

---

## Workflow par Phase

### Phase 1 — Fondations
1. Charger `vercel-react-best-practices` + `uxui-principles` + `web-design-guidelines`
2. Charger `grill-me` pour valider l'architecture avant d'écrire le code
3. Exécuter les tâches

### Phase 2 — API Backend Core
1. Charger les 3 skills obligatoires
2. Exécuter les tâches (les skills frontend ne sont pas nécessaires ici)

### Phase 3 — Frontend Storefront
1. Charger les 3 skills obligatoires
2. Charger `frontend-design` + `impeccable` + `ui-ux-polish`
3. Charger `grill-me` pour valider le design de chaque page avant codage
4. Exécuter les tâches

### Phase 4 — Frontend Admin
1. Charger les 3 skills obligatoires
2. Charger `frontend-design` + `ui-ux-designer` (dashboard, formulaires complexes)
3. Charger `grill-me` pour valider l'UX admin
4. Exécuter les tâches

### Phase 5 — SEO & Optimisations
1. Charger les 3 skills obligatoires
2. Charger `ui-ux-reviewer` pour audit final
3. Charger `web-design-guidelines` pour conformité accessibilité
4. Exécuter les tâches

### Phase 6 — Production
1. Charger les 3 skills obligatoires
2. Charger `ui-ux-reviewer` pour vérification finale
3. Exécuter les tâches

---

## Règle d'Or

> **Ne jamais écrire une ligne de frontend sans avoir chargé `frontend-design` + `impeccable` au préalable.**

> **Ne jamais finaliser une phase sans avoir passé le code au crible de `uxui-principles` et `web-design-guidelines`.**
