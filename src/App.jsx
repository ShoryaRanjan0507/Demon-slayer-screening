import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import VerificationStep from './components/VerificationStep';
import SeatMap from './components/SeatMap';
import CheckoutModal from './components/CheckoutModal';
import TicketPass from './components/TicketPass';
import MyTicketsModal from './components/MyTicketsModal';
import AdminPortal from './components/AdminPortal';
import ParticipantsModal from './components/ParticipantsModal';
import backupSeed from './data/backupSeed.json';

import { 
  getRegisteredViewers, 
  saveRegisteredViewers,
  getSeatMap, 
  saveSeatMap, 
  syncSeatMapWithBookings,
  getUserBookings, 
  saveUserBooking, 
  getActiveVerifiedUser, 
  setActiveVerifiedUser 
} from './utils/storage';
import { fetchNeonViewers, fetchNeonBookings, fetchNeonSeatMap } from './utils/db';

export default function App() {
  // Application Data States
  const [registeredViewers, setRegisteredViewers] = useState([]);
  const [seatMap, setSeatMapState] = useState(getSeatMap());
  const [userBookings, setUserBookingsState] = useState(getUserBookings());
  
  // Active User & Seat Selection States
  const [verifiedUser, setVerifiedUser] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [selectedAudiKey, setSelectedAudiKey] = useState('AUDI_1');

  // Modals visibility
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showMyTicketsModal, setShowMyTicketsModal] = useState(false);
  const [showAdminPortal, setShowAdminPortal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);

  // Organiser Authentication state
  const [isOrganiserAuthenticated, setIsOrganiserAuthenticated] = useState(false);

  // Load data on mount & background sync with Neon Postgres
  useEffect(() => {
    // 1. Instant local load
    setRegisteredViewers(getRegisteredViewers());
    setSeatMapState(getSeatMap());
    setUserBookingsState(getUserBookings());
    setVerifiedUser(getActiveVerifiedUser());

    // 2. Full initial sync with Neon Postgres DB
    const syncAllData = async () => {
      try {
        const neonViewers = await fetchNeonViewers();
        if (neonViewers && Array.isArray(neonViewers) && neonViewers.length > 0) {
          saveRegisteredViewers(neonViewers);
          setRegisteredViewers([...neonViewers]);
        }

        const neonBookings = await fetchNeonBookings();
        if (neonBookings && Array.isArray(neonBookings) && neonBookings.length > 0) {
          localStorage.setItem('ds_infinity_castle_user_bookings', JSON.stringify(neonBookings));
          setUserBookingsState([...neonBookings]);

          const currentMap = getSeatMap();
          const syncedMap = syncSeatMapWithBookings(currentMap, neonBookings);
          saveSeatMap(syncedMap);
          setSeatMapState({ ...syncedMap });
        }
      } catch (err) {
        console.error("Neon DB sync warning:", err);
      }

      // Fallback: if localStorage is STILL empty after sync attempt, seed from backup
      const localBookings = getUserBookings();
      const localViewers = getRegisteredViewers();
      if ((!localBookings || localBookings.length === 0) && backupSeed.bookings?.length > 0) {
        console.warn("⚠️ DB unreachable & localStorage empty — loading from backup seed");
        localStorage.setItem('ds_infinity_castle_user_bookings', JSON.stringify(backupSeed.bookings));
        setUserBookingsState([...backupSeed.bookings]);

        const currentMap = getSeatMap();
        const syncedMap = syncSeatMapWithBookings(currentMap, backupSeed.bookings);
        saveSeatMap(syncedMap);
        setSeatMapState({ ...syncedMap });
      }
      if ((!localViewers || localViewers.length === 0) && backupSeed.viewers?.length > 0) {
        saveRegisteredViewers(backupSeed.viewers);
        setRegisteredViewers([...backupSeed.viewers]);
      }
    };

    // Lightweight sync for live seat updates
    const syncBookingsOnly = async () => {
      if (document.hidden || document.visibilityState !== 'visible') return;
      try {
        const neonBookings = await fetchNeonBookings();
        // Only overwrite if DB returned real data (null = error/unreachable)
        if (neonBookings && Array.isArray(neonBookings) && neonBookings.length > 0) {
          localStorage.setItem('ds_infinity_castle_user_bookings', JSON.stringify(neonBookings));
          setUserBookingsState([...neonBookings]);

          const currentMap = getSeatMap();
          const syncedMap = syncSeatMapWithBookings(currentMap, neonBookings);
          saveSeatMap(syncedMap);
          setSeatMapState({ ...syncedMap });
        }
      } catch (err) {
        console.error("Neon DB sync warning:", err);
      }
    };

    // Initial load
    syncAllData();

    // 3. Smart interval: runs every 60s ONLY when tab is active/visible
    const syncInterval = setInterval(syncBookingsOnly, 60000);

    // Sync immediately when user switches back to this tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncBookingsOnly();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(syncInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Update storage helpers & sync with Neon DB
  const handleUpdateViewers = async () => {
    console.log("🔄 handleUpdateViewers: starting sync...");
    const neonViewers = await fetchNeonViewers();
    console.log("🔄 handleUpdateViewers: got viewers:", neonViewers?.length, neonViewers);
    if (neonViewers && Array.isArray(neonViewers)) {
      saveRegisteredViewers(neonViewers);
      setRegisteredViewers([...neonViewers]);
    }

    const neonBookings = await fetchNeonBookings();
    if (neonBookings && Array.isArray(neonBookings)) {
      localStorage.setItem('ds_infinity_castle_user_bookings', JSON.stringify(neonBookings));
      setUserBookingsState([...neonBookings]);
    }
  };

  const handleUpdateBookings = (updatedBookings, updatedSeatMap) => {
    if (updatedBookings) setUserBookingsState([...updatedBookings]);
    if (updatedSeatMap) setSeatMapState({ ...updatedSeatMap });
  };

  const handleResetData = async () => {
    if (!window.confirm('⚠️ This will permanently delete ALL data — viewers, bookings, and seats — from both this browser and the cloud database. Are you sure?')) {
      return;
    }
    try {
      // 1. Clear cloud database tables
      const res = await fetch('/api/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Reset API failed');
      }

      // 2. Clear browser LocalStorage
      localStorage.clear();

      // 3. Generate 100% fresh, empty seat map
      const freshSeatMap = generateInitialSeatMap();
      saveSeatMap(freshSeatMap);

      // 4. Reset React states
      setRegisteredViewers([]);
      setSeatMapState(freshSeatMap);
      setUserBookingsState([]);
      setVerifiedUser(null);
      setSelectedSeats([]);
      setActiveTicket(null);
      setSelectedAudiKey('AUDI_1');

      alert('✅ All data, bookings, and occupied seats have been completely reset!');
    } catch (err) {
      console.error('Reset failed:', err);
      alert(`❌ Reset failed: ${err.message}`);
    }
  };



  // Handle Verification success
  const handleVerifySuccess = (user) => {
    setVerifiedUser(user);
    setActiveVerifiedUser(user);
    setShowVerifyModal(false);
  };

  // Handle Logout / Change user
  const handleLogout = () => {
    setVerifiedUser(null);
    setActiveVerifiedUser(null);
    setSelectedSeats([]);
  };

  // Toggle seat selection (Max 4 seats per booking anti-abuse limit)
  const handleToggleSeat = (seatId) => {
    if (!verifiedUser) {
      setShowVerifyModal(true);
      return;
    }

    setSelectedSeats(prev => {
      if (prev.includes(seatId)) {
        return prev.filter(id => id !== seatId);
      } else {
        if (prev.length >= 4) {
          alert('⚠️ Limit reached: Maximum 4 seats allowed per booking to ensure fair availability for all students.');
          return prev;
        }
        return [...prev, seatId];
      }
    });
  };

  // Switch Auditorium and clear previous seat selections
  const handleSelectAudiKey = (audiKey) => {
    if (audiKey !== selectedAudiKey) {
      setSelectedSeats([]);
      setSelectedAudiKey(audiKey);
    }
  };

  // Handle Booking Confirmation
  const handleConfirmBooking = (bookingData) => {
    // 1. Mark selected seats as occupied in active auditorium
    const audiKey = selectedAudiKey || 'AUDI_1';
    const updatedSeatMap = { ...seatMap };
    
    if (!updatedSeatMap[audiKey]) {
      updatedSeatMap[audiKey] = {};
    } else {
      updatedSeatMap[audiKey] = { ...updatedSeatMap[audiKey] };
    }

    const currentAudiSeats = (bookingData.seats || []).map(s => {
      return {
        ...s,
        auditorium: audiKey === 'AUDI_1' ? 'AB02 — Audi 1' : 'AB02 — Audi 2'
      };
    });

    bookingData.seats.forEach(seat => {
      if (updatedSeatMap[audiKey][seat.id]) {
        updatedSeatMap[audiKey][seat.id].status = 'occupied';
        updatedSeatMap[audiKey][seat.id].bookedBy = {
          name: bookingData.user.name,
          email: bookingData.user.email
        };
      }
    });

    setSeatMapState(updatedSeatMap);
    saveSeatMap(updatedSeatMap);

    // 2. Save booking with auditorium info
    const fullBookingData = {
      ...bookingData,
      seats: currentAudiSeats,
      audiKey: audiKey,
      auditorium: audiKey === 'AUDI_1' ? 'AB02 — Audi 1' : 'AB02 — Audi 2'
    };

    const updatedBookings = saveUserBooking(fullBookingData);
    setUserBookingsState(updatedBookings);

    // 3. Clear selected seats & show ticket pass view
    setSelectedSeats([]);
    setShowCheckoutModal(false);
    setActiveTicket(fullBookingData);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090710] text-gray-100 selection:bg-red-600 selection:text-white">
      
      {/* Header Bar */}
      <Header
        verifiedUser={verifiedUser}
        onOpenVerify={() => setShowVerifyModal(true)}
        onOpenMyTickets={() => setShowMyTicketsModal(true)}
        onOpenAdmin={() => setShowAdminPortal(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        
        {/* Active Ticket Pass View */}
        {activeTicket ? (
          <TicketPass
            booking={activeTicket}
            onBackToHome={() => setActiveTicket(null)}
          />
        ) : (
          <>
            {/* Cinematic Hero Section */}
            <Hero
              verifiedUser={verifiedUser}
              onOpenMyTickets={() => setShowMyTicketsModal(true)}
            />

            {/* Postponement & Ticket Verification Notice Section */}
            <section className="py-12 px-4 max-w-4xl mx-auto">
              <div className="rounded-3xl border-2 border-amber-500/50 bg-gradient-to-b from-[#160c26] via-[#0d0918] to-black/80 p-6 sm:p-10 shadow-2xl backdrop-blur-xl text-center space-y-6 animate-popup">
                
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 shadow-inner animate-pulse">
                  <span className="text-3xl">📢</span>
                </div>

                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 px-3.5 py-1 text-xs font-black tracking-widest text-amber-300 uppercase font-mono">
                    EVENT POSTPONED • REGISTRATIONS CLOSED
                  </span>
                  <h2 className="text-2xl font-black text-white sm:text-4xl">
                    Demon Slayer Screening Postponed
                  </h2>
                  <p className="text-sm text-gray-300 max-w-xl mx-auto leading-relaxed">
                    The movie screening is postponed for now. We have stopped taking any more viewer registrations or seat bookings. Please wait for further instructions & announcements from the Anime Club organizers.
                  </p>
                </div>

                <div className="rounded-2xl border border-red-900/50 bg-black/60 p-5 max-w-lg mx-auto text-left space-y-3 shadow-inner">
                  <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-2">
                    🎟️ Already Booked a Ticket?
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    All existing bookings and confirmed seats are preserved safely in the database. You can search by your email, roll number, or booking ID to view and download your pass.
                  </p>
                  <button
                    onClick={() => setShowMyTicketsModal(true)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-red-950/80 transition hover:brightness-110 active:scale-98 hover-zoom"
                  >
                    🔍 Find & View My Ticket Pass
                  </button>
                </div>

              </div>
            </section>
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-red-950/60 bg-black/80 py-8 px-4 text-center text-xs text-gray-500">
        <div className="mx-auto max-w-5xl space-y-2">
          <p className="font-semibold text-gray-400">ANIME CLUB — DEMON SLAYER INFINITY CASTLE MOVIE SCREENING</p>
          <p>© 2026 Anime Club. All rights reserved. Designed for Laptops & Mobile Devices.</p>
        </div>
      </footer>

      {/* Verification Modal (Triggered from header if unverified) */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg">
            <button
              onClick={() => setShowVerifyModal(false)}
              className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-gray-400 hover:bg-red-950/50 hover:text-white"
            >
              ✕
            </button>
            <VerificationStep
              registeredViewers={registeredViewers}
              onVerifySuccess={handleVerifySuccess}
              onRegisterNewViewer={handleUpdateViewers}
            />
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        selectedSeats={selectedSeats}
        seatMap={seatMap}
        verifiedUser={verifiedUser}
        onConfirmBooking={handleConfirmBooking}
        selectedAudiKey={selectedAudiKey}
      />

      {/* My Tickets Modal */}
      <MyTicketsModal
        isOpen={showMyTicketsModal}
        onClose={() => setShowMyTicketsModal(false)}
        userBookings={userBookings}
        onSelectTicket={(ticket) => setActiveTicket(ticket)}
        verifiedUser={verifiedUser}
        onOpenVerify={() => setShowVerifyModal(true)}
      />

      {/* Organizer Admin Portal */}
      <AdminPortal
        isOpen={showAdminPortal}
        onClose={() => setShowAdminPortal(false)}
        registeredViewers={registeredViewers}
        onUpdateViewers={handleUpdateViewers}
        seatMap={seatMap}
        userBookings={userBookings}
        onUpdateBookings={handleUpdateBookings}
        onResetData={handleResetData}
        onOpenParticipants={() => setShowParticipantsModal(true)}
        isOrganiserAuthenticated={isOrganiserAuthenticated}
        onAuthenticateOrganiser={() => setIsOrganiserAuthenticated(true)}
      />

      {/* Participants Directory & Sheet Importer Modal */}
      <ParticipantsModal
        isOpen={showParticipantsModal}
        onClose={() => setShowParticipantsModal(false)}
        registeredViewers={registeredViewers}
        onUpdateViewers={handleUpdateViewers}
        isOrganiserAuthenticated={isOrganiserAuthenticated}
        onAuthenticateOrganiser={() => setIsOrganiserAuthenticated(true)}
      />

    </div>
  );
}

