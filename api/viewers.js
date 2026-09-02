import { neon } from '@neondatabase/serverless';

const NEON_URL = process.env.NEON_DATABASE_URL || process.env.VITE_NEON_DATABASE_URL || "postgresql://neondb_owner:npg_hIOBTiYDVL59@ep-purple-forest-axyt3h5l-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require";
const sql = neon(NEON_URL);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=60');
      const rows = await sql`SELECT email, name, roll_no as "rollNo" FROM viewers ORDER BY registered_at DESC`;
      const viewers = (rows || []).map(r => ({
        id: `reg-${r.email}`,
        email: r.email,
        name: r.name,
        rollNo: r.rollNo || 'N/A'
      }));
      return res.status(200).json({ viewers });
    }

    if (req.method === 'POST') {
      return res.status(403).json({ 
        error: 'Registrations are currently closed. The event is postponed for now, please wait for further instructions.' 
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API /api/viewers error:', err);
    return res.status(500).json({ error: err.message });
  }
}
