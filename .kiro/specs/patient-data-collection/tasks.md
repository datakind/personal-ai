# Implementation Plan: Patient Data Collection

## Overview

This implementation plan breaks down the patient data collection feature into discrete coding tasks. The feature enables authenticated users to create patient records and collect mental health assessment data through PHQ-2 and PHQ-9 questionnaires with conditional workflow logic.

The implementation follows this sequence:
1. Database schema and migrations
2. Core data access functions and Server Actions
3. External API integration for user qualifications
4. UI components and assessment workflow
5. Validation and error handling
6. Property-based testing setup

Each task builds incrementally, with early validation through code execution and optional property-based tests to verify correctness properties.

## Tasks

- [ ] 1. Set up database schema and migrations
  - [x] 1.1 Add patients and assessments tables to database schema
    - Extend `db/schema.ts` with patients table (id, firstName, lastName, dateOfBirth, createdById, createdAt)
    - Add assessments table (id, patientId, userId, assessmentType, totalScore, responses, completedAt)
    - Define relations between patients, assessments, and users tables
    - Export TypeScript types using InferSelectModel and InferInsertModel
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.4, 3.5, 3.6, 4.1, 4.4, 4.5, 4.6_
  
  - [x] 1.2 Generate and apply database migration
    - Run `npx drizzle-kit generate` to create migration files
    - Run `npx drizzle-kit push` to apply schema changes to local.db
    - Verify tables created correctly using `npx drizzle-kit studio`
    - _Requirements: 1.1, 3.1, 4.1_

- [ ] 2. Implement patient management Server Actions
  - [x] 2.1 Create patient CRUD Server Actions
    - Create `app/actions/patients.ts` with 'use server' directive
    - Implement `createPatient(formData: FormData)` with validation and authentication check
    - Implement `getPatients()` to retrieve all patients ordered by creation date
    - Implement `getPatient(id: number)` to retrieve single patient by ID
    - Return structured success/error objects from all actions
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 9.1, 9.2, 9.7_
  
  - [ ]* 2.2 Write property test for patient data round-trip
    - **Property 1: Patient Data Round-Trip**
    - **Validates: Requirements 1.3, 1.4, 1.5, 2.2, 2.3**
    - Install fast-check: `npm install --save-dev fast-check`
    - Create `__tests__/properties/patient-round-trip.test.ts`
    - Generate random valid patient data, create patient, retrieve by ID, verify all fields match
    - Run 100 iterations minimum
  
  - [ ]* 2.3 Write property test for patient ID uniqueness
    - **Property 2: Patient ID Uniqueness and Immutability**
    - **Validates: Requirements 1.2, 1.6**
    - Create `__tests__/properties/patient-id-uniqueness.test.ts`
    - Create multiple patients sequentially, verify each has unique auto-incremented ID
    - Run 100 iterations minimum
  
  - [ ]* 2.4 Write unit tests for patient validation
    - Create `__tests__/unit/patient-validation.test.ts`
    - Test empty first name returns validation error
    - Test empty last name returns validation error
    - Test future date of birth returns validation error
    - Test unauthenticated user returns authorization error
    - _Requirements: 9.1, 9.2, 9.7_

- [ ] 3. Implement assessment scoring and validation logic
  - [x] 3.1 Create assessment utility functions
    - Create `lib/assessments.ts` with scoring and validation functions
    - Implement `calculatePHQ2Score(responses: number[]): number` that sums 2 responses
    - Implement `calculatePHQ9Score(responses: number[]): number` that sums 9 responses
    - Implement `validatePHQ2Responses(responses: number[]): { valid: boolean; error?: string }`
    - Implement `validatePHQ9Responses(responses: number[]): { valid: boolean; error?: string }`
    - Implement `requiresPHQ9(phq2Score: number): boolean` that checks if score >= 3
    - _Requirements: 3.3, 4.3, 9.3, 9.4, 9.5, 10.1, 10.2, 10.4, 10.5_
  
  - [ ]* 3.2 Write property test for PHQ-2 score calculation
    - **Property 6: PHQ-2 Score Calculation**
    - **Validates: Requirements 3.3, 10.1, 10.4**
    - Create `__tests__/properties/phq2-score.test.ts`
    - Generate random arrays of 2 integers (0-3), calculate score, verify sum and range (0-6)
    - Run 100 iterations minimum
  
  - [ ]* 3.3 Write property test for PHQ-9 score calculation
    - **Property 7: PHQ-9 Score Calculation**
    - **Validates: Requirements 4.3, 10.2, 10.5**
    - Create `__tests__/properties/phq9-score.test.ts`
    - Generate random arrays of 9 integers (0-3), calculate score, verify sum and range (0-27)
    - Run 100 iterations minimum
  
  - [ ]* 3.4 Write property test for response validation
    - **Property 15: Assessment Response Range Validation**
    - **Validates: Requirements 9.5**
    - Create `__tests__/properties/response-validation.test.ts`
    - Generate arrays with out-of-range values, verify validation rejects them
    - Run 100 iterations minimum

- [ ] 4. Implement external API integration for user qualifications
  - [x] 4.1 Extend auth system with qualification checking
    - Extend `lib/auth.ts` with OAuth token storage types (if not already present)
    - Implement `getUserQualificationStatus(userId: number): Promise<UserQualificationStatus>`
    - Implement `isUserPHQ9Qualified(userId: number): Promise<boolean>`
    - Check if user has linked account (OAuth tokens exist)
    - If no linked account, return `{ hasLinkedAccount: false, phq9Qualified: false }`
    - If linked account exists, call external API with OAuth token
    - Implement 5-second timeout and error handling (default to not qualified)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  
  - [ ]* 4.2 Write property test for qualification retrieval
    - **Property 9: User Qualification Retrieved from External API**
    - **Validates: Requirements 6.1, 6.2, 6.4**
    - Create `__tests__/properties/user-qualification.test.ts`
    - Mock users with and without linked accounts, verify qualification logic
    - Run 100 iterations minimum
  
  - [ ]* 4.3 Write property test for API error handling
    - **Property 10: External API Error Handling**
    - **Validates: Requirements 6.6**
    - Create `__tests__/properties/api-error-handling.test.ts`
    - Mock API failures, verify system defaults to not qualified
    - Run 100 iterations minimum
  
  - [ ]* 4.4 Write unit tests for qualification edge cases
    - Create `__tests__/unit/qualification-edge-cases.test.ts`
    - Test API timeout defaults to not qualified
    - Test expired OAuth token triggers refresh attempt
    - Test refresh failure defaults to not qualified
    - _Requirements: 6.6_

- [x] 5. Checkpoint - Verify core logic
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement assessment management Server Actions
  - [x] 6.1 Create assessment Server Actions
    - Create `app/actions/assessments.ts` with 'use server' directive
    - Implement `submitPHQ2(patientId: number, responses: number[])` with validation
    - Calculate score using utility function, check user qualification, store assessment
    - Return success, score, requiresPHQ9 flag, and userQualified flag
    - Implement `submitPHQ9(patientId: number, responses: number[])` with validation
    - Calculate score using utility function, store assessment
    - Implement `getAssessmentHistory(patientId: number)` ordered by completion date descending
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.3, 5.4, 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ]* 6.2 Write property test for assessment data round-trip
    - **Property 4: Assessment Data Round-Trip**
    - **Validates: Requirements 3.4, 3.5, 4.4, 4.5**
    - Create `__tests__/properties/assessment-round-trip.test.ts`
    - Generate random valid assessments, create and retrieve, verify all fields match
    - Run 100 iterations minimum
  
  - [ ]* 6.3 Write property test for assessment type tagging
    - **Property 5: Assessment Type Tagging**
    - **Validates: Requirements 3.6, 4.6**
    - Create `__tests__/properties/assessment-type.test.ts`
    - Create PHQ-2 and PHQ-9 assessments, verify type field is correctly set
    - Run 100 iterations minimum
  
  - [ ]* 6.4 Write property test for assessment workflow logic
    - **Property 8: Assessment Workflow Logic**
    - **Validates: Requirements 5.2, 5.3, 5.4**
    - Create `__tests__/properties/workflow-logic.test.ts`
    - Test PHQ-2 score < 3 does not require PHQ-9
    - Test PHQ-2 score >= 3 with qualified user requires PHQ-9
    - Test PHQ-2 score >= 3 with non-qualified user indicates not qualified
    - Run 100 iterations minimum
  
  - [ ]* 6.5 Write unit tests for assessment validation
    - Create `__tests__/unit/assessment-validation.test.ts`
    - Test incomplete PHQ-2 responses (< 2) returns validation error
    - Test incomplete PHQ-9 responses (< 9) returns validation error
    - Test invalid response values return validation error
    - Test patient not found returns error
    - _Requirements: 9.3, 9.4, 9.5_

- [ ] 7. Create patient list and management UI
  - [x] 7.1 Create patient list page
    - Create `app/patients/page.tsx` as Server Component
    - Fetch all patients using `getPatients()` Server Action
    - Display patient list with names, DOB, creation date in a table
    - Add "New Patient" button linking to `/patients/new`
    - Add "Start Assessment" button for each patient linking to `/patients/[id]/assess`
    - Style with Tailwind CSS
    - _Requirements: 2.1, 2.2, 2.3, 7.2, 7.3_
  
  - [x] 7.2 Create new patient form page
    - Create `app/patients/new/page.tsx` as Server Component
    - Create `app/patients/components/PatientForm.tsx` as Client Component with 'use client'
    - Add form fields for firstName, lastName, dateOfBirth (use HTML date input)
    - Use `useFormStatus` hook for loading states
    - Call `createPatient` Server Action on form submit
    - Display validation errors from Server Action response
    - Redirect to `/patients` on success using `redirect()`
    - Style with Tailwind CSS
    - _Requirements: 7.1, 7.4, 7.6, 7.7, 9.1, 9.2_

- [ ] 8. Create patient detail and assessment history UI
  - [x] 8.1 Create patient detail page
    - Create `app/patients/[patientId]/page.tsx` as Server Component
    - Fetch patient by ID using `getPatient(id)` Server Action
    - Fetch assessment history using `getAssessmentHistory(id)` Server Action
    - Display patient information (name, DOB, creation date)
    - Add "Start New Assessment" button linking to `/patients/[id]/assess`
    - Render assessment history component
    - Handle patient not found with redirect to `/patients`
    - Style with Tailwind CSS
    - _Requirements: 2.2, 2.5, 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [x] 8.2 Create assessment history component
    - Create `app/patients/components/AssessmentHistory.tsx` as Server Component
    - Accept assessments array as prop
    - Display each assessment with type, score, completion date, staff member name
    - Order by completion date descending (already ordered from Server Action)
    - Display "No assessments yet" message when array is empty
    - Style with Tailwind CSS
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ]* 8.3 Write property test for assessment history ordering
    - **Property 11: Assessment History Retrieval**
    - **Validates: Requirements 8.1, 8.2, 8.3**
    - Create `__tests__/properties/assessment-history.test.ts`
    - Create multiple assessments with different timestamps, verify ordering
    - Run 100 iterations minimum

- [ ] 9. Implement assessment workflow UI
  - [x] 9.1 Create assessment workflow page
    - Create `app/patients/[patientId]/assess/page.tsx` as Server Component
    - Fetch patient by ID to display patient name
    - Render AssessmentForm component with initial state (PHQ-2)
    - Handle patient not found with redirect to `/patients`
    - Style with Tailwind CSS
    - _Requirements: 5.1, 7.3_
  
  - [x] 9.2 Create assessment form component with workflow logic
    - Create `app/patients/components/AssessmentForm.tsx` as Client Component with 'use client'
    - Accept patientId as prop
    - Manage workflow state: 'phq2' | 'phq2-complete' | 'phq9' | 'complete' | 'not-qualified'
    - Render PHQ-2 questions with 0-3 radio buttons when state is 'phq2'
    - On PHQ-2 submit, call `submitPHQ2` Server Action
    - If score < 3, set state to 'complete' and show completion message
    - If score >= 3 and userQualified is true, set state to 'phq9' and render PHQ-9 form
    - If score >= 3 and userQualified is false, set state to 'not-qualified' and show message
    - Render PHQ-9 questions with 0-3 radio buttons when state is 'phq9'
    - On PHQ-9 submit, call `submitPHQ9` Server Action, set state to 'complete'
    - Display calculated scores after each submission
    - Use `useFormStatus` for loading states
    - Display validation errors from Server Action responses
    - Add "Return to Patient" button when workflow completes
    - Style with Tailwind CSS
    - _Requirements: 3.2, 4.2, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 7.4, 7.5, 7.6, 7.7_
  
  - [ ]* 9.3 Write integration test for complete workflow
    - Create `__tests__/integration/assessment-workflow.test.ts`
    - Test complete PHQ-2 to PHQ-9 workflow for qualified user
    - Test PHQ-2 only workflow for low score
    - Test PHQ-2 workflow for non-qualified user with high score
    - Verify data persisted correctly in database
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 10. Add validation and error handling
  - [x] 10.1 Enhance patient validation
    - Update `createPatient` Server Action to validate name length (max 255 characters)
    - Trim whitespace from names before validation
    - Return specific field-level errors in response object
    - _Requirements: 9.1, 9.6_
  
  - [x] 10.2 Enhance assessment validation
    - Update assessment Server Actions to validate response array length
    - Validate each response is integer between 0-3
    - Validate calculated score is within valid range (0-6 for PHQ-2, 0-27 for PHQ-9)
    - Return specific validation errors in response object
    - _Requirements: 9.3, 9.4, 9.5, 9.6, 10.4, 10.5_
  
  - [x] 10.3 Add database error handling
    - Wrap all database operations in try-catch blocks
    - Log errors server-side with console.error
    - Return generic error messages to client (don't expose database details)
    - Handle foreign key constraint violations gracefully
    - _Requirements: 9.6_
  
  - [ ]* 10.4 Write property test for name validation
    - **Property 12: Patient Name Validation**
    - **Validates: Requirements 9.1**
    - Create `__tests__/properties/name-validation.test.ts`
    - Generate empty and whitespace-only strings, verify validation rejects them
    - Run 100 iterations minimum
  
  - [ ]* 10.5 Write property test for date validation
    - **Property 13: Date of Birth Validation**
    - **Validates: Requirements 9.2**
    - Create `__tests__/properties/dob-validation.test.ts`
    - Generate future dates and invalid dates, verify validation rejects them
    - Run 100 iterations minimum
  
  - [ ]* 10.6 Write property test for response completeness
    - **Property 14: Assessment Response Completeness**
    - **Validates: Requirements 9.3, 9.4**
    - Create `__tests__/properties/response-completeness.test.ts`
    - Generate incomplete response arrays, verify validation rejects them
    - Run 100 iterations minimum

- [ ] 11. Add authentication checks
  - [x] 11.1 Add authentication to all Server Actions
    - Import `requireAuth()` from `lib/auth.ts` in all Server Action files
    - Call `requireAuth()` at the start of each Server Action
    - Use returned user ID for createdById and userId fields
    - Return authorization error if authentication fails
    - _Requirements: 9.7_
  
  - [ ]* 11.2 Write property test for authentication requirement
    - **Property 16: Authentication Requirement**
    - **Validates: Requirements 9.7**
    - Create `__tests__/properties/auth-requirement.test.ts`
    - Mock unauthenticated requests, verify all actions reject them
    - Run 100 iterations minimum

- [ ] 12. Final checkpoint and integration
  - [x] 12.1 Test complete user flows
    - Manually test creating a patient from UI
    - Manually test PHQ-2 assessment with score < 3
    - Manually test PHQ-2 to PHQ-9 workflow with qualified user
    - Manually test PHQ-2 workflow with non-qualified user
    - Manually test viewing assessment history
    - Verify all data persists correctly in database
    - _Requirements: All_
  
  - [~] 12.2 Verify error handling
    - Test form validation errors display correctly
    - Test database errors are handled gracefully
    - Test external API errors default to not qualified
    - Test patient not found scenarios
    - _Requirements: 9.6, 6.6_
  
  - [~] 12.3 Final checkpoint
    - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- The implementation uses TypeScript with Next.js 16 App Router and Drizzle ORM
- Server Components are used by default; Client Components only where needed (forms, interactive UI)
- All database operations use Drizzle ORM with type-safe queries
- Property-based tests use fast-check library with minimum 100 iterations
- Authentication is required for all patient and assessment operations
- External API integration includes error handling and fail-safe defaults
