# Prisma Database Management Guidelines

## Core Principle
**NEVER lose user data.** Every schema change must preserve existing data unless the user explicitly requests deletion. When in doubt, ask before executing.

## Environment Setup

### Database URLs (Neon)
```bash
# .env.example
DATABASE_URL="postgresql://...@ep-xxx.eu-central-1.aws.neon.tech/anso?sslmode=require"           # Pooled connection (API runtime)
DIRECT_URL="postgresql://...@ep-xxx.eu-central-1.aws.neon.tech/anso?sslmode=require&connection_limit=1"  # Direct connection (migrations)
```

### schema.prisma Configuration
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch"]  // PostgreSQL-specific features
}
```

### Package.json Scripts
```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma generate && nest build",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate:dev": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:migrate:status": "prisma migrate status",
    "db:studio": "prisma studio",
    "db:seed": "prisma db seed",
    "db:reset": "prisma migrate reset"
  }
}
```

---

## Development Workflow

### When to Use Each Command

| Command | When to Use | Data Loss Risk |
|---------|-------------|----------------|
| `prisma generate` | After any schema change, regenerates client | None |
| `prisma db push` | Prototyping, early development, no migration history needed | ⚠️ Can lose data |
| `prisma migrate dev` | Creating a new migration in development | Safe if reviewed |
| `prisma migrate deploy` | Applying migrations in CI/staging/production | Safe |
| `prisma migrate reset` | Reset dev DB to clean state | ⚠️ Destroys all data |

### Standard Development Flow

```bash
# 1. Make schema changes in schema.prisma

# 2. Create migration with descriptive name
pnpm db:migrate:dev --name add_invoice_table

# 3. Review generated migration in prisma/migrations/

# 4. If migration looks wrong, delete the migration folder and retry

# 5. Commit migration file with your code changes
git add prisma/migrations prisma/schema.prisma
git commit -m "feat: add invoice table"
```

---

## Safe Schema Changes

### ✅ Always Safe Operations
```prisma
// Adding a new table
model Invoice {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
}

// Adding nullable column
model Contact {
  // existing fields...
  linkedinUrl String?  // nullable = safe
}

// Adding column with default
model Contact {
  // existing fields...
  isArchived Boolean @default(false)  // has default = safe
}

// Adding index
@@index([workspaceId, createdAt])
```

### ⚠️ Requires Data Migration (Multi-Step)
```prisma
// DANGEROUS: Adding required column without default
model Contact {
  newRequiredField String  // ❌ Will fail if table has data
}

// SAFE: Do it in steps
// Step 1: Add as nullable
model Contact {
  newRequiredField String?
}

// Step 2: Backfill data (in migration or script)
// UPDATE "Contact" SET "newRequiredField" = 'default_value' WHERE "newRequiredField" IS NULL;

// Step 3: Make required
model Contact {
  newRequiredField String
}
```

### ⚠️ Renaming Columns/Tables (Data Preservation)
```sql
-- In migration file, replace DROP/CREATE with:
ALTER TABLE "Contact" RENAME COLUMN "old_name" TO "new_name";
ALTER TABLE "OldTable" RENAME TO "NewTable";
```

Prisma generates DROP + CREATE by default. **Always review migrations for renames.**

### 🚫 Destructive Operations (Require Explicit Confirmation)
Before executing any of these, **ask the user for confirmation**:

```prisma
// Dropping a column
// Dropping a table
// Changing column type (may truncate data)
// Removing @unique constraint with duplicates
// Changing @id field
```

---

## Production Deployment

### Pre-Deployment Checklist
```bash
# 1. Check migration status
pnpm db:migrate:status

# 2. Backup production database (Neon console or pg_dump)
pg_dump $PRODUCTION_DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 3. Test migration on staging/branch first
# 4. Deploy during low-traffic window for major changes
```

### CI/CD Pipeline (GitHub Actions)
```yaml
# .github/workflows/deploy-api.yml
name: Deploy API

on:
  push:
    branches: [main]
    paths: ['apps/api/**', 'prisma/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Check migration status
        run: pnpm db:migrate:status
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          DIRECT_URL: ${{ secrets.DIRECT_URL }}
          
      - name: Deploy migrations
        run: pnpm db:migrate:deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          DIRECT_URL: ${{ secrets.DIRECT_URL }}
          
      # Railway/Vercel deployment follows...
```

---

## Neon-Specific Practices

### Branch Databases for Preview Environments
```bash
# Create branch for feature
neon branch create --name preview-feat-123 --parent main

# Get connection string
neon connection-string preview-feat-123

# Delete branch when PR merged
neon branch delete preview-feat-123
```

### Connection Pooling
- **Pooled URL** (`DATABASE_URL`): For application runtime, supports many connections
- **Direct URL** (`DIRECT_URL`): For migrations, schema changes, Prisma Studio

### Neon Branching in CI (Optional)
```yaml
- name: Create Neon branch
  id: neon
  uses: neondatabase/create-branch-action@v4
  with:
    project_id: ${{ secrets.NEON_PROJECT_ID }}
    branch_name: preview-${{ github.event.pull_request.number }}
    api_key: ${{ secrets.NEON_API_KEY }}
    
- name: Run migrations on branch
  run: pnpm db:migrate:deploy
  env:
    DATABASE_URL: ${{ steps.neon.outputs.db_url_pooled }}
    DIRECT_URL: ${{ steps.neon.outputs.db_url }}
```

---

## Error Recovery

### Migration Failed Mid-Way
```bash
# 1. Check status
pnpm db:migrate:status

# 2. If migration marked as failed, fix the issue then:
prisma migrate resolve --applied "migration_name"

# 3. Or rollback manually and retry
prisma migrate resolve --rolled-back "migration_name"
```

### Schema Drift (DB doesn't match migrations)
```bash
# 1. See differences
prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma

# 2. Create migration to fix drift
prisma migrate dev --name fix_drift

# 3. Or baseline if starting fresh
prisma migrate resolve --applied "0_init"
```

### Restore from Backup
```bash
# Neon point-in-time recovery (console) - preferred
# Or manual restore:
psql $DATABASE_URL < backup_20250102_120000.sql
```

---

## Code Patterns

### Transaction for Multi-Step Operations
```typescript
await prisma.$transaction(async (tx) => {
  const contact = await tx.contact.update({
    where: { id },
    data: { isArchived: true }
  });
  
  await tx.deal.updateMany({
    where: { contactId: id },
    data: { status: 'ARCHIVED' }
  });
  
  return contact;
});
```

### Soft Delete Pattern
```prisma
model Contact {
  id        String    @id @default(cuid())
  deletedAt DateTime? // null = active, set = soft deleted
  
  @@index([workspaceId, deletedAt])
}
```

```typescript
// Middleware for automatic filtering
prisma.$use(async (params, next) => {
  if (params.model === 'Contact' && params.action === 'findMany') {
    params.args.where = { ...params.args.where, deletedAt: null };
  }
  return next(params);
});
```

---

## Quick Reference

### Before Any Schema Change
1. Is this additive (new table, nullable column, index)? → Safe, proceed
2. Is this modifying existing data structure? → Plan multi-step migration
3. Is this removing/dropping anything? → **Ask user for explicit confirmation**
4. Does the migration file contain DROP? → Review carefully, consider RENAME

### Commands Cheatsheet
```bash
prisma generate          # Regenerate client after schema change
prisma migrate dev       # Create new migration (dev only)
prisma migrate deploy    # Apply pending migrations (CI/prod)
prisma migrate status    # Check migration state
prisma migrate reset     # ⚠️ Reset DB (dev only, loses all data)
prisma db push           # Sync schema without migration (prototyping)
prisma db pull           # Introspect existing DB to schema
prisma studio            # Visual DB browser
```
