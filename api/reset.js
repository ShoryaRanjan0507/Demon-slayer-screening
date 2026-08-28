import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.VITE_NEON_DATABASE_URL || process.env.NEON_DATABASE_URL);

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
