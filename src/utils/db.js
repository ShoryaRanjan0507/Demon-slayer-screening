import { neon } from '@neondatabase/serverless';

export const NEON_CONNECTION_STRING = "postgresql://neondb_owner:npg_e6wn1AzBgGpF@ep-super-recipe-aesw3lnz-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require";

export const getSql = () => {
  let url = NEON_CONNECTION_STRING;
  try {
    if (typeof import.meta !== 'undefined' && import.meta && import.meta.env && import.meta.env.VITE_NEON_DATABASE_URL) {
      const custom = import.meta.env.VITE_NEON_DATABASE_URL.trim();
      if (custom.length > 10) url = custom;
    }
  } catch (e) {
    url = NEON_CONNECTION_STRING;
  }
  return neon(url);
};

// Initialize Database Tables in Neon Postgres
export const initNeonDatabase = async () => {
  try {
    const sql = getSql();
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

    console.log("⚡ Neon Postgres Database connected & tables initialized!");
    return { success: true };
  } catch (err) {
    console.error("Neon DB Initialization Warning:", err);
    return { success: false, error: err };
  }
};

// Fetch registered viewers from Neon Postgres
export const fetchNeonViewers = async () => {
  try {
    const sql = getSql();
    const rows = await sql`SELECT email, name, roll_no as "rollNo" FROM viewers ORDER BY registered_at DESC`;
    if (!rows) return [];
    console.log("⚡ [Neon DB] Viewers loaded from database:", rows.length);
    return rows.map(r => ({
      id: `reg-${r.email}`,
      email: r.email,
      name: r.name,
      rollNo: r.rollNo || 'N/A'
    }));
  } catch (err) {
    console.error("⚡ Fetch Neon Viewers Error:", err);
    throw err;
  }
};

// Save a new viewer to Neon Postgres
export const saveNeonViewer = async (viewer) => {
  try {
    const sql = getSql();
    await sql`
      INSERT INTO viewers (email, name, roll_no)
      VALUES (${viewer.email.toLowerCase()}, ${viewer.name}, ${viewer.rollNo || ''})
      ON CONFLICT (email) DO UPDATE 
      SET name = EXCLUDED.name, roll_no = EXCLUDED.roll_no;
    `;
    return true;
  } catch (err) {
    console.error("Save Neon Viewer Error:", err);
    return false;
  }
};

// Fetch all bookings from Neon Postgres
export const fetchNeonBookings = async () => {
  try {
    const sql = getSql();
    const rows = await sql`
      SELECT 
        booking_id as "bookingId",
        user_email,
        user_name,
        user_roll_no,
        auditorium,
        seats,
        total_amount::float as "totalAmount",
        utr_number as "utrNumber",
        payment_screenshot as "paymentScreenshot",
        status,
        checked_in as "checkedIn",
        check_in_time as "checkInTime",
        timestamp
      FROM bookings 
      ORDER BY timestamp DESC;
    `;

    return rows.map(r => ({
      bookingId: r.bookingId,
      user: {
        email: r.user_email,
        name: r.user_name,
        rollNo: r.user_roll_no
      },
      auditorium: r.auditorium,
      seats: typeof r.seats === 'string' ? JSON.parse(r.seats) : r.seats,
      totalAmount: r.totalAmount,
      utrNumber: r.utrNumber,
      paymentScreenshot: r.paymentScreenshot,
      status: r.status,
      checkedIn: r.checkedIn,
      checkInTime: r.checkInTime,
      timestamp: r.timestamp
    }));
  } catch (err) {
    console.error("Fetch Neon Bookings Error:", err);
    return null;
  }
};

// Save a new booking record to Neon Postgres
export const saveNeonBooking = async (b) => {
  try {
    const sql = getSql();
    await sql`
      INSERT INTO bookings (
        booking_id, user_email, user_name, user_roll_no, auditorium, 
        seats, total_amount, utr_number, payment_screenshot, status, checked_in, timestamp
      ) VALUES (
        ${b.bookingId}, ${b.user.email}, ${b.user.name}, ${b.user.rollNo || ''}, ${b.auditorium || 'AB02 — Audi 1'},
        ${JSON.stringify(b.seats)}, ${b.totalAmount}, ${b.utrNumber}, ${b.paymentScreenshot || null},
        ${b.status || 'PENDING_VERIFICATION'}, ${b.checkedIn || false}, ${b.timestamp}
      )
      ON CONFLICT (booking_id) DO UPDATE SET
        status = EXCLUDED.status,
        payment_screenshot = COALESCE(EXCLUDED.payment_screenshot, bookings.payment_screenshot),
        checked_in = EXCLUDED.checked_in,
        check_in_time = EXCLUDED.check_in_time;
    `;
    return true;
  } catch (err) {
    console.error("Save Neon Booking Warning (Retrying fallback without heavy payload):", err);
    try {
      const sql = getSql();
      await sql`
        INSERT INTO bookings (
          booking_id, user_email, user_name, user_roll_no, auditorium, 
          seats, total_amount, utr_number, payment_screenshot, status, checked_in, timestamp
        ) VALUES (
          ${b.bookingId}, ${b.user.email}, ${b.user.name}, ${b.user.rollNo || ''}, ${b.auditorium || 'AB02 — Audi 1'},
          ${JSON.stringify(b.seats)}, ${b.totalAmount}, ${b.utrNumber}, null,
          ${b.status || 'PENDING_VERIFICATION'}, ${b.checkedIn || false}, ${b.timestamp}
        )
        ON CONFLICT (booking_id) DO UPDATE SET
          status = EXCLUDED.status,
          checked_in = EXCLUDED.checked_in;
      `;
      return true;
    } catch (fallbackErr) {
      console.error("Fallback Save Neon Booking Error:", fallbackErr);
      return false;
    }
  }
};

// Update booking status in Neon Postgres
export const updateNeonBookingStatus = async (bookingId, status) => {
  try {
    const sql = getSql();
    await sql`
      UPDATE bookings 
      SET status = ${status}
      WHERE booking_id = ${bookingId};
    `;
    return true;
  } catch (err) {
    console.error("Update Neon Booking Status Error:", err);
    return false;
  }
};

// Update check-in status in Neon Postgres
export const markNeonCheckIn = async (bookingId, checkInTime) => {
  try {
    const sql = getSql();
    await sql`
      UPDATE bookings 
      SET checked_in = TRUE, check_in_time = ${checkInTime}
      WHERE booking_id = ${bookingId};
    `;
    return true;
  } catch (err) {
    console.error("Mark Neon Check-in Error:", err);
    return false;
  }
};

// Save full dual seat map state to Neon Postgres
export const saveNeonSeatMap = async (seatMapData) => {
  try {
    const sql = getSql();
    await sql`
      INSERT INTO seat_maps (audi_id, seat_data, updated_at)
      VALUES ('MAIN_SEAT_MAP', ${JSON.stringify(seatMapData)}, CURRENT_TIMESTAMP)
      ON CONFLICT (audi_id) DO UPDATE 
      SET seat_data = EXCLUDED.seat_data, updated_at = CURRENT_TIMESTAMP;
    `;
    return true;
  } catch (err) {
    console.error("Save Neon Seat Map Error:", err);
    return false;
  }
};

// Fetch full seat map state from Neon Postgres
export const fetchNeonSeatMap = async () => {
  try {
    const sql = getSql();
    const rows = await sql`SELECT seat_data FROM seat_maps WHERE audi_id = 'MAIN_SEAT_MAP' LIMIT 1`;
    if (rows && rows.length > 0) {
      return typeof rows[0].seat_data === 'string' ? JSON.parse(rows[0].seat_data) : rows[0].seat_data;
    }
    return null;
  } catch (err) {
    console.error("Fetch Neon Seat Map Error:", err);
    return null;
  }
};
