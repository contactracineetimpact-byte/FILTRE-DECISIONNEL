# Le Filtre — outil décisionnel personnel

Filtre rapide (5 questions Oui/Non) pour rationaliser une décision avant d'agir, avec 3 catégories (Dépense / Social / Autre), branchement selon réversibilité, et tag de diagnostic CSR à 4 racines (Je ne peux pas / Je ne sais pas / Je n'ose pas / Je ne veux pas vraiment) + option "choix sain".

## Installation

```bash
npm install
npm run dev
```

Ouvre ensuite l'URL locale affichée (en général http://localhost:5173).

## Déploiement sur Vercel

1. Pousse ce dossier sur un repo GitHub.
2. Sur vercel.com → "New Project" → importe le repo.
3. Vercel détecte automatiquement Vite (`npm run build`, dossier de sortie `dist`). Aucune config supplémentaire nécessaire.

## ⚠️ Important : stockage des données

L'historique des décisions est sauvegardé en `localStorage`, **local à l'appareil et au navigateur utilisés**. Concrètement :

- Si tu remplis des décisions sur ton téléphone ET sur ton PC, ce sont deux historiques séparés.
- Vider le cache du navigateur ou changer d'appareil efface l'accès à l'historique (les données restent sur l'ancien appareil, mais ne se synchronisent pas).
- Pour tes 10 premières décisions de test, utilise **le même appareil et le même navigateur** à chaque fois, sinon l'export CSV sera incomplet.

Si tu veux plus tard un stockage partagé entre appareils (comme ton compteur Airtable sur score-csr.vercel.app), il faudra brancher une vraie base de données (Airtable, Supabase, etc.) à la place de `localStorage` — dis-le moi quand tu en seras là.

## Export des données

Dans la section "Historique" de l'app :
- **Télécharger CSV** : génère un fichier `.csv` téléchargeable, ouvrable dans Excel/Google Sheets.
- **Copier** : copie un résumé texte dans le presse-papier, à coller directement dans une conversation.

## Structure du projet

```
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx      — point d'entrée React
    ├── App.jsx       — composant principal (toute la logique et l'UI)
    └── index.css     — imports Tailwind
```
