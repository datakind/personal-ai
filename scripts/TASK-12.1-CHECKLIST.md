# Task 12.1 Testing Checklist

**Feature:** Patient Data Collection  
**Task:** Test complete user flows  
**Tester:** ________________  
**Date:** ________________

---

## Pre-Test Setup

- [ ] Development server running (`npm run dev`)
- [ ] Database exists (`local.db`)
- [ ] Test users created (run `npx tsx scripts/setup-test-environment.ts`)
- [ ] Logged into application
- [ ] Test plan reviewed (`scripts/MANUAL-TEST-PLAN.md`)

---

## Core Test Scenarios

### ✅ Test 1: Create Patient from UI

- [ ] Navigate to patients page
- [ ] Click "New Patient" button
- [ ] Fill in patient form (First: John, Last: Doe, DOB: 1990-01-15)
- [ ] Submit form
- [ ] Verify redirect to patients list
- [ ] Verify patient appears in list
- [ ] Verify patient has unique ID and creation date

**Result:** ⬜ Pass / ⬜ Fail  
**Notes:** _______________________________________________

---

### ✅ Test 2: PHQ-2 Assessment (Score < 3)

- [ ] Click "Start Assessment" for John Doe
- [ ] Verify PHQ-2 form displays with 2 questions
- [ ] Select responses: Q1=0, Q2=1
- [ ] Submit assessment
- [ ] Verify score calculated as 1
- [ ] Verify workflow completes (no PHQ-9 shown)
- [ ] Verify completion message or redirect

**Result:** ⬜ Pass / ⬜ Fail  
**Notes:** _______________________________________________

---

### ✅ Test 3: PHQ-2 to PHQ-9 (Qualified User)

**Prerequisites:**
- [ ] User has OAuth token (qualified)
- [ ] External API mocked or available

**PHQ-2 Phase:**
- [ ] Start new assessment
- [ ] Complete PHQ-2 with score ≥ 3 (Q1=2, Q2=1)
- [ ] Submit PHQ-2
- [ ] Verify score calculated as 3
- [ ] Verify PHQ-2 saved to database

**PHQ-9 Phase:**
- [ ] Verify PHQ-9 form displays (9 questions)
- [ ] Complete all 9 questions (sample: 1,2,1,0,1,2,1,0,1)
- [ ] Submit PHQ-9
- [ ] Verify score calculated as 9
- [ ] Verify PHQ-9 saved to database
- [ ] Verify workflow completes

**Result:** ⬜ Pass / ⬜ Fail  
**Notes:** _______________________________________________

---

### ✅ Test 4: PHQ-2 (Non-Qualified User)

**Prerequisites:**
- [ ] User does NOT have OAuth token (not qualified)

**Steps:**
- [ ] Start new assessment
- [ ] Complete PHQ-2 with score ≥ 3 (Q1=3, Q2=2)
- [ ] Submit PHQ-2
- [ ] Verify score calculated as 5
- [ ] Verify PHQ-2 saved to database

**Expected Behavior:**
- [ ] Message displayed: "PHQ-9 assessment required"
- [ ] Message displayed: "User not qualified"
- [ ] PHQ-9 form NOT displayed
- [ ] Workflow completes (only PHQ-2 saved)

**Result:** ⬜ Pass / ⬜ Fail  
**Notes:** _______________________________________________

---

### ✅ Test 5: View Assessment History

- [ ] Navigate to patient detail page for John Doe
- [ ] Locate "Assessment History" section
- [ ] Verify all assessments displayed
- [ ] Verify each assessment shows:
  - [ ] Assessment type (PHQ-2 or PHQ-9)
  - [ ] Total score
  - [ ] Completion date/time
  - [ ] Staff member name
- [ ] Verify assessments ordered by date (most recent first)
- [ ] Verify all previous test assessments visible

**Result:** ⬜ Pass / ⬜ Fail  
**Notes:** _______________________________________________

---

### ✅ Test 6: Database Persistence

**Method:** Use Drizzle Studio (`npx drizzle-kit studio`) or SQLite CLI

**Patients Table:**
- [ ] John Doe exists with correct first_name
- [ ] John Doe has correct last_name
- [ ] John Doe has correct date_of_birth
- [ ] John Doe has correct created_by_id
- [ ] John Doe has valid created_at timestamp

**Assessments Table:**
- [ ] All test assessments exist
- [ ] Each assessment has correct patient_id
- [ ] Each assessment has correct user_id
- [ ] Each assessment has correct assessment_type
- [ ] Each assessment has correct total_score
- [ ] Each assessment has valid responses JSON array
- [ ] Each assessment has valid completed_at timestamp

**Data Integrity:**
- [ ] All foreign keys valid
- [ ] No NULL values in required fields
- [ ] Timestamps reasonable (not future, not too old)
- [ ] Scores match sum of responses
- [ ] Response arrays have correct length (2 or 9)
- [ ] All response values between 0-3

**Result:** ⬜ Pass / ⬜ Fail  
**Notes:** _______________________________________________

---

## Optional Edge Case Tests

### ✅ Test 7: Patient Form Validation

- [ ] Empty first name rejected
- [ ] Empty last name rejected
- [ ] Future date of birth rejected
- [ ] Invalid date rejected
- [ ] Validation messages clear and helpful

**Result:** ⬜ Pass / ⬜ Fail

---

### ✅ Test 8: Assessment Form Validation

- [ ] PHQ-2 with unanswered questions rejected
- [ ] PHQ-9 with unanswered questions rejected
- [ ] Validation messages clear and helpful

**Result:** ⬜ Pass / ⬜ Fail

---

### ✅ Test 9: Multiple Patients

- [ ] Created 3-5 different patients
- [ ] Completed multiple assessments per patient
- [ ] All patients appear in list
- [ ] Each patient's assessments correctly associated
- [ ] No data mixing between patients

**Result:** ⬜ Pass / ⬜ Fail

---

## Issues Found

| # | Description | Severity | Test | Status |
|---|-------------|----------|------|--------|
| 1 | | ⬜ High ⬜ Med ⬜ Low | | ⬜ Open ⬜ Fixed |
| 2 | | ⬜ High ⬜ Med ⬜ Low | | ⬜ Open ⬜ Fixed |
| 3 | | ⬜ High ⬜ Med ⬜ Low | | ⬜ Open ⬜ Fixed |
| 4 | | ⬜ High ⬜ Med ⬜ Low | | ⬜ Open ⬜ Fixed |
| 5 | | ⬜ High ⬜ Med ⬜ Low | | ⬜ Open ⬜ Fixed |

---

## Overall Assessment

**Total Tests:** 9 (6 core + 3 optional)  
**Tests Passed:** _____  
**Tests Failed:** _____  
**Pass Rate:** _____%

**Overall Result:** ⬜ PASS / ⬜ FAIL

---

## Sign-Off

**Tester Name:** _____________________________________________

**Date:** _____________________________________________

**Comments:**

_______________________________________________

_______________________________________________

_______________________________________________

---

## Next Steps

If all tests pass:
- [ ] Mark Task 12.1 as complete
- [ ] Archive test results
- [ ] Proceed to next task

If tests fail:
- [ ] Document all issues in detail
- [ ] Create bug reports for critical issues
- [ ] Prioritize fixes
- [ ] Re-test after fixes

