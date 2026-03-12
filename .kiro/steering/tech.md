# Technology Stack

## Framework & Runtime

- Next.js 16.1.6 (App Router with React Server Components)
- React 19.2.3
- TypeScript 5
- Node.js 20.9+ required

## Database & ORM

- Drizzle ORM with better-sqlite3 driver
- SQLite database for local storage
- Schema-first approach with TypeScript definitions

## Styling

- Tailwind CSS 4 (PostCSS plugin architecture)
- CSS variables for theming
- Geist font family (sans and mono variants)

## Code Quality

- ESLint 9 with Next.js config
- TypeScript strict mode enabled

## Build System

Next.js uses Turbopack as the default bundler (v16+) for faster development and builds.

## Common Commands

```bash
# Development server (runs on http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Database migrations (when Drizzle is configured)
npx drizzle-kit generate
npx drizzle-kit migrate
npx drizzle-kit studio
```

## Path Aliases

- `@/*` maps to project root for cleaner imports
- Example: `import { db } from '@/db/client'`

## Module Resolution

- Uses `bundler` module resolution
- ESNext module system
- React JSX transform (no React import needed)
