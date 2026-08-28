import { neon } from '@neondatabase/serverless';

const url = "postgresql://neondb_owner:npg_e6wn1AzBgGpF@ep-super-recipe-aesw3lnz-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require";
const sql = neon(url);

async function testQuery() {
  console.log("1. Running query with full connection string...");
  try {
    const rows = await sql`SELECT email, name, roll_no as "rollNo" FROM viewers ORDER BY registered_at DESC`;
    console.log("Success! Count:", rows.length);
    console.log("Rows:", rows);
  } catch (e) {
    console.error("Error:", e);
  }
}

testQuery();
