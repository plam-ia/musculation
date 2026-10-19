# Ma Muscu — V1

Application personnelle de suivi de musculation, en **bleu marine, doré et blanc**, sans photos ni écran d'accueil.

**Technologies :** site statique HTML/CSS/JavaScript (GitHub Pages), Supabase Auth + Postgres avec Row Level Security (RLS). Aucune installation Node/npm nécessaire.

## Ce qui fonctionne

- **Exercices :** bibliothèque d'exercices maîtrisés, regroupés en Haut du corps / Jambes / Fessiers / Core, muscles associés, commentaires, indication « Machine » uniquement si nécessaire ; ajout et modification sans limite prédéfinie, archivage sans perte d'historique.
- **Progression par exercice :** courbe unique de la charge maximale enregistrée à chaque date, **RIR en étiquette** (pas de courbe RIR), plus historique détaillé. Attention : les répétitions et le RIR pouvant varier, une augmentation de charge ne prouve pas à elle seule un gain de force.
- **Séances :** ajouter une séance vide (date, Maison/INSEP/ON AIR, durée facultative, commentaire). Ajouter ensuite des exercices à la volée ou plusieurs jours plus tard. Saisie rapide du nombre de séries, répétitions ou secondes, charge, RIR, et commentaire. Les séries sont ensuite modifiables individuellement.
- **Cas particuliers :** côté gauche/droite, travail des deux côtés, alternance avec comptage **total**, ainsi que saisie « Chaque jambe (G+D) » qui crée une série gauche et une série droite pour chaque numéro de série.
- **Stats :** navigation semaine par semaine, nombre de séances, séries et exercices réalisés ; volume par muscle principal sans double comptage ; évolution de charge exercice par exercice.
- **Connexion privée :** une adresse e-mail et un mot de passe, pas de bouton de création de compte. Les données de musculation sont dans Supabase, **pas dans le dépôt GitHub**.
- **Écran d'accueil iPhone :** icône personnalisée via le manifeste web.

La première connexion initialise automatiquement **21 exercices** issus de ton carnet (sans importer de fausses performances ou séances passées). Tu peux ensuite corriger ou compléter leurs noms, muscles et catégories.

## Installation étape par étape (sans terminal)

### 1. Préparer Supabase

1. Ouvre [supabase.com/dashboard](https://supabase.com/dashboard) et sélectionne ton **projet Supabase** (ou crée un projet si tu veux séparer Ma Muscu de tes autres applications).
2. Dans **Authentication > Users > Add user**, crée **ton seul utilisateur** (adresse e-mail + mot de passe). Selon les options de ton projet, tu peux choisir « Create new user » ou une invitation ; dans ce second cas termine le lien reçu par e-mail et définis le mot de passe.
3. Dans **Authentication > Settings / General configuration**, désactive **Allow new users to sign up**. Conserve la connexion e-mail/mot de passe activée ; laisse les connexions anonymes désactivées.
4. Dans **SQL Editor > New query**, copie intégralement le contenu de `schema.sql`, puis clique sur **Run**. Les quatre tables et leurs règles RLS sont créées.
5. Dans **Connect** ou **Project Settings > API Keys**, relève :
   - **Project URL**, comme `https://abcdefgh.supabase.co` ;
   - **Publishable key**, qui commence généralement par `sb_publishable_...` (une ancienne clé `anon` peut aussi fonctionner).

**Important :** n'utilise **jamais** une clé `service_role`, `sb_secret_...`, un mot de passe ou un secret de projet dans les fichiers de l'application. La clé *publishable* est conçue pour être exposée côté navigateur. Ce sont l'authentification et RLS qui rendent les données privées.

### 2. Configurer les fichiers

Ouvre `config.js` et remplace :

```js
window.MUSCU_CONFIG = {
  supabaseUrl: 'https://TON-ID-PROJET.supabase.co',
  supabasePublishableKey: 'sb_publishable_TA_CLE'
};
```

Enregistre le fichier. C'est **la seule modification obligatoire du code**.

### 3. Publier avec GitHub Pages

1. Sur [github.com](https://github.com), clique sur **New repository**.
2. Appelle-le par exemple `ma-muscu` (avec GitHub Free et Pages depuis une branche, le dépôt doit être **Public** ; le code sera public, mais **pas tes données Supabase**).
3. Décompresse l'archive fournie et ajoute **les fichiers contenus dans `muscu-v1` à la racine du dépôt**, avec **Add file > Upload files**. Tu dois voir `index.html`, `app.js`, `style.css`, `config.js`, `schema.sql`, les icônes et `manifest.webmanifest` directement dans le dépôt (pas à l'intérieur d'un sous-dossier).
4. Clique sur **Commit changes**.
5. Va dans **Settings > Pages** : choisis **Deploy from a branch**, branche `main`, répertoire `/(root)`, puis **Save**.
6. Patiente quelques minutes, puis ouvre l'adresse publiée, généralement :

   `https://TON-PSEUDO.github.io/ma-muscu/`

La publication GitHub Pages peut prendre quelques minutes, parfois jusqu'à une dizaine de minutes.

### 4. Première utilisation

1. Ouvre le lien du site et connecte-toi avec **l'adresse et le mot de passe du compte créé dans Supabase**.
2. L'onglet **Exercices** se remplit avec 21 mouvements issus de ta note (pas de séances historiques pré-remplies).
3. Vérifie ou modifie quelques fiches et le pictogramme Machine.
4. Dans **Séances**, ajoute une séance, par exemple la séance du 13/10, en choisissant sa date réelle ; complète-la avec tes performances connues, sans inventer de données.
5. Essaie le graphique dans **Exercices** et la navigation hebdomadaire dans **Stats**.

### 5. Mettre une icône sur l'iPhone

1. Ouvre **Safari** sur l'iPhone (et non un navigateur intégré à une autre application).
2. Accède à l'URL GitHub Pages et connecte-toi.
3. Utilise le bouton **Partager > Sur l'écran d'accueil** (ou **Ajouter à l'écran d'accueil**, selon la version d'iOS).
4. Nomme l'icône `Ma Muscu`, puis valide.

C'est une **application web installable (PWA)** : elle se comporte comme un raccourci dédié avec son icône, sans passage par l'App Store. Une **connexion Internet** est nécessaire pour lire/enregistrer tes séances.

## Sécurité — vérifier avant usage

- Les quatre tables ont RLS activé et chaque politique n'accorde l'accès qu'à `auth.uid() = user_id` pour un utilisateur **authentifié**.
- Les autorisations SQL de lecture/écriture de ces tables ont été **retirées** au rôle anonyme.
- Les références entre séances, exercices et séries incluent `user_id` pour empêcher de rattacher des objets appartenant à un autre utilisateur.
- Aucun formulaire d'inscription n'est présent et les inscriptions doivent être **désactivées dans le tableau de bord Supabase**, car cacher le bouton ne suffit pas à empêcher une inscription via l'API.
- **Test recommandé :** ouvre le site en navigation privée ; avant connexion, tu ne dois accéder qu'à l'écran de connexion. Vérifie ensuite dans Supabase que les tables ont bien RLS activé. Idéalement, teste une requête API anonyme et une requête d'un autre utilisateur dans un environnement de test.
- GitHub Pages est un **site public** ; ne mets jamais de données sportives privées, de mots de passe, de clés secrètes ou de photos personnelles dans le dépôt.

## Utilisation quotidienne

- Pendant l'entraînement : Séances > `+` > choisis lieu/date > Créer > Ajouter un exercice > renseigne tes séries > Valider. Tu peux laisser la durée vide jusqu'à la fin.
- Après l'entraînement : rouvre n'importe quelle séance et modifie sa date, sa durée ou ses séries.
- Pour un leg curl bilatéral : choisis « Deux jambes / bras ».
- Pour des fentes en avançant D/G et en comptant **25 au total** : choisis « Alternées (total) » et saisis **25** répétitions.
- Pour une presse unilatérale G et D à 3×10 : choisis « Chaque jambe (G+D) » (l'app enregistrera **six lignes de séries**, trois par jambe). Tu pourras ensuite modifier les charges et RIR séparément par côté.
- Pour un gainage : le champ de répétitions est automatiquement remplacé par **secondes**.
- Pour consulter la progression : Exercices > un mouvement > courbe avec les valeurs de charge (une ligne) et le RIR indiqué au-dessus de chaque point.

## Limites assumées de cette V1

- Pas de photos, d'IA, de planification obligatoire, d'accès hors-ligne ni de synchronisation Garmin.
- Pas d'import automatique des performances passées depuis Apple Notes. L'application est préchargée uniquement avec les **noms et attributs de 21 exercices**, à vérifier.
- Pour les exercices au poids de corps, la courbe **de charge** n'est pas représentative ; utilise le récapitulatif des répétitions/durées et des RIR dans leur historique.
- Le graphique retient la **charge la plus élevée** par date. Il ne corrige pas les différences de répétitions, de RIR, d'amplitude ou de machine.
- Les statistiques par muscle affectent chaque série à **un muscle principal** afin d'éviter les doubles comptages. Cela mesure des séries attribuées et non la charge biomécanique précise de chaque muscle.
- Les séries se sauvegardent en appuyant sur **Ajouter** ou **Enregistrer**, et non à chaque frappe. Un réseau instable peut empêcher l'enregistrement ; vérifie la confirmation affichée.
- Il n'y a pas de fonctionnalité de sauvegarde/export en un clic : réalise des sauvegardes/exportations périodiques depuis Supabase.
- Pas encore de test de connexion **réelle** sur ton Supabase : les parcours UI ont été simulés dans un navigateur. Teste RLS, création et modification avec ton projet avant de te reposer sur cette application pour toutes tes données.

## Fichiers

| Fichier | Usage |
|---|---|
| `index.html` | Page et ressources |
| `style.css` | Design bleu marine et doré, responsive iPhone |
| `app.js` | Bibliothèque, séances, graphiques, stats, connexion |
| `config.js` | URL et clé publique Supabase à renseigner |
| `schema.sql` | Tables, clés étrangères et politiques RLS |
| `manifest.webmanifest`, `icon.svg`, `icon-*.png` | Installation et icône iPhone |
| `.nojekyll` | Désactive le traitement Jekyll de GitHub Pages |

**Pour l'évolution :** tu peux ajouter des photos privées dans Supabase Storage plus tard, sans changer la structure des séances.
