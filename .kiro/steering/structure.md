# Project Structure

## Root Directory

```
/
├── app/                    # Next.js App Router directory
├── public/                 # Static assets (images, SVGs)
├── node_modules/           # Dependencies
├── .next/                  # Next.js build output
├── .git/                   # Git repository
└── .kiro/                  # Kiro configuration and steering
```

## App Directory (Next.js App Router)

The `app/` directory uses file-system based routing:

- `layout.tsx` - Root layout component (required, wraps all pages)
- `page.tsx` - Route page components
- `globals.css` - Global styles and Tailwind imports
- `favicon.ico` - Site favicon

### Routing Conventions

- `app/page.tsx` → `/` (home page)
- `app/dashboard/page.tsx` → `/dashboard`
- `app/blog/[slug]/page.tsx` → `/blog/:slug` (dynamic route)
- `app/api/*/route.ts` → API endpoints (Route Handlers)

### Special Files

- `layout.tsx` - Shared UI for route segments
- `page.tsx` - Unique UI for routes
- `loading.tsx` - Loading UI with Suspense
- `error.tsx` - Error boundary UI
- `not-found.tsx` - 404 UI
- `route.ts` - API endpoint handlers

## Configuration Files

- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript compiler options
- `eslint.config.mjs` - ESLint configuration
- `postcss.config.mjs` - PostCSS configuration
- `package.json` - Dependencies and scripts
- `drizzle.config.ts` - Drizzle ORM configuration (when added)

## Database Structure (Planned)

When implementing database features:

- `db/schema.ts` or `db/schema/` - Drizzle table definitions
- `drizzle/` - Generated migration files
- Database file location (SQLite): typically `./local.db` or `./data/app.db`

## Path Aliases

TypeScript is configured with path aliases:

- `@/*` maps to project root
- Example: `import { db } from '@/db'`

## Component Organization

Recommended structure for components (not yet implemented):

- `app/components/` - Shared components
- `app/[route]/components/` - Route-specific components
- Use Server Components by default, add `'use client'` only when needed
