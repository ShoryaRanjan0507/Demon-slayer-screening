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

async function runBackup() {
  console.log('🔄 Fetching complete database snapshot from Neon...');
  try {
    const bookings = await sql`
      SELECT 
        booking_id as "bookingId", 
        user_email as "userEmail", 
        user_name as "userName", 
        user_roll_no as "userRollNo", 
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

    const viewers = await sql`
      SELECT 
        email, 
        name, 
        roll_no as "rollNo", 
        registered_at as "registeredAt" 
      FROM viewers 
      ORDER BY registered_at DESC;
    `;

    const seatMaps = await sql`SELECT * FROM seat_maps;`;

    const now = new Date();
    const timestampStr = now.toISOString().replace(/[:.]/g, '-');
    const backupData = {
      exportedAt: now.toISOString(),
      stats: {
        totalBookings: bookings.length,
        totalViewers: viewers.length,
        confirmedBookings: bookings.filter(b => b.status === 'CONFIRMED').length,
        pendingBookings: bookings.filter(b => b.status === 'PENDING_VERIFICATION').length,
        rejectedBookings: bookings.filter(b => b.status === 'REJECTED').length,
        totalRevenue: bookings.filter(b => b.status !== 'REJECTED').reduce((acc, b) => acc + (Number(b.totalAmount) || 0), 0)
      },
      viewers,
      bookings: bookings.map(b => ({
        ...b,
        seats: typeof b.seats === 'string' ? JSON.parse(b.seats) : b.seats
      })),
      seatMaps
    };

    // 1. Write latest backup_data.json
    const latestPath = path.join(rootDir, 'backup_data.json');
    fs.writeFileSync(latestPath, JSON.stringify(backupData, null, 2));

    // 2. Write timestamped copy in backups/ directory
    const backupsDir = path.join(rootDir, 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }
    const timestampedPath = path.join(backupsDir, `backup_${timestampStr}.json`);
    fs.writeFileSync(timestampedPath, JSON.stringify(backupData, null, 2));

    // 3. Generate a clean CSV of all bookings
    let csv = "Booking ID,Status,Checked In,Check-In Time,User Name,User Email,Roll No,Auditorium,Seats,Amount (INR),UTR Number,Timestamp,Payment Receipt\n";
    backupData.bookings.forEach(b => {
      const seatsStr = Array.isArray(b.seats) ? b.seats.map(s => s.id || s).join(';') : '';
      csv += `"${b.bookingId}","${b.status}","${b.checkedIn ? 'YES' : 'NO'}","${b.checkInTime || ''}","${b.userName || ''}","${b.userEmail || ''}","${b.userRollNo || ''}","${b.auditorium || 'AB02 — Audi 1'}","${seatsStr}","${b.totalAmount}","${b.utrNumber || ''}","${b.timestamp || ''}","${b.paymentScreenshot ? (b.paymentScreenshot.startsWith('http') ? b.paymentScreenshot : 'BASE64_ATTACHED') : 'NONE'}"\n`;
    });
    const csvPath = path.join(backupsDir, `bookings_${timestampStr}.csv`);
    fs.writeFileSync(csvPath, csv);

    console.log(`✅ Backup successfully saved!`);
    console.log(`   📊 Total Bookings: ${bookings.length} (${backupData.stats.confirmedBookings} confirmed, ${backupData.stats.pendingBookings} pending)`);
    console.log(`   👥 Total Viewers: ${viewers.length}`);
    console.log(`   💰 Estimated Total: ₹${backupData.stats.totalRevenue}`);
    console.log(`   📁 Files written:`);
    console.log(`      - backup_data.json`);
    console.log(`      - backups/backup_${timestampStr}.json`);
    console.log(`      - backups/bookings_${timestampStr}.csv`);
  } catch (err) {
    console.error('❌ Backup error:', err.message);
  }
}

runBackup();
