# CLAUDE.md - MiniCRM Project

## Project Overview

Anso is a minimalist CRM SaaS for French freelancers and small businesses (TPE). The product philosophy is "5-minute setup, zero bullshit". We compete against bloated solutions like HubSpot, Pipedrive, and Axonaut by offering only essential features with an exceptional UX.

**Target users**: Freelancers, consultants, small agencies and small companies (1-5 people)
**Pricing**: 10€/month with freemium with 10 contacts limit
**Language**: French UI, English codebase

## Tech Stack

### Monorepo Structure (Turborepo)
```
/apps
  /web          → React frontend (Vite + React Router)
  /api          → NestJS backend
/packages
  /ui           → Shared UI components (React + Tailwind)
  /config       → Shared ESLint, Prettier, TypeScript configs
  /types        → Shared TypeScript types/interfaces
```

### Frontend (`apps/web`)
- React 18+ with functional components and hooks only
- Vite for bundling
- React Router v6 for routing
- TanStack Query for server state
- Zustand for client state (minimal usage)
- Tailwind CSS with shadcn/ui design system
- Lucide React for icons
- React Hook Form + Zod for forms

### UI Library (`packages/ui`)
- shadcn/ui component patterns (not installed via CLI, manually implemented)
- Radix UI primitives for accessible, unstyled components
- class-variance-authority (cva) for component variants
- Tailwind CSS with CSS variables for theming
- Components: Button, Input, Card, Badge, Avatar, Dialog, DropdownMenu, Label, Tooltip

### Backend (`apps/api`)
- NestJS 10+
- Hexagonal Architecture (Ports & Adapters)
- DDD tactical patterns (Entities, Value Objects, Repositories, Use Cases)
- Prisma ORM with PostgreSQL
- Passport.js with Google OAuth 2.0
- Class-validator for DTO validation
- Class-transformer for serialization

### Infrastructure
- Vercel for frontend deployment
- Railway for backend
- Neon for PostgreSQL
- GitHub Actions for CI
- OpenTelemetry for observability (tracing)

## Architecture Guidelines

### Backend - Hexagonal Architecture

```
src/
├── modules/
│   ├── contact/
│   │   ├── domain/           # Pure business logic
│   │   │   ├── entities/
│   │   │   ├── value-objects/
│   │   │   ├── repositories/  # Interfaces only
│   │   │   └── errors/
│   │   ├── application/      # Use cases
│   │   │   ├── commands/
│   │   │   ├── queries/
│   │   │   └── ports/        # Input/Output ports
│   │   └── infrastructure/   # Adapters
│   │       ├── persistence/  # Prisma repositories
│   │       ├── http/         # Controllers, DTOs
│   │       └── mappers/
│   ├── deal/
│   ├── workspace/
│   └── auth/
├── shared/
│   ├── domain/              # Base classes, Result type
│   └── infrastructure/      # Guards, filters, interceptors
└── main.ts
```

### Domain Rules
- Entities have identity and lifecycle
- Value Objects are immutable and compared by value
- Repositories are interfaces in domain, implemented in infrastructure
- Use Cases orchestrate domain logic, one public method per use case
- Never import infrastructure in domain layer

### Frontend - Component Architecture

```
src/
├── components/
│   ├── ui/                  # Primitive components (from packages/ui)
│   └── features/            # Feature-specific components
├── pages/                   # Route components
├── hooks/                   # Custom hooks
├── services/                # API calls (TanStack Query)
├── stores/                  # Zustand stores
└── lib/                     # Utils, constants
```

## Code Conventions

### TypeScript
- Strict mode enabled
- Explicit return types on functions
- No `any` - use `unknown` if needed
- Prefer `interface` for object shapes, `type` for unions/intersections
- Use barrel exports (`index.ts`) per module

### React
- Functional components only
- Props interface named `{ComponentName}Props`
- Destructure props in function signature
- Colocate component, types, and styles
- Use `cn()` helper for conditional Tailwind classes

```tsx
// Good
interface ContactCardProps {
  contact: Contact;
  onEdit: (id: string) => void;
}

export function ContactCard({ contact, onEdit }: ContactCardProps) {
  return (...)
}
```

### NestJS
- One module per aggregate/bounded context
- Controllers are thin - delegate to use cases
- DTOs use class-validator decorators
- Use Result pattern for error handling (no throwing in domain)

```typescript
// Good - Use Case
@Injectable()
export class CreateContactUseCase {
  constructor(private readonly contactRepo: ContactRepository) {}

  async execute(command: CreateContactCommand): Promise<Result<Contact>> {
    const contact = Contact.create(command);
    if (contact.isFailure) return contact;
    
    await this.contactRepo.save(contact.value);
    return Result.ok(contact.value);
  }
}
```

### Naming Conventions
- Files: `kebab-case.ts`
- Classes/Components: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Database tables: `snake_case`
- API endpoints: `kebab-case` (`/api/contacts/:id/deals`)

### Git
- Conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`
- Branch naming: `feat/contact-crud`, `fix/auth-redirect`
- PR must pass CI (lint, typecheck, tests)

## Testing Strategy

### Backend
- **Unit tests**: Domain entities, value objects, use cases (jest)
- **Integration tests**: Repositories with test DB, API endpoints (supertest)
- Naming: `*.spec.ts` for unit, `*.e2e-spec.ts` for integration
- Use factories for test data

### Frontend
- **Unit tests**: Hooks, utils, complex components (vitest + testing-library)
- **E2E**: Critical flows only (Playwright) - optional for MVP

## Design System (shadcn/ui)

### Theme Configuration
The design system uses CSS variables for theming, enabling dark mode support. Variables are defined in `globals.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 199 89% 48%;        /* Brand color #0ea5e9 */
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --muted: 210 40% 96.1%;
  --accent: 210 40% 96.1%;
  --destructive: 0 84.2% 60.2%;
  --border: 214.3 31.8% 91.4%;
  --ring: 199 89% 48%;
  --radius: 0.5rem;
}
```

### Colors (Tailwind)
Semantic colors via CSS variables:
- `primary` - Brand color (sky-500 #0ea5e9)
- `secondary` - Muted backgrounds
- `destructive` - Error/danger states
- `muted` - Subdued text and backgrounds
- `accent` - Hover states

Legacy brand scale still available for backwards compatibility:
```js
brand: {
  50: '#f0f9ff',
  500: '#0ea5e9',  // Primary
  600: '#0284c7',
  700: '#0369a1',
}
```

### Component Variants (cva)
Components use class-variance-authority for type-safe variants:

```tsx
// Button variants
<Button variant="default" />   // Primary solid
<Button variant="secondary" /> // Muted background
<Button variant="outline" />   // Border only
<Button variant="ghost" />     // No background
<Button variant="destructive" /> // Red/danger
<Button variant="link" />      // Text link style

// Button sizes
<Button size="default" />  // h-10 px-4
<Button size="sm" />       // h-9 px-3
<Button size="lg" />       // h-11 px-8
<Button size="icon" />     // h-10 w-10
```

### Typography
- Font: Inter (Google Fonts)
- Base size: 14px for app, 16px for landing

### Spacing
- Use Tailwind spacing scale consistently
- Cards: `p-4` or `p-6`
- Sections: `py-8` or `py-12`

### Adding New Components
When adding shadcn/ui components:
1. Copy component from shadcn/ui source or ui.shadcn.com
2. Place in `packages/ui/src/components/`
3. Update `packages/ui/src/index.ts` exports
4. Ensure Radix dependencies are installed in `packages/ui/package.json`

## Data Model (Prisma)

```prisma
model User {
  id          String      @id @default(cuid())
  email       String      @unique
  name        String?
  avatarUrl   String?
  googleId    String      @unique
  workspaces  WorkspaceMember[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model Workspace {
  id        String      @id @default(cuid())
  name      String
  members   WorkspaceMember[]
  contacts  Contact[]
  stages    Stage[]
  deals     Deal[]
  plan      Plan        @default(FREE)
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
}

model WorkspaceMember {
  id          String    @id @default(cuid())
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  workspaceId String
  user        User      @relation(fields: [userId], references: [id])
  userId      String
  role        Role      @default(MEMBER)
  
  @@unique([workspaceId, userId])
}

model Contact {
  id          String    @id @default(cuid())
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  workspaceId String
  name        String
  email       String?
  phone       String?
  company     String?
  notes       String?
  tags        String[]
  deals       Deal[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([workspaceId])
}

model Stage {
  id          String    @id @default(cuid())
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  workspaceId String
  name        String
  color       String    @default("#64748b")
  position    Int
  deals       Deal[]
  
  @@index([workspaceId])
}

model Deal {
  id          String    @id @default(cuid())
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  workspaceId String
  contact     Contact?  @relation(fields: [contactId], references: [id])
  contactId   String?
  stage       Stage     @relation(fields: [stageId], references: [id])
  stageId     String
  title       String
  value       Decimal?  @db.Decimal(10, 2)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([workspaceId])
  @@index([stageId])
}

enum Role {
  OWNER
  MEMBER
}

enum Plan {
  FREE
  SOLO
  TEAM
}
```

## API Endpoints

```
POST   /auth/google              # Initiate Google OAuth
GET    /auth/google/callback     # OAuth callback
POST   /auth/logout
GET    /auth/me

GET    /workspaces
POST   /workspaces
GET    /workspaces/:id
PATCH  /workspaces/:id
DELETE /workspaces/:id

GET    /workspaces/:wid/contacts
POST   /workspaces/:wid/contacts
POST   /workspaces/:wid/contacts/import   # CSV import
GET    /workspaces/:wid/contacts/:id
PATCH  /workspaces/:wid/contacts/:id
DELETE /workspaces/:wid/contacts/:id

GET    /workspaces/:wid/stages
POST   /workspaces/:wid/stages
PATCH  /workspaces/:wid/stages/:id
PATCH  /workspaces/:wid/stages/reorder
DELETE /workspaces/:wid/stages/:id

GET    /workspaces/:wid/deals
POST   /workspaces/:wid/deals
GET    /workspaces/:wid/deals/:id
PATCH  /workspaces/:wid/deals/:id
DELETE /workspaces/:wid/deals/:id
```

## Observability (OpenTelemetry)

The API uses OpenTelemetry for distributed tracing, configured in `apps/api/src/instrumentation.ts`.

### Auto-instrumentation
- HTTP requests (incoming/outgoing)
- Express middleware and routes
- NestJS controllers and providers
- Prisma database queries

### Custom Spans
Use `TracingService` to add custom spans to use cases:

```typescript
@Injectable()
export class MyUseCase {
  constructor(private readonly tracing: TracingService) {}

  async execute(command: Command): Promise<Result<T>> {
    return this.tracing.withSpan(
      'MyUseCase.execute',
      async (span) => {
        span.setAttributes({ 'my.attribute': value });
        // ... business logic
      },
      { 'use_case': 'my_use_case' }
    );
  }
}
```

### Environment Variables
```bash
OTEL_EXPORTER_OTLP_ENDPOINT=https://your-collector.railway.app  # Required to enable tracing
OTEL_EXPORTER_OTLP_HEADERS='{"Authorization":"Bearer xxx"}'     # Optional auth headers
OTEL_SERVICE_NAME=anso-api                                       # Service name (default: anso-api)
```

## Billing (Stripe)

Stripe integration for subscription management in `apps/api/src/modules/billing/`.

### Plans
- **FREE**: 10 contacts max, 1 user
- **SOLO**: Unlimited contacts, 1 user, 10€/month
- **TEAM**: Unlimited contacts, 3 users, 20€/month

### Environment Variables
```bash
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SOLO_PRICE_ID=price_...
STRIPE_TEAM_PRICE_ID=price_...
```

### API Endpoints
```
POST   /workspaces/:wid/billing/checkout  # Create Stripe checkout session
POST   /workspaces/:wid/billing/portal    # Create Stripe customer portal session
POST   /billing/webhook                    # Stripe webhook handler
```

## Important Reminders

1. **Keep it simple** - We're building a minimalist CRM, resist feature creep
2. **French UX** - All user-facing text in French, use proper typography (« », espaces insécables)
3. **Mobile-first** - Responsive design, touch-friendly
4. **Performance** - Lazy loading, optimistic updates, skeleton loaders
5. **Security** - Validate all inputs, sanitize outputs, proper CORS, rate limiting
6. **Accessibility** - Semantic HTML, ARIA when needed, keyboard navigation

## Commands

```bash
# Development
pnpm dev                 # Start all apps
pnpm dev --filter web    # Start frontend only
pnpm dev --filter api    # Start backend only

# Database
pnpm db:push            # Push schema changes
pnpm db:migrate         # Create migration
pnpm db:studio          # Open Prisma Studio

# Testing
pnpm test               # Run all tests
pnpm test:e2e           # Run E2E tests

# Build & Deploy
pnpm build              # Build all
pnpm lint               # Lint all
pnpm typecheck          # TypeScript check
```
