# Le Relais DOTR

Site statique (HTML/CSS/JS, sans serveur) qui rassemble les documents des équipes commerciales et communication de Docs On The Road, présentés le long de **La Route du Relais**.

## Mettre en ligne (une seule fois)
1. Créez un dépôt GitHub (ex. `relais-dotr`), puis glissez-y **tout le contenu de ce dossier** (y compris `.github` et `.nojekyll`). Les fichiers de plus de 25 Mo : utilisez GitHub Desktop.
2. *Settings ▸ Pages ▸ Deploy from a branch ▸ main ▸ / (root)*.
3. Le site est en ligne à l'adresse `https://<compte>.github.io/<dépôt>/`.

## Espace équipe : ajouter, remplacer, supprimer depuis le site
1. Sur GitHub, créez un jeton **fine-grained** limité à ce dépôt, permission *Contents : Read and write*.
2. Ouvrez `outils/configurer-acces.html` (double-clic), collez le jeton : la page crée deux codes (contributeur, administrateur) et le fichier `acces.json`.
3. Déposez `acces.json` dans le dossier `data` du dépôt.
Le contributeur ajoute et remplace ; l'administrateur supprime aussi. Le jeton est chiffré (AES-GCM, PBKDF2 600 000 itérations) : il n'est lisible qu'avec un code. La séparation des rôles est une protection d'usage, pas une barrière technique : ne donnez les codes qu'à des personnes de confiance. Pour couper un accès : révoquez le jeton sur GitHub et recréez-en un.

## Structure
- `documents/<rubrique>/<dossier>/fichier` : une rubrique = une bulle, un dossier = un groupe.
- `data/config.json` : nom du site, rubriques, **route** (les huit relais), parcours « Je veux… ».
- `data/meta.json` : titres, descriptions, tags. `data/liens.json` : liens externes. `data/acces.json` : espace équipe.
- `.github/workflows/catalogue.yml` : régénère `data/catalogue.js` (et les vignettes) à chaque changement dans `documents/` ou `data/`.

## Confidentialité
GitHub Pages gratuit publie un site **public** (non référencé par Google, mais accessible à qui a l'adresse). Ne déposez ni données personnelles, ni mots de passe. Pour un accès restreint : Cloudflare Pages + Access.

## Limites
Site ≤ 1 Go, fichiers ≤ 25 Mo depuis le site, jeton GitHub à renouveler avant son expiration.
