import { getCompletionsByTimestampRange } from '@/lib/training';

async function testTimestampRangeQuery() {
  console.log('Testing timestamp range query...\n');

  // Test 1: Query last 7 days
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  console.log('Test 1: Query completions from last 7 days');
  console.log(`Start: ${sevenDaysAgo.toISOString()}`);
  console.log(`End: ${now.toISOString()}`);
  
  const recentCompletions = await getCompletionsByTimestampRange(sevenDaysAgo, now);
  console.log(`Found ${recentCompletions.length} completions\n`);
  
  if (recentCompletions.length > 0) {
    console.log('Sample completion:');
    const sample = recentCompletions[0];
    console.log(`- ID: ${sample.id}`);
    console.log(`- User ID: ${sample.userId}`);
    console.log(`- Material: ${sample.material.title}`);
    console.log(`- Completed At: ${sample.completedAt.toISOString()}`);
    console.log(`- Synced: ${sample.synced}\n`);
  }

  // Test 2: Query specific date range (yesterday)
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));
  const endOfYesterday = new Date(yesterday.setHours(23, 59, 59, 999));
  
  console.log('Test 2: Query completions from yesterday');
  console.log(`Start: ${startOfYesterday.toISOString()}`);
  console.log(`End: ${endOfYesterday.toISOString()}`);
  
  const yesterdayCompletions = await getCompletionsByTimestampRange(startOfYesterday, endOfYesterday);
  console.log(`Found ${yesterdayCompletions.length} completions\n`);

  // Test 3: Query all time (very wide range)
  const veryOld = new Date('2020-01-01');
  const future = new Date('2030-12-31');
  
  console.log('Test 3: Query all completions (2020-2030)');
  const allCompletions = await getCompletionsByTimestampRange(veryOld, future);
  console.log(`Found ${allCompletions.length} total completions\n`);

  console.log('✓ Timestamp range query tests completed successfully');
}

testTimestampRangeQuery().catch(console.error);
