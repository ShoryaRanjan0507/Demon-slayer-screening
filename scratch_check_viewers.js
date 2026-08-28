import { neon } from '@neondatabase/serverless';

const DB_URL = "postgresql://neondb_owner:npg_e6wn1AzBgGpF@ep-super-recipe-aesw3lnz-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require";

const sql = neon(DB_URL);

async function checkViewers() {
  try {
    const viewers = await sql`SELECT * FROM viewers ORDER BY registered_at DESC`;
    console.log("VIEWERS_COUNT:", viewers.length);
    console.log("VIEWERS_DATA:", JSON.stringify(viewers, null, 2));
  } catch (err) {
    console.error("DB check error:", err);
  }
}

checkViewers();
