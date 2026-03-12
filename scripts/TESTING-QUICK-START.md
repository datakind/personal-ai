# Quick Start Guide: Manual Testing

This guide helps you quickly set up and execute the manual test plan for Task 12.1.

## 1. Start the Application

```bash
# Start the development server
npm run dev
```

The application will be available at: **http://localhost:3000**

## 2. Prepare Test Environment

### Check Database

The SQLite database should exist at `local.db` in the project root. If it doesn't exist, the application will create it automatically.

### Login

1. Navigate to http://localhost:3000/login
2. Log in with any existing user credentials
3. If no users exist, you may need to create one first

## 3. Execute Test Plan

Open the detailed test plan:

```
scripts/MANUAL-TEST-PLAN.md
```

Follow each test scenario in order:

1. ✅ **Test 1:** Create a Patient from UI
2. ✅ **Test 2:** PHQ-2 Assessment with Score < 3
3. ✅ **Test 3:** PHQ-2 to PHQ-9 Workflow (Qualified User)
4. ✅ **Test 4:** PHQ-2 Workflow (Non-Qualified User)
5. ✅ **Test 5:** View Assessment History
6. ✅ **Test 6:** Verify Data Persists in Database

## 4. Verify Database (Optional)

### Option A: Use Drizzle Studio (Recommended)

```bash
npx drizzle-kit studio
```

This opens a web GUI to browse the database.

### Option B: Use SQLite CLI

```bash
sqlite3 local.db

# Then run queries:
SELECT * FROM patients;
SELECT * FROM assessments;
.quit
```

## 5. Test User Qualification Setup

For **Test 3** (qualified user workflow), you need a user with PHQ-9 qualification.

### Quick Setup: Insert Test OAuth Token

```bash
# Open SQLite
sqlite3 local.db

# Find your user ID
SELECT id, name FROM users;

# Insert test OAuth token (replace 1 with your actual user ID)
INSERT INTO oauth_tokens (user_id, access_token, refresh_token, expires_at, created_at, updated_at)
VALUES (
  1,
  'test_access_token_123',
  'test_refresh_token_456',
  datetime('now', '+1 day'),
  datetime('now'),
  datetime('now')
);

.quit
```

**Note:** The external API will still need to be mocked or available for this to work fully. See the main test plan for details.

## 6. Common Issues

### Issue: Can't access http://localhost:3000

**Solution:** Ensure the dev server is running (`npm run dev`)

### Issue: Database errors

**Solution:** Check that `local.db` exists and has correct permissions

### Issue: Login not working

**Solution:** Verify users exist in the database:

```bash
sqlite3 local.db "SELECT * FROM users;"
```

### Issue: PHQ-9 form not showing for qualified user

**Solution:** 
1. Verify OAuth token exists for the user
2. Check that `EXTERNAL_API_URL` environment variable is set
3. Ensure external API is accessible or mocked

## 7. Recording Results

As you complete each test:

1. Mark Pass/Fail in the test plan
2. Add notes for any issues found
3. Fill out the Issues Found table
4. Complete the Test Summary table

## 8. Clean Up (After Testing)

If you want to reset the test data:

```bash
# Delete test patients and assessments
sqlite3 local.db

DELETE FROM assessments;
DELETE FROM patients;

.quit
```

**Warning:** This will delete ALL patients and assessments, not just test data.

## Need Help?

- Review the full test plan: `scripts/MANUAL-TEST-PLAN.md`
- Check requirements: `.kiro/specs/patient-data-collection/requirements.md`
- Check design: `.kiro/specs/patient-data-collection/design.md`

