import { neon } from '@neondatabase/serverless';

const POOLER_URL = "postgresql://neondb_owner:npg_e6wn1AzBgGpF@ep-super-recipe-aesw3lnz-pooler.c-2.us-east-2.aws.neon.tech/neondb";
const DIRECT_URL = "postgresql://neondb_owner:npg_e6wn1AzBgGpF@ep-super-recipe-aesw3lnz.c-2.us-east-2.aws.neon.tech/neondb";

async function compareUrls() {
  console.log("1. Testing POOLER url:", POOLER_URL);
  try {
    const sqlPooler = neon(POOLER_URL);
    const res1 = await sqlPooler`SELECT email FROM viewers`;
    console.log("Pooler result count:", res1.length);
  } catch (err) {
    console.error("Pooler error:", err.message);
  }

  console.log("\n2. Testing DIRECT url:", DIRECT_URL);
  try {
    const sqlDirect = neon(DIRECT_URL);
    const res2 = await sqlDirect`SELECT email FROM viewers`;
    console.log("Direct result count:", res2.length);
    console.log("Direct emails:", res2.map(r => r.email));
  } catch (err) {
    console.error("Direct error:", err.message);
  }
}

compareUrls();
