import { neon } from '@neondatabase/serverless';

const NEON_URL = process.env.VITE_NEON_DATABASE_URL || process.env.NEON_DATABASE_URL || "postgresql://neondb_owner:npg_hIOBTiYDVL59@ep-purple-forest-axyt3h5l-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require";
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
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const { email, name, rollNo } = body;
      if (!email || !name) {
        return res.status(400).json({ error: 'email and name are required' });
      }
      await sql`
        INSERT INTO viewers (email, name, roll_no)
        VALUES (${email.toLowerCase()}, ${name}, ${rollNo || ''})
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, roll_no = EXCLUDED.roll_no;
      `;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API /api/viewers error:', err);
    return res.status(500).json({ error: err.message });
  }
}
