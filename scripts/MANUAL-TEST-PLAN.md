# Manual Test Plan: Patient Data Collection System

**Feature:** Patient Data Collection  
**Task:** 12.1 - Test complete user flows  
**Date:** $(date)  
**Tester:** _____________

## Overview

This test plan covers end-to-end testing of the patient data collection system, including patient creation, PHQ-2 and PHQ-9 assessment workflows, and data persistence verification.

## Prerequisites

### 1. Start the Development Server

```bash
npm run dev
```

The application should be accessible at: http://localhost:3000

### 2. Verify Database Exists

Ensure `local.db` exists in the project root. If not, the application will create it on first run.

### 3. Login as a Test User

Navigate to http://localhost:3000/login and log in with any test user credentials.

---

## Test Scenarios

### Test 1: Create a Patient from UI

**Objective:** Verify that users can successfully create patient records through the UI.

**Steps:**

1. Navigate to the patients page: http://localhost:3000/patients
2. Click the "New Patient" or "Add Patient" button
3. Fill in the patient form:
   - **First Name:** John
   - **Last Name:** Doe
   - **Date of Birth:** 1990-01-15 (or use date picker)
4. Click "Submit" or "Create Patient"

**Expected Results:**

- ✅ Form submits without errors
- ✅ User is redirected to the patients list page
- ✅ New patient "John Doe" appears in the patient list
- ✅ Patient shows creation date (today's date)
- ✅ Patient has a unique ID assigned

**Actual Results:**

- [ ] Pass
- [ ] Fail

**Notes:**
_____________________________________________

---

### Test 2: PHQ-2 Assessment with Score < 3

**Objective:** Verify that PHQ-2 assessments with low scores complete without requiring PHQ-9.

**Steps:**

1. From the patients list, click "Start Assessment" or "Assess" for John Doe
2. You should see the PHQ-2 questionnaire with 2 questions:
   - Question 1: "Little interest or pleasure in doing things"
   - Question 2: "Feeling down, depressed, or hopeless"
3. Select the following responses:
   - Question 1: **0 (Not at all)**
   - Question 2: **1 (Several days)**
4. Click "Submit" or "Complete Assessment"

**Expected Results:**

- ✅ Form submits successfully
- ✅ Total score calculated: **1** (0 + 1)
- ✅ Assessment workflow completes (no PHQ-9 form shown)
- ✅ User sees completion message or is redirected
- ✅ No message about PHQ-9 being required

**Actual Results:**

- [ ] Pass
- [ ] Fail

**Notes:**
_____________________________________________

---

### Test 3: PHQ-2 to PHQ-9 Workflow with Qualified User

**Objective:** Verify that qualified users can complete PHQ-9 after a PHQ-2 score ≥ 3.

**Prerequisites:**

- User must have a linked OAuth account with PHQ-9 qualification
- To simulate this, you may need to:
  1. Insert test OAuth token in database, OR
  2. Mock the external API response, OR
  3. Use a test user that's already qualified

**Steps:**

1. From the patients list, click "Start Assessment" for John Doe (or create a new patient)
2. Complete the PHQ-2 questionnaire with a score ≥ 3:
   - Question 1: **2 (More than half the days)**
   - Question 2: **1 (Several days)**
3. Click "Submit"
4. Verify PHQ-2 score: **3** (2 + 1)

**Expected Results After PHQ-2:**

- ✅ PHQ-2 assessment saved to database
- ✅ System checks user qualification status
- ✅ PHQ-9 form is displayed (because user is qualified and score ≥ 3)
- ✅ PHQ-9 form shows all 9 questions

**Steps (continued):**

5. Complete the PHQ-9 questionnaire with sample responses:
   - Question 1: 1
   - Question 2: 2
   - Question 3: 1
   - Question 4: 0
   - Question 5: 1
   - Question 6: 2
   - Question 7: 1
   - Question 8: 0
   - Question 9: 1
6. Click "Submit"

**Expected Results After PHQ-9:**

- ✅ PHQ-9 assessment saved to database
- ✅ Total score calculated: **9** (sum of all responses)
- ✅ Assessment workflow completes
- ✅ User sees completion message or is redirected

**Actual Results:**

- [ ] Pass
- [ ] Fail

**Notes:**
_____________________________________________

---

### Test 4: PHQ-2 Workflow with Non-Qualified User

**Objective:** Verify that non-qualified users see appropriate messaging when PHQ-9 is required.

**Prerequisites:**

- User must NOT have PHQ-9 qualification
- This is the default state for users without linked OAuth accounts

**Steps:**

1. Ensure you're logged in as a user without PHQ-9 qualification
2. From the patients list, click "Start Assessment" for a patient
3. Complete the PHQ-2 questionnaire with a score ≥ 3:
   - Question 1: **3 (Nearly every day)**
   - Question 2: **2 (More than half the days)**
4. Click "Submit"
5. Verify PHQ-2 score: **5** (3 + 2)

**Expected Results:**

- ✅ PHQ-2 assessment saved to database
- ✅ System checks user qualification status
- ✅ User sees a message indicating:
  - PHQ-9 assessment is required (score ≥ 3)
  - User is not qualified to administer PHQ-9
  - A qualified staff member should complete the assessment
- ✅ PHQ-9 form is NOT displayed
- ✅ Assessment workflow completes (only PHQ-2 saved)

**Actual Results:**

- [ ] Pass
- [ ] Fail

**Notes:**
_____________________________________________

---

### Test 5: View Assessment History

**Objective:** Verify that users can view all assessments for a patient in chronological order.

**Steps:**

1. Navigate to the patient detail page for John Doe
   - Click on the patient name from the patients list, OR
   - Navigate to: http://localhost:3000/patients/[patientId]
2. Locate the "Assessment History" section

**Expected Results:**

- ✅ All assessments for the patient are displayed
- ✅ Each assessment shows:
  - Assessment type (PHQ-2 or PHQ-9)
  - Total score
  - Completion date and time
  - Staff member who completed it (user name)
- ✅ Assessments are ordered by completion date (most recent first)
- ✅ All assessments from previous tests are visible:
  - PHQ-2 with score 1
  - PHQ-2 with score 3 (if Test 3 was performed)
  - PHQ-9 with score 9 (if Test 3 was performed)
  - PHQ-2 with score 5 (if Test 4 was performed)

**Actual Results:**

- [ ] Pass
- [ ] Fail

**Notes:**
_____________________________________________

---

### Test 6: Verify Data Persists in Database

**Objective:** Verify that all data is correctly stored in the SQLite database.

**Method 1: Using Drizzle Studio (Recommended)**

```bash
npx drizzle-kit studio
```

This opens a web-based database GUI at http://localhost:4983 (or similar).

**Method 2: Using SQLite CLI**

```bash
sqlite3 local.db
```

Then run SQL queries:

```sql
-- View all patients
SELECT * FROM patients;

-- View all assessments
SELECT * FROM assessments;

-- View assessments with patient names
SELECT 
  a.id,
  a.assessment_type,
  a.total_score,
  a.responses,
  a.completed_at,
  p.first_name || ' ' || p.last_name as patient_name,
  u.name as staff_name
FROM assessments a
JOIN patients p ON a.patient_id = p.id
JOIN users u ON a.user_id = u.id
ORDER BY a.completed_at DESC;
```

**Expected Results:**

**Patients Table:**
- ✅ Patient "John Doe" exists with correct:
  - first_name: "John"
  - last_name: "Doe"
  - date_of_birth: 1990-01-15 (as timestamp)
  - created_by_id: (your user ID)
  - created_at: (timestamp from test execution)

**Assessments Table:**
- ✅ All assessments from tests exist with correct:
  - patient_id: (matches John Doe's ID)
  - user_id: (your user ID)
  - assessment_type: "PHQ-2" or "PHQ-9"
  - total_score: (matches calculated scores)
  - responses: (JSON array of integers)
  - completed_at: (timestamp from test execution)

**Data Integrity:**
- ✅ All foreign key relationships are valid
- ✅ No NULL values in required fields
- ✅ Timestamps are reasonable (not in future, not too old)
- ✅ Scores match the sum of responses
- ✅ Response arrays have correct length (2 for PHQ-2, 9 for PHQ-9)
- ✅ All response values are between 0 and 3

**Actual Results:**

- [ ] Pass
- [ ] Fail

**Notes:**
_____________________________________________

---

## Additional Edge Case Tests (Optional)

### Test 7: Patient Form Validation

**Steps:**

1. Navigate to create new patient form
2. Try to submit with empty first name
3. Try to submit with empty last name
4. Try to submit with future date of birth
5. Try to submit with invalid date

**Expected Results:**

- ✅ Form shows validation errors for each invalid input
- ✅ Form does not submit until all fields are valid

---

### Test 8: Assessment Form Validation

**Steps:**

1. Start a new assessment
2. Try to submit PHQ-2 without answering all questions
3. Complete PHQ-2, then try to submit PHQ-9 without answering all questions

**Expected Results:**

- ✅ Form shows validation error when questions are unanswered
- ✅ Form does not submit until all questions are answered

---

### Test 9: Multiple Patients and Assessments

**Steps:**

1. Create 3-5 different patients
2. Complete multiple assessments for each patient
3. Verify patient list shows all patients
4. Verify each patient's assessment history is separate and correct

**Expected Results:**

- ✅ All patients appear in list
- ✅ Each patient's assessments are correctly associated
- ✅ No data mixing between patients

---

## Test Summary

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Create Patient | ⬜ Pass / ⬜ Fail | |
| 2 | PHQ-2 Score < 3 | ⬜ Pass / ⬜ Fail | |
| 3 | PHQ-2 to PHQ-9 (Qualified) | ⬜ Pass / ⬜ Fail | |
| 4 | PHQ-2 (Non-Qualified) | ⬜ Pass / ⬜ Fail | |
| 5 | Assessment History | ⬜ Pass / ⬜ Fail | |
| 6 | Database Persistence | ⬜ Pass / ⬜ Fail | |
| 7 | Patient Validation | ⬜ Pass / ⬜ Fail | |
| 8 | Assessment Validation | ⬜ Pass / ⬜ Fail | |
| 9 | Multiple Patients | ⬜ Pass / ⬜ Fail | |

**Overall Result:** ⬜ Pass / ⬜ Fail

---

## Issues Found

| Issue # | Description | Severity | Test # |
|---------|-------------|----------|--------|
| | | | |
| | | | |
| | | | |

---

## Notes for Developers

### Setting Up Test Users with PHQ-9 Qualification

To test the qualified user workflow (Test 3), you need a user with PHQ-9 qualification. Here are options:

**Option 1: Insert Test OAuth Token**

```sql
-- First, find your user ID
SELECT id, name FROM users;

-- Insert a test OAuth token (replace USER_ID with your actual user ID)
INSERT INTO oauth_tokens (user_id, access_token, refresh_token, expires_at, created_at, updated_at)
VALUES (
  USER_ID,
  'test_access_token_123',
  'test_refresh_token_456',
  datetime('now', '+1 day'),
  datetime('now'),
  datetime('now')
);
```

**Option 2: Mock External API**

Set environment variable to use a mock API endpoint:

```bash
EXTERNAL_API_URL=http://localhost:3001/mock
```

Then create a simple mock server that returns:

```json
{
  "qualifications": {
    "phq9": true
  }
}
```

**Option 3: Modify Code Temporarily**

In `lib/auth.ts`, temporarily modify `getUserQualificationStatus()` to return:

```typescript
return {
  hasLinkedAccount: true,
  phq9Qualified: true,
};
```

---

## Sign-Off

**Tester Name:** _____________________________________________

**Date:** _____________________________________________

**Signature:** _____________________________________________

