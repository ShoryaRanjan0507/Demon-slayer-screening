import { neon } from '@neondatabase/serverless';

const NEON_URL = process.env.VITE_NEON_DATABASE_URL || process.env.NEON_DATABASE_URL || "postgresql://neondb_owner:npg_e6wn1AzBgGpF@ep-super-recipe-aesw3lnz-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require";
const sql = neon(NEON_URL);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT seat_data FROM seat_maps WHERE audi_id = 'MAIN_SEAT_MAP' LIMIT 1`;
      if (rows && rows.length > 0) {
        const data = typeof rows[0].seat_data === 'string' ? JSON.parse(rows[0].seat_data) : rows[0].seat_data;
        return res.status(200).json({ seatMap: data });
      }
      return res.status(200).json({ seatMap: null });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const { seatMap } = body;
      if (!seatMap) {
        return res.status(400).json({ error: 'seatMap is required' });
      }
      await sql`
        INSERT INTO seat_maps (audi_id, seat_data, updated_at)
        VALUES ('MAIN_SEAT_MAP', ${JSON.stringify(seatMap)}, CURRENT_TIMESTAMP)
        ON CONFLICT (audi_id) DO UPDATE 
        SET seat_data = EXCLUDED.seat_data, updated_at = CURRENT_TIMESTAMP;
      `;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API /api/seats error:', err);
    return res.status(500).json({ error: err.message });
  }
}
