# Implementation Plan: User Authentication and Session Management

## Overview

This plan implements a simple local authentication system with session management for the patient health reporting application. The implementation follows a bottom-up approach: database layer first, then authentication library, middleware for route protection, Server Actions for login/logout, and finally the login UI. Each task builds incrementally with validation checkpoints to ensure core functionality works before proceeding.

## Tasks

- [ ] 1. Set up database schema and configuration
  - [x] 1.1 Create Drizzle configuration file
    - Create `drizzle.config.ts` in project root
    - Configure SQLite driver with `better-sqlite3`
    - Set schema path to `./db/schema.ts`
    - Set output directory for migrations to `./drizzle`
    - _Requirements: 1.2, 2.4, 7.5_

  - [x] 1.2 Define database schema for users and sessions
    - Create `db/schema.ts` with users table (id, name, email, createdAt)
    - Create sessions table (id, userId, expiresAt, createdAt)
    - Add foreign key constraint with cascade delete from sessions to users
    - Export TypeScript types using `InferSelectModel` and `InferInsertModel`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.4, 7.5_

  - [x] 1.3 Create database connection module
    - Create `db/index.ts` with better-sqlite3 connection
    - Initialize Drizzle instance with schema
    - Export db instance for use across application
    - _Requirements: 1.2, 7.5_

  - [x] 1.4 Generate and apply initial migration
    - Run `npx drizzle-kit generate` to create migration files
    - Run `npx drizzle-kit push` to apply schema to database
    - Verify tables created correctly
    - _Requirements: 1.2, 7.5_

- [ ] 2. Implement authentication library
  - [x] 2.1 Create session token generation function
    - Create `lib/auth.ts` file
    - Implement `generateSessionToken()` using `crypto.randomBytes(32)`
    - Encode token as base64url string
    - _Requirements: 2.2, 7.1_

  - [x] 2.2 Implement session creation function
    - Write `createSession(userId: number)` function
    - Generate cryptographically secure session token
    - Calculate expiration timestamp (8 hours from now)
    - Insert session record into database using Drizzle
    - Return session token
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_

  - [x] 2.3 Implement session validation function
    - Write `validateSession(token: string)` function
    - Query session by token with user join
    - Check if session exists and not expired
    - Delete session if expired
    - Return user and session data or null
    - _Requirements: 3.4, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 2.4 Implement session invalidation function
    - Write `invalidateSession(token: string)` function
    - Delete session record from database
    - _Requirements: 5.1_

  - [x] 2.5 Implement user context access functions
    - Write `getCurrentUser()` to get user from cookies
    - Write `requireAuth()` that throws if not authenticated
    - Use `cookies()` from next/headers to read session token
    - Call `validateSession()` to get user data
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 2.6 Implement expired session cleanup function
    - Write `cleanupExpiredSessions()` function
    - Delete all sessions where expiresAt < current time
    - _Requirements: 5.4_

- [ ] 3. Implement middleware for route protection
  - [x] 3.1 Create Next.js middleware with session validation
    - Create `middleware.ts` in project root
    - Extract session token from request cookies
    - Call `validateSession()` to check authentication
    - Implement route protection logic: redirect unauthenticated users from protected routes to `/login`
    - Implement login redirect: redirect authenticated users from `/login` to `/`
    - Configure matcher to run on all routes except static assets
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 4. Checkpoint - Verify database and auth library
  - Ensure database schema is created correctly
  - Test session creation and validation functions manually if needed
  - Ask the user if questions arise

- [ ] 5. Implement Server Actions for authentication
  - [x] 5.1 Create login Server Action
    - Create `app/actions/auth.ts` with `'use server'` directive
    - Implement `login(formData: FormData)` function
    - Validate form data (non-empty name and email)
    - Query or create user by email using Drizzle
    - Call `createSession(userId)` to generate session token
    - Set HTTP-only cookie with session token (httpOnly, secure in production, sameSite: lax, maxAge: 28800)
    - Call `redirect('/')` on success
    - Return error object on failure
    - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 6.3, 6.4, 7.2, 7.3, 7.4_

  - [x] 5.2 Create logout Server Action
    - Implement `logout()` function in `app/actions/auth.ts`
    - Get session token from cookies
    - Call `invalidateSession(token)` to remove session
    - Clear session cookie by setting maxAge to 0
    - Call `redirect('/login')` to redirect to login page
    - _Requirements: 5.1, 5.2, 5.3_

- [ ] 6. Implement login UI
  - [x] 6.1 Create login page Server Component
    - Create `app/login/page.tsx`
    - Check if user is already authenticated using `getCurrentUser()`
    - Redirect to `/` if authenticated (handled by middleware, but good practice)
    - Render login form component
    - _Requirements: 6.1, 6.2_

  - [x] 6.2 Create login form Client Component
    - Create `app/login/components/LoginForm.tsx` with `'use client'` directive
    - Add form with name and email input fields
    - Add submit button with loading state using `useFormStatus` hook
    - Connect form action to login Server Action
    - Display validation errors from Server Action response
    - Show loading state while form is submitting
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 7. Update root layout and create protected page
  - [x] 7.1 Verify root layout doesn't interfere with auth
    - Check `app/layout.tsx` doesn't have auth-blocking logic
    - Ensure layout works for both authenticated and unauthenticated states
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 7.2 Update home page to demonstrate authentication
    - Modify `app/page.tsx` to use `getCurrentUser()`
    - Display user information when authenticated
    - Show that route is protected (middleware handles redirect)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 8. Add logout functionality to UI
  - [x] 8.1 Create logout button component
    - Create logout button that calls logout Server Action
    - Add to home page or create shared navigation component
    - Use form with action for progressive enhancement
    - _Requirements: 5.1, 5.2, 5.3_

- [ ] 9. Final checkpoint - End-to-end testing
  - Test complete authentication flow: register → login → access protected route → logout
  - Verify middleware redirects work correctly
  - Verify session expiration (can test with shorter duration)
  - Ensure all tests pass, ask the user if questions arise

## Notes

- All tasks reference specific requirements for traceability
- Database setup must complete before authentication library implementation
- Middleware depends on authentication library functions
- Server Actions depend on both auth library and middleware being functional
- UI components are implemented last as they depend on all backend functionality
- No property-based tests included as the design document doesn't specify correctness properties
- Session cleanup function implemented but not scheduled (can be added to cron job later)
- Training qualifications are NOT stored locally per requirements - will be retrieved from external API in future tasks
