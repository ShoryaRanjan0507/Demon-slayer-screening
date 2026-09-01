import { INITIAL_REGISTERED_VIEWERS, generateInitialSeatMap } from '../data/initialData';
import { 
  initNeonDatabase, 
  saveNeonViewer, 
  saveNeonBooking, 
  updateNeonBookingStatus, 
  saveNeonSeatMap, 
  markNeonCheckIn,
  deleteNeonBooking 
} from './db';

// Initialize Neon Postgres tables on module load
initNeonDatabase();

const KEYS = {
  VIEWERS: 'ds_infinity_castle_viewers',
  SEATS: 'ds_infinity_castle_seats',
  BOOKINGS: 'ds_infinity_castle_user_bookings',
  VERIFIED_USER: 'ds_infinity_castle_active_user'
};

const MOCK_EMAILS = [
  'tanjiro@demonslayer.club',
  'nezuko@demonslayer.club',
  'zenitsu@demonslayer.club',
  'inosuke@demonslayer.club',
  'rengoku@hashira.club',
  'giyu@hashira.club',
  'shinobu@hashira.club',
  'viewer@gmail.com',
  'animefan@gmail.com'
];

export const getRegisteredViewers = () => {
  try {
    const data = localStorage.getItem(KEYS.VIEWERS);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(v => v && v.email && !MOCK_EMAILS.includes(v.email.toLowerCase()));
  } catch (e) {
    console.error("Storage error:", e);
    return [];
  }
};

export const saveRegisteredViewers = (viewers) => {
  try {
    localStorage.setItem(KEYS.VIEWERS, JSON.stringify(viewers));
  } catch (e) {
    console.error("Storage save error:", e);
  }
};

export const addRegisteredViewer = async (viewerData) => {
  const current = getRegisteredViewers();
  const emailClean = viewerData.email.trim().toLowerCase();
  
  // check if already exists by email
  const existing = current.find(v => v.email.toLowerCase() === emailClean);
  if (existing) return existing;

  const newViewer = {
    id: `reg-${Date.now()}`,
    email: emailClean,
    name: viewerData.name || emailClean.split('@')[0],
    rollNo: viewerData.rollNo || 'N/A',
    phone: viewerData.phone || 'N/A',
    formTimestamp: new Date().toLocaleString()
  };

  const updated = [newViewer, ...current];
  saveRegisteredViewers(updated);
  
  // Await the Neon Postgres DB insert so it commits before any refetch
  await saveNeonViewer(newViewer);
  return newViewer;
};

export const importParticipantsBatch = (parsedRows) => {
  const current = getRegisteredViewers();
  const currentMap = new Map();
  current.forEach(v => {
    if (v.email) currentMap.set(v.email.toLowerCase(), v);
  });

  let addedCount = 0;
  let updatedCount = 0;

  parsedRows.forEach((row, idx) => {
    // Helper to find column value by key case-insensitively
    const findValue = (keys) => {
      for (const k of Object.keys(row)) {
        const lowerKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (keys.some(target => lowerKey.includes(target))) {
          return String(row[k] || '').trim();
        }
      }
      return '';
    };

    const email = (findValue(['email', 'mail', 'user']) || (row.email || '')).trim().toLowerCase();
    if (!email || !email.includes('@')) return;

    const name = findValue(['name', 'studentname', 'fullname', 'viewer']) || row.name || email.split('@')[0];
    const rollNo = findValue(['roll', 'id', 'registration', 'reg', 'student']) || row.rollNo || 'N/A';
    const phone = findValue(['phone', 'mobile', 'contact', 'number']) || row.phone || 'N/A';

    if (currentMap.has(email)) {
      // Update existing record details if new data provided
      const existing = currentMap.get(email);
      existing.name = name || existing.name;
      existing.rollNo = rollNo !== 'N/A' ? rollNo : existing.rollNo;
      existing.phone = phone !== 'N/A' ? phone : existing.phone;
      updatedCount++;
    } else {
      // Create new record
      const newViewer = {
        id: `reg-${Date.now()}-${idx}`,
        email,
        name,
        rollNo,
        phone,
        formTimestamp: new Date().toLocaleString()
      };
      currentMap.set(email, newViewer);
      addedCount++;
    }
  });

  const updatedViewersList = Array.from(currentMap.values());
  saveRegisteredViewers(updatedViewersList);
  return { addedCount, updatedCount, totalViewers: updatedViewersList };
};

export const exportParticipantsToCsv = (viewers) => {
  if (!viewers || viewers.length === 0) return;
  let csv = "Email,Full Name,Roll No / ID,Phone Number,Registration Timestamp\n";
  viewers.forEach(v => {
    csv += `"${v.email}","${v.name || ''}","${v.rollNo || ''}","${v.phone || ''}","${v.formTimestamp || ''}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `anime_club_participants_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const syncSeatMapWithBookings = (seatMap, bookings) => {
  if (!seatMap) return seatMap;
  const updatedMap = JSON.parse(JSON.stringify(seatMap));

  // 1. Reset all seats to available
  ['AUDI_1', 'AUDI_2'].forEach(audiKey => {
    if (updatedMap[audiKey] && typeof updatedMap[audiKey] === 'object') {
      Object.keys(updatedMap[audiKey]).forEach(sId => {
        updatedMap[audiKey][sId].status = 'available';
        updatedMap[audiKey][sId].bookedBy = null;
      });
    }
  });

  // 2. Mark occupied only for non-REJECTED bookings
  (bookings || []).forEach(b => {
    if (b.status !== 'REJECTED' && b.seats && Array.isArray(b.seats)) {
      const audiKey = b.audiKey || (b.auditorium && b.auditorium.includes('Audi 2') ? 'AUDI_2' : 'AUDI_1');
      b.seats.forEach(seat => {
        const sId = typeof seat === 'string' ? seat : seat?.id;
        if (sId) {
          if (updatedMap[audiKey] && updatedMap[audiKey][sId]) {
            updatedMap[audiKey][sId].status = 'occupied';
            updatedMap[audiKey][sId].bookedBy = { name: b.user?.name, email: b.user?.email };
          } else if (updatedMap[sId]) {
            updatedMap[sId].status = 'occupied';
            updatedMap[sId].bookedBy = { name: b.user?.name, email: b.user?.email };
          }
        }
      });
    }
  });

  return updatedMap;
};

export const getSeatMap = () => {
  try {
    const data = localStorage.getItem(KEYS.SEATS);
    const bookings = getUserBookings();
    
    let baseMap = null;
    if (!data) {
      baseMap = generateInitialSeatMap();
    } else {
      const parsed = JSON.parse(data);
      if (parsed && parsed.AUDI_1 && parsed.AUDI_2) {
        baseMap = parsed;
      } else {
        baseMap = generateInitialSeatMap();
        if (parsed && typeof parsed === 'object') {
          Object.keys(parsed).forEach(id => {
            if (baseMap.AUDI_1[id]) {
              baseMap.AUDI_1[id] = { ...baseMap.AUDI_1[id], ...parsed[id] };
            }
          });
        }
      }
    }

    const syncedMap = syncSeatMapWithBookings(baseMap, bookings);
    saveSeatMap(syncedMap);
    return syncedMap;
  } catch (e) {
    return generateInitialSeatMap();
  }
};

export const saveSeatMap = (seatMap) => {
  try {
    localStorage.setItem(KEYS.SEATS, JSON.stringify(seatMap));
    saveNeonSeatMap(seatMap); // Sync to Neon Postgres
  } catch (e) {
    console.error("Save seats error:", e);
  }
};

export const getUserBookings = () => {
  try {
    const data = localStorage.getItem(KEYS.BOOKINGS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveUserBooking = (booking) => {
  try {
    const current = getUserBookings();
    const updated = [booking, ...current];
    localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(updated));
    saveNeonBooking(booking); // Sync to Neon Postgres
    return updated;
  } catch (e) {
    console.error("Save booking error:", e);
    return [];
  }
};

export const updateBookingStatus = (bookingId, status) => {
  try {
    const currentBookings = getUserBookings();
    const seatMap = getSeatMap();

    const targetBooking = currentBookings.find(b => b.bookingId === bookingId);
    if (!targetBooking) return { bookings: currentBookings, seatMap };

    targetBooking.status = status; // 'CONFIRMED', 'PENDING_VERIFICATION', 'REJECTED'

    const audiKey = targetBooking.audiKey || (targetBooking.auditorium && targetBooking.auditorium.includes('Audi 2') ? 'AUDI_2' : 'AUDI_1');

    // If REJECTED, free up the seats on the seatMap
    if (status === 'REJECTED') {
      targetBooking.seats.forEach(seat => {
        if (seatMap[audiKey] && seatMap[audiKey][seat.id]) {
          seatMap[audiKey][seat.id].status = 'available';
          seatMap[audiKey][seat.id].bookedBy = null;
        } else if (seatMap[seat.id]) {
          seatMap[seat.id].status = 'available';
          seatMap[seat.id].bookedBy = null;
        }
      });
      saveSeatMap(seatMap);
    } else if (status === 'CONFIRMED') {
      // Ensure seats are marked occupied
      targetBooking.seats.forEach(seat => {
        if (seatMap[audiKey] && seatMap[audiKey][seat.id]) {
          seatMap[audiKey][seat.id].status = 'occupied';
          seatMap[audiKey][seat.id].bookedBy = {
            name: targetBooking.user.name,
            email: targetBooking.user.email
          };
        } else if (seatMap[seat.id]) {
          seatMap[seat.id].status = 'occupied';
          seatMap[seat.id].bookedBy = {
            name: targetBooking.user.name,
            email: targetBooking.user.email
          };
        }
      });
      saveSeatMap(seatMap);
    }

    localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(currentBookings));
    updateNeonBookingStatus(bookingId, status); // Sync to Neon Postgres
    return { bookings: currentBookings, seatMap };
  } catch (e) {
    console.error("Update booking status error:", e);
    return { bookings: getUserBookings(), seatMap: getSeatMap() };
  }
};

export const cancelAndRemoveBooking = async (bookingId) => {
  try {
    const currentBookings = getUserBookings();
    const targetBooking = currentBookings.find(b => b.bookingId === bookingId);
    
    // 1. Remove from bookings list
    const remainingBookings = currentBookings.filter(b => b.bookingId !== bookingId);
    localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(remainingBookings));

    // 2. Free up reserved seats on seatMap
    let seatMap = getSeatMap();
    if (targetBooking && targetBooking.seats && Array.isArray(targetBooking.seats)) {
      const audiKey = targetBooking.audiKey || (targetBooking.auditorium && targetBooking.auditorium.includes('Audi 2') ? 'AUDI_2' : 'AUDI_1');
      targetBooking.seats.forEach(seat => {
        const sId = typeof seat === 'string' ? seat : seat?.id;
        if (sId) {
          if (seatMap[audiKey] && seatMap[audiKey][sId]) {
            seatMap[audiKey][sId].status = 'available';
            seatMap[audiKey][sId].bookedBy = null;
          } else if (seatMap[sId]) {
            seatMap[sId].status = 'available';
            seatMap[sId].bookedBy = null;
          }
        }
      });
      saveSeatMap(seatMap);
    } else {
      seatMap = syncSeatMapWithBookings(seatMap, remainingBookings);
      saveSeatMap(seatMap);
    }

    // 3. Delete from Neon Postgres DB
    await deleteNeonBooking(bookingId);

    return { bookings: remainingBookings, seatMap };
  } catch (e) {
    console.error("Cancel and remove booking error:", e);
    return { bookings: getUserBookings(), seatMap: getSeatMap() };
  }
};

export const markTicketCheckedIn = (bookingId) => {
  try {
    const currentBookings = getUserBookings();
    const targetBooking = currentBookings.find(b => b.bookingId === bookingId);

    if (!targetBooking) {
      return { success: false, msg: `No booking found for ID "${bookingId}"` };
    }

    if (targetBooking.status === 'PENDING_VERIFICATION') {
      return { success: false, booking: targetBooking, msg: `PAYMENT PENDING: UTR (${targetBooking.utrNumber}) has not been approved by organisers yet!` };
    }

    if (targetBooking.status === 'REJECTED') {
      return { success: false, booking: targetBooking, msg: `ACCESS DENIED: Booking payment was REJECTED!` };
    }

    if (targetBooking.checkedIn) {
      return { 
        success: false, 
        alreadyCheckedIn: true,
        booking: targetBooking, 
        msg: `ALREADY USED: Ticket was checked-in at ${targetBooking.checkInTime || 'earlier'}` 
      };
    }

    // Mark as checked in
    targetBooking.checkedIn = true;
    targetBooking.checkInTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(currentBookings));
    markNeonCheckIn(bookingId, targetBooking.checkInTime); // Sync to Neon Postgres
    return { success: true, booking: targetBooking, msg: `ACCESS GRANTED! Welcome ${targetBooking.user.name}` };
  } catch (e) {
    console.error("Mark checked in error:", e);
    return { success: false, msg: "Error verifying check-in" };
  }
};

export const getActiveVerifiedUser = () => {
  try {
    const data = localStorage.getItem(KEYS.VERIFIED_USER);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

export const setActiveVerifiedUser = (user) => {
  try {
    if (user) {
      localStorage.setItem(KEYS.VERIFIED_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(KEYS.VERIFIED_USER);
    }
  } catch (e) {
    console.error("Set active user error:", e);
  }
};

export const clearAllBookings = () => {
  try {
    localStorage.removeItem(KEYS.BOOKINGS);
    const freshMap = generateInitialSeatMap();
    saveSeatMap(freshMap);
    return { bookings: [], seatMap: freshMap };
  } catch (e) {
    console.error("Clear bookings error:", e);
    return { bookings: [], seatMap: generateInitialSeatMap() };
  }
};

export const resetAllData = () => {
  localStorage.removeItem(KEYS.VIEWERS);
  localStorage.removeItem(KEYS.SEATS);
  localStorage.removeItem(KEYS.BOOKINGS);
  localStorage.removeItem(KEYS.VERIFIED_USER);
};

// NOTE: clearAllBookings() was previously called here on every module load,
// which wiped all bookings from localStorage on each page refresh. Removed.

