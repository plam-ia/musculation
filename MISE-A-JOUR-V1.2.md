# MUSCU — mise à jour V1.2

## Installer la mise à jour sur ton application existante

**Tes séances et exercices restent dans Supabase : cette mise à jour ne supprime ni ne réinitialise tes données.**

1. Dans [Supabase](https://supabase.com/dashboard), ouvre le projet **musculation**, puis **SQL Editor > New query**.
2. Copie-colle le contenu de **`migration-v1.2.sql`**, puis clique sur **Run**. La contrainte des catégories est mise à jour pour autoriser « Mollets ».
3. Dans ton dépôt GitHub `plam-ia/musculation` (ou son nom réel), remplace **uniquement `app.js` et `style.css`** par ceux de l'archive de mise à jour, dans la racine du dépôt. GitHub : **Add file > Upload files > Commit changes**.
4. Attends quelques instants la publication GitHub Pages, puis recharge l'application sur Safari. Si l'ancienne version reste en cache, ferme puis rouvre la web-app.
5. Dans **Exercices**, sélectionne « Élévations mollets » et change sa catégorie en **Mollets** si tu le souhaites. Aucune catégorie d'exercice existant n'est modifiée automatiquement.

**Ne remplace surtout pas ton fichier `config.js` par celui d'une archive complète** : il contient déjà l'URL et la clé *publishable* de ton Supabase. Ne réexécute pas `schema.sql` pour cette mise à jour. La migration V1.2 suffit.

## Changements

- **Filtre conservé :** retour à l'onglet Exercices après ouverture/modification, sans revenir à « Tous ». La recherche de la liste générale est conservée indépendamment de celle utilisée pour choisir un exercice dans une séance.
- **Catégorie Mollets :** disponible dans les filtres et lors de la création/modification d'un exercice.
- **Salle :** l'indicateur « Machine » est renommé **Salle**, avec un badge légèrement rouge pour mieux l'identifier. La coche « Nécessite la salle » indique que tu n'as pas l'équipement nécessaire chez toi, même si ce n'est pas techniquement une machine.
- **Indice de progression :** remplace l'ancienne courbe de charge. Chaque point affiche le score, le nombre de répétitions **ou** la durée, les kg pertinents et le RIR ; un tableau permet de voir l'historique précis.
- **Stats :** les tendances par exercice utilisent le nouvel indice et non la dernière charge maximale.

## Comment lire l'indice de progression

**100 points = la première séance comparable enregistrée pour un exercice.** La courbe montre les changements relatifs par rapport à cette référence : 110 points signifie **+10 % de capacité estimée par rapport à la référence**, pas « 10 % de muscle de plus ».

Sur chaque date, le système sélectionne **la série avec la meilleure capacité estimée** pour l'exercice. Il n'additionne pas toutes les séries : une séance à 4 séries ne paraît pas artificiellement meilleure qu'une séance à 3 séries.

### Exercices avec charge (kg > 0)

`Capacité estimée = kg × [1 + min(30, répétitions + RIR) / 30]`

C'est une adaptation simplifiée de l'estimation d'une répétition maximale de type Epley. Le RIR représente les répétitions supplémentaires que tu aurais pu faire en gardant une technique correcte. **Exemple :** 73 kg × 10 à RIR 3 et 73 kg × 11 à RIR 2 donnent le même score : dans les deux cas tu estimes pouvoir faire 13 répétitions au total.

### Exercices au poids du corps sans charge externe

`Capacité estimée = répétitions + RIR`

Par exemple, 10 répétitions à RIR 2 → 12 répétitions possibles estimées ; 12 répétitions à RIR 1 → 13, ce qui fait passer l'indice de 100 à **108,3**.

### Exercices chronométrés

`Capacité indicative = durée en secondes × (1 + 0,025 × RIR)`

Par exemple, 45 s à RIR 2 → 50 s à RIR 2, l'indice passe de 100 à **111,1**. **Le RIR en exercices chronométrés n'est pas une mesure validée du temps restant** : le coefficient de 2,5 % est une convention légère choisie pour l'application. La durée réelle reste l'indicateur le plus fiable. À terme, tu pourrais noter des « secondes en réserve » à la place du RIR pour ces exercices.

Si tu fais un exercice chronométré avec différentes charges, seules les durées à **charge égale à celle de la date la plus récente** sont comparées ; si tu passes d'un exercice au poids du corps à un exercice chargé, l'indice suit uniquement les séries chargées à partir de cette référence. Un message s'affiche lorsque des séries sont exclues.

### Limites

- **Indice relatif par exercice** : 110 en leg curl n'est pas « mieux » ou « plus fort » que 105 en développé militaire. C'est une même *échelle de variation*, pas un classement entre muscles.
- Il reflète une estimation ponctuelle, **pas** le gain réel de force, de masse musculaire ou de performance sportive ; il dépend de l'amplitude, de la technique, du matériel, des repos et surtout de l'estimation subjective du RIR.
- La formule chargée est moins fiable pour les séries très longues. Une série avec RIR non saisi est calculée provisoirement avec RIR = 0 ; mieux vaut renseigner le RIR lorsque possible.
- Les côtés gauche/droite sont actuellement réunis : la meilleure série peut masquer un écart entre les membres. Ne t'en sers pas pour juger une asymétrie sans regarder l'historique.
- L'indice suit la **meilleure série** ; le volume total reste visible dans **Stats** et ne contribue pas au score.

## Sécurité et vérifications

Cette version **ne change ni les comptes ni les politiques RLS** et ne requiert aucune nouvelle clé. Le nouveau fichier SQL modifie seulement la liste des catégories autorisées. Après publication, vérifie que l'authentification fonctionne et que tu retrouves tes séances existantes. Les tests d'interface ont été faits sur des données simulées ; la connexion réelle à ton Supabase n'a pas été testée ici.
