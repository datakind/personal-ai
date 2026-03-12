# Project Structure

## Root Configuration

- `package.json` - Dependencies and npm scripts
- `tsconfig.json` - TypeScript configuration with strict mode and path aliases
- `next.config.ts` - Next.js configuration
- `eslint.config.mjs` - ESLint configuration with Next.js rules
- `postcss.config.mjs` - PostCSS configuration for Tailwind CSS

## App Directory (Next.js App Router)

```
app/
├── layout.tsx       # Root layout with fonts and metadata
├── page.tsx         # Home page route
├── globals.css      # Global styles and Tailwind directives
└── favicon.ico      # Site favicon
```

## Public Assets

```
public/
├── *.svg            # Static SVG assets
└── ...              # Other public files
```

## Documentation

- `README.md` - Project overview and feature description
- `NEXTJS-BEST-PRACTICES.md` - Next.js framework guidelines
- `DRIZZLE-BEST-PRACTICES.md` - Drizzle ORM usage patterns

## Conventions

- Use file-based routing in `app/` directory
- `page.tsx` defines routes
- `layout.tsx` defines shared UI wrappers
- Server Components are default (no 'use client' directive)
- Client Components require 'use client' at top of file
- Server Actions use 'use server' directive
- API routes use `route.ts` files with HTTP method exports

## Expected Additions

- Database schema files (Drizzle ORM)
- Server Actions for mutations
- API routes for OAuth flow
- Components directory for reusable UI
- Database migration files
