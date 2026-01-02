# Anso - CRM Minimaliste

CRM minimaliste pour freelances et TPE. 5 minutes pour démarrer, zéro bullshit.

## Prérequis

- Node.js 20+
- pnpm 9+
- PostgreSQL (ou compte Neon)

## Installation

```bash
# Cloner le repo
git clone https://github.com/your-username/anso.git
cd anso

# Installer les dépendances
pnpm install

# Copier les fichiers d'environnement
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Configurer les variables d'environnement dans apps/api/.env
# - DATABASE_URL et DIRECT_URL (Neon PostgreSQL)
# - GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET
# - JWT_SECRET

# Générer le client Prisma et pousser le schéma
pnpm db:generate
pnpm db:push

# Lancer en développement
pnpm dev
```

## Structure du projet

```
anso/
├── apps/
│   ├── web/          # Frontend React + Vite
│   └── api/          # Backend NestJS
├── packages/
│   ├── ui/           # Composants UI partagés
│   ├── config/       # Configs ESLint, Prettier, TypeScript
│   └── types/        # Types TypeScript partagés
├── turbo.json
└── pnpm-workspace.yaml
```

## Scripts disponibles

```bash
# Développement
pnpm dev              # Lancer tous les apps
pnpm dev --filter web # Lancer le frontend uniquement
pnpm dev --filter api # Lancer le backend uniquement

# Base de données
pnpm db:push          # Pousser le schéma
pnpm db:migrate       # Créer une migration
pnpm db:studio        # Ouvrir Prisma Studio

# Tests
pnpm test             # Lancer les tests
pnpm test:e2e         # Lancer les tests E2E

# Build
pnpm build            # Build tous les apps
pnpm lint             # Linter
pnpm typecheck        # Vérification TypeScript
```

## Configuration Google OAuth

1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créer un nouveau projet ou en sélectionner un existant
3. Activer l'API Google+ API
4. Créer des identifiants OAuth 2.0
5. Ajouter les origines autorisées : `http://localhost:5173`
6. Ajouter les URI de redirection : `http://localhost:5173/api/auth/google/callback`
7. Copier le Client ID et Client Secret dans `.env`

## Endpoints API

- `GET /api/health` - Health check
- `GET /api/auth/google` - Initier l'auth Google
- `GET /api/auth/me` - Utilisateur courant
- `GET /api/workspaces` - Liste des workspaces
- `GET /api/workspaces/:wid/contacts` - Liste des contacts
- `GET /api/workspaces/:wid/deals` - Liste des opportunités
- `GET /api/workspaces/:wid/stages` - Liste des étapes

## Licence

MIT
