---
inclusion: always
---

# Next.js and Drizzle Best Practices

This project uses Next.js 16 with the App Router and Drizzle ORM with SQLite. Follow these conventions when working with the codebase.

## Technology Stack

- Next.js 16.1.6 (App Router, React Server Components)
- React 19.2.3
- Drizzle ORM with better-sqlite3
- TypeScript 5 (strict mode)
- Tailwind CSS 4

## Architecture Patterns

### Server Components First
- Default to Server Components for data fetching and rendering
- Only use `'use client'` when you need interactivity, hooks, or browser APIs
- Fetch data directly in Server Components using async/await
- Use Server Actions for mutations instead of API routes when possible

### Database Access
- Define schemas in `db/schema.ts` using Drizzle's SQLite syntax
- Use `db/client.ts` for database connection
- Prefer relational queries (`db.query`) for nested data
- Use SQL-like queries (`db.select()`) for complex filtering and joins
- Always use type inference: `InferSelectModel` and `InferInsertModel`

### File Organization
- Routes: `app/[route]/page.tsx`
- Layouts: `app/[route]/layout.tsx`
- API endpoints: `app/api/[route]/route.ts`
- Server Actions: `app/actions.ts` or colocated with features
- Database: `db/schema.ts`, `db/client.ts`
- Use `@/` path alias for imports from project root

## Code Style

### Next.js Conventions
- Use `<Link>` for navigation, never `<a>` tags
- Use `<Image>` for images with proper width/height or fill
- Await `params` in dynamic routes: `const { id } = await params`
- Use `redirect()` for server-side navigation
- Use `notFound()` for 404 responses
- Define metadata with `generateMetadata` for dynamic pages

### Drizzle Conventions
- Use `eq()`, `and()`, `or()` for filtering, not raw SQL strings
- Use `.returning()` for insert/update operations in SQLite
- Define relations with `relations()` for relational queries
- Use transactions for multi-step operations
- Use prepared statements for repeated queries

### TypeScript
- Enable strict mode
- Use type inference from Drizzle schemas
- Avoid `any` types
- Use proper async/await with error handling

## Data Patterns

### Fetching Data
```typescript
// Server Component
async function getData() {
  const data = await db.query.table.findMany({
    with: { relations: true }
  })
  return data
}

export default async function Page() {
  const data = await getData()
  return <div>{/* render */}</div>
}
```

### Mutations
```typescript
// Server Action
'use server'
export async function createItem(formData: FormData) {
  const data = { /* extract from formData */ }
  await db.insert(table).values(data)
  revalidatePath('/items')
  redirect('/items')
}
```

### Caching
- Use `next: { revalidate: seconds }` for time-based revalidation
- Use `next: { tags: ['tag'] }` for on-demand revalidation
- Call `revalidatePath()` or `revalidateTag()` after mutations

## Security

- Never expose database credentials in client components
- Use Server Actions for sensitive operations
- Validate all user input before database operations
- Use `httpOnly` cookies for authentication tokens
- Set proper CORS headers in API routes

## Performance

- Use `loading.tsx` for loading states
- Use `error.tsx` for error boundaries
- Optimize images with `<Image>` component
- Use dynamic imports for heavy client components
- Leverage React Server Components to reduce client bundle size

## Documentation References

When you need detailed API information or examples:
- Use Context7 to query Next.js documentation
- Use Context7 to query Drizzle ORM documentation
- Reference the comprehensive best practices files:

#[[file:DRIZZLE-BEST-PRACTICES.md]]
#[[file:NEXTJS-BEST-PRACTICES.md]]