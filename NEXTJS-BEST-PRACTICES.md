# Next.js

Next.js is a React framework for building full-stack web applications. It provides a comprehensive set of features including server-side rendering, static site generation, API routes, and file-based routing. The framework uses React Server Components by default for optimal performance, with the App Router architecture providing nested layouts, streaming, and built-in support for loading and error states.

Next.js enables developers to build production-ready applications with automatic code splitting, optimized image loading, font optimization, and built-in CSS support. The framework supports both server and client components, allowing developers to choose the optimal rendering strategy for each part of their application. With Turbopack as the default bundler in version 16, Next.js offers significantly faster development and build times.

## Installation and Project Setup

Create a new Next.js application using the CLI or manual installation. The framework requires Node.js 20.9+ and supports TypeScript out of the box.

```bash
# Create new app with recommended defaults (TypeScript, Tailwind CSS, ESLint, App Router)
npx create-next-app@latest my-app --yes
cd my-app
npm run dev

# Or manual installation
npm install next@latest react@latest react-dom@latest

# Add scripts to package.json
# "dev": "next dev"
# "build": "next build"
# "start": "next start"
```

## App Router File Structure

The App Router uses a file-system based routing where folders define routes and special files define UI. Create an `app` directory with `layout.tsx` and `page.tsx` to get started.

```tsx
// app/layout.tsx - Root layout (required)
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

// app/page.tsx - Home page
export default function Page() {
  return <h1>Hello, Next.js!</h1>
}

// app/dashboard/page.tsx - Nested route at /dashboard
export default function DashboardPage() {
  return <h1>Dashboard</h1>
}

// app/blog/[slug]/page.tsx - Dynamic route
export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <h1>Blog Post: {slug}</h1>
}
```

## Link Component

The `<Link>` component extends the HTML `<a>` element to provide prefetching and client-side navigation between routes. It is the primary way to navigate between pages in Next.js.

```tsx
import Link from 'next/link'

export default function Navigation() {
  return (
    <nav>
      {/* Basic navigation */}
      <Link href="/dashboard">Dashboard</Link>

      {/* With query parameters */}
      <Link href={{ pathname: '/search', query: { q: 'nextjs' } }}>
        Search
      </Link>

      {/* Dynamic routes */}
      <Link href={`/blog/${post.slug}`}>{post.title}</Link>

      {/* Replace history instead of push */}
      <Link href="/settings" replace>Settings</Link>

      {/* Disable scroll to top */}
      <Link href="/about" scroll={false}>About</Link>

      {/* Disable prefetching */}
      <Link href="/heavy-page" prefetch={false}>Heavy Page</Link>

      {/* With navigation callback */}
      <Link
        href="/checkout"
        onNavigate={(e) => {
          if (hasUnsavedChanges && !confirm('Leave page?')) {
            e.preventDefault()
          }
        }}
      >
        Checkout
      </Link>
    </nav>
  )
}
```

## Image Component

The `next/image` component extends HTML `<img>` with automatic image optimization, lazy loading, and responsive sizing. It prevents layout shift and serves images in modern formats.

```tsx
import Image from 'next/image'

// Local image with automatic dimensions
import profilePic from './profile.png'

export default function Gallery() {
  return (
    <div>
      {/* Static import - dimensions auto-detected */}
      <Image src={profilePic} alt="Profile" placeholder="blur" />

      {/* Remote image - requires dimensions */}
      <Image
        src="https://example.com/photo.jpg"
        alt="Photo"
        width={800}
        height={600}
        quality={80}
      />

      {/* Fill container (responsive) */}
      <div style={{ position: 'relative', width: '100%', height: '400px' }}>
        <Image
          src="/hero.jpg"
          alt="Hero"
          fill
          style={{ objectFit: 'cover' }}
          sizes="(max-width: 768px) 100vw, 50vw"
          priority // Preload for LCP images
        />
      </div>

      {/* Custom loader for external optimization service */}
      <Image
        loader={({ src, width, quality }) =>
          `https://cdn.example.com/${src}?w=${width}&q=${quality || 75}`
        }
        src="photo.jpg"
        alt="CDN Image"
        width={400}
        height={300}
      />
    </div>
  )
}
```

## Server Components and Data Fetching

Server Components are the default in the App Router. They can fetch data directly and have no client-side JavaScript overhead. Use async/await for data fetching.

```tsx
// app/posts/page.tsx - Server Component (default)
async function getPosts() {
  const res = await fetch('https://api.example.com/posts', {
    next: { revalidate: 3600 } // Revalidate every hour
  })
  if (!res.ok) throw new Error('Failed to fetch posts')
  return res.json()
}

export default async function PostsPage() {
  const posts = await getPosts()

  return (
    <ul>
      {posts.map((post: { id: string; title: string }) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}

// Fetch with cache tags for on-demand revalidation
async function getProduct(id: string) {
  const res = await fetch(`https://api.example.com/products/${id}`, {
    next: { tags: [`product-${id}`] }
  })
  return res.json()
}

// Static generation with dynamic params
export async function generateStaticParams() {
  const posts = await getPosts()
  return posts.map((post: { slug: string }) => ({ slug: post.slug }))
}
```

## Client Components

Client Components enable interactivity with hooks, event handlers, and browser APIs. Mark a component with `'use client'` directive.

```tsx
'use client'

import { useState, useEffect } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null // Avoid hydration mismatch

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
    </div>
  )
}
```

## useRouter Hook

The `useRouter` hook provides programmatic navigation in Client Components. Import from `next/navigation` for the App Router.

```tsx
'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

export default function NavigationExample() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleNavigation = () => {
    // Navigate to new page
    router.push('/dashboard')

    // Replace current history entry
    router.replace('/login')

    // Navigate without scrolling to top
    router.push('/settings', { scroll: false })

    // Prefetch a route
    router.prefetch('/heavy-page')

    // Refresh current route (re-fetch server components)
    router.refresh()

    // Browser history navigation
    router.back()
    router.forward()
  }

  return (
    <div>
      <p>Current path: {pathname}</p>
      <p>Search: {searchParams.toString()}</p>
      <button onClick={handleNavigation}>Navigate</button>
    </div>
  )
}
```

## Server Functions (Server Actions)

Server Functions run on the server and can be called from Client Components. Use `'use server'` directive for secure server-side operations.

```tsx
// app/actions.ts
'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string
  const content = formData.get('content') as string

  // Validate input
  if (!title || title.length < 3) {
    return { error: 'Title must be at least 3 characters' }
  }

  // Database operation
  const post = await db.post.create({ data: { title, content } })

  // Revalidate cached data
  revalidatePath('/posts')
  revalidateTag('posts')

  // Redirect after mutation
  redirect(`/posts/${post.id}`)
}

export async function deletePost(id: string) {
  await db.post.delete({ where: { id } })
  revalidatePath('/posts')
}

export async function setTheme(theme: string) {
  const cookieStore = await cookies()
  cookieStore.set('theme', theme, { httpOnly: true, secure: true })
}

// app/posts/new/page.tsx - Using Server Action in form
import { createPost } from '../actions'

export default function NewPostPage() {
  return (
    <form action={createPost}>
      <input name="title" placeholder="Title" required />
      <textarea name="content" placeholder="Content" />
      <button type="submit">Create Post</button>
    </form>
  )
}
```

## Route Handlers (API Routes)

Route Handlers create custom API endpoints using Web Request and Response APIs. Define them in `route.ts` files.

```tsx
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server'

// GET /api/posts
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = searchParams.get('page') || '1'

  const posts = await db.post.findMany({
    skip: (parseInt(page) - 1) * 10,
    take: 10,
  })

  return NextResponse.json(posts)
}

// POST /api/posts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const post = await db.post.create({ data: body })
    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}

// app/api/posts/[id]/route.ts - Dynamic route handler
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const post = await db.post.findUnique({ where: { id } })

  if (!post) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(post)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await db.post.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
```

## Cookies and Headers

Read and write cookies and headers in Server Components, Server Functions, and Route Handlers.

```tsx
import { cookies, headers } from 'next/headers'

// Reading cookies and headers in Server Component
export default async function Page() {
  const cookieStore = await cookies()
  const headersList = await headers()

  const theme = cookieStore.get('theme')?.value || 'light'
  const userAgent = headersList.get('user-agent')
  const authToken = headersList.get('authorization')

  return (
    <div data-theme={theme}>
      <p>User Agent: {userAgent}</p>
    </div>
  )
}

// Setting cookies in Server Action
'use server'

import { cookies } from 'next/headers'

export async function setUserPreferences(formData: FormData) {
  const cookieStore = await cookies()

  // Set cookie with options
  cookieStore.set('preferences', JSON.stringify({
    theme: formData.get('theme'),
    language: formData.get('language'),
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  })

  // Delete cookie
  cookieStore.delete('old-cookie')
}
```

## Redirect and Navigation Functions

Use `redirect` for server-side redirects and `notFound` for 404 responses.

```tsx
import { redirect, permanentRedirect, notFound } from 'next/navigation'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await getPost(id)

  // 404 if not found
  if (!post) {
    notFound()
  }

  // Temporary redirect (307)
  if (post.status === 'draft') {
    redirect('/drafts')
  }

  // Permanent redirect (308)
  if (post.oldSlug) {
    permanentRedirect(`/posts/${post.newSlug}`)
  }

  return <article>{post.content}</article>
}
```

## Metadata and SEO

Define metadata for SEO using the Metadata API or `generateMetadata` for dynamic values.

```tsx
// app/layout.tsx - Static metadata
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'My App',
    template: '%s | My App',
  },
  description: 'My application description',
  openGraph: {
    title: 'My App',
    description: 'My application description',
    url: 'https://example.com',
    siteName: 'My App',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

// app/posts/[slug]/page.tsx - Dynamic metadata
export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) return { title: 'Not Found' }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.image],
    },
  }
}
```

## Loading and Error Handling

Use special files for loading states and error boundaries at the route segment level.

```tsx
// app/dashboard/loading.tsx - Loading UI
export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
      <div className="h-4 bg-gray-200 rounded w-full mb-2" />
      <div className="h-4 bg-gray-200 rounded w-3/4" />
    </div>
  )
}

// app/dashboard/error.tsx - Error boundary
'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}

// app/not-found.tsx - Custom 404 page
export default function NotFound() {
  return (
    <div>
      <h2>Not Found</h2>
      <p>Could not find the requested resource</p>
    </div>
  )
}
```

## Proxy (Middleware)

The Proxy file runs before requests are completed, enabling URL rewrites, redirects, and header modifications.

```tsx
// proxy.ts (root of project)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect old URLs
  if (pathname.startsWith('/old-blog')) {
    return NextResponse.redirect(
      new URL(pathname.replace('/old-blog', '/blog'), request.url)
    )
  }

  // Rewrite for A/B testing
  if (pathname === '/') {
    const bucket = Math.random() < 0.5 ? 'a' : 'b'
    return NextResponse.rewrite(new URL(`/home/${bucket}`, request.url))
  }

  // Add headers
  const response = NextResponse.next()
  response.headers.set('x-custom-header', 'my-value')

  // Authentication check
  const token = request.cookies.get('auth-token')
  if (pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

## next.config.js Configuration

Configure Next.js behavior using the configuration file. Supports TypeScript with `next.config.ts`.

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Enable React Strict Mode
  reactStrictMode: true,

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.example.com',
        pathname: '/uploads/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/old-page',
        destination: '/new-page',
        permanent: true,
      },
    ]
  },

  // Rewrites (proxy to external API)
  async rewrites() {
    return [
      {
        source: '/api/external/:path*',
        destination: 'https://api.external.com/:path*',
      },
    ]
  },

  // Headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ]
  },

  // Environment variables
  env: {
    CUSTOM_VAR: 'value',
  },

  // Turbopack configuration (default bundler in v16)
  turbopack: {
    resolveAlias: {
      '@components': './src/components',
    },
  },
}

export default nextConfig
```

## Environment Variables

Next.js supports environment variables with automatic loading from `.env` files. Use `NEXT_PUBLIC_` prefix for client-side exposure.

```bash
# .env.local
DATABASE_URL="postgresql://..."
API_SECRET="secret-key"

# Exposed to client (browser)
NEXT_PUBLIC_API_URL="https://api.example.com"
NEXT_PUBLIC_SITE_NAME="My App"
```

```tsx
// Server-side only (secure)
const dbUrl = process.env.DATABASE_URL

// Client-side accessible
const apiUrl = process.env.NEXT_PUBLIC_API_URL

// Runtime environment variable (use connection() to prevent build-time inlining)
import { connection } from 'next/server'

export default async function Page() {
  await connection()
  const runtimeValue = process.env.RUNTIME_CONFIG
  return <div>{runtimeValue}</div>
}
```

## Summary

Next.js is designed for building modern web applications that require both excellent developer experience and production performance. The App Router provides a powerful foundation with React Server Components, nested layouts, and streaming capabilities. Common integration patterns include using Server Components for data fetching, Client Components for interactivity, and Server Functions for mutations.

For optimal application architecture, leverage the file-based routing system with `page.tsx` for routes, `layout.tsx` for shared UI, and `route.ts` for API endpoints. Use the `<Link>` component for navigation, `<Image>` for optimized images, and the caching APIs (`revalidatePath`, `revalidateTag`) for data freshness. The Proxy file enables request interception for authentication, redirects, and A/B testing, while `next.config.ts` provides extensive customization options for images, headers, rewrites, and build optimization.
