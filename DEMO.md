# Demo: Memory Storage with Users

This guide shows how to demo **personal memory** storage (facts, activities, training) per user.

**Use case:** Community health workers (CHWs). The **training platform** delivers job training and career/learning; the **reporting platform** records their job activities (assessments and referrals for disease populations). This app stores each CHW’s identity, training history, and activity history.

---

## Option 1: Quick demo with seed data (recommended)

1. **Apply DB schema** (if not already done):
   ```bash
   npm run db:push
   ```

2. **Seed demo users and memory**:
   ```bash
   npx tsx scripts/seed-demo-data.ts
   ```
   This creates **3 community health workers** with facts (name, role, region), **training** (e.g. TB Screening and Referral, Diabetes Awareness, Maternal Health), and **activities** (screening_completed, referral_made, follow_up_visit) from the reporting platform.

3. **Start the app**:
   ```bash
   npm run dev
   ```

4. **Show the UI**:
   - Open **http://localhost:3000** → you see the **People** list (e.g. Maria Santos, James Okello, Priya Sharma).
   - Click a person → their **Facts** (role, region), **Activities** (screenings, referrals), and **Training** (courses completed).

5. **Optional: Demo adding memory via API** (in another terminal):
   ```bash
   # Add a new screening activity for a CHW (replace 1 with actual person id from seed output)
   curl -X POST http://localhost:3000/api/people/1/activities \
     -H "Content-Type: application/json" \
     -d '{"category":"screening_completed","activityTime":"2025-03-12T10:00:00Z"}'
   ```
   Refresh the person page to see the new activity.

---

## Option 2: Manual demo (no seed script)

1. **Create users**:
   ```bash
   curl -X POST http://localhost:3000/api/people
   # => {"id":1}
   curl -X POST http://localhost:3000/api/people
   # => {"id":2}
   ```

2. **Add memory for each person**:

   **Facts** (e.g. name, role, region):
   ```bash
   curl -X POST http://localhost:3000/api/people/1/facts -H "Content-Type: application/json" -d '{"key":"givenName","value":"Maria"}'
   curl -X POST http://localhost:3000/api/people/1/facts -H "Content-Type: application/json" -d '{"key":"familyName","value":"Santos"}'
   curl -X POST http://localhost:3000/api/people/1/facts -H "Content-Type: application/json" -d '{"key":"role","value":"Community Health Worker"}'
   curl -X POST http://localhost:3000/api/people/1/facts -H "Content-Type: application/json" -d '{"key":"region","value":"South District"}'
   ```

   **Activities** (reporting platform: screenings, referrals):
   ```bash
   curl -X POST http://localhost:3000/api/people/1/activities -H "Content-Type: application/json" -d '{"category":"screening_completed","activityTime":"2025-03-10T14:00:00Z"}'
   curl -X POST http://localhost:3000/api/people/1/activities -H "Content-Type: application/json" -d '{"category":"referral_made","activityTime":"2025-03-10T14:30:00Z"}'
   ```

   **Training** (training platform):
   ```bash
   curl -X POST http://localhost:3000/api/people/1/training -H "Content-Type: application/json" -d '{"name":"TB Screening and Referral","description":"Screening protocols and referral pathways for TB","trainingTime":"2025-02-01T09:00:00Z"}'
   ```

3. **View in the app**: go to http://localhost:3000, click a person, and show Facts / Activities / Training.

---

## Option 3: Demo OAuth “personal memory” consent

Shows that **external apps** can request access to a user’s memory (facts, activities, training) with consent.

1. **Prerequisites**: At least one person with some data (Option 1 or 2), and a test OAuth client (see [TESTING.md](./TESTING.md)):
   ```bash
   OAUTH_CLIENT_ID=test-client \
   OAUTH_CLIENT_SECRET=test-secret \
   OAUTH_REDIRECT_URI=http://localhost:3000/test-oauth/callback \
   OAUTH_CLIENT_NAME="Test OAuth Client" \
   npx tsx scripts/seed-oauth-client.ts
   ```
   In `.env`: `TEST_OAUTH_CLIENT_ID=test-client`, `TEST_OAUTH_CLIENT_SECRET=test-secret`.

2. **Run the flow**:
   - Open **http://localhost:3000/test-oauth**.
   - Click **“Start OAuth flow”** → sign in as a person → on the **consent screen** you see “wants to access the following from your **personal memory**” (facts, activities, training).
   - After allowing, use **“Fetch my facts”** / **“Fetch my activities”** / **“Fetch my training”** to show the app reading that user’s memory via the access token.

---

## Summary

| Goal | Steps |
|------|--------|
| **Show memory per user in the UI** | Seed data → open `/` → click a person → show Facts / Activities / Training. |
| **Show adding memory via API** | `POST /api/people/:id/facts` (or activities, training) → refresh person page. |
| **Show OAuth consent for “personal memory”** | Register test client → `/test-oauth` → Start flow → consent → Fetch my facts/activities/training. |
