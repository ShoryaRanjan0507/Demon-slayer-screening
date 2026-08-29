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

// Seat Categories configuration (Standard Price: ₹67 for all zones)
export const SEAT_TIERS = {
  FRONT_ZONE: {
    name: "Front Selection",
    price: 67,
    badge: "Frontmost to Screen",
    color: "#ff6b1a", // Flame orange
    lightColor: "rgba(255, 107, 26, 0.25)",
    borderColor: "#ff8c42",
    description: "Rows A to D — Frontmost to the screen, immersive close-up view."
  },
  MID_ZONE: {
    name: "Demon Slayer Center",
    price: 67,
    badge: "Sweet Spot",
    color: "#8a2be2", // Purple
    lightColor: "rgba(138, 43, 226, 0.25)",
    borderColor: "#b15eff",
    description: "Rows E to K — Perfect eye-level center view with balanced surround sound."
  },
  REAR_ZONE: {
    name: "Hashira Rear VIP",
    price: 67,
    badge: "Elevated Rear View",
    color: "#e62035", // Crimson red
    lightColor: "rgba(230, 32, 53, 0.25)",
    borderColor: "#ff4d6d",
    description: "Rows L to P — Clear elevated rear view with full auditorium perspective."
  }
};

// Helper to generate 288 seats (16 Rows A-P, 18 seats 1-18) for a given auditorium
export const generateSingleAudiSeatMap = (audiLabel) => {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
  const seatsPerRow = 18;
  const seatMap = {};

  rows.forEach(row => {
    let tierKey = 'MID_ZONE';
    if (['A', 'B', 'C', 'D'].includes(row)) tierKey = 'FRONT_ZONE';
    else if (['E', 'F', 'G', 'H', 'I', 'J', 'K'].includes(row)) tierKey = 'MID_ZONE';
    else if (['L', 'M', 'N', 'O', 'P'].includes(row)) tierKey = 'REAR_ZONE';

    for (let num = 1; num <= seatsPerRow; num++) {
      const seatId = `${row}${num}`;
      seatMap[seatId] = {
        id: seatId,
        row: row,
        number: num,
        tierKey: tierKey,
        price: SEAT_TIERS[tierKey].price,
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




