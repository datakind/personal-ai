/**
 * Seed a single OAuth client (e.g. for the training platform).
 * Run with: npx tsx scripts/seed-oauth-client.ts
 *
 * Requires env: OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, OAUTH_REDIRECT_URI (or pass as args)
 * Optional: OAUTH_CLIENT_NAME (default: "Training Platform")
 */
import { createHash } from 'node:crypto'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '../db/schema'

const clientId = process.env.OAUTH_CLIENT_ID ?? process.argv[2]
const clientSecret = process.env.OAUTH_CLIENT_SECRET ?? process.argv[3]
const redirectUri = process.env.OAUTH_REDIRECT_URI ?? process.argv[4] ?? 'http://localhost:3000/callback'
const name = process.env.OAUTH_CLIENT_NAME ?? process.argv[5] ?? 'Training Platform'

if (!clientId || !clientSecret) {
  console.error('Usage: OAUTH_CLIENT_ID=id OAUTH_CLIENT_SECRET=secret [OAUTH_REDIRECT_URI=uri] npx tsx scripts/seed-oauth-client.ts')
  console.error('   Or: npx tsx scripts/seed-oauth-client.ts <client_id> <client_secret> [redirect_uri] [name]')
  process.exit(1)
}

const secretHash = createHash('sha256').update(clientSecret).digest('hex')
const redirectUris = JSON.stringify([redirectUri])

const dbPath = process.env.DATABASE_PATH ?? 'storage.db'

async function main() {
  const sqlite = new Database(dbPath)
  const db = drizzle(sqlite, { schema })

  try {
    await db.insert(schema.oauthClients).values({
      clientId,
      clientSecretHash: secretHash,
      name,
      redirectUris,
    })
    console.log('OAuth client registered:', { clientId, name, redirectUri })
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'SQLITE_CONSTRAINT_UNIQUE') {
      console.log('Client already exists:', clientId)
    } else {
      throw e
    }
  } finally {
    sqlite.close()
  }
}

main()
