# Technology Stack

## Framework & Runtime

- Next.js 16.1.6 (App Router with React Server Components)
- React 19.2.3
- Node.js 20.9+ required
- TypeScript 5 (strict mode enabled)

## Styling

- Tailwind CSS 4 with PostCSS
- Geist Sans and Geist Mono fonts (Google Fonts)
- Dark mode support via CSS variables

## Database

- Drizzle ORM with better-sqlite3
- SQLite for local storage
- Type-safe schema definitions and queries

## Build System

- Turbopack (default bundler in Next.js 16)
- ESLint with Next.js config
- TypeScript compiler with path aliases (@/*)

## Common Commands

```bash
# Development server (manual start recommended)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Development Notes

- Use Server Components by default for data fetching
- Mark components with 'use client' only when needed for interactivity
- Leverage Server Actions for mutations with 'use server'
- Path alias @/* maps to project root
