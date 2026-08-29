// Pre-seeded Google Form responses (Registered viewers database)
export const INITIAL_REGISTERED_VIEWERS = [
  { id: "reg-1", email: "tanjiro@demonslayer.club", name: "Tanjiro Kamado", rollNo: "DS2026-001", phone: "9876543210", formTimestamp: "2026-08-25 10:15" },
  { id: "reg-2", email: "nezuko@demonslayer.club", name: "Nezuko Kamado", rollNo: "DS2026-002", phone: "9876543211", formTimestamp: "2026-08-25 10:20" },
  { id: "reg-3", email: "zenitsu@demonslayer.club", name: "Zenitsu Agatsuma", rollNo: "DS2026-003", phone: "9876543212", formTimestamp: "2026-08-25 10:45" },
  { id: "reg-4", email: "inosuke@demonslayer.club", name: "Inosuke Hashibira", rollNo: "DS2026-004", phone: "9876543213", formTimestamp: "2026-08-25 11:30" },
  { id: "reg-5", email: "rengoku@hashira.club", name: "Kyojuro Rengoku", rollNo: "DS2026-005", phone: "9876543214", formTimestamp: "2026-08-25 12:00" },
  { id: "reg-6", email: "giyu@hashira.club", name: "Giyu Tomioka", rollNo: "DS2026-006", phone: "9876543215", formTimestamp: "2026-08-25 13:10" },
  { id: "reg-7", email: "shinobu@hashira.club", name: "Shinobu Kocho", rollNo: "DS2026-007", phone: "9876543216", formTimestamp: "2026-08-25 14:25" },
  { id: "reg-8", email: "viewer@gmail.com", name: "Alex Mercer", rollNo: "VITB-2026-104", phone: "9988776655", formTimestamp: "2026-08-26 09:00" },
  { id: "reg-9", email: "animefan@gmail.com", name: "Rohan Sharma", rollNo: "VITB-2026-218", phone: "9123456789", formTimestamp: "2026-08-26 11:45" }
];

export const BANK_DETAILS = {
  accountName: "Anime Club",
  accountNumber: "7092546382",
  ifscCode: "IDIB000V143",
  bankName: "INDIAN BANK",
  branch: "VIT BHOPAL",
  branchCode: "02953"
};

export const CLUB_UPI_ID = "";
export const CLUB_UPI_NAME = "Anime Club";

export const EVENT_DETAILS = {
  date: "Thursday, 3 Sept 2026",
  shortDate: "3 Sept 2026",
  heroDate: "Thursday, 3 Sept",
  time: "1:20 PM Onwards",
  venue: "AB02, Audi 1 + Audi 2",
  targetIso: "2026-09-03T13:20:00"
};

// Seat Categories configuration (Single Standard Price: ₹67)
export const SEAT_TIERS = {
  STANDARD: {
    name: "Standard",
    price: 67,
    badge: "All Seats",
    color: "#ff6b1a", // Neon orange
    lightColor: "rgba(255, 107, 26, 0.22)",
    borderColor: "#ff8c42",
    description: "Rows A to P — 288 seats across 16 rows with full Infinity Castle surround experience."
  }
};

// Helper to generate 288 seats (16 Rows A-P, 18 seats 1-18) for a given auditorium
export const generateSingleAudiSeatMap = (audiLabel) => {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
  const seatsPerRow = 18;
  const seatMap = {};

  rows.forEach(row => {
    for (let num = 1; num <= seatsPerRow; num++) {
      const seatId = `${row}${num}`;
      seatMap[seatId] = {
        id: seatId,
        row: row,
        number: num,
        tierKey: 'STANDARD',
        price: 67,
        status: 'available', // ALL SEATS EMPTY
        bookedBy: null,
        auditorium: audiLabel
      };
    }
  });

  return seatMap;
};

// Generate seat layout for both AB02 Audi 1 and AB02 Audi 2
export const generateInitialSeatMap = () => {
  return {
    AUDI_1: generateSingleAudiSeatMap('AB02 — Audi 1'),
    AUDI_2: generateSingleAudiSeatMap('AB02 — Audi 2')
  };
};




