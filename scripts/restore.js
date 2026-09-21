import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Load .env if present
const envPath = path.join(rootDir, '.env');
let neonUrl = "postgresql://neondb_owner:npg_hIOBTiYDVL59@ep-purple-forest-axyt3h5l-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require";
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/VITE_NEON_DATABASE_URL=["']?([^"'\r\n]+)/);
  if (match && match[1]) {
    neonUrl = match[1];
  }
}

const sql = neon(neonUrl);

async function runRestore() {
  const backupFile = path.join(rootDir, 'backups', 'backup_2026-08-31T17-54-59-319Z.json');
  if (!fs.existsSync(backupFile)) {
    console.error('❌ Backup file not found at:', backupFile);
    return;
  }

  const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
  console.log(`📦 Loaded backup file with:`);
  console.log(`   - ${backupData.viewers?.length || 0} Viewers`);
  console.log(`   - ${backupData.bookings?.length || 0} Bookings`);

  console.log('🔄 Initializing database tables...');
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

  console.log('👥 Restoring viewers into Neon DB...');
  let viewerCount = 0;
  for (const v of backupData.viewers) {
    await sql`
      INSERT INTO viewers (email, name, roll_no, registered_at)
      VALUES (${v.email.toLowerCase()}, ${v.name}, ${v.rollNo || ''}, ${v.registeredAt || new Date().toISOString()})
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, roll_no = EXCLUDED.roll_no;
    `;
    viewerCount++;
  }
  console.log(`✅ Restored ${viewerCount} viewers.`);

  console.log('🎟️ Restoring bookings into Neon DB...');
  let bookingCount = 0;
  for (const b of backupData.bookings) {
    const cleanUtr = (b.utrNumber || '').trim();
    await sql`
      INSERT INTO bookings (
        booking_id, user_email, user_name, user_roll_no, auditorium, 
        seats, total_amount, utr_number, payment_screenshot, 
        status, checked_in, check_in_time, timestamp
      )
      VALUES (
        ${b.bookingId}, 
        ${b.userEmail || b.user?.email}, 
        ${b.userName || b.user?.name}, 
        ${b.userRollNo || b.user?.rollNo || ''}, 
        ${b.auditorium || 'AB02 — Audi 1'}, 
        ${JSON.stringify(b.seats)}, 
        ${b.totalAmount}, 
        ${cleanUtr}, 
        ${b.paymentScreenshot || null}, 
        ${b.status || 'CONFIRMED'}, 
        ${b.checkedIn || false}, 
        ${b.checkInTime || null}, 
        ${b.timestamp}
      )
      ON CONFLICT (booking_id) DO UPDATE SET 
        status = EXCLUDED.status, 
        payment_screenshot = COALESCE(EXCLUDED.payment_screenshot, bookings.payment_screenshot),
        checked_in = EXCLUDED.checked_in,
        check_in_time = EXCLUDED.check_in_time;
    `;
    bookingCount++;
  }
  console.log(`✅ Restored ${bookingCount} bookings.`);

  // Update backupSeed.json in src/data/
  const seedPath = path.join(rootDir, 'src', 'data', 'backupSeed.json');
  const seedData = {
    bookings: backupData.bookings.map(b => ({
      bookingId: b.bookingId,
      user: {
        email: b.userEmail || b.user?.email,
        name: b.userName || b.user?.name,
        rollNo: b.userRollNo || b.user?.rollNo || ''
      },
      auditorium: b.auditorium || 'AB02 — Audi 1',
      seats: b.seats,
      totalAmount: b.totalAmount,
      utrNumber: b.utrNumber,
      paymentScreenshot: b.paymentScreenshot || null,
      status: b.status || 'CONFIRMED',
      checkedIn: b.checkedIn || false,
      checkInTime: b.checkInTime || null,
      timestamp: b.timestamp
    })),
    viewers: backupData.viewers.map(v => ({
      id: `reg-${v.email}`,
      email: v.email,
      name: v.name,
      rollNo: v.rollNo || 'N/A'
    }))
  };
  fs.writeFileSync(seedPath, JSON.stringify(seedData, null, 2));
  console.log(`✅ Updated src/data/backupSeed.json with full 245 viewers and 105 bookings.`);

  // Update root backup_data.json
  const rootBackupPath = path.join(rootDir, 'backup_data.json');
  fs.writeFileSync(rootBackupPath, JSON.stringify(backupData, null, 2));
  console.log(`✅ Restored backup_data.json in root directory.`);

  console.log('🎉 Database and Local Seed full restoration complete!');
}

runRestore().catch(err => {
  console.error('❌ Restore error:', err);
});
