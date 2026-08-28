import { neon } from '@neondatabase/serverless';

const FULL_URL = "postgresql://neondb_owner:npg_e6wn1AzBgGpF@ep-super-recipe-aesw3lnz-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require";
const CLEAN_URL = FULL_URL.split('?')[0];

console.log("Full URL:", FULL_URL);
console.log("Clean URL:", CLEAN_URL);

const sqlClean = neon(CLEAN_URL);

async function testClean() {
  try {
    const res = await sqlClean`SELECT email, name FROM viewers`;
    console.log("Clean URL Fetch Success! Rows:", res.length);
  } catch (err) {
    console.error("Clean URL Fetch Error:", err);
  }
}

testClean();
