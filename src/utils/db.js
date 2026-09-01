// Database layer - connects directly to Neon PostgreSQL over WebSockets/HTTPS
// (eliminating Vercel Serverless Function invocation limits), with automatic API fallback.

let directSql = null;
export const getDirectSql = async () => {
  if (directSql) return directSql;
  try {
    const { neon } = await import('@neondatabase/serverless');
    let url = "postgresql://neondb_owner:npg_hIOBTiYDVL59@ep-purple-forest-axyt3h5l-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require";
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

// ─── Initialize Database ───

export const initNeonDatabase = async () => {
  try {
    const sql = await getDirectSql();
    if (sql) {
      await sql`CREATE TABLE IF NOT EXISTS viewers (email TEXT PRIMARY KEY, name TEXT NOT NULL, roll_no TEXT, registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
      await sql`CREATE TABLE IF NOT EXISTS bookings (booking_id TEXT PRIMARY KEY, user_email TEXT NOT NULL, user_name TEXT NOT NULL, user_roll_no TEXT, auditorium TEXT NOT NULL, seats JSONB NOT NULL, total_amount NUMERIC NOT NULL, utr_number TEXT NOT NULL, payment_screenshot TEXT, status TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION', checked_in BOOLEAN DEFAULT FALSE, check_in_time TEXT, timestamp TEXT NOT NULL)`;
      await sql`CREATE TABLE IF NOT EXISTS seat_maps (audi_id TEXT PRIMARY KEY, seat_data JSONB NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
      console.log("⚡ Database initialized directly via Neon!");
      return { success: true };
    }
    await apiFetch('/api/init');
    return { success: true };
  } catch (err) {
    console.warn("DB Init fallback:", err);
    return { success: false, error: err };
  }
};

// ─── Viewers ───

export const fetchNeonViewers = async () => {
  try {
    const sql = await getDirectSql();
    if (sql) {
      const rows = await sql`SELECT email, name, roll_no as "rollNo" FROM viewers ORDER BY registered_at DESC`;
      return (rows || []).map(r => ({
        id: `reg-${r.email}`,
        email: r.email,
        name: r.name,
        rollNo: r.rollNo || 'N/A'
      }));
    }
  } catch (directErr) {
    console.warn("Direct SQL viewers fetch fallback to API:", directErr);
  }

  try {
    const data = await apiFetch('/api/viewers');
    return data.viewers || [];
  } catch (err) {
    console.error("Fetch Viewers Error:", err);
    return [];
  }
};

export const saveNeonViewer = async (viewer) => {
  try {
    const sql = await getDirectSql();
    if (sql) {
      await sql`
        INSERT INTO viewers (email, name, roll_no)
        VALUES (${viewer.email.toLowerCase()}, ${viewer.name}, ${viewer.rollNo || ''})
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, roll_no = EXCLUDED.roll_no;
      `;
      return true;
    }
  } catch (directErr) {
    console.warn("Direct SQL save viewer fallback to API:", directErr);
  }

  try {
    await apiFetch('/api/viewers', {
      method: 'POST',
      body: JSON.stringify({ email: viewer.email, name: viewer.name, rollNo: viewer.rollNo })
    });
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
    const sql = await getDirectSql();
    if (sql) {
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
  } catch (directErr) {
    console.warn("Direct SQL bookings fetch fallback to API:", directErr);
  }

  try {
    const data = await apiFetch('/api/bookings');
    return data.bookings || [];
  } catch (err) {
    console.error("Fetch Bookings Error:", err);
    return null;
  }
};

// Full fetch (includes payment_screenshot — for admin portal only)
export const fetchNeonBookingsFull = async () => {
  try {
    const sql = await getDirectSql();
    if (sql) {
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
  } catch (directErr) {
    console.warn("Direct SQL full bookings fetch fallback to API:", directErr);
  }

  try {
    const data = await apiFetch('/api/bookings?full=true');
    return data.bookings || [];
  } catch (err) {
    console.error("Fetch Bookings Full Error:", err);
    return null;
  }
};

export const checkNeonUtrDuplicate = async (utrNumber, excludeBookingId = '') => {
  try {
    const cleanUtr = (utrNumber || '').trim().replace(/\s+/g, '');
    if (!cleanUtr) return false;

    const sql = await getDirectSql();
    if (sql) {
      const rows = await sql`
        SELECT booking_id FROM bookings 
        WHERE TRIM(utr_number) = ${cleanUtr} 
          AND status != 'REJECTED' 
          AND booking_id != ${excludeBookingId} 
        LIMIT 1;
      `;
      return rows && rows.length > 0;
    }

    const data = await fetchNeonBookings();
    if (data && Array.isArray(data)) {
      return data.some(b => 
        b.utrNumber && 
        b.utrNumber.trim().replace(/\s+/g, '') === cleanUtr && 
        b.status !== 'REJECTED' && 
        b.bookingId !== excludeBookingId
      );
    }
    return false;
  } catch (err) {
    console.error("Check UTR Duplicate Error:", err);
    return false;
  }
};

export const saveNeonBooking = async (b) => {
  const cleanUtr = (b.utrNumber || '').trim().replace(/\s+/g, '');
  try {
    const sql = await getDirectSql();
    if (sql) {
      if (cleanUtr) {
        const existing = await sql`
          SELECT booking_id FROM bookings 
          WHERE TRIM(utr_number) = ${cleanUtr} 
            AND status != 'REJECTED' 
            AND booking_id != ${b.bookingId} 
          LIMIT 1;
        `;
        if (existing && existing.length > 0) {
          throw new Error(`⚠️ This 12-digit UTR number (${cleanUtr}) has already been used for another booking (${existing[0].booking_id}). Each payment UTR can only be used once.`);
        }
      }

      await sql`
        INSERT INTO bookings (booking_id, user_email, user_name, user_roll_no, auditorium, seats, total_amount, utr_number, payment_screenshot, status, checked_in, timestamp)
        VALUES (${b.bookingId}, ${b.user.email}, ${b.user.name}, ${b.user.rollNo || ''}, ${b.auditorium || 'AB02 — Audi 1'}, ${JSON.stringify(b.seats)}, ${b.totalAmount}, ${cleanUtr || b.utrNumber}, ${b.paymentScreenshot || null}, ${b.status || 'PENDING_VERIFICATION'}, ${b.checkedIn || false}, ${b.timestamp})
        ON CONFLICT (booking_id) DO UPDATE SET status = EXCLUDED.status, payment_screenshot = COALESCE(EXCLUDED.payment_screenshot, bookings.payment_screenshot), checked_in = EXCLUDED.checked_in, check_in_time = EXCLUDED.check_in_time;
      `;
      return true;
    }
  } catch (directErr) {
    if (directErr.message?.includes('already been used')) throw directErr;
    console.warn("Direct SQL save booking fallback to API:", directErr);
  }

  try {
    await apiFetch('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({ ...b, utrNumber: cleanUtr || b.utrNumber })
    });
    return true;
  } catch (err) {
    console.error("Save Booking Error:", err);
    throw err;
  }
};

export const updateNeonBookingStatus = async (bookingId, status) => {
  try {
    const sql = await getDirectSql();
    if (sql) {
      await sql`UPDATE bookings SET status = ${status} WHERE booking_id = ${bookingId}`;
      return true;
    }
  } catch (directErr) {
    console.warn("Direct SQL update status fallback to API:", directErr);
  }

  try {
    await apiFetch('/api/bookings', {
      method: 'PUT',
      body: JSON.stringify({ bookingId, status })
    });
    return true;
  } catch (err) {
    console.error("Update Booking Status Error:", err);
    return false;
  }
};

export const markNeonCheckIn = async (bookingId, checkInTime) => {
  try {
    const sql = await getDirectSql();
    if (sql) {
      await sql`UPDATE bookings SET checked_in = TRUE, check_in_time = ${checkInTime} WHERE booking_id = ${bookingId}`;
      return true;
    }
  } catch (directErr) {
    console.warn("Direct SQL check in fallback to API:", directErr);
  }

  try {
    await apiFetch('/api/bookings', {
      method: 'PUT',
      body: JSON.stringify({ bookingId, checkedIn: true, checkInTime })
    });
    return true;
  } catch (err) {
    console.error("Mark Check-in Error:", err);
    return false;
  }
};

export const deleteNeonBooking = async (bookingId) => {
  try {
    const sql = await getDirectSql();
    if (sql) {
      await sql`DELETE FROM bookings WHERE booking_id = ${bookingId}`;
      return true;
    }
  } catch (directErr) {
    console.warn("Direct SQL delete booking fallback to API:", directErr);
  }

  try {
    await apiFetch(`/api/bookings?bookingId=${encodeURIComponent(bookingId)}`, {
      method: 'DELETE',
      body: JSON.stringify({ bookingId })
    });
    return true;
  } catch (err) {
    console.error("Delete Booking DB Error:", err);
    return false;
  }
};

// ─── Seat Maps ───

export const saveNeonSeatMap = async (seatMapData) => {
  try {
    const sql = await getDirectSql();
    if (sql) {
      await sql`
        INSERT INTO seat_maps (audi_id, seat_data, updated_at)
        VALUES ('MAIN_SEAT_MAP', ${JSON.stringify(seatMapData)}, CURRENT_TIMESTAMP)
        ON CONFLICT (audi_id) DO UPDATE SET seat_data = EXCLUDED.seat_data, updated_at = CURRENT_TIMESTAMP;
      `;
      return true;
    }
  } catch (directErr) {
    console.warn("Direct SQL save seat map fallback to API:", directErr);
  }

  try {
    await apiFetch('/api/seats', {
      method: 'POST',
      body: JSON.stringify({ seatMap: seatMapData })
    });
    return true;
  } catch (err) {
    console.error("Save Seat Map Error:", err);
    return false;
  }
};

export const fetchNeonSeatMap = async () => {
  try {
    const sql = await getDirectSql();
    if (sql) {
      const rows = await sql`SELECT seat_data FROM seat_maps WHERE audi_id = 'MAIN_SEAT_MAP' LIMIT 1`;
      if (rows && rows.length > 0) {
        return typeof rows[0].seat_data === 'string' ? JSON.parse(rows[0].seat_data) : rows[0].seat_data;
      }
      return null;
    }
  } catch (directErr) {
    console.warn("Direct SQL fetch seat map fallback to API:", directErr);
  }

  try {
    const data = await apiFetch('/api/seats');
    return data.seatMap || null;
  } catch (err) {
    console.error("Fetch Seat Map Error:", err);
    return null;
  }
};

