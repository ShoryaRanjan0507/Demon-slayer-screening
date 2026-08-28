import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.VITE_NEON_DATABASE_URL || process.env.NEON_DATABASE_URL);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Initialize tables
    await sql`
      CREATE TABLE IF NOT EXISTS viewers (
        email TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        roll_no TEXT,
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS bookings (
        booking_id TEXT PRIMARY KEY,
        user_email TEXT NOT NULL,
        user_name TEXT NOT NULL,
        user_roll_no TEXT,
        auditorium TEXT NOT NULL,
        seats JSONB NOT NULL,
        total_amount NUMERIC NOT NULL,
        utr_number TEXT NOT NULL,
        payment_screenshot TEXT,
        status TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION',
        checked_in BOOLEAN DEFAULT FALSE,
        check_in_time TEXT,
        timestamp TEXT NOT NULL
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS seat_maps (
        audi_id TEXT PRIMARY KEY,
        seat_data JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    return res.status(200).json({ success: true, message: 'Database initialized' });
  } catch (err) {
    console.error('API /api/init error:', err);
    return res.status(500).json({ error: err.message });
  }
}
