# Project Structure

## Root Directory

```
/
├── app/                    # Next.js App Router directory
├── public/                 # Static assets (images, icons)
├── node_modules/           # Dependencies
├── .next/                  # Next.js build output
├── .git/                   # Git repository
└── .kiro/                  # Kiro AI configuration
    └── steering/           # AI guidance documents
```

## App Directory (Next.js App Router)

```
app/
├── layout.tsx              # Root layout (required)
├── page.tsx                # Home page route (/)
├── globals.css             # Global styles
└── favicon.ico             # Site favicon
```

### App Router Conventions

- `page.tsx` - Defines a route's UI
- `layout.tsx` - Shared UI for a segment and its children
- `loading.tsx` - Loading UI for a segment
- `error.tsx` - Error UI for a segment
- `not-found.tsx` - 404 UI
- `route.ts` - API endpoint (Route Handler)

### Expected Structure (when implemented)

```
app/
├── api/                    # API routes
│   └── [resource]/
│       └── route.ts        # REST endpoints
├── people/                 # People listing and detail pages
│   ├── page.tsx            # List all people
│   └── [id]/
│       └── page.tsx        # Person detail view
└── components/             # Shared React components (optional)
```

## Database Structure (when implemented)

```
db/
├── schema.ts               # Drizzle schema definitions
├── client.ts               # Database connection
└── migrations/             # SQL migration files
```

## Configuration Files

- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript compiler options
- `eslint.config.mjs` - ESLint rules
- `postcss.config.mjs` - PostCSS/Tailwind configuration
- `drizzle.config.ts` - Drizzle Kit configuration (when added)
- `package.json` - Dependencies and scripts

## File Naming Conventions

- React components: PascalCase (`UserProfile.tsx`)
- Route files: lowercase (`page.tsx`, `layout.tsx`, `route.ts`)
- Utilities: camelCase (`formatDate.ts`)
- Types: PascalCase (`User.ts`, `types.ts`)
- Use `.tsx` for files with JSX, `.ts` for pure TypeScript

## Import Organization

1. External dependencies (React, Next.js, etc.)
2. Internal modules using `@/` alias
3. Relative imports
4. Types (if not inline)
5. Styles

Example:
```typescript
import { useState } from 'react'
import Link from 'next/link'

import { db } from '@/db/client'
import { users } from '@/db/schema'

import { formatDate } from './utils'
import type { User } from './types'

import './styles.css'
```
