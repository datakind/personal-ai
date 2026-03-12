# Design Document: Patient Data Collection

## Overview

This design implements a patient data collection system for mental health assessments using standardized PHQ-2 and PHQ-9 questionnaires. The system follows a conditional workflow where all users begin with a PHQ-2 screening, and based on the score (≥3) and user qualifications, may proceed to a PHQ-9 assessment.

The implementation leverages Next.js 16 App Router with React Server Components for the UI layer, Drizzle ORM with SQLite for data persistence, and Server Actions for form handling. The architecture separates concerns between patient record management, assessment data collection, and workflow orchestration.

Key design decisions:
- Server Components handle all data fetching to minimize client-side JavaScript
- Server Actions process form submissions with validation before database operations
- Single assessments table stores both PHQ-2 and PHQ-9 data with a discriminator field
- User qualification tracking extends the existing users table
- Relational queries simplify fetching patient assessment history

## Architecture

### Component Hierarchy

```
app/
├── patients/
│   ├── page.tsx                    # Patient list (Server Component)
│   ├── new/
│   │   └── page.tsx                # New patient form (Server Component)
│   ├── [patientId]/
│   │   ├── page.tsx                # Patient detail with assessment history
│   │   └── assess/
│   │       └── page.tsx            # Assessment workflow entry point
│   └── components/
│       ├── PatientList.tsx         # Patient list display
│       ├── PatientForm.tsx         # Patient creation form (Client Component)
│       ├── AssessmentForm.tsx      # PHQ questionnaire form (Client Component)
│       └── AssessmentHistory.tsx   # Assessment history display
├── actions/
│   ├── patients.ts                 # Patient CRUD Server Actions
│   └── assessments.ts              # Assessment Server Actions
└── lib/
    └── assessments.ts              # Assessment scoring and validation logic
```

### Data Flow

1. **Patient Creation**: User submits form → Server Action validates → Insert into database → Redirect to patient list
2. **Assessment Workflow**: 
   - User initiates assessment → PHQ-2 form displayed
   - User submits PHQ-2 → Server Action calculates score → Store in database
   - If score ≥3 and user qualified → Display PHQ-9 form
   - If score ≥3 and user not qualified → Complete workflow
   - If score <3 → Complete workflow
3. **Data Retrieval**: Server Component fetches data → Render UI → Stream to client

### Technology Integration

- **Next.js App Router**: File-based routing with Server Components as default
- **Drizzle ORM**: Type-safe database operations with relational queries
- **Server Actions**: Form handling with progressive enhancement
- **SQLite**: Local database with better-sqlite3 driver
- **TypeScript**: Strict mode with type inference from Drizzle schemas

## Components and Interfaces

### Database Layer (Drizzle ORM)

#### Patients Table
```typescript
export const patients = sqliteTable('patients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  dateOfBirth: integer('date_of_birth', { mode: 'timestamp' }).notNull(),
  createdById: integer('created_by_id').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
```

#### Assessments Table
```typescript
export const assessments = sqliteTable('assessments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  patientId: integer('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id),
  assessmentType: text('assessment_type', { enum: ['PHQ-2', 'PHQ-9'] }).notNull(),
  totalScore: integer('total_score').notNull(),
  responses: text('responses', { mode: 'json' }).notNull(), // JSON array of integers
  completedAt: integer('completed_at', { mode: 'timestamp' }).notNull(),
});
```

#### No Changes to Users Table

The users table remains unchanged. PHQ-9 qualification is retrieved from the external common storage system API, not stored locally.

### Authentication and Qualification System

**Location:** `lib/auth.ts` (extended)

The Auth_System provides functions to check user qualification status by querying the external common storage system API.

```typescript
// New functions for qualification checking
export async function getUserQualificationStatus(userId: number): Promise<UserQualificationStatus>
export async function isUserPHQ9Qualified(userId: number): Promise<boolean>
```

**Qualification Retrieval Logic:**
1. Check if user has OAuth tokens stored (linked account)
2. If no linked account: return `{ hasLinkedAccount: false, phq9Qualified: false }`
3. If linked account exists: call external API with OAuth token
4. Parse API response for PHQ-9 qualification status
5. If API call fails or times out: return `{ hasLinkedAccount: true, phq9Qualified: false }` (fail-safe)
6. Return qualification status from API

**External API Integration:**
- Endpoint: `GET /api/user/qualifications` (or similar, TBD based on actual API)
- Authentication: OAuth 2.0 bearer token
- Response format: `{ qualifications: { phq9: boolean } }`
- Timeout: 5 seconds
- Error handling: Default to not qualified on any error

**OAuth Token Storage:**
- OAuth tokens stored in database (separate table or in users table)
- Tokens include access token, refresh token, and expiration
- Token refresh logic handles expired access tokens

### Server Actions

#### Patient Actions (`app/actions/patients.ts`)
```typescript
'use server'

export async function createPatient(formData: FormData): Promise<{ 
  success: boolean; 
  patientId?: number; 
  error?: string 
}>

export async function getPatients(): Promise<Patient[]>

export async function getPatient(id: number): Promise<Patient | null>
```

#### Assessment Actions (`app/actions/assessments.ts`)
```typescript
'use server'

export async function submitPHQ2(
  patientId: number, 
  responses: number[]
): Promise<{ 
  success: boolean; 
  score: number; 
  requiresPHQ9: boolean;
  userQualified: boolean;
  error?: string 
}>

export async function submitPHQ9(
  patientId: number, 
  responses: number[]
): Promise<{ 
  success: boolean; 
  score: number; 
  error?: string 
}>

export async function getAssessmentHistory(
  patientId: number
): Promise<Assessment[]>
```

### UI Components

#### PatientForm (Client Component)
- Renders form fields for first name, last name, date of birth
- Uses `useFormStatus` for loading states
- Calls `createPatient` Server Action on submit
- Displays validation errors

#### AssessmentForm (Client Component)
- Accepts assessment type ('PHQ-2' or 'PHQ-9') as prop
- Renders appropriate questions with 0-3 scale radio buttons
- Manages form state for responses
- Calls appropriate Server Action on submit
- Displays calculated score after submission

#### PatientList (Server Component)
- Fetches all patients using `getPatients()`
- Displays patient names, DOB, creation date
- Provides "Start Assessment" button for each patient
- Links to patient detail pages

#### AssessmentHistory (Server Component)
- Fetches assessment history using `getAssessmentHistory()`
- Displays assessment type, score, completion date, and staff member
- Orders by completion date descending

### Assessment Workflow Logic

The workflow is implemented as a multi-step form within a single page component:

1. **Initial State**: Display PHQ-2 form
2. **PHQ-2 Submitted**: 
   - Calculate score
   - Store assessment
   - If score < 3: Show completion message
   - If score ≥ 3 and user qualified: Show PHQ-9 form
   - If score ≥ 3 and user not qualified: Show "requires qualified staff" message
3. **PHQ-9 Submitted** (if applicable):
   - Calculate score
   - Store assessment
   - Show completion message

## Data Models

### Patient Record
```typescript
type Patient = {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  createdById: number;
  createdAt: Date;
}
```

### Assessment Record
```typescript
type Assessment = {
  id: number;
  patientId: number;
  userId: number;
  assessmentType: 'PHQ-2' | 'PHQ-9';
  totalScore: number;
  responses: number[]; // Array of 2 or 9 integers (0-3)
  completedAt: Date;
}
```

### User (No Changes)
```typescript
type User = {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
  // PHQ-9 qualification retrieved from external API, not stored here
}
```

### User Qualification Status (from External API)
```typescript
type UserQualificationStatus = {
  hasLinkedAccount: boolean;
  phq9Qualified: boolean; // Only meaningful if hasLinkedAccount is true
}
```

### Validation Rules

**Patient Creation:**
- firstName: non-empty string, max 255 characters
- lastName: non-empty string, max 255 characters
- dateOfBirth: valid date, must be in the past

**PHQ-2 Assessment:**
- responses: array of exactly 2 integers
- each response: integer between 0 and 3 inclusive
- totalScore: sum of responses, must be 0-6

**PHQ-9 Assessment:**
- responses: array of exactly 9 integers
- each response: integer between 0 and 3 inclusive
- totalScore: sum of responses, must be 0-27


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Patient Data Round-Trip

*For any* valid patient data (first name, last name, date of birth, creator ID), creating a patient record and then retrieving it by ID should return a record with the same first name, last name, date of birth, creator ID, and a non-null creation timestamp.

**Validates: Requirements 1.3, 1.4, 1.5, 2.2, 2.3**

### Property 2: Patient ID Uniqueness and Immutability

*For any* two patient records created sequentially, they should have different auto-incremented IDs, and once assigned, a patient's ID should never change.

**Validates: Requirements 1.2, 1.6**

### Property 3: Patient List Ordering

*For any* set of patient records with different creation timestamps, retrieving all patients should return them ordered by creation date.

**Validates: Requirements 2.1**

### Property 4: Assessment Data Round-Trip

*For any* valid assessment (patient ID, user ID, assessment type, responses), creating an assessment and then retrieving it should return the same patient ID, user ID, assessment type, responses, and a non-null completion timestamp.

**Validates: Requirements 3.4, 3.5, 4.4, 4.5**

### Property 5: Assessment Type Tagging

*For any* PHQ-2 assessment created, its type field should be "PHQ-2", and for any PHQ-9 assessment created, its type field should be "PHQ-9".

**Validates: Requirements 3.6, 4.6**

### Property 6: PHQ-2 Score Calculation

*For any* array of 2 integers between 0 and 3, submitting them as PHQ-2 responses should result in a total score equal to their sum (0-6 range).

**Validates: Requirements 3.3, 10.1, 10.4**

### Property 7: PHQ-9 Score Calculation

*For any* array of 9 integers between 0 and 3, submitting them as PHQ-9 responses should result in a total score equal to their sum (0-27 range).

**Validates: Requirements 4.3, 10.2, 10.5**

### Property 8: Assessment Workflow Logic

*For any* PHQ-2 assessment with score < 3, the workflow should not require PHQ-9; for any PHQ-2 assessment with score ≥ 3 and qualified user, the workflow should require PHQ-9; for any PHQ-2 assessment with score ≥ 3 and non-qualified user, the workflow should indicate PHQ-9 is required but user is not qualified.

**Validates: Requirements 5.2, 5.3, 5.4**

### Property 9: User Qualification Retrieved from External API

*For any* user, when checking their PHQ-9 qualification status, if they have not linked their account via OAuth, the system should return not qualified; if they have linked their account, the system should retrieve the qualification status from the external API.

**Validates: Requirements 6.1, 6.2, 6.4**

### Property 10: External API Error Handling

*For any* user with a linked account, if the external API is unavailable or returns an error when checking PHQ-9 qualification, the system should default to not qualified for safety.

**Validates: Requirements 6.6**

### Property 11: Assessment History Retrieval

*For any* patient with multiple assessments at different timestamps, retrieving their assessment history should return all assessments ordered by completion timestamp in descending order.

**Validates: Requirements 8.1, 8.2, 8.3**

### Property 12: Patient Name Validation

*For any* patient creation request with empty or whitespace-only first name or last name, the creation should be rejected with a validation error.

**Validates: Requirements 9.1**

### Property 13: Date of Birth Validation

*For any* patient creation request with a date of birth in the future or an invalid date, the creation should be rejected with a validation error.

**Validates: Requirements 9.2**

### Property 14: Assessment Response Completeness

*For any* PHQ-2 submission with fewer than 2 responses or PHQ-9 submission with fewer than 9 responses, the submission should be rejected with a validation error.

**Validates: Requirements 9.3, 9.4**

### Property 15: Assessment Response Range Validation

*For any* questionnaire submission where any response is not an integer between 0 and 3 inclusive, the submission should be rejected with a validation error.

**Validates: Requirements 9.5**

### Property 16: Authentication Requirement

*For any* patient creation request without valid authentication, the creation should be rejected with an authorization error.

**Validates: Requirements 9.7**

## Error Handling

### Validation Errors

All validation errors return structured error objects to the client:

```typescript
type ValidationError = {
  success: false;
  error: string;
  field?: string; // Optional field identifier
}
```

**Patient Creation Errors:**
- Empty first name: "First name is required"
- Empty last name: "Last name is required"
- Invalid date of birth: "Date of birth must be a valid date in the past"
- Unauthenticated user: "Authentication required"

**Assessment Submission Errors:**
- Incomplete responses: "All questions must be answered"
- Invalid response value: "Each response must be between 0 and 3"
- Invalid score range: "Calculated score is outside valid range"
- Patient not found: "Patient not found"

### Database Errors

Database operations are wrapped in try-catch blocks. Errors are logged server-side and generic messages returned to clients:

```typescript
try {
  await db.insert(patients).values(data);
} catch (error) {
  console.error('Database error:', error);
  return { success: false, error: 'Failed to create patient record' };
}
```

### Not Found Handling

- Patient not found: Return null from retrieval functions, handle in UI
- Assessment history empty: Return empty array, display "No assessments yet" message
- Invalid patient ID in URL: Redirect to patient list with error message

**Workflow Errors:**
- User not qualified for PHQ-9: Display informational message, do not show PHQ-9 form
- External API unavailable: Default to not qualified, log error server-side
- OAuth token expired: Attempt token refresh, if fails default to not qualified
- Assessment already in progress: Allow completion or restart (no restriction)

## Testing Strategy

### Unit Testing

Unit tests verify specific examples, edge cases, and error conditions using a testing framework like Vitest or Jest:

**Patient Management:**
- Create patient with valid data returns success
- Create patient with empty name returns validation error
- Create patient with future DOB returns validation error
- Retrieve non-existent patient returns null
- Retrieve all patients when database is empty returns empty array

**Assessment Management:**
- Submit PHQ-2 with valid responses calculates correct score
- Submit PHQ-9 with valid responses calculates correct score
- Submit assessment with missing responses returns validation error
- Submit assessment with out-of-range response returns validation error
- Retrieve assessment history for patient with no assessments returns empty array

**Workflow Logic:**
- PHQ-2 score of 2 does not require PHQ-9
- PHQ-2 score of 3 with qualified user (via API) requires PHQ-9
- PHQ-2 score of 3 with non-qualified user shows qualification message
- PHQ-2 score of 3 with unlinked account shows qualification message
- External API error defaults to not qualified

### Property-Based Testing

Property-based tests verify universal properties across randomized inputs using a library like fast-check for TypeScript. Each test runs a minimum of 100 iterations.

**Configuration:**
- Library: fast-check (npm install --save-dev fast-check)
- Iterations: 100 minimum per property test
- Test framework: Vitest or Jest

**Property Test Examples:**

```typescript
import fc from 'fast-check';

// Feature: patient-data-collection, Property 1: Patient Data Round-Trip
test('patient data round-trip', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string({ minLength: 1 }),
      fc.string({ minLength: 1 }),
      fc.date({ max: new Date() }),
      fc.integer({ min: 1 }),
      async (firstName, lastName, dob, userId) => {
        const created = await createPatient({ firstName, lastName, dateOfBirth: dob, createdById: userId });
        const retrieved = await getPatient(created.id);
        
        expect(retrieved.firstName).toBe(firstName);
        expect(retrieved.lastName).toBe(lastName);
        expect(retrieved.dateOfBirth).toEqual(dob);
        expect(retrieved.createdById).toBe(userId);
        expect(retrieved.createdAt).toBeDefined();
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: patient-data-collection, Property 6: PHQ-2 Score Calculation
test('PHQ-2 score calculation', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.array(fc.integer({ min: 0, max: 3 }), { minLength: 2, maxLength: 2 }),
      fc.integer({ min: 1 }),
      fc.integer({ min: 1 }),
      async (responses, patientId, userId) => {
        const result = await submitPHQ2(patientId, responses);
        const expectedScore = responses.reduce((sum, r) => sum + r, 0);
        
        expect(result.score).toBe(expectedScore);
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(6);
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: patient-data-collection, Property 9: User Qualification Retrieved from External API
test('user qualification from external API', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 1 }),
      fc.boolean(),
      fc.boolean(),
      async (userId, hasLinkedAccount, apiQualified) => {
        // Mock user with or without linked account
        const status = await getUserQualificationStatus(userId);
        
        if (!hasLinkedAccount) {
          expect(status.hasLinkedAccount).toBe(false);
          expect(status.phq9Qualified).toBe(false);
        } else {
          expect(status.hasLinkedAccount).toBe(true);
          // Qualification comes from API
        }
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: patient-data-collection, Property 10: External API Error Handling
test('external API error handling', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 1 }),
      async (userId) => {
        // Mock API failure
        const qualified = await isUserPHQ9Qualified(userId);
        
        // Should default to not qualified on error
        expect(qualified).toBe(false);
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: patient-data-collection, Property 12: Patient Name Validation
test('patient name validation', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string().filter(s => s.trim().length === 0),
      fc.string({ minLength: 1 }),
      fc.date({ max: new Date() }),
      async (emptyName, validName, dob) => {
        const result1 = await createPatient({ firstName: emptyName, lastName: validName, dateOfBirth: dob });
        const result2 = await createPatient({ firstName: validName, lastName: emptyName, dateOfBirth: dob });
        
        expect(result1.success).toBe(false);
        expect(result2.success).toBe(false);
      }
    ),
    { numRuns: 100 }
  );
});
```

**Test Organization:**
- Property tests in `__tests__/properties/` directory
- Unit tests in `__tests__/unit/` directory
- Each property test tagged with feature name and property number in comments
- Test database setup/teardown in beforeEach/afterEach hooks

### Integration Testing

Integration tests verify the complete workflow from UI interaction to database persistence:

- Complete patient creation flow from form submission to database storage
- Complete PHQ-2 assessment flow with score calculation and storage
- Complete PHQ-9 conditional workflow based on score and qualification
- Assessment history retrieval and display
- External API qualification check with mocked responses
- OAuth token refresh flow when access token expires
- Workflow behavior when user has no linked account
- Workflow behavior when external API is unavailable

### Manual Testing Checklist

- Verify UI displays correctly on different screen sizes
- Verify form validation messages are clear and helpful
- Verify loading states appear during form submission
- Verify assessment workflow transitions smoothly between steps
- Verify date picker works correctly for date of birth input
- Verify assessment history displays in correct order with proper formatting
- Verify qualification check message displays when user not qualified
- Verify qualification check message displays when user has no linked account
- Verify appropriate error handling when external API is slow or unavailable
