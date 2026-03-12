# Implementation Plan: People Listing Page

## Overview

This implementation replaces the default Next.js landing page with a functional people listing interface. The approach uses Next.js 16 Server Components for optimal performance, fetching data directly from SQLite using Drizzle ORM's relational query API. The implementation includes smart name derivation logic with fallback handling, empty state management, and comprehensive testing with both property-based tests and unit tests.

## Tasks

- [x] 1. Implement data fetching function and name derivation logic
  - [x] 1.1 Create getPeople() function in app/page.tsx
    - Implement async function using db.query.people.findMany()
    - Include facts relation using with: { facts: true }
    - Order by createdAt descending
    - Return typed PersonWithFacts array
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [ ]* 1.2 Write property test for Query Completeness
    - **Property 1: Query Completeness**
    - **Validates: Requirements 2.1, 2.2**
    - Generate random database states with varying numbers of people and facts
    - Assert returned count matches expected count and all facts are included
    - Use fast-check with minimum 100 iterations
  
  - [x] 1.3 Create deriveName() helper function
    - Extract givenName and familyName from facts array
    - Implement fallback chain: full name → givenName → familyName → "Person #[id]"
    - Return string with proper formatting
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ]* 1.4 Write property test for Name Derivation Correctness
    - **Property 2: Name Derivation Correctness**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
    - Generate random person records with different fact combinations
    - Assert output matches expected format for each case
    - Use fast-check with minimum 100 iterations

- [x] 2. Implement UI components
  - [x] 2.1 Create PersonCard component
    - Accept person prop with PersonWithFacts type
    - Call deriveName() for display name
    - Format createdAt using Intl.DateTimeFormat with 'en-US' locale and medium dateStyle
    - Render Link component with href="/people/{id}"
    - Apply Tailwind classes for card styling with hover states
    - Support dark mode with dark: variants
    - _Requirements: 3.1, 3.5, 4.1, 4.2, 6.1, 6.2_
  
  - [ ]* 2.2 Write property test for Date Formatting
    - **Property 3: Date Formatting**
    - **Validates: Requirements 3.5**
    - Generate random timestamps
    - Format and parse back to verify same calendar day
    - Use fast-check with minimum 100 iterations
  
  - [ ]* 2.3 Write property test for Link Generation
    - **Property 4: Link Generation**
    - **Validates: Requirements 4.1, 4.2**
    - Generate random person IDs
    - Assert href attribute equals "/people/{id}"
    - Use fast-check with minimum 100 iterations
  
  - [x] 2.4 Create EmptyState component
    - Render centered layout with min-h-screen
    - Display "No People Yet" heading
    - Include helpful message about adding people via API
    - Apply consistent Tailwind styling with dark mode support
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2_
  
  - [ ]* 2.5 Write unit tests for UI components
    - Test PersonCard renders with correct name and date
    - Test EmptyState displays expected content
    - Test dark mode classes are applied correctly

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement main page component
  - [x] 4.1 Replace app/page.tsx with PeoplePage Server Component
    - Remove all default Next.js template content
    - Create async default export function
    - Call getPeople() and await results
    - Conditionally render EmptyState when peopleList.length === 0
    - Render main layout with max-w-4xl container, proper spacing
    - Map over peopleList and render PersonCard for each person
    - Apply responsive Tailwind classes and dark mode support
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 5.1, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2_
  
  - [ ]* 4.2 Write integration tests for page component
    - Test page renders empty state when no people exist
    - Test page renders person cards when people exist
    - Test page handles database errors gracefully
    - _Requirements: 1.1, 2.4, 5.1_

- [x] 5. Add TypeScript type definitions
  - [x] 5.1 Define PersonWithFacts type
    - Import InferSelectModel from drizzle-orm
    - Create type combining Person with facts array
    - Export type for use in components
    - _Requirements: 2.1, 2.2_
  
  - [ ]* 5.2 Write unit tests for type safety
    - Verify getPeople() returns correctly typed data
    - Test type inference works with Drizzle queries

- [x] 6. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check library with minimum 100 iterations
- All components support dark mode using Tailwind's dark: variant
- Server Components eliminate client-side JavaScript overhead
- The implementation leverages existing database schema and client configuration
