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

import { 
  getRegisteredViewers, 
  getSeatMap, 
  saveSeatMap, 
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

    // 2. Async sync with Neon Postgres DB (Single Source of Truth)
    const syncNeonData = async () => {
      try {
        const neonViewers = await fetchNeonViewers();
        if (neonViewers && Array.isArray(neonViewers) && neonViewers.length > 0) {
          saveRegisteredViewers(neonViewers);
          setRegisteredViewers(neonViewers);
        }

        const neonBookings = await fetchNeonBookings();
        if (neonBookings && Array.isArray(neonBookings)) {
          localStorage.setItem('ds_infinity_castle_user_bookings', JSON.stringify(neonBookings));
          setUserBookingsState(neonBookings);
        }

        const neonSeats = await fetchNeonSeatMap();
        if (neonSeats) {
          saveSeatMap(neonSeats);
          setSeatMapState(neonSeats);
        }
      } catch (err) {
        console.error("Neon DB sync warning:", err);
      }
    };

    syncNeonData();

    // 3. Live 3-second polling interval across devices
    const syncInterval = setInterval(syncNeonData, 3000);
    return () => clearInterval(syncInterval);
  }, []);

  // Update storage helpers & sync with Neon DB
  const handleUpdateViewers = async () => {
    try {
      const neonViewers = await fetchNeonViewers();
      if (neonViewers && Array.isArray(neonViewers) && neonViewers.length > 0) {
        saveRegisteredViewers(neonViewers);
        setRegisteredViewers(neonViewers);
      } else {
        setRegisteredViewers(getRegisteredViewers());
      }

      const neonBookings = await fetchNeonBookings();
      if (neonBookings && Array.isArray(neonBookings)) {
        localStorage.setItem('ds_infinity_castle_user_bookings', JSON.stringify(neonBookings));
        setUserBookingsState(neonBookings);
      }
    } catch (err) {
      setRegisteredViewers(getRegisteredViewers());
    }
  };

  const handleUpdateBookings = (updatedBookings, updatedSeatMap) => {
    if (updatedBookings) setUserBookingsState([...updatedBookings]);
    if (updatedSeatMap) setSeatMapState({ ...updatedSeatMap });
  };

  const handleResetData = () => {
    setRegisteredViewers(getRegisteredViewers());
    setSeatMapState(getSeatMap());
    setUserBookingsState(getUserBookings());
    setVerifiedUser(null);
    setSelectedSeats([]);
    setActiveTicket(null);
    setSelectedAudiKey('AUDI_1');
  };

  // Toggle Audi 1 Full simulation for easy overflow testing
  const handleSimulateAudi1Full = () => {
    const currentMap = { ...seatMap };
    if (!currentMap.AUDI_1) return;

    const audi1Seats = Object.values(currentMap.AUDI_1);
    const bookedCount = audi1Seats.filter(s => s.status === 'occupied').length;

    const updatedAudi1 = { ...currentMap.AUDI_1 };
    
    if (bookedCount >= 288) {
      // Reset Audi 1 seats back to available
      Object.keys(updatedAudi1).forEach(id => {
        updatedAudi1[id] = { ...updatedAudi1[id], status: 'available', bookedBy: null };
      });
      setSelectedAudiKey('AUDI_1');
    } else {
      // Mark all 288 seats in Audi 1 as occupied
      Object.keys(updatedAudi1).forEach(id => {
        updatedAudi1[id] = { 
          ...updatedAudi1[id], 
          status: 'occupied', 
          bookedBy: { name: "Full Booking Demo", email: "demo@animeclub.org" } 
        };
      });
      setSelectedAudiKey('AUDI_2');
    }

    const newMapState = { ...currentMap, AUDI_1: updatedAudi1 };
    setSeatMapState(newMapState);
    saveSeatMap(newMapState);
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

  // Toggle seat selection
  const handleToggleSeat = (seatId) => {
    if (!verifiedUser) {
      setShowVerifyModal(true);
      return;
    }

    setSelectedSeats(prev => {
      if (prev.includes(seatId)) {
        return prev.filter(id => id !== seatId);
      } else {
        return [...prev, seatId];
      }
    });
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
              onStartBooking={() => {
                if (verifiedUser) {
                  const seatSection = document.getElementById('seat-selection-section');
                  if (seatSection) seatSection.scrollIntoView({ behavior: 'smooth' });
                } else {
                  setShowVerifyModal(true);
                }
              }}
            />

            {/* Seat Selection / Verification Section */}
            <section id="seat-selection-section" className="py-12">
              {!verifiedUser ? (
                /* Unverified User - Direct Registration */
                <div className="px-4">
                  <div className="text-center mb-8">
                    <span className="text-xs font-bold text-red-500 uppercase tracking-widest font-mono">ON-SITE REGISTRATION PORTAL</span>
                    <h2 className="text-2xl font-black text-white sm:text-3xl mt-1">Register Or Log In To Choose Your Seats</h2>
                    <p className="text-xs text-gray-400 mt-1 max-w-lg mx-auto">
                      Fill in your details below to unlock the interactive seat map and book your screening ticket.
                    </p>
                  </div>
                  <VerificationStep
                    registeredViewers={registeredViewers}
                    onVerifySuccess={handleVerifySuccess}
                    onRegisterNewViewer={handleUpdateViewers}
                  />
                </div>
              ) : (
                /* Verified User - Interactive Seat Map */
                <SeatMap
                  seatMap={seatMap}
                  selectedSeats={selectedSeats}
                  onToggleSeat={handleToggleSeat}
                  verifiedUser={verifiedUser}
                  onProceedToCheckout={() => setShowCheckoutModal(true)}
                  selectedAudiKey={selectedAudiKey}
                  onSelectAudiKey={setSelectedAudiKey}
                  onSimulateAudi1Full={handleSimulateAudi1Full}
                />
              )}
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

