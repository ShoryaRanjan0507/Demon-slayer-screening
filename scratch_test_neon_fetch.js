import { neon } from '@neondatabase/serverless';

const DB_URL = "postgresql://neondb_owner:npg_e6wn1AzBgGpF@ep-super-recipe-aesw3lnz-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require";

const sql = neon(DB_URL);

async function runTest() {
  try {
    console.log("1. Fetching viewers...");
    const viewers = await sql`SELECT * FROM viewers`;
    console.log("Viewers count:", viewers.length);
    console.log("Viewers emails:", viewers.map(v => v.email));

    console.log("2. Inserting test viewer...");
    const testEmail = `test_${Date.now()}@vitbhopal.ac.in`;
    await sql`
      INSERT INTO viewers (email, name, roll_no)
      VALUES (${testEmail}, 'Realtime Test', '25TEST001')
      ON CONFLICT (email) DO NOTHING;
    `;
    console.log("Inserted test viewer:", testEmail);

    console.log("3. Re-fetching viewers...");
    const viewersAfter = await sql`SELECT * FROM viewers`;
    console.log("Viewers count after insert:", viewersAfter.length);
    console.log("Viewers emails after insert:", viewersAfter.map(v => v.email));

    // Clean up test viewer
    await sql`DELETE FROM viewers WHERE email = ${testEmail}`;
    console.log("Cleaned up test viewer.");
  } catch (err) {
    console.error("NEON FETCH ERROR:", err);
  }
}

runTest();
