import { neon } from '@neondatabase/serverless';

const NEON_URL = process.env.VITE_NEON_DATABASE_URL || process.env.NEON_DATABASE_URL || "postgresql://neondb_owner:npg_e6wn1AzBgGpF@ep-super-recipe-aesw3lnz-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require";
const sql = neon(NEON_URL);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await sql`DELETE FROM bookings`;
    await sql`DELETE FROM seat_maps`;
    await sql`DELETE FROM viewers`;
    return res.status(200).json({ success: true, message: 'All data cleared from database' });
  } catch (err) {
    console.error('API /api/reset error:', err);
    return res.status(500).json({ error: err.message });
  }
}
