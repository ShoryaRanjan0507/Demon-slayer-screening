import { neon } from '@neondatabase/serverless';

const DB_URL = "postgresql://neondb_owner:npg_e6wn1AzBgGpF@ep-super-recipe-aesw3lnz-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require";

const sql = neon(DB_URL);

async function testConnection() {
  try {
    console.log("Testing Neon DB connection...");
    const res = await sql`SELECT NOW()`;
    console.log("Connection Success! Server time:", res);

    // Check viewers table
    const viewers = await sql`SELECT * FROM viewers`;
    console.log("Registered Viewers in Neon DB:", viewers);

    // Check bookings table
    const bookings = await sql`SELECT * FROM bookings`;
    console.log("Bookings in Neon DB:", bookings);
  } catch (err) {
    console.error("Neon DB Error:", err);
  }
}

testConnection();
