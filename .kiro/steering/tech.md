# Technology Stack

## Framework & Runtime

- Next.js 16.1.6 (App Router architecture with React Server Components)
- React 19.2.3
- TypeScript 5 (strict mode enabled)
- Node.js 20.9+ required

## Styling

- Tailwind CSS 4 with PostCSS
- Custom CSS variables for theming (light/dark mode support)
- Geist font family (sans and mono variants)

## Database & ORM

- SQLite with better-sqlite3 driver
- Drizzle ORM for type-safe database operations
- Drizzle Kit for migrations and schema management

## Code Quality

- ESLint with Next.js configuration
- TypeScript strict mode with path aliases (@/*)

## Common Commands

```bash
# Development server (runs on http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Database migrations (when Drizzle is configured)
npx drizzle-kit generate      # Generate migrations from schema
npx drizzle-kit push          # Push schema to database (dev)
npx drizzle-kit studio        # Open database GUI
npx drizzle-kit migrate       # Apply migrations
```

## Build System

- Turbopack (default bundler in Next.js 16)
- Automatic code splitting and optimization
- Built-in image and font optimization
