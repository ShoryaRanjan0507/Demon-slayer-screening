import { neon } from '@neondatabase/serverless';

const NEON_URL = process.env.VITE_NEON_DATABASE_URL || process.env.NEON_DATABASE_URL || "postgresql://neondb_owner:npg_e6wn1AzBgGpF@ep-super-recipe-aesw3lnz-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require";
const sql = neon(NEON_URL);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // ?full=true includes payment_screenshot (for admin portal only)
      // Default excludes it to save bandwidth during polling
      const includeFull = req.query?.full === 'true';

      const rows = includeFull
        ? await sql`
            SELECT 
              booking_id as "bookingId", user_email, user_name, user_roll_no, auditorium, seats,
              total_amount::float as "totalAmount", utr_number as "utrNumber",
              payment_screenshot as "paymentScreenshot",
              status, checked_in as "checkedIn", check_in_time as "checkInTime", timestamp
            FROM bookings ORDER BY timestamp DESC;
          `
        : await sql`
            SELECT 
              booking_id as "bookingId", user_email, user_name, user_roll_no, auditorium, seats,
              total_amount::float as "totalAmount", utr_number as "utrNumber",
              status, checked_in as "checkedIn", check_in_time as "checkInTime", timestamp
            FROM bookings ORDER BY timestamp DESC;
          `;

      const bookings = (rows || []).map(r => ({
        bookingId: r.bookingId,
        user: { email: r.user_email, name: r.user_name, rollNo: r.user_roll_no },
        auditorium: r.auditorium,
        seats: typeof r.seats === 'string' ? JSON.parse(r.seats) : r.seats,
        totalAmount: r.totalAmount,
        utrNumber: r.utrNumber,
        paymentScreenshot: r.paymentScreenshot || null,
        status: r.status,
        checkedIn: r.checkedIn,
        checkInTime: r.checkInTime,
        timestamp: r.timestamp
      }));
      return res.status(200).json({ bookings });
    }

    if (req.method === 'POST') {
      const b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      if (!b || !b.bookingId) {
        return res.status(400).json({ error: 'bookingId is required' });
      }
      await sql`
        INSERT INTO bookings (
          booking_id, user_email, user_name, user_roll_no, auditorium, 
          seats, total_amount, utr_number, payment_screenshot, status, checked_in, timestamp
        ) VALUES (
          ${b.bookingId}, ${b.user?.email}, ${b.user?.name}, ${b.user?.rollNo || ''}, ${b.auditorium || 'AB02 — Audi 1'},
          ${JSON.stringify(b.seats)}, ${b.totalAmount}, ${b.utrNumber}, ${b.paymentScreenshot || null},
          ${b.status || 'PENDING_VERIFICATION'}, ${b.checkedIn || false}, ${b.timestamp}
        )
        ON CONFLICT (booking_id) DO UPDATE SET
          status = EXCLUDED.status,
          payment_screenshot = COALESCE(EXCLUDED.payment_screenshot, bookings.payment_screenshot),
          checked_in = EXCLUDED.checked_in,
          check_in_time = EXCLUDED.check_in_time;
      `;
      return res.status(200).json({ success: true });
    }

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const { bookingId, status, checkedIn, checkInTime } = body;
      if (!bookingId) {
        return res.status(400).json({ error: 'bookingId is required' });
      }
      if (checkedIn !== undefined) {
        await sql`
          UPDATE bookings SET checked_in = TRUE, check_in_time = ${checkInTime}
          WHERE booking_id = ${bookingId};
        `;
      } else if (status) {
        await sql`
          UPDATE bookings SET status = ${status}
          WHERE booking_id = ${bookingId};
        `;
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API /api/bookings error:', err);
    return res.status(500).json({ error: err.message });
  }
}
