import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const neonUrl = "postgresql://neondb_owner:npg_hIOBTiYDVL59@ep-purple-forest-axyt3h5l-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require";
const sql = neon(neonUrl);

async function issueTicket() {
  const email = "ayush.25bai10059@vitbhopal.ac.in".toLowerCase().trim();
  const name = "Ayush Arora";
  const rollNo = "25BAI10059";
  const auditorium = "AB02 — Audi 2";
  const audiKey = "AUDI_2";
  const bookingId = "DS-250059";
  const utrNumber = "PENDING_UTR_AYUSH";
  const totalAmount = 134;

  const seats = [
    {
      id: "J11",
      row: "J",
      number: 11,
      tierKey: "STANDARD",
      price: 67,
      status: "occupied",
      bookedBy: { name, email },
      auditorium: auditorium
    },
    {
      id: "J12",
      row: "J",
      number: 12,
      tierKey: "STANDARD",
      price: 67,
      status: "occupied",
      bookedBy: { name, email },
      auditorium: auditorium
    }
  ];

  const now = new Date();
  const timestamp = now.toLocaleString('en-US');

  console.log(`🎫 Issuing ticket for ${name} (${email}) for seats J11, J12 in ${auditorium}...`);

  // 1. Insert into viewers
  await sql`
    INSERT INTO viewers (email, name, roll_no, registered_at)
    VALUES (${email}, ${name}, ${rollNo}, CURRENT_TIMESTAMP)
    ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, roll_no = EXCLUDED.roll_no;
  `;
  console.log(`✅ Viewer profile registered/updated in Neon DB.`);

  // 2. Insert booking into bookings
  await sql`
    INSERT INTO bookings (
      booking_id, user_email, user_name, user_roll_no, auditorium, 
      seats, total_amount, utr_number, payment_screenshot, 
      status, checked_in, check_in_time, timestamp
    ) VALUES (
      ${bookingId}, ${email}, ${name}, ${rollNo}, ${auditorium},
      ${JSON.stringify(seats)}, ${totalAmount}, ${utrNumber}, null,
      'CONFIRMED', false, null, ${timestamp}
    )
    ON CONFLICT (booking_id) DO UPDATE SET
      user_email = EXCLUDED.user_email,
      user_name = EXCLUDED.user_name,
      user_roll_no = EXCLUDED.user_roll_no,
      auditorium = EXCLUDED.auditorium,
      seats = EXCLUDED.seats,
      total_amount = EXCLUDED.total_amount,
      status = 'CONFIRMED';
  `;
  console.log(`✅ Booking ${bookingId} confirmed in Neon DB for ${name}.`);

  // 3. Update backupSeed.json
  const seedPath = path.join(rootDir, 'src', 'data', 'backupSeed.json');
  if (fs.existsSync(seedPath)) {
    const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
    
    // Add viewer if not exists
    if (!seedData.viewers.some(v => v.email.toLowerCase() === email)) {
      seedData.viewers.unshift({
        id: `reg-${email}`,
        email,
        name,
        rollNo
      });
    }

    // Add booking if not exists
    const existingIndex = seedData.bookings.findIndex(b => b.bookingId === bookingId);
    const newBookingObj = {
      bookingId,
      user: { email, name, rollNo },
      auditorium,
      seats,
      totalAmount,
      utrNumber,
      paymentScreenshot: null,
      status: "CONFIRMED",
      checkedIn: false,
      checkInTime: null,
      timestamp
    };

    if (existingIndex >= 0) {
      seedData.bookings[existingIndex] = newBookingObj;
    } else {
      seedData.bookings.unshift(newBookingObj);
    }

    fs.writeFileSync(seedPath, JSON.stringify(seedData, null, 2));
    console.log(`✅ Updated src/data/backupSeed.json.`);
  }

  // 4. Update backup_data.json
  const rootBackupPath = path.join(rootDir, 'backup_data.json');
  if (fs.existsSync(rootBackupPath)) {
    const rootBackup = JSON.parse(fs.readFileSync(rootBackupPath, 'utf8'));
    if (!rootBackup.viewers.some(v => v.email.toLowerCase() === email)) {
      rootBackup.viewers.unshift({ email, name, rollNo, registeredAt: new Date().toISOString() });
    }
    const existingIndex = rootBackup.bookings.findIndex(b => b.bookingId === bookingId);
    const rootBookingObj = {
      bookingId,
      userEmail: email,
      userName: name,
      userRollNo: rollNo,
      auditorium,
      seats,
      totalAmount,
      utrNumber,
      paymentScreenshot: null,
      status: "CONFIRMED",
      checkedIn: false,
      checkInTime: null,
      timestamp
    };
    if (existingIndex >= 0) {
      rootBackup.bookings[existingIndex] = rootBookingObj;
    } else {
      rootBackup.bookings.unshift(rootBookingObj);
    }
    fs.writeFileSync(rootBackupPath, JSON.stringify(rootBackup, null, 2));
    console.log(`✅ Updated backup_data.json.`);
  }

  console.log(`🎉 SUCCESS! Ticket pass ${bookingId} has been created for Ayush Arora with Seats J11 + J12 in AB02 — Audi 2!`);
}

issueTicket().catch(err => {
  console.error("❌ Failed to issue ticket:", err);
});
