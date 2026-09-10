# PASSPro — Design System (`DESIGN.md`)

> **Version** 1.0 · **Date** 10/09/2026 · **Direction** Premium blue/white — sobre, dense, lisible à 2 mètres
> **Implémentation** Tailwind CSS 4 (tokens en variables `@theme`) + shadcn/ui · Police Inter via `next/font`
> **Périmètre** Back-office (dashboard, caisse, gestion) · Borne kiosk `/access` · Reçus thermiques 80 mm

## Sommaire

1. [Principes directeurs](#1-principes-directeurs)
2. [Palette](#2-palette)
3. [Typographie](#3-typographie)
4. [Fondations : espacement, rayons, ombres, focus](#4-fondations--espacement-rayons-ombres-focus)
5. [Composants](#5-composants)
6. [Layouts de pages](#6-layouts-de-pages)
7. [Motion](#7-motion)
8. [Icônes & formats de données](#8-icônes--formats-de-données)
9. [Accessibilité](#9-accessibilité)
10. [Règles anti-dérive](#10-règles-anti-dérive)

---

## 1. Principes directeurs

**Le bleu est une action, pas une décoration.** `#2563EB` est réservé aux actions primaires, aux liens, à l'onglet actif et à l'état d'information sélectionné. Un écran qui contient du bleu au hasard est un écran faux. Cette discipline unique est ce qui donne l'impression « premium » : l'œil sait instantanément où cliquer.

**Le blanc porte la page.** Les fonds sont blancs ou `#F6F8FB` ; la structure vient de la typographie, de l'espacement et de bordures 1 px d'un gris très léger — jamais de blocs colorés, jamais d'ombres empilées. La couleur vive est consommée par les états (succès, danger, alerte) et par les composants de décision, pas par la déco.

**Une décision se lit en 0,5 s.** Partout où l'opérateur doit trancher — résultat de scan, abonnement sur le point d'expirer, carte bloquée — la couleur sémantique domine la surface du composant (au moins 60 % de celui-ci) et le libellé est un verbe ou un état, jamais un jargon. Le vert et le rouge de la borne se voient de l'autre côté du tourniquet ; c'est une exigence fonctionnelle, pas un style.

**Les chiffres sont des données, pas du texte.** Tout montant, compteur, date et UID utilise des chiffres tabulaires (`tabular-nums`) pour rester aligné dans les tableaux et stable dans le temps. Un dashboard dont les colonnes de chiffres tremblent à chaque rafraîchissement n'est pas un dashboard premium.

**Une densité maîtrisée plutôt qu'un vide théâtral.** PASSPro est un outil de travail quotidien : tables à 48 px de hauteur de ligne, contrôles à 36 px, un maximum d'information utile par écran sans entassement. Le luxe vient de la précision des valeurs (grille de 4 px, rayons cohérents, deux niveaux d'élévation maximum), pas de grands espaces vides qui obligent à scroller.

---

## 2. Palette

### 2.1 Bleu primaire

| Token | Valeur | Usage |
|---|---|---|
| `--primary` | `#2563EB` | Bouton primaire, lien, onglet actif, filtre actif, focus |
| `--primary-hover` | `#1D4ED8` | Survol du bouton primaire, lien survolé |
| `--primary-active` | `#1E40AF` | État enfoncé (momentané) |
| `--primary-soft` | `#EFF6FF` | Fond d'élément actif (item de navigation, pille de filtre, avatar) |
| `--primary-border` | `#BFDBFE` | Bordure d'un élément actif/sélectionné |
| `--primary-ring` | `#93C5FD` | Anneau de focus (§4.4) |

### 2.2 Neutres (échelle slate)

| Token | Valeur | Usage |
|---|---|---|
| `--bg-page` | `#F6F8FB` | Fond de l'application (derrière les surfaces) |
| `--surface` | `#FFFFFF` | Cartes, tables, modals, sidebar |
| `--surface-alt` | `#F8FAFC` | En-tête de table, survol de ligne, zone secondaire |
| `--border` | `#E2E8F0` | Bordures par défaut (cartes, séparateurs, sidebar) |
| `--border-strong` | `#CBD5E1` | Bordure d'input au repos |
| `--text` | `#0F172A` | Texte principal, valeurs, titres |
| `--text-secondary` | `#475569` | Libellés de champs, texte de corps secondaire |
| `--text-tertiary` | `#64748B` | Aides, métadonnées, en-têtes de table |
| `--text-disabled` | `#94A3B8` | Texte désactivé, placeholders, labels de groupe |

### 2.3 Sémantiques

| Token | Base | Fond | Bordure | Usage |
|---|---|---|---|---|
| Succès | `#059669` | `#ECFDF5` | `#A7F3D0` | Accès autorisé, encaissement confirmé, statut `ACTIVE` |
| Danger | `#DC2626` | `#FEF2F2` | `#FECACA` | Accès refusé, carte bloquée, statut `EXPIRED`, suppression |
| Alerte | `#D97706` | `#FFFBEB` | `#FDE68A` | Statut `EXPIRING_SOON`, alertes WARNING, progression < 50 % |
| Information | = primaire | `#EFF6FF` | `#BFDBFE` | Notifications INFO, états neutres informatifs |

Le danger sémantique (`#DC2626`) est distinct du bleu d'action — la suppression d'un adhérent n'est jamais un bouton bleu. Le niveau `DANGER` d'une alerte et le rouge du refus de scan partagent le même token : une seule signification du rouge dans tout le produit.

### 2.4 Gradients — usage restreint

Un seul gradient existe dans le produit : `linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)` (token `--grad-brand`). Il est réservé à deux surfaces : le fond de l'état idle de la borne kiosk et la carte du badge RFID virtuel. Tout autre usage est interdit — pas de gradient sur boutons, textes, en-têtes ou cartes standard. C'est cette rareté qui rend les deux surfaces concernées mémorables.

### 2.5 Contrastes vérifiés (WCAG)

| Association | Ratio | Verdict |
|---|---|---|
| `#0F172A` sur `#FFFFFF` | 17,9:1 | AAA — texte principal |
| `#FFFFFF` sur `#2563EB` | 4,6:1 | AA — texte de bouton primaire |
| `#64748B` sur `#FFFFFF` | 4,8:1 | AA — texte secondaire |
| `#1D4ED8` sur `#EFF6FF` | 7,0:1 | AAA — élément de navigation actif |
| `#D97706` sur `#FFFBEB` | 3,3:1 | Réservé aux pilles ≥ 12 px en gras et aux icônes — jamais au corps de texte |
| `#FFFFFF` sur `#059669` | 3,0:1 | Kiosk uniquement : texte ≥ 24 px gras (grand texte AA) |

---

## 3. Typographie

### 3.1 Familles

- **Inter** pour toute l'interface — UI, titres, tables, reçus. Auto-hébergée via `next/font` (aucun flash de texte non stylé, aucun appel externe).
- **JetBrains Mono** pour les identifiants techniques : UIDs de badges, numéros de reçu (`REC-2026-0001`), IDs d'enregistrements. Le monospace signale visuellement « ceci est une donnée technique, pas un nom ».

### 3.2 Échelle

| Token | Taille / interligne | Poids | Usage |
|---|---|---|---|
| `display` | 48 / 1,1 | 700 | Résultat de scan kiosk (ACCÈS AUTORISÉ / REFUSÉ), horloge kiosk |
| `h1` | 30 / 1,2 | 600 | Titre de page (une seule fois par vue) |
| `h2` | 24 / 1,25 | 600 | Titre de section majeure, nom de l'adhérent en dossier |
| `h3` | 20 / 1,3 | 600 | Titre de carte, nom de formule |
| `body-lg` | 16 / 1,5 | 400 | Donnée importante dans un dossier (dates d'abonnement) |
| `body` | 14 / 1,5 | 400 | Texte par défaut de l'UI, cellules de table |
| `small` | 13 / 1,45 | 400 | Aides, métadonnées, secondaires |
| `caption` | 12 / 1,4 | 500 · majuscules · `letter-spacing: 0.04em` | Labels de KPI, labels de groupe de navigation |
| `mono` | 13 / 1,4 | 400 | UIDs, numéros de reçu |

### 3.3 Règles

- **Chiffres tabulaires obligatoires** (`font-variant-numeric: tabular-nums`) sur tout montant, compteur, date, pourcentage, colonne numérique de table, et sur les valeurs du kiosk. Implémenté une fois dans la classe utilitaire `.nums`.
- La hiérarchie vient de la taille et du poids 600 — jamais de soulignement décoratif, jamais de gras systématique, jamais de majuscules en dehors des labels `caption`.
- Titres en casse normale avec accentuation correcte (« Derniers passages », pas « DERNIERS PASSAGES »). Les majuscules sont l'apanage des seuls labels `caption` de 12 px.
- Montants formatés par `lib/money.ts` : espace fine insécable comme séparateur de milliers, devise en suffixe (`5 500 DA`), pas de symbole décimal tant que la devise travaille en unités entières.

---

## 4. Fondations : espacement, rayons, ombres, focus

### 4.1 Espacement — grille de 4 px

Échelle complète : 4, 8, 12, 16, 20, 24, 32, 40, 48, 64. Pas d'autre valeur. Repères usuels : 8 entre un label et son champ, 16 dans un composant (padding interne), 24 entre cartes et padding de page, 32 entre sections du dashboard, 48 au-dessus d'une pagination.

### 4.2 Rayons

| Token | Valeur | Usage |
|---|---|---|
| `radius-sm` | 6 px | Inputs, selects, cellules interactives |
| `radius-md` | 8 px | Boutons, items de navigation, carrés d'icônes |
| `radius-lg` | 10 px | Cartes, conteneur de table |
| `radius-xl` | 12 px | Modals, popovers, toasts |
| `radius-full` | 999 px | Pilles de statut, filtres, avatars |

### 4.3 Ombres — deux niveaux, pas plus

| Token | Valeur | Usage |
|---|---|---|
| `shadow-xs` | `0 1px 2px rgba(15,23,42,.06)` | Cartes au repos |
| `shadow-md` | `0 4px 12px rgba(15,23,42,.08)` | Éléments survolés/ouverts (dropdown, carte badge) |
| `shadow-lg` | `0 12px 32px rgba(15,23,42,.14)` | Modals uniquement |
| `shadow-glow` | `0 0 0 1px rgba(37,99,235,.2), 0 8px 40px rgba(37,99,235,.25)` | Résultat de scan kiosk uniquement |

Toute ombre est neutre (teinte slate), sauf le glow du kiosk. Interdiction d'empiler : un élément porte exactement un token d'ombre. Les bordures 1 px `#E2E8F0` font la séparation ordinaire ; l'ombre ne sert qu'à l'élévation.

### 4.4 Focus — jamais retiré

`outline: 2px solid #93C5FD; outline-offset: 2px` sur tout élément focusable, dans toutes les vues y compris la borne. Un composant sans focus visible est un bug bloquant, pas un détail de finition.

### 4.5 Densité

Tables : 48 px par ligne (44 px minimum). Contrôles : 36 px standard, 32 px compact, 44 px pour les actions principales. Zone tactile de la borne : ≥ 56 px. Sidebar : 240 px. Topbar : 64 px. Ces mesures ne se négocient pas composant par composant.

---

## 5. Composants

Chaque spécification donne : anatomie, variantes, états, et une règle d'usage non négociable. Les composants de base s'appuient sur shadcn/ui (restylés avec les tokens ci-dessus) ; les composants métier vivent dans `components/business/`.

### 5.1 Button

Anatomie : icône optionnelle 16 px (20 px en lg) + libellé. Largeur = contenu + padding 16 px (jamais de bouton étiré sauf pleine largeur explicite).

| Variante | Repos | Survol | Usage |
|---|---|---|---|
| Primary | fond `--primary`, texte blanc | `--primary-hover` | Une seule par vue : « Encaisser », « Renouveler », « Créer un adhérent » |
| Secondary | fond blanc, bordure `--border-strong`, texte `--text` | fond `--surface-alt` | Actions secondaires de la barre d'outils |
| Ghost | transparent, texte `--primary` | fond `--primary-soft` | Actions inline de table, « Annuler » de modal |
| Danger | fond `--danger`, texte blanc | `#B91C1C` | Suppression définitive — confirmation par modal obligatoire |
| Danger-soft | fond `#FEF2F2`, texte `--danger` | bordure `#FECACA` | Blocage de carte, suspension d'abonnement (réversibles) |

Tailles : `sm` 32 px / 13 px, `md` 36 px / 14 px (défaut), `lg` 44 px / 15 px (actions de caisse et de kiosk), `icon` 36 × 36. États : loading conserve la largeur et remplace le libellé par un spinner 16 px ; désactivé = fond `#E2E8F0`, texte `#94A3B8`, curseur non-autorisé. Règle : le bouton primaire d'une vue porte le verbe de l'action métier, jamais « OK » ni « Valider ».

### 5.2 Field (label + input + aide)

Label 13 px / 500 `--text-secondary` au-dessus du champ, gap 8. Input 36 px, `radius-sm`, bordure `--border-strong` → survol `#94A3B8` → focus bordure `--primary` + ring §4.4. Placeholder `--text-disabled`. Aide 12 px `--text-tertiary` sous le champ ; erreur 12 px `--danger` avec icône 14 px — l'erreur remplace l'aide, elle ne s'ajoute pas. Champs UID et numéro de reçu en JetBrains Mono. Largeurs fixées par le contenu attendu (téléphone : 200 px ; email : pleine largeur) — pas d'input largeur-auto.

### 5.3 StatusPill (pille de statut)

Hauteur 22 px, padding horizontal 10, `radius-full`, 12 px / 600. C'est la représentation **unique** de tout statut — table, dossier, fil d'activité utilisent le même composant.

| Statut | Fond | Texte | Bordure |
|---|---|---|---|
| `ACTIVE` | `#ECFDF5` | `#047857` | `#A7F3D0` |
| `EXPIRING_SOON` | `#FFFBEB` | `#B45309` | `#FDE68A` |
| `EXPIRED` | `#FEF2F2` | `#B91C1C` | `#FECACA` |
| `SUSPENDED` | `#F1F5F9` | `#475569` | `#E2E8F0` |
| `CANCELLED` | `#FFFFFF` | `#94A3B8` | `#E2E8F0` |
| Carte `BLOCKED` | `#FEF2F2` | `#B91C1C` | `#FECACA` |
| Carte `UNASSIGNED` | `#F1F5F9` | `#64748B` | `#E2E8F0` |

Règle : une pille affiche exactement un statut en libellé français (« Actif », « Expire dans 5 j », « Expiré », « Bloquée ») — jamais icône + texte + couleur redondants, jamais le code enum brut.

### 5.4 Table

Conteneur : carte `radius-lg`, en-tête collant en haut du conteneur lors du défilement. En-tête 40 px, fond `--surface-alt`, texte 12 px / 600 `--text-tertiary`, casse normale. Lignes 48 px, séparateur 1 px `#F1F5F9`, survol `--surface-alt`. Colonnes numériques alignées à droite en `tabular-nums` ; colonne d'actions alignée à droite avec boutons ghost apparaissant au survol de ligne. Ligne d'adhérent entièrement cliquable (curseur pointer) vers le dossier. État vide : composant EmptyState §5.10, jamais une cellule « Aucun résultat » perdue dans la table. Pagination sous la table : « 1–20 sur 143 » en 13 px + deux boutons icon 32 px.

### 5.5 Card

Fond `--surface`, bordure 1 px `--border`, `radius-lg`, padding 20 (interne) / 24 (page), `shadow-xs`. En-tête interne : titre 14 px / 600 à gauche, action (lien ghost ou icon button) à droite, gap 16 avec le contenu. Une carte = un sujet ; deux sujets = deux cartes, pas de cartes gigognes.

### 5.6 KpiCard

Anatomie verticale, gap 8 : label `caption` 12 px → valeur 28 px / 600 `tabular-nums` → contexte 12 px `--text-tertiary` (« +3 hier », « dont 5 bloquées »). À gauche de la valeur : carré 36 px `radius-md` fond `--primary-soft` avec icône 20 px `--primary`. Variante alerte (KPI « Expirent bientôt », « Cartes bloquées ») : carré fond `#FEF2F2`, icône `--danger`. Cliquable vers la liste filtrée correspondante. Grille dashboard : 6 KPI en 3 colonnes × 2 rangées (2 × 3 sur écran moyen).

### 5.7 Modal

Overlay `rgba(15,23,42,.4)` + flou 2 px. Panneau fond blanc, `radius-xl`, `shadow-lg`, largeurs : 480 px (formulaire), 640 px (reçu), 720 px (création adhérente avec deux colonnes). En-tête : titre 16 px / 600 + bouton close ghost 32 px. Pied aligné à droite : ghost « Annuler » + action primaire. Entrée : fondu + échelle 0,98 → 1 en 200 ms §7. Fermeture par Échap et clic overlay. Règle : une modal n'ouvre jamais une deuxième modal — la création rapide d'adhérent depuis la vente se fait par sélection élargie, pas par modal imbriquée.

### 5.8 Toast

Bas-droit, empilement maximum 3, largeur 360 px. Panneau blanc `radius-xl` `shadow-md`, barre gauche 3 px de la couleur sémantique, icône 20 px de la même couleur, titre 13 px / 600, détail 13 px `--text-tertiary`. Durées : 4 s (succès/info), 6 s (alerte/danger). Le toast d'encaissement porte l'action « Voir le reçu » qui ouvre le `ReceiptModal` — l'enchaînement vente → reçu doit pouvoir se faire sans retourner dans le journal de caisse.

### 5.9 SubscriptionProgress (barre de validité)

Piste 6 px `radius-full` fond `#E2E8F0`, remplissage uni (sans dégradé) : `--primary` au-delà de 50 % de validité restante, `#D97706` entre 20 et 50 %, `--danger` sous 20 %. À droite : « 17 j restants » en 12 px `tabular-nums`. Sous la piste : « 28/08/2026 → 27/09/2026 » en 13 px `--text-tertiary`. Utilisée dans le dossier adhérent et dans le suivi des abonnements.

### 5.10 SearchInput, FilterPills, EmptyState, Skeleton

- **SearchInput** : 280 px, icône loupe 16 px à gauche, raccourci `⌘K`/`Ctrl+K` en pille grise à droite sur le dashboard. Recherche instantanée (debounce 200 ms), pas de bouton « Rechercher ».
- **FilterPills** : hauteur 32 px, `radius-full`. Active : fond `--primary-soft`, bordure `--primary-border`, texte `#1D4ED8`. Inactive : fond blanc, bordure `--border`, texte `--text-secondary`. Une seule active par groupe (comportement radio).
- **EmptyState** : centré, icône 40 px dans un cercle 72 px fond `--surface-alt`, titre 14 px / 600, description 13 px `--text-tertiary`, action secondaire si pertinente. Jamais d'emoji, jamais d'illustration importée.
- **Skeleton** : fond `#F1F5F9`, `radius-sm`, shimmer 1,2 s. Formes réservées : barre de table = ligne de 48 px, carte KPI = rectangle 96 px. Les skeletons affichent la structure réelle de la page, pas des blocs génériques.

### 5.11 BadgeRFID (badge virtuel holographique)

Format carte ISO ID-1 : ratio 85,6:54, largeur d'affichage 320 px (dossier adhérent). Fond `--grad-brand`. Composition : motif d'ondes RFID en haut à droite (trois arcs concentriques, trait blanc opacité 0,18, espacement 10 px), nom du porteur en 16 px / 600 blanc en haut à gauche, UID en JetBrains Mono 14 px / 600 blanc, lettres espacées 0,12 em, en bas à gauche. Reflet premium statique : pseudo-élément bande diagonale 105° de `rgba(255,255,255,.12)` sur 30 % de la largeur — pas d'animation au repos. État bloqué : overlay blanc à 60 % + bandeau diagonal « BLOQUÉE » en 12 px / 700 `--danger`, et la pille de statut en bas à droite. `shadow-md`. Ce composant est la seule surface sombre du back-office : c'est voulu, il représente un objet physique.

### 5.12 ScanResult (décision plein écran kiosk)

Plein écran, deux variantes, texte lisible à 2 mètres minimum :

- **AUTORISÉ** : fond dégradé vertical `#059669` → `#047857`, icône check 96 px blanc dans cercle 128 px bordé blanc à 40 %, nom « AMINE BELKACEM » en `display` 48 px / 700 blanc (majuscules uniquement ici — affichage distance), formule 20 px blanc à 90 %, pille translucide blanche « Échéance : 27/09/2026 · 17 jours » en 16 px / 600.
- **REFUSÉ** : fond dégradé vertical `#DC2626` → `#B91C1C`, icône croix 96 px, motif de refus en 24 px / 600 blanc (« Abonnement expiré », « Carte bloquée »…), UID en mono 16 px blanc à 80 %, horodatage 14 px à 70 %.
- Transition d'entrée : fondu + échelle 0,96 → 1 en 400 ms `ease-out-expo` (§7), retour automatique à l'idle après 5 s, `aria-live="assertive"` pour les lecteurs d'écran, aucune interaction requise pour fermer.

### 5.13 Heatmap (affluence 7 j × 12 créneaux)

Grille CSS : lignes = jours (lun → dim), colonnes = créneaux de 2 h (06–08 → 22–24). Cellule 28 px, `radius-sm`, échelle de 5 paliers de bleu : `#F1F5F9`, `#DBEAFE`, `#93C5FD`, `#3B82F6`, `#1D4ED8` (seuils : 0, 1–4, 5–9, 10–14, 15+ passages). Survol : tooltip 13 px « Mar. 12 · 18–20 h · 23 passages ». Labels jours à gauche en 12 px `--text-tertiary`, créneaux en bas en 11 px `#94A3B8`. Aucune autre couleur que la gamme bleue — c'est un graphique de contexte, pas une alarme.

### 5.14 ReceiptModal (reçu thermique 80 mm)

Fenêtre 640 px : aperçu du reçu à gauche (fond `--surface-alt`, le reçu blanc centré), boutons à droite (ghost « Fermer », primary « Imprimer »). Le reçu : largeur utile 72 mm, `@page { size: 80mm auto; margin: 4mm }`, police Inter 12 px (13 px pour le total), structure — en-tête établissement 13 px / 700 centré (nom, adresse, téléphone), séparateur pointillé `border-dashed`, numéro de reçu en mono 12 px, date/heure, titulaire, formule et période de validité ligne à ligne, total 14 px / 700, mode de règlement, opérateur de caisse, pied `Setting.receiptFooter` centré. Mentions « DUPLICATA » en 12 px / 700 `--danger` en tête si réimpression. L'impression masque tout le reste via `@media print` — le reçu imprimé est identique à l'aperçu, c'est un critère de recette (§P5 du plan).

---

## 6. Layouts de pages

### 6.1 Shell applicatif (toutes les pages sauf `/login` et `/access`)

Trois zones fixes : **sidebar** 240 px à gauche, **topbar** 64 px en haut, **contenu** en dessous.

- **Sidebar** — fond blanc, bordure droite 1 px `--border`, pleine hauteur, scroll interne. Bloc logo : 64 px de haut, logotype « PASSPro » 16 px / 700 avec point bleu `--primary` (la seule fantaisie autorisée). Navigation en groupes séparés par un label `caption` 11 px `--text-disabled` : *Exploitation* (Tableau de bord, Borne d'accès, Journal des passages), *Gestion* (Adhérents, Abonnements, Formules, Cartes RFID), *Finances* (Caisse), *Système* (Notifications, Paramètres). Item : 36 px de haut, `radius-md`, icône 20 px, gap 12, texte 14 px `--text-secondary` ; actif : fond `--primary-soft`, texte et icône `#1D4ED8`, sans barre latérale ni autre ornement. En bas : bloc utilisateur (avatar initiales 32 px fond `--primary-soft`, nom 13 px / 600, rôle 11 px `--text-tertiary`) + bouton déconnexion.
- **Topbar** — fond blanc, bordure basse 1 px `--border`. À gauche : fil d'Ariane 13 px (`Gestion / Adhérents / Amine Belkacem`, dernier segment en 600). À droite : bouton recherche 280 px style SearchInput (ouvre la palette ⌘K), cloche avec pastille rouge `--danger` affichant le compte non lu (max « 9+ »), séparateur vertical, avatar utilisateur.
- **Contenu** — fond `--bg-page`, largeur maximum 1280 px centrée, padding 24 px, gap 24 px entre les blocs. Le titre de page (`h1` 30 px) et ses actions s'alignent sur une ligne au-dessus du contenu, gap 16 avec la suite.

### 6.2 Dashboard (`/`)

Ordre vertical strict, gap 24 :

1. **Rangée de 6 KpiCard** en grille 3 × 2 : Adhérents actifs · Expirent bientôt (variante alerte) · Expirés (variante alerte) · Passages aujourd'hui · CA du jour · CA du mois. La carte « Cartes bloquées » trouve place en contexte des cartes (§7.2 du plan — si 7 KPI s'affichent, la grille passe en 4 colonnes sur écran large).
2. **Deux colonnes (2fr / 1fr)** : à gauche la Heatmap dans une carte (« Affluence — 28 derniers jours ») ; à droite le widget de scan rapide (carte « Scan test » : champ UID mono + bouton primary « Vérifier », puis résultat compact avec la même sémantique que le kiosk, animation radar réduite à un anneau pulsé 320 px).
3. **Fil d'activité** pleine largeur : carte « Derniers passages » listant les 20 derniers scans — icône ronde 32 px verte/rouge (check/croix 16 px), nom de l'adhérent ou « Carte inconnue », UID mono, borne, heure relative, StatusPill du motif. Pied : lien ghost « Tout le journal → ».

### 6.3 Dossier adhérent (`/members/[id]`)

- **En-tête** (carte pleine largeur, 96 px de contenu) : avatar initiales 48 px, nom en `h2`, coordonnées 13 px `--text-tertiary` (téléphone · email · inscrit le JJ/MM/AAAA). À droite : StatusPill de l'abonnement courant + bouton primary « Renouveler » + menu ⋯ (Modifier, Suspendre l'abonnement, Supprimer). Le bouton « Renouveler » ouvre la vente pré-remplie — c'est le geste le plus fréquent de la page, il mérite le primaire.
- **Corps 2 colonnes (2fr / 1fr), gap 24** :
  - *Colonne principale* : carte « Abonnement en cours » (nom de formule `h3`, SubscriptionProgress, dates, mode de dernier renouvellement) → carte « Derniers passages » (table 8 lignes : date/heure, borne, StatusPill décision, lien « Tout voir ») → carte « Règlements » (table : date, numéro de reçu mono, formule, montant aligné droit, icône réimpression).
  - *Colonne latérale* : BadgeRFID + bloc de commandes carte (4 boutons secondary pleine largeur : Attribuer, Remplacer, Bloquer/Débloquer selon l'état, Retirer) → carte « Notes internes » (textarea en ligne, sauvegarde au blur, jamais imprimée sur les reçus) → bloc de danger bordé `#FECACA` : suppression de l'adhérent (danger-soft + modal de confirmation).

### 6.4 Listes (membres, cartes, abonnements, journal, caisse)

Gabarit unique : titre + actions en ligne 1, barre d'outils en ligne 2 (SearchInput 280 px à gauche, FilterPills au centre, action primaire à droite), table dans une carte en ligne 3, pagination en pied. Chaque liste ajoute ses spécificités : comptes d'état au-dessus de la table des cartes (trois KpiCard compacts : Actives / Bloquées / En stock), période en FilterPills sur la caisse (Aujourd'hui · Semaine · Mois · Tout) avec deux cartes de synthèse (Total encaissé, Transactions) entre la barre d'outils et la table, colonne « Source » (HARDWARE/SIMULATION) en 11 px mono sur le journal des passages.

### 6.5 Borne kiosk (`/access`) — trois états

- **Idle** : fond `--grad-brand` plein écran. En haut : logo établissement 16 px / 600 blanc à 80 %. Centre : anneau radar 320 px (cercle bordé blanc à 40 % avec deux anneaux pulsés, §7), horloge 96 px / 200 `tabular-nums` blanc, date complète 20 px blanc à 90 %, consigne « Présentez votre badge » 24 px / 500 à 40 px sous l'horloge. En bas : nom de la borne 13 px mono blanc à 60 %.
- **Résultat** : ScanResult §5.12 — la couleur sémantique occupe 100 % de l'écran.
- **Console de simulation** (mode simulation uniquement, accès réservé aux rôles ≥ RECEPTIONIST par long appui 2 s sur le logo) : tiroir latéral 320 px fond blanc, liste des scénarios (carte inconnue, carte bloquée, carte en stock, adhérent actif, adhérent expiré, adhérent suspendu) + champ UID libre. Le tiroir se referme et déclenche le scan comme du matériel.

Typographie kiosk : éléments de décision ≥ 64 px, contrastes blancs pleins, aucune donnée de gestion (prix, notes) sur la borne.

### 6.6 Paramètres (`/settings`)

Onglets internes (32 px, soulignement 2 px `--primary` sur l'actif) : *Établissement* (nom, téléphone, email, adresse — préview d'en-tête de reçu en direct à droite), *Général* (devise, fuseau, format de date), *Matériel* (nom de la borne, mode simulation toggle, option série), *Comptes* (table des opérateurs : nom, rôle en StatusPill grise, actif, actions ; création en modal 480 px), *Audit* (table paginée des actions sensibles). Chaque section sauvegarde explicitement (bouton primary en pied), jamais de sauvegarde automatique silencieuse sur ce qui figure sur les reçus.

---

## 7. Motion

Le mouvement informe, il ne divertit pas : chaque animation du produit annonce un changement d'état (élément apparu, décision rendue, contenu chargé). Aucune animation décorative en boucle en dehors du radar de la borne au repos.

| Interaction | Durée | Easing |
|---|---|---|
| Survol / focus / changement de couleur | 120 ms | `ease-out` |
| Entrée modal, popover, menu | 200 ms | `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo) |
| Sortie modal, toast | 150 ms | `ease-in` |
| Révélation du résultat de scan | 400 ms | `ease-out-expo` (fondu + échelle 0,96 → 1) |
| Radar idle (borne) | 2,4 s en boucle | `ease-in-out` (échelle 1 → 1,15, opacité 0,5 → 0) |
| Skeleton shimmer | 1,2 s en boucle | `linear` |

Règles : jamais de rebond ni de spring — un outil de caisse ne « gicle » pas ; jamais d'animation sur `width`/`height` (réserver `transform` et `opacity` pour ne pas accrocher le rendu du mini-PC) ; `prefers-reduced-motion` coupe le radar, le shimmer et réduit toutes les transitions à 0. Les bips kiosk (880 Hz succès / 220 Hz refus) ne sont pas du motion mais suivent la même logique : un signal, pas une ambiance.

---

## 8. Icônes & formats de données

### 8.1 Icônes

Bibliothèque **Lucide** exclusivement — stroke 1,75, angles arrondis, aucune bibliothèque mélangée. Tailles : 16 px (tables, inline), 20 px (boutons, navigation, KPI), 24 px (états vides). Couleur : héritée du texte du composant, jamais colorée indépendamment (exception : icônes sémantiques des toasts et du ScanResult, qui portent la couleur de leur état). Icônes métier fixées : `Users` adhérents, `CreditCard` cartes, `CalendarCheck` abonnements, `Tags` formules, `Receipt` caisse, `ScanLine` borne, `BellRing` alertes, `ShieldCheck` audit.

### 8.2 Formats fr-FR (implémentés dans `lib/money.ts` et `lib/dates.ts`)

| Donnée | Format | Exemple |
|---|---|---|
| Date | `dd/MM/yyyy` | 27/09/2026 |
| Date-heure | `dd/MM/yyyy HH:mm` | 27/09/2026 18:42 |
| Heure relative | « il y a 3 min » jusqu'à 24 h, puis date | il y a 3 min |
| Montant | espace fine insécable en séparateur, devise en suffixe | 5 500 DA |
| UID | mono, paires hex en majuscules, deux-points | 04:A3:2B:F1 |
| Numéro de reçu | mono | REC-2026-0001 |
| Pourcentage | espace avant le signe | 42 % |
| Jours restants | suffixe « j » | 17 j |

L'heure affichée est toujours celle de l'établissement (`Setting.timezone`) — jamais l'heure du navigateur du poste ni de la borne : deux postes ouverts sur le même log doivent lire la même seconde.

---

## 9. Accessibilité

- **Contrastes** : §2.5 — AA minimum partout, AAA sur le texte courant ; le couple ambre-sur-crème n'est jamais utilisé en corps de texte.
- **Focus** : visible en permanence (§4.4), ordre de tabulation logique (barre d'outils → table → pagination), Échap ferme modal et popover.
- **Cibles** : 44 px en back-office, 56 px sur la borne ; la borne n'exige aucune précision fine — elle est pilotée par les badges.
- **Lecteurs d'écran** : `aria-live="assertive"` sur le ScanResult et sur les toasts de niveau danger ; les StatusPill portent le statut en texte (pas uniquement par la couleur) ; tout champ a son label lié (`<label for>`).
- **Couleur jamais seule** : une erreur = texte + icône, un refus de scan = texte du motif + UID, une alerte = niveau textuel explicite. Le daltonien rouge/vert distingue AUTORISÉ de REFUSÉ au texte et à l'icône, avant même la couleur.

---

## 10. Règles anti-dérive

Ces interdictions sont le prix du look premium. Elles s'appliquent à tout développeur, tout patch, tout « quick fix » visuel.

**Autorisé** — un seul bouton primaire par vue ; des StatusPill pour tout statut ; du blanc dominant (≥ 80 % de la surface hors kiosk) ; Lucide comme seule source d'icônes ; les chiffres tabulaires partout où il y a des nombres ; un seul gradient (`--grad-brand`) sur deux surfaces.

**Interdit** — gradients sur boutons, textes ou cartes standard ; emojis dans l'UI ; ombres empilées ou colorées hors `shadow-glow` kiosk ; bordures de plus de 1 px ; polices autres qu'Inter et JetBrains Mono ; plus de deux niveaux d'élévation visibles simultanément sur un écran ; bleu `--primary` sur un texte non cliquable ; rouge décoratif sans sémantique de danger ; codes enum bruts à l'écran (`EXPIRING_SOON`, `CARD_BLOCKED`) ; composants redéfinis localement quand `components/ui/` en fournit un.

### Checklist de conformité (à passer avant chaque fusion)

1. Un seul bleu primaire actionnable par écran, et il porte un verbe métier.
2. Tout statut affiché est une StatusPill, aucun code enum brut visible.
3. Tous les montants et compteurs sont en `tabular-nums` et formatés par `lib/money.ts`.
4. Aucune heure affichée ne provient du navigateur (toujours `Setting.timezone`).
5. Focus visible vérifié au clavier sur la page modifiée.
6. Aucune nouvelle valeur hex en dehors de `DESIGN.md` et du fichier de tokens `@theme` — sinon, mettre à jour ce document d'abord.



