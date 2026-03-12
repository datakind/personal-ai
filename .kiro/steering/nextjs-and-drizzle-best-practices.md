---
inclusion: always
---

# Next.js & Drizzle ORM Best Practices

This project uses Next.js 16 with the App Router and Drizzle ORM with SQLite. Follow these conventions when working with the codebase.

## Architecture Patterns

- Use Server Components by default for data fetching and rendering
- Add `'use client'` directive only when using hooks, event handlers, or browser APIs
- Prefer Server Actions for mutations over API routes
- Use Route Handlers (`route.ts`) only for external API integrations or webhooks

## Database Conventions

- All database operations use Drizzle ORM with better-sqlite3 driver
- Schema definitions live in `db/schema.ts` or `db/schema/` directory
- Use TypeScript type inference: `InferSelectModel` and `InferInsertModel`
- Prefer relational queries (`db.query`) for nested data over manual joins
- Always use transactions for multi-step operations that must be atomic

## Code Organization

- Route-specific components go in `app/[route]/components/`
- Shared components go in `app/components/`
- Database queries and mutations belong in Server Components or Server Actions
- Keep business logic separate from UI components

## Data Fetching

- Fetch data directly in Server Components using async/await
- Use `next: { revalidate: seconds }` for time-based cache invalidation
- Use `next: { tags: ['tag'] }` with `revalidateTag()` for on-demand revalidation
- Call `revalidatePath()` after mutations to refresh cached data

## Forms and Mutations

- Use Server Actions with native form `action` attribute when possible
- Return validation errors as objects: `{ error: 'message' }`
- Call `redirect()` after successful mutations to navigate
- Use `useFormStatus` hook in Client Components for pending states

## Type Safety

- Enable TypeScript strict mode
- Use path aliases (`@/*`) for imports
- Infer types from Drizzle schemas rather than duplicating definitions
- Validate user input in Server Actions before database operations

## Performance

- Use `<Image>` component with `priority` for above-the-fold images
- Implement loading states with `loading.tsx` files
- Use Suspense boundaries for streaming long-running operations
- Minimize client-side JavaScript by maximizing Server Component usage

## Documentation References

When you need detailed API information or examples, reference:

#[[file:DRIZZLE-BEST-PRACTICES.md]]
#[[file:NEXTJS-BEST-PRACTICES.md]]

Use Context7 to query Next.js or Drizzle ORM documentation for specific API details not covered in the best practices files.
