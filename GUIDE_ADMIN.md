# Guide d'administration — Made by Algerians

## Accès

1. Aller sur `https://madebyalgerians.com/admin/login`
2. Saisir l'email et le mot de passe administrateur
3. La session dure 15 minutes (renouvellement automatique)

---

## Dashboard

Page d'accueil de l'administration avec :

- **Aujourd'hui** : nombre de commandes du jour
- **En attente** : commandes en statut "pending"
- **Rupture de stock** : variantes avec stock à zéro
- **Revenu total** : somme des commandes livrées

**Produits en alerte** : variantes avec moins de 5 unités en stock.

**Dernières commandes** : les 10 commandes les plus récentes. Cliquer sur le numéro pour voir le détail.

---

## Commandes

### Liste
- Filtrer par statut, rechercher par nom/email, filtrer par date
- Cliquer "Voir" pour accéder au détail

### Détail d'une commande
- Infos client, produits commandés, notes éventuelles
- **Timeline des statuts** : historique complet des changements
- **Changer le statut** :
  - `pending → confirmed` : confirmer la commande (décrémente le stock automatiquement)
  - `confirmed → shipped` : marquer comme expédiée
  - `shipped → delivered` : marquer comme livrée
  - `cancelled` : annuler (possible avant expédition uniquement)

**Workflow recommandé** :
1. Nouvelle commande arrive (statut `pending`)
2. Appeler le client pour confirmer
3. Passer en `confirmed` (le stock se décrémente automatiquement)
4. Une fois expédiée → `shipped`
5. Une fois livrée → `delivered`

---

## Produits

### Créer un produit
1. Cliquer "Ajouter un produit"
2. Renseigner : Nom, Slug (généré automatiquement), Description
3. Sélectionner la catégorie
4. Activer "Prix par quantité" si besoin
5. **Matrice de variants** :
   - Saisir les couleurs (ex: "Noir,Blanc,Rouge") et les tailles (ex: "S,M,L,XL")
   - Cliquer "Générer la matrice" pour créer toutes les combinaisons
   - Remplir le prix, stock et SKU pour chaque ligne
   - Supprimer les combinaisons invalides avec le bouton X
6. Si prix par quantité est activé, ajouter des paliers (quantité minimum → prix)
7. Cliquer "Créer"

### Modifier un produit
- Cliquer "Modifier" sur la ligne du produit
- Modifier les champs souhaités
- Cliquer "Mettre à jour"

### Archiver un produit
- Cliquer "Archiver" → le produit n'apparaît plus sur le site

---

## Catégories

- **Ajouter** : cliquer "Ajouter une catégorie", remplir le formulaire
- **Modifier** : cliquer "Modifier" sur la catégorie
- **Désactiver** : cliquer "Désactiver" (impossible si la catégorie contient des produits)
- Les sous-catégories sont indentées sous leur parent (max 2 niveaux)

---

## Paramètres

### Informations boutique
- Nom, email de contact, devise (DZD), téléphone, réseaux sociaux

### Champs du formulaire de commande
- Gérer les champs affichés sur le formulaire de commande (nom, email, téléphone, etc.)
- Ajouter/supprimer des champs, changer le type (texte, email, téléphone, zone de texte, dropdown, case à cocher)
- Réorganiser l'ordre via le champ "Ordre"
