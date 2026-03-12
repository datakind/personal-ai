# Implementation Plan: User Authentication

## Overview

This plan implements immediate trust-based email authentication for the training application using Next.js 16 Server Components, Drizzle ORM with SQLite, and session-based authentication. The implementation follows an incremental approach: database setup, core authentication logic, session management, UI components, middleware protection, testing, and migration from the legacy system.

## Tasks

- [ ] 1. Set up database infrastructure and schema
  - [x] 1.1 Install required dependencies
    - Install drizzle-orm, better-sqlite3, and @types/better-sqlite3
    - Install drizzle-kit for migrations
    - Install fast-check for property-based testing
    - _Requirements: 7.1, 7.2_

  - [x] 1.2 Create database schema with users and sessions tables
    - Create `db/schema.ts` with users table (id, email, createdAt, updatedAt)
    - Create sessions table (id, userId, token, expiresAt, createdAt)
    - Add unique constraints on email and token fields
    - Add foreign key relationship with cascade delete from sessions to users
    - Export TypeScript types using Drizzle's type inference
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 1.3 Create database connection module
    - Create `db/index.ts` with better-sqlite3 connection
    - Initialize Drizzle instance with schema
    - Configure database file path as `training.db`
    - _Requirements: 7.1, 7.2_

  - [x] 1.4 Generate and run initial migration
    - Use drizzle-kit to generate migration files
    - Create migration script to initialize database
    - _Requirements: 7.1, 7.2_

- [ ] 2. Implement core authentication logic
  - [x] 2.1 Create authentication Server Action
    - Create `app/auth/actions.ts` with authenticate function
    - Implement email format validation using regex
    - Implement find-or-create user logic with email normalization (lowercase)
    - Generate cryptographically secure session token using crypto.randomBytes
    - Calculate 7-day expiration timestamp
    - Insert session record into database
    - Set HTTP-only session cookie with secure flags
    - Handle errors and return appropriate error messages
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.5, 3.4, 3.5, 9.1_

  - [ ]* 2.2 Write property test for authentication creates session
    - **Property 1: Authentication creates session with token**
    - **Validates: Requirements 1.1, 1.2, 1.5, 2.1**
    - Generate random valid email addresses
    - Verify session record created in database
    - Verify session token returned

  - [ ]* 2.3 Write property test for email validation
    - **Property 2: Invalid email format rejected**
    - **Validates: Requirements 1.3, 9.1**
    - Generate random invalid email strings
    - Verify authentication returns error for invalid formats

  - [ ]* 2.4 Write property test for unique user identifiers
    - **Property 3: User creation generates unique identifier**
    - **Validates: Requirements 1.4**
    - Create multiple users with different emails
    - Verify all user IDs are unique

  - [ ]* 2.5 Write property test for session expiration calculation
    - **Property 4: Session expiration is 7 days**
    - **Validates: Requirements 2.2**
    - Generate random creation timestamps
    - Verify expiration is exactly 604800 seconds (7 days) from creation

  - [ ]* 2.6 Write property test for session persistence
    - **Property 5: Session persisted with correct associations**
    - **Validates: Requirements 2.3**
    - Create sessions for random users
    - Query database and verify userId, token, and expiresAt match

  - [ ]* 2.7 Write property test for token security
    - **Property 6: Session tokens are cryptographically secure**
    - **Validates: Requirements 2.5**
    - Generate multiple session tokens
    - Verify uniqueness, minimum length (32 bytes), and randomness

- [ ] 3. Implement session validation and management
  - [x] 3.1 Create session validation utilities
    - Create `lib/session.ts` with getSession function
    - Implement session token extraction from cookies
    - Query database for valid, non-expired sessions with user data
    - Implement requireSession function that redirects if no valid session
    - _Requirements: 3.1, 3.2, 4.2, 4.3, 4.4_

  - [x] 3.2 Create logout Server Action
    - Add logout function to `app/auth/actions.ts`
    - Delete session from database using token
    - Clear session cookie
    - Redirect to login page
    - Handle gracefully when session is already invalid
    - _Requirements: 3.3, 5.1, 5.2, 5.3, 5.4_

  - [ ]* 3.3 Write property test for valid session authentication
    - **Property 7: Valid session authenticates request**
    - **Validates: Requirements 3.1, 4.2**
    - Generate valid sessions with future expiration
    - Verify getSession returns user data

  - [ ]* 3.4 Write property test for expired session rejection
    - **Property 8: Expired session rejected**
    - **Validates: Requirements 3.2, 9.2**
    - Generate sessions with past expiration timestamps
    - Verify getSession returns null for expired sessions

  - [ ]* 3.5 Write property test for logout behavior
    - **Property 9: Logout deletes session and clears cookie**
    - **Validates: Requirements 3.3, 5.1, 5.2**
    - Create valid sessions and call logout
    - Verify session deleted from database
    - Verify cookie cleared

  - [ ]* 3.6 Write property test for logout redirect
    - **Property 10: Logout redirects to login**
    - **Validates: Requirements 5.3**
    - Call logout and verify redirect to /login

  - [ ]* 3.7 Write property test for HTTP-only cookies
    - **Property 11: Session cookies are HTTP-only**
    - **Validates: Requirements 3.4**
    - Verify all session cookies have httpOnly flag set to true

- [x] 4. Checkpoint - Verify core authentication logic
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement login UI components
  - [x] 5.1 Create login page Server Component
    - Create `app/login/page.tsx` as async Server Component
    - Check for existing session and redirect to dashboard if authenticated
    - Extract returnUrl from searchParams
    - Render login form with email input
    - _Requirements: 1.1, 1.6, 4.5_

  - [x] 5.2 Create login form Client Component
    - Create `app/login/login-form.tsx` with 'use client' directive
    - Implement form with email input field
    - Use useFormStatus for pending state during submission
    - Call authenticate Server Action on form submission
    - Display error messages from Server Action
    - Handle returnUrl parameter for post-login redirect
    - _Requirements: 1.1, 1.3, 9.1_

  - [ ]* 5.3 Write unit tests for login form component
    - Test form submission with valid email
    - Test error display for invalid email
    - Test pending state during submission
    - _Requirements: 1.1, 1.3, 9.1_

- [ ] 6. Implement protected routes and middleware
  - [x] 6.1 Create middleware for route protection
    - Create `middleware.ts` (or `proxy.ts`) in project root
    - Define public paths array (login, static assets)
    - Check for session cookie on protected routes
    - Redirect to login with returnUrl if no session cookie
    - Allow requests with session cookie to proceed
    - Export config with matcher pattern
    - _Requirements: 4.1, 4.4, 4.5_

  - [x] 6.2 Create protected dashboard page
    - Create `app/dashboard/page.tsx` as async Server Component
    - Call requireSession to enforce authentication
    - Display user email from session
    - Render logout button with Server Action
    - Add placeholder for training materials
    - _Requirements: 3.1, 4.2, 5.1, 5.2, 5.3_

  - [ ]* 6.3 Write property test for unauthenticated redirect
    - **Property 12: Unauthenticated requests redirect to login**
    - **Validates: Requirements 4.1, 4.4**
    - Test requests without session cookie
    - Verify redirect to /login

  - [ ]* 6.4 Write property test for return URL preservation
    - **Property 13: Login redirect preserves return URL**
    - **Validates: Requirements 4.5**
    - Generate random protected route paths
    - Verify returnUrl query parameter set correctly

  - [ ]* 6.5 Write integration tests for protected routes
    - Test complete flow: unauthenticated request → login → dashboard
    - Test middleware allows authenticated requests
    - Test logout clears session and redirects
    - _Requirements: 4.1, 4.2, 4.4, 4.5_

- [ ] 7. Implement database constraints and cleanup
  - [x] 7.1 Verify database constraints enforcement
    - Test unique constraint on users.email
    - Test unique constraint on sessions.token
    - Test foreign key cascade on user deletion
    - _Requirements: 7.3, 7.4, 7.5_

  - [ ]* 7.2 Write property test for email uniqueness
    - **Property 14: Email uniqueness enforced**
    - **Validates: Requirements 7.3**
    - Attempt to insert duplicate email addresses
    - Verify database rejects insertion

  - [ ]* 7.3 Write property test for token uniqueness
    - **Property 15: Session token uniqueness enforced**
    - **Validates: Requirements 7.4**
    - Attempt to insert duplicate session tokens
    - Verify database rejects insertion

  - [ ]* 7.4 Write property test for cascade deletion
    - **Property 16: Foreign key cascade on user deletion**
    - **Validates: Requirements 7.5**
    - Create users with sessions
    - Delete users and verify sessions automatically deleted

  - [x] 7.5 Implement session cleanup process
    - Create cleanup function that deletes expired sessions
    - Add cleanup call to application startup
    - Optionally add scheduled cleanup task
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 7.6 Write property test for session cleanup
    - **Property 17: Cleanup deletes expired sessions**
    - **Validates: Requirements 8.1, 8.2**
    - Create mix of expired and valid sessions
    - Run cleanup and verify only expired sessions deleted

- [x] 8. Checkpoint - Verify complete authentication system
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement migration from legacy system
  - [x] 9.1 Create migration script for existing users
    - Create script to read existing user data with incrementing identifiers
    - Generate User_Record entries preserving user IDs
    - Preserve associations with training history records
    - Preserve associations with OAuth tokens
    - Implement transaction-based migration with rollback on error
    - Add email prompt mechanism for migrated users on first access
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 9.2 Write unit tests for migration script
    - Test data preservation for training history
    - Test OAuth token preservation
    - Test referential integrity maintenance
    - Test idempotency (can run multiple times safely)
    - Test rollback on errors
    - _Requirements: 6.1, 6.2, 6.3, 6.5_

  - [x] 9.3 Create email collection flow for migrated users
    - Detect users without email addresses
    - Redirect to email collection page on first access
    - Update user record with provided email
    - Validate email format and uniqueness
    - _Requirements: 6.4_

- [ ] 10. Final integration and polish
  - [x] 10.1 Add error handling and user feedback
    - Ensure all error messages are user-friendly
    - Add session expiration message on expired session redirect
    - Log detailed errors server-side without exposing to client
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 10.2 Update existing pages to use authentication
    - Update home page to redirect authenticated users to dashboard
    - Add authentication checks to any existing protected routes
    - Ensure consistent navigation and user experience
    - _Requirements: 3.1, 4.2_

  - [x] 10.3 Add Storage API integration placeholder
    - Add TODO comment in authenticate function for Storage API query
    - Document expected behavior when user has OAuth token
    - _Requirements: 2.4_

  - [ ]* 10.4 Write end-to-end integration tests
    - Test complete authentication flow from login to dashboard
    - Test logout flow and re-authentication
    - Test session expiration and re-authentication
    - Test protected route access patterns
    - _Requirements: 1.1, 1.2, 3.1, 3.2, 4.1, 4.2, 5.1, 5.2, 5.3_

- [x] 11. Final checkpoint - Complete system verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Integration tests verify end-to-end flows across components
- Migration tasks preserve existing user data and OAuth integrations
- Checkpoints ensure incremental validation at key milestones
- All database operations use Drizzle ORM with TypeScript type safety
- Authentication uses Server Components and Server Actions following Next.js 16 best practices
