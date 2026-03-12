# Testing the OAuth flow

Two ways to test: **browser (test client)** or **curl**.

---

## Prerequisites

1. **Database with OAuth tables**
   ```bash
   npm run db:push
   ```
   If you use migrations instead, ensure `drizzle/0001_oauth_tables.sql` has been applied.

2. **Environment**
   ```bash
   cp .env.example .env
   # Set at least:
   # SESSION_SECRET=something-at-least-32-characters-long
   ```

3. **At least one person**
   ```bash
   curl -X POST http://localhost:3000/api/people
   # => {"id":1}
   ```
   Optionally add facts so there’s data to see:
   ```bash
   # If you have an API to add facts, use it. Otherwise add via DB or leave empty.
   ```

4. **Registered OAuth client**
   For the **in-app test client** (recommended):
   ```bash
   OAUTH_CLIENT_ID=test-client \
   OAUTH_CLIENT_SECRET=test-secret \
   OAUTH_REDIRECT_URI=http://localhost:3000/test-oauth/callback \
   OAUTH_CLIENT_NAME="Test OAuth Client" \
   npx tsx scripts/seed-oauth-client.ts
   ```
   For **curl testing**, register any client and use its `client_id` and `client_secret` in the steps below.

5. **Run the app**
   ```bash
   npm run dev
   ```

---

## Option A: Browser test (easiest)

1. Register the test client (see above) with `OAUTH_REDIRECT_URI=http://localhost:3000/test-oauth/callback`.

2. Add to `.env`:
   ```env
   TEST_OAUTH_CLIENT_ID=test-client
   TEST_OAUTH_CLIENT_SECRET=test-secret
   ```

3. Open **http://localhost:3000/test-oauth**.

4. Click **“Start OAuth flow”**. You will:
   - Be sent to **login** → choose a person.
   - Then to **consent** → choose facts / activities / training.
   - Then to the callback, which **verifies the state** cookie (CSRF mitigation), then back to the test page with an access token.
   - **Note:** For arbitrary clients, the server does not validate `state`; each client must send and verify `state` on their own callback (as the test client does).

5. Use **“Fetch my facts”**, **“Fetch my activities”**, **“Fetch my training”** to call the protected APIs with that token.

---

## Option B: Manual flow with curl

Base URL (adjust if needed): `BASE=http://localhost:3000`

### 1. Create a person (if needed)
```bash
curl -s -X POST $BASE/api/people
# => {"id":1}
```

### 2. Start the flow in a browser

Open (one line, replace `BASE` and `CLIENT_ID`):

```
{BASE}/api/oauth/authorize?client_id=CLIENT_ID&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Ftest-oauth%2Fcallback&response_type=code&scope=facts%20activities%20training&state=abc
```

- Sign in (choose the person).
- On the consent screen, allow the scopes you want.
- You will be redirected to `redirect_uri?code=...&state=abc`. Copy the `code` from the URL (use it in the next step).

### 3. Exchange the code for a token
```bash
CODE='paste-code-from-redirect-url-here'
CLIENT_ID=test-client
CLIENT_SECRET=test-secret
REDIRECT_URI='http://localhost:3000/test-oauth/callback'

curl -s -X POST "$BASE/api/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&code=$CODE&redirect_uri=$REDIRECT_URI&client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET"
```

You should get JSON like:
```json
{"access_token":"...","token_type":"Bearer","expires_in":3600,"scope":"facts activities training"}
```

### 4. Call the protected APIs
```bash
TOKEN='paste-access_token-here'

curl -s -H "Authorization: Bearer $TOKEN" "$BASE/api/people/me/facts"
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/api/people/me/activities"
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/api/people/me/training"
```

- With the right scope, you get 200 and JSON data.
- Without the scope (e.g. token only has `facts` but you call `/api/people/me/activities`), you get **401 Unauthorized**.

---

## Quick checks

| What | How |
|------|-----|
| No token | `curl $BASE/api/people/me/facts` → 401 |
| Wrong scope | Get token with only `scope=facts`, then `GET /api/people/me/activities` → 401 |
| Expired code | Use the same `code` twice for token exchange → second request fails |
| Consent remembered | Run the flow again for the same person + client → consent screen can be skipped and you get a new code |
