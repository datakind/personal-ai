# Shared Storage System

This application manages a data storage system shared by outside systems. It uses Drizzle ORM with better-sqlite3 to manage the storage system interactions.

The data stored in the system is unique to each person. Data is not shared between people.

## Features

- List people
- View a person and the data stored for them
- API endpoints to add and retrieve fact data to a person
- API endpoints to add and retrieve activity data to a person
- API endpoints to add and retrieve training data to a person

### Data Types

- Facts: Facts are primitive data about a person. Examples of this include given name, family name, date of birth.
- Activities: Activities are actions performed by a person. This data includes a category, a time of activity.
- Training: Training is education a persons has received for a subject area. This data includes a timestamp, name, and description of the training received.

## OAuth 2.0 consent flow

Users can grant the **training platform** (or any registered OAuth client) access to only the personal memory data they choose.

### Scopes

- `facts` – read the person’s facts (e.g. name, date of birth)
- `activities` – read the person’s activities
- `training` – read the person’s training/education data

### Flow

1. **Training platform** redirects the user to this app’s authorize URL:
   ```
   GET /api/oauth/authorize?client_id=...&redirect_uri=...&response_type=code&scope=facts%20activities%20training&state=...
   ```
   **State (CSRF):** The server forwards `state` but does not validate it. For production, the client must generate a random `state`, store it before redirecting, and verify it on their callback. The test client at `/test-oauth` demonstrates this via `/api/test-oauth/start`.
2. User **signs in** (chooses which person they are) if not already signed in.
3. User sees a **consent screen** and selects which data types to allow (facts, activities, training).
4. On “Allow”, the user is redirected back to the client with an authorization `code` (and `state`).
5. The client **exchanges the code for an access token**:
   ```
   POST /api/oauth/token
   Content-Type: application/x-www-form-urlencoded

   grant_type=authorization_code&code=...&redirect_uri=...&client_id=...&client_secret=...
   ```
6. The client uses the **access token** to call the “me” APIs:
   - `GET /api/people/me/facts` (requires `facts` scope)
   - `GET /api/people/me/activities` (requires `activities` scope)
   - `GET /api/people/me/training` (requires `training` scope)
   - Header: `Authorization: Bearer <access_token>`

### Setup

1. Set `SESSION_SECRET` in the environment (used to sign the session cookie).
2. Run the database migration so OAuth tables exist (e.g. `npm run db:push` or apply `drizzle/0001_oauth_tables.sql`).
3. (Optional) Set `DATABASE_PATH` if not using the default `storage.db`; the app and `scripts/seed-oauth-client.ts` both use it so the seeded client is in the same DB.
4. Register an OAuth client (e.g. for the training platform):
   ```bash
   OAUTH_CLIENT_ID=training-platform \
   OAUTH_CLIENT_SECRET=your-secret \
   OAUTH_REDIRECT_URI=https://training.example.com/oauth/callback \
   OAUTH_CLIENT_NAME="Training Platform" \
   npx tsx scripts/seed-oauth-client.ts
   ```
   The client’s `redirect_uri` must be in the allowed list (single URI in the seed script).

### PKCE (public clients)

For public clients (e.g. SPAs without a client secret), send `code_challenge` and `code_challenge_method` (e.g. `S256`) on the authorize request, and `code_verifier` when exchanging the code for a token. Confidential clients can omit PKCE.

### Testing

See **[TESTING.md](./TESTING.md)** for step-by-step instructions. Quick option: register the test client (with `redirect_uri=http://localhost:3000/test-oauth/callback`), set `TEST_OAUTH_CLIENT_ID` and `TEST_OAUTH_CLIENT_SECRET` in `.env`, then open **http://localhost:3000/test-oauth** to run the full flow in the browser.