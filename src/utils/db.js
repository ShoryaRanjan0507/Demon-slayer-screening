// Database layer - uses Vercel serverless API routes on production,
// falls back to direct @neondatabase/serverless calls in local dev.

const IS_PRODUCTION = typeof window !== 'undefined' && 
  (window.location.hostname.includes('vercel.app') || 
   window.location.hostname.includes('.vercel.') ||
   !window.location.hostname.includes('localhost'));

// ─── API-based fetchers (production - go through /api/ serverless functions) ───

const apiFetch = async (url, options = {}) => {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `API ${url} failed with status ${res.status}`);
  }
  return res.json();
};

// ─── Direct DB fetchers (local dev only) ───

let directSql = null;
const getDirectSql = async () => {
  if (directSql) return directSql;
  try {
    const { neon } = await import('@neondatabase/serverless');
    let url = "postgresql://neondb_owner:npg_e6wn1AzBgGpF@ep-super-recipe-aesw3lnz-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require";
    try {
      if (typeof import.meta !== 'undefined' && import.meta && import.meta.env && import.meta.env.VITE_NEON_DATABASE_URL) {
        url = import.meta.env.VITE_NEON_DATABASE_URL;
      }
    } catch (e) {
      // fallback to hardcoded URL
    }
    directSql = neon(url);
    return directSql;
  } catch (e) {
    console.error("Failed to init direct SQL:", e);
    return null;
  }
};

// ─── Initialize Database ───

export const initNeonDatabase = async () => {
  try {
    if (IS_PRODUCTION) {
      await apiFetch('/api/init');
    } else {
      const sql = await getDirectSql();
      if (!sql) return { success: false };
      await sql`CREATE TABLE IF NOT EXISTS viewers (email TEXT PRIMARY KEY, name TEXT NOT NULL, roll_no TEXT, registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
      await sql`CREATE TABLE IF NOT EXISTS bookings (booking_id TEXT PRIMARY KEY, user_email TEXT NOT NULL, user_name TEXT NOT NULL, user_roll_no TEXT, auditorium TEXT NOT NULL, seats JSONB NOT NULL, total_amount NUMERIC NOT NULL, utr_number TEXT NOT NULL, payment_screenshot TEXT, status TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION', checked_in BOOLEAN DEFAULT FALSE, check_in_time TEXT, timestamp TEXT NOT NULL)`;
      await sql`CREATE TABLE IF NOT EXISTS seat_maps (audi_id TEXT PRIMARY KEY, seat_data JSONB NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
    }
    console.log("⚡ Database initialized!");
    return { success: true };
  } catch (err) {
    console.error("DB Init Error:", err);
    return { success: false, error: err };
  }
};

// ─── Viewers ───

export const fetchNeonViewers = async () => {
  try {
    if (IS_PRODUCTION) {
      const data = await apiFetch('/api/viewers');
      console.log("⚡ [API] Viewers loaded:", data.viewers?.length);
      return data.viewers || [];
    } else {
      const sql = await getDirectSql();
      if (!sql) return [];
      const rows = await sql`SELECT email, name, roll_no as "rollNo" FROM viewers ORDER BY registered_at DESC`;
      console.log("⚡ [Direct] Viewers loaded:", rows?.length);
      return (rows || []).map(r => ({
        id: `reg-${r.email}`,
        email: r.email,
        name: r.name,
        rollNo: r.rollNo || 'N/A'
      }));
    }
  } catch (err) {
    console.error("Fetch Viewers Error:", err);
    throw err;
  }
};

export const saveNeonViewer = async (viewer) => {
  try {
    if (IS_PRODUCTION) {
      await apiFetch('/api/viewers', {
        method: 'POST',
        body: JSON.stringify({ email: viewer.email, name: viewer.name, rollNo: viewer.rollNo })
      });
    } else {
      const sql = await getDirectSql();
      if (!sql) return false;
      await sql`
        INSERT INTO viewers (email, name, roll_no)
        VALUES (${viewer.email.toLowerCase()}, ${viewer.name}, ${viewer.rollNo || ''})
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, roll_no = EXCLUDED.roll_no;
      `;
    }
    return true;
  } catch (err) {
    console.error("Save Viewer Error:", err);
    return false;
  }
};

// ─── Bookings ───

// Lightweight fetch (excludes payment_screenshot to save bandwidth during polling)
export const fetchNeonBookings = async () => {
  try {
    if (IS_PRODUCTION) {
      const data = await apiFetch('/api/bookings');
      return data.bookings || [];
    } else {
      const sql = await getDirectSql();
      if (!sql) return null;
      const rows = await sql`
        SELECT booking_id as "bookingId", user_email, user_name, user_roll_no, auditorium, seats,
          total_amount::float as "totalAmount", utr_number as "utrNumber",
          status, checked_in as "checkedIn", check_in_time as "checkInTime", timestamp
        FROM bookings ORDER BY timestamp DESC;
      `;
      return (rows || []).map(r => ({
        bookingId: r.bookingId,
        user: { email: r.user_email, name: r.user_name, rollNo: r.user_roll_no },
        auditorium: r.auditorium,
        seats: typeof r.seats === 'string' ? JSON.parse(r.seats) : r.seats,
        totalAmount: r.totalAmount, utrNumber: r.utrNumber, paymentScreenshot: null,
        status: r.status, checkedIn: r.checkedIn, checkInTime: r.checkInTime, timestamp: r.timestamp
      }));
    }
  } catch (err) {
    console.error("Fetch Bookings Error:", err);
    return null;
  }
};

// Full fetch (includes payment_screenshot — for admin portal only)
export const fetchNeonBookingsFull = async () => {
  try {
    if (IS_PRODUCTION) {
      const data = await apiFetch('/api/bookings?full=true');
      return data.bookings || [];
    } else {
      const sql = await getDirectSql();
      if (!sql) return null;
      const rows = await sql`
        SELECT booking_id as "bookingId", user_email, user_name, user_roll_no, auditorium, seats,
          total_amount::float as "totalAmount", utr_number as "utrNumber", payment_screenshot as "paymentScreenshot",
          status, checked_in as "checkedIn", check_in_time as "checkInTime", timestamp
        FROM bookings ORDER BY timestamp DESC;
      `;
      return (rows || []).map(r => ({
        bookingId: r.bookingId,
        user: { email: r.user_email, name: r.user_name, rollNo: r.user_roll_no },
        auditorium: r.auditorium,
        seats: typeof r.seats === 'string' ? JSON.parse(r.seats) : r.seats,
        totalAmount: r.totalAmount, utrNumber: r.utrNumber, paymentScreenshot: r.paymentScreenshot,
        status: r.status, checkedIn: r.checkedIn, checkInTime: r.checkInTime, timestamp: r.timestamp
      }));
    }
  } catch (err) {
    console.error("Fetch Bookings Full Error:", err);
    return null;
  }
};

export const saveNeonBooking = async (b) => {
  try {
    if (IS_PRODUCTION) {
      await apiFetch('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(b)
      });
    } else {
      const sql = await getDirectSql();
      if (!sql) return false;
      await sql`
        INSERT INTO bookings (booking_id, user_email, user_name, user_roll_no, auditorium, seats, total_amount, utr_number, payment_screenshot, status, checked_in, timestamp)
        VALUES (${b.bookingId}, ${b.user.email}, ${b.user.name}, ${b.user.rollNo || ''}, ${b.auditorium || 'AB02 — Audi 1'}, ${JSON.stringify(b.seats)}, ${b.totalAmount}, ${b.utrNumber}, ${b.paymentScreenshot || null}, ${b.status || 'PENDING_VERIFICATION'}, ${b.checkedIn || false}, ${b.timestamp})
        ON CONFLICT (booking_id) DO UPDATE SET status = EXCLUDED.status, payment_screenshot = COALESCE(EXCLUDED.payment_screenshot, bookings.payment_screenshot), checked_in = EXCLUDED.checked_in, check_in_time = EXCLUDED.check_in_time;
      `;
    }
    return true;
  } catch (err) {
    console.error("Save Booking Error:", err);
    return false;
  }
};

export const updateNeonBookingStatus = async (bookingId, status) => {
  try {
    if (IS_PRODUCTION) {
      await apiFetch('/api/bookings', {
        method: 'PUT',
        body: JSON.stringify({ bookingId, status })
      });
    } else {
      const sql = await getDirectSql();
      if (!sql) return false;
      await sql`UPDATE bookings SET status = ${status} WHERE booking_id = ${bookingId}`;
    }
    return true;
  } catch (err) {
    console.error("Update Booking Status Error:", err);
    return false;
  }
};

export const markNeonCheckIn = async (bookingId, checkInTime) => {
  try {
    if (IS_PRODUCTION) {
      await apiFetch('/api/bookings', {
        method: 'PUT',
        body: JSON.stringify({ bookingId, checkedIn: true, checkInTime })
      });
    } else {
      const sql = await getDirectSql();
      if (!sql) return false;
      await sql`UPDATE bookings SET checked_in = TRUE, check_in_time = ${checkInTime} WHERE booking_id = ${bookingId}`;
    }
    return true;
  } catch (err) {
    console.error("Mark Check-in Error:", err);
    return false;
  }
};

// ─── Seat Maps ───

export const saveNeonSeatMap = async (seatMapData) => {
  try {
    if (IS_PRODUCTION) {
      await apiFetch('/api/seats', {
        method: 'POST',
        body: JSON.stringify({ seatMap: seatMapData })
      });
    } else {
      const sql = await getDirectSql();
      if (!sql) return false;
      await sql`
        INSERT INTO seat_maps (audi_id, seat_data, updated_at)
        VALUES ('MAIN_SEAT_MAP', ${JSON.stringify(seatMapData)}, CURRENT_TIMESTAMP)
        ON CONFLICT (audi_id) DO UPDATE SET seat_data = EXCLUDED.seat_data, updated_at = CURRENT_TIMESTAMP;
      `;
    }
    return true;
  } catch (err) {
    console.error("Save Seat Map Error:", err);
    return false;
  }
};

export const fetchNeonSeatMap = async () => {
  try {
    if (IS_PRODUCTION) {
      const data = await apiFetch('/api/seats');
      return data.seatMap || null;
    } else {
      const sql = await getDirectSql();
      if (!sql) return null;
      const rows = await sql`SELECT seat_data FROM seat_maps WHERE audi_id = 'MAIN_SEAT_MAP' LIMIT 1`;
      if (rows && rows.length > 0) {
        return typeof rows[0].seat_data === 'string' ? JSON.parse(rows[0].seat_data) : rows[0].seat_data;
      }
      return null;
    }
  } catch (err) {
    console.error("Fetch Seat Map Error:", err);
    return null;
  }
};
