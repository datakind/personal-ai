/**
 * Seed demo data: community health workers (CHWs) with job-relevant memory.
 * - Training platform: courses for CHW skills and career/learning.
 * - Reporting platform: job activities (assessments, referrals for disease populations).
 *
 * Run with: npx tsx scripts/seed-demo-data.ts
 * Uses DATABASE_PATH from env or default storage.db.
 *
 * This script CLEARS existing people and their data, then inserts only the 3 CHWs.
 */
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '../db/schema'

const dbPath = process.env.DATABASE_PATH ?? 'storage.db'

function main() {
  const sqlite = new Database(dbPath)
  const db = drizzle(sqlite, { schema })

  const now = new Date()
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  // Clear existing data (order matters: child tables first due to FK)
  sqlite.exec('DELETE FROM facts')
  sqlite.exec('DELETE FROM activities')
  sqlite.exec('DELETE FROM training')
  sqlite.exec('DELETE FROM oauth_authorization_codes')
  sqlite.exec('DELETE FROM oauth_access_tokens')
  sqlite.exec('DELETE FROM oauth_consents')
  sqlite.exec('DELETE FROM people')
  sqlite.exec("DELETE FROM sqlite_sequence WHERE name='people'")

  // —— CHW 1: Maria Santos ——
  const maria = db.insert(schema.people).values({}).returning().get()
  if (!maria) throw new Error('Failed to create person')
  const mariaId = maria.id

  const mariaFacts = [
    { personId: mariaId, key: 'givenName', value: 'Maria' },
    { personId: mariaId, key: 'familyName', value: 'Santos' },
    { personId: mariaId, key: 'dateOfBirth', value: '1988-03-12' },
    { personId: mariaId, key: 'role', value: 'Community Health Worker' },
    { personId: mariaId, key: 'region', value: 'South District' },
  ]
  for (const row of mariaFacts) {
    db.insert(schema.facts).values(row).run()
  }
  db.insert(schema.activities).values([
    { personId: mariaId, category: 'screening_completed', activityTime: twoDaysAgo },
    { personId: mariaId, category: 'referral_made', activityTime: twoDaysAgo },
    { personId: mariaId, category: 'screening_completed', activityTime: lastWeek },
    { personId: mariaId, category: 'referral_made', activityTime: lastWeek },
    { personId: mariaId, category: 'follow_up_visit', activityTime: lastWeek },
    { personId: mariaId, category: 'screening_completed', activityTime: twoWeeksAgo },
    { personId: mariaId, category: 'referral_made', activityTime: twoWeeksAgo },
    { personId: mariaId, category: 'screening_completed', activityTime: lastMonth },
  ]).run()
  db.insert(schema.training).values([
    { personId: mariaId, name: 'TB Screening and Referral', description: 'Identification, screening protocols, and referral pathways for tuberculosis.', trainingTime: twoMonthsAgo },
    { personId: mariaId, name: 'Diabetes Awareness for CHWs', description: 'Risk factors, blood glucose basics, and when to refer for diabetes care.', trainingTime: lastMonth },
    { personId: mariaId, name: 'Maternal Health Assessment', description: 'Prenatal risk assessment and referral for high-risk pregnancies.', trainingTime: lastMonth },
  ]).run()

  // —— CHW 2: James Okello ——
  const james = db.insert(schema.people).values({}).returning().get()
  if (!james) throw new Error('Failed to create person')
  const jamesId = james.id

  const jamesFacts = [
    { personId: jamesId, key: 'givenName', value: 'James' },
    { personId: jamesId, key: 'familyName', value: 'Okello' },
    { personId: jamesId, key: 'dateOfBirth', value: '1992-07-22' },
    { personId: jamesId, key: 'role', value: 'Community Health Worker' },
    { personId: jamesId, key: 'region', value: 'North District' },
  ]
  for (const row of jamesFacts) {
    db.insert(schema.facts).values(row).run()
  }
  db.insert(schema.activities).values([
    { personId: jamesId, category: 'screening_completed', activityTime: lastWeek },
    { personId: jamesId, category: 'referral_made', activityTime: lastWeek },
    { personId: jamesId, category: 'screening_completed', activityTime: twoWeeksAgo },
    { personId: jamesId, category: 'referral_made', activityTime: twoWeeksAgo },
    { personId: jamesId, category: 'follow_up_visit', activityTime: lastMonth },
  ]).run()
  db.insert(schema.training).values([
    { personId: jamesId, name: 'Referral Protocol Compliance', description: 'Documentation, eligibility, and correct referral for TB, HIV, and NCDs.', trainingTime: lastMonth },
    { personId: jamesId, name: 'Hypertension Screening', description: 'BP measurement, interpretation, and when to refer for hypertension.', trainingTime: twoWeeksAgo },
  ]).run()

  // —— CHW 3: Priya Sharma ——
  const priya = db.insert(schema.people).values({}).returning().get()
  if (!priya) throw new Error('Failed to create person')
  const priyaId = priya.id

  const priyaFacts = [
    { personId: priyaId, key: 'givenName', value: 'Priya' },
    { personId: priyaId, key: 'familyName', value: 'Sharma' },
    { personId: priyaId, key: 'dateOfBirth', value: '1995-11-08' },
    { personId: priyaId, key: 'role', value: 'Community Health Worker' },
    { personId: priyaId, key: 'region', value: 'Central District' },
  ]
  for (const row of priyaFacts) {
    db.insert(schema.facts).values(row).run()
  }
  db.insert(schema.activities).values([
    { personId: priyaId, category: 'screening_completed', activityTime: twoDaysAgo },
    { personId: priyaId, category: 'screening_completed', activityTime: lastWeek },
    { personId: priyaId, category: 'follow_up_visit', activityTime: lastWeek },
  ]).run()
  db.insert(schema.training).values([
    { personId: priyaId, name: 'CHW Foundations', description: 'Core competencies, ethics, and community engagement for new CHWs.', trainingTime: twoMonthsAgo },
    { personId: priyaId, name: 'TB Screening and Referral', description: 'Identification, screening protocols, and referral pathways for tuberculosis.', trainingTime: lastMonth },
  ]).run()

  sqlite.close()
  console.log('Demo data seeded: 3 community health workers (existing data was cleared).')
  console.log('  Maria Santos (South District):', mariaId)
  console.log('  James Okello (North District):', jamesId)
  console.log('  Priya Sharma (Central District):', priyaId)
  console.log('Refresh http://localhost:3000 to see the names.')
}

main()
