# Implementation Plan: Training Listing Display

## Overview

This implementation creates two primary pages for the training system: a listing page at `/training` that displays all available training materials with completion status, and a detail page at `/training/[id]` that shows individual training content with the ability to mark completion. The implementation uses Next.js 16 Server Components for data fetching, Server Actions for mutations, and Drizzle ORM for type-safe database operations.

## Tasks

- [x] 1. Set up training routes and basic page structure
  - Create `app/training/page.tsx` as Server Component for training list
  - Create `app/training/[id]/page.tsx` as Server Component for training detail
  - Create `app/training/loading.tsx` for loading states
  - Create `app/training/error.tsx` for error boundary
  - Create `app/training/[id]/not-found.tsx` for 404 handling
  - _Requirements: 5.1, 5.2, 5.5, 6.1, 6.2_

- [ ] 2. Implement training list page data fetching and rendering
  - [x] 2.1 Create data fetching function for training list
    - Fetch all training materials using Drizzle relational query
    - Fetch user completion history using `getUserCompletionHistory()`
    - Merge data to create enriched list with completion status
    - Sort materials with uncompleted first, then completed
    - _Requirements: 1.1, 1.5, 1.6, 4.1, 7.1, 7.4_
  
  - [ ]* 2.2 Write property test for list data completeness
    - **Property 1: All materials displayed in list**
    - **Validates: Requirements 1.1**
  
  - [ ]* 2.3 Write property test for list sorting
    - **Property 5: Uncompleted materials sorted first**
    - **Validates: Requirements 1.6**
  
  - [x] 2.4 Implement training list UI rendering
    - Render page header with title
    - Map materials to card components with title, category, completion badge
    - Add clickable links to detail pages for each material
    - Add visual distinction between completed and uncompleted items
    - Add navigation link back to dashboard
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 5.3_
  
  - [ ]* 2.5 Write property test for list item fields
    - **Property 2: List items contain required fields**
    - **Validates: Requirements 1.2, 1.3**
  
  - [ ]* 2.6 Write property test for list navigation links
    - **Property 3: List items have navigation links**
    - **Validates: Requirements 1.4**
  
  - [ ]* 2.7 Write property test for completion indicators
    - **Property 4: Completion status indicated in list**
    - **Validates: Requirements 1.5**

- [ ] 3. Implement training detail page data fetching and rendering
  - [x] 3.1 Create data fetching function for training detail
    - Validate material ID is valid integer
    - Fetch training material by ID using Drizzle query
    - Handle not found case with Next.js `notFound()`
    - Check user completion status using `hasUserCompletedMaterial()`
    - _Requirements: 2.4, 4.2, 6.4, 7.2_
  
  - [x] 3.2 Implement training detail UI rendering
    - Render material title, category badge, and full content
    - Display completion button if not completed
    - Display completion indicator if already completed
    - Add back link to training list
    - Display success message from URL params
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 3.1, 3.4, 5.4_
  
  - [ ]* 3.3 Write property test for detail page fields
    - **Property 6: Detail page contains required fields**
    - **Validates: Requirements 2.1, 2.2, 2.3**
  
  - [ ]* 3.4 Write property test for completion UI rendering
    - **Property 7: Completion UI renders based on status**
    - **Validates: Requirements 3.1, 3.4**
  
  - [ ]* 3.5 Write unit test for invalid material ID handling
    - Test non-integer material IDs trigger validation error
    - Test non-existent material IDs trigger 404
    - _Requirements: 2.4, 6.4_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement completion Server Action
  - [x] 5.1 Create Server Action file `app/training/[id]/actions.ts`
    - Mark file with 'use server' directive
    - Import required functions from lib/session and lib/training
    - _Requirements: 3.2_
  
  - [x] 5.2 Implement `completeTraining` Server Action
    - Get authenticated user with `requireSession()`
    - Extract and validate material ID from FormData
    - Validate material ID is valid integer
    - Call `recordTrainingCompletion()` to create completion record
    - Handle error responses from completion function
    - Revalidate `/training` path cache
    - Redirect to detail page with success parameter
    - _Requirements: 3.2, 3.3, 3.5, 4.3, 4.4, 6.3, 6.4, 6.5, 7.3_
  
  - [ ]* 5.3 Write property test for completion record creation
    - **Property 8: Completion creates database record**
    - **Validates: Requirements 3.2**
  
  - [ ]* 5.4 Write property test for completion idempotency
    - **Property 9: Completion is idempotent**
    - **Validates: Requirements 3.6**
  
  - [ ]* 5.5 Write property test for user association
    - **Property 10: Completions associated with correct user**
    - **Validates: Requirements 4.4**
  
  - [ ]* 5.6 Write unit test for material ID validation
    - **Property 12: Material ID validation**
    - **Validates: Requirements 6.4**

- [ ] 6. Add navigation link from dashboard to training list
  - [x] 6.1 Update `app/dashboard/page.tsx` with training link
    - Add navigation link to `/training` route
    - Style link consistently with dashboard UI
    - _Requirements: 5.3_
  
  - [ ]* 6.2 Write unit test for dashboard navigation link
    - Test link exists and points to `/training`
    - _Requirements: 5.3_

- [ ] 7. Implement error handling and loading states
  - [x] 7.1 Create error boundary component
    - Implement `app/training/error.tsx` with retry functionality
    - Add link back to dashboard
    - Display user-friendly error messages
    - _Requirements: 6.1, 6.2_
  
  - [x] 7.2 Create loading component
    - Implement `app/training/loading.tsx` with skeleton UI
    - Use Tailwind CSS for animated loading states
    - _Requirements: 5.5_
  
  - [x] 7.3 Create not found component
    - Implement `app/training/[id]/not-found.tsx`
    - Display user-friendly 404 message
    - Add link back to training list
    - _Requirements: 2.4_
  
  - [ ]* 7.4 Write unit tests for error handling
    - Test database connection failure displays error
    - Test error boundary catches and displays errors
    - Test loading state displays while fetching
    - _Requirements: 6.1, 6.2, 5.5_

- [x] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
- All database operations use existing functions from `lib/training.ts`
- Server Components are used for data fetching to minimize client-side JavaScript
- Server Actions handle mutations with automatic cache revalidation
