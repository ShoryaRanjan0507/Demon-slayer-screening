import React, { useState, useEffect } from 'react';
import { SEAT_TIERS } from '../data/initialData';
import { Check, Lock, User, ShoppingBag, Building2, AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';

export default function SeatMap({
  seatMap,
  selectedSeats,
  onToggleSeat,
  verifiedUser,
  onProceedToCheckout,
  selectedAudiKey = 'AUDI_1',
  onSelectAudiKey
}) {

  // Active auditorium state ('AUDI_1' or 'AUDI_2')
  const activeAudi = selectedAudiKey || 'AUDI_1';

  // Calculate booked counts for both auditoriums
  const audi1Seats = seatMap?.AUDI_1 ? Object.values(seatMap.AUDI_1) : [];
  const audi2Seats = seatMap?.AUDI_2 ? Object.values(seatMap.AUDI_2) : [];

  const audi1BookedCount = audi1Seats.filter(s => s.status === 'occupied').length;
  const audi2BookedCount = audi2Seats.filter(s => s.status === 'occupied').length;

  const isAudi1Full = audi1BookedCount >= 288;
  const isAudi2Full = audi2BookedCount >= 288;

  // Group seats by Row (A through P)
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];

  // Get current active auditorium seat map dictionary
  const currentAudiSeatMap = (seatMap && seatMap[activeAudi]) ? seatMap[activeAudi] : (seatMap?.AUDI_1 || seatMap || {});

  // Calculate total amount for current selected seats
  const totalPrice = selectedSeats.reduce((sum, seatId) => {
    return sum + (currentAudiSeatMap[seatId]?.price || 0);
  }, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 animate-fadeIn" id="seat-selection-section">

      {/* Verified Banner & Auditorium Selector Header */}
      <div className="mb-6 rounded-2xl border border-red-900/60 bg-[#0d0a1b] p-5 shadow-xl animate-popup">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-red-950/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-400 animate-zoomin">
              <User className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">AUTHENTICATED VIEWER</span>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {verifiedUser.name} <span className="text-xs font-mono text-emerald-400">({verifiedUser.email})</span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-950/80 border border-amber-500/40 px-3 py-1 text-[11px] font-bold text-amber-300 flex items-center gap-1.5 shadow">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" /> Max 4 Seats / Person
            </span>
          </div>
        </div>

        {/* Auditorium Selection Tabs */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-200 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-red-500" /> Choose Screening Venue:
            </span>
            <span className="text-[11px] text-gray-400">Select either Audi 1 or Audi 2 to choose your seats</span>
          </div>

          <div className="flex w-full sm:w-auto rounded-xl border border-red-950/80 bg-black/60 p-1 gap-1.5">
            {/* Audi 1 Tab */}
            <button
              onClick={() => onSelectAudiKey && onSelectAudiKey('AUDI_1')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition hover-zoom ${activeAudi === 'AUDI_1'
                ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <span>🏛️ AB02 — AUDI 1</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-black ${isAudi1Full 
                ? 'bg-red-950 text-red-400 border border-red-500/50' 
                : 'bg-black/60 text-emerald-400 border border-emerald-500/30'
                }`}>
                {isAudi1Full ? 'FULL (288/288)' : `${audi1BookedCount}/288`}
              </span>
            </button>

            {/* Audi 2 Tab (Fully Open & Selectable) */}
            <button
              onClick={() => onSelectAudiKey && onSelectAudiKey('AUDI_2')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition hover-zoom ${activeAudi === 'AUDI_2'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <span>🏛️ AB02 — AUDI 2</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-black ${isAudi2Full 
                ? 'bg-red-950 text-red-400 border border-red-500/50' 
                : 'bg-black/60 text-purple-300 border border-purple-500/30'
                }`}>
                {isAudi2Full ? 'FULL (288/288)' : `${audi2BookedCount}/288`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* AUTO OVERFLOW NOTIFICATION BANNER */}
      {isAudi1Full && (
        <div className="mb-6 rounded-2xl border border-amber-500/60 bg-gradient-to-r from-amber-950/80 via-black to-red-950/80 p-4 text-center shadow-xl space-y-1.5 animate-popup">
          <div className="inline-flex items-center gap-2 rounded-full bg-red-600 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-white animate-bounce shadow">
            <AlertTriangle className="h-4 w-4 text-amber-200" /> AB02 AUDI 1 IS 100% FULLY BOOKED (288 / 288 SEATS)
          </div>
          <h3 className="text-base font-black text-white flex items-center justify-center gap-2">
            Automated Overflow Active <ArrowRight className="h-4 w-4 text-amber-400" /> You Are Booking In AB02 — Audi 2
          </h3>
          <p className="text-xs text-amber-200/90 max-w-2xl mx-auto">
            All 288 seats in Audi 1 have been reserved. The booking system has automatically redirected you to <strong>Audi 2 of AB02</strong>, featuring the exact same seating arrangement and screening setup!
          </p>
        </div>
      )}

      {/* Screen Curved Header */}
      <div className="relative mb-10 text-center">
        <div className="mx-auto h-16 w-3/4 bg-gradient-to-b from-red-600/20 via-orange-500/10 to-transparent blur-xl"></div>
        <div className="relative mx-auto max-w-3xl overflow-hidden py-3">
          <div className="h-6 w-full rounded-t-[100%] border-t-4 border-red-500 bg-gradient-to-b from-red-600/30 to-transparent shadow-[0_-5px_20px_rgba(230,32,53,0.6)] animate-zoomin"></div>
          <p className="mt-1 font-display text-xs font-extrabold tracking-[0.4em] text-red-400 uppercase">
            INFINITY CASTLE SCREEN — {activeAudi === 'AUDI_1' ? 'AB02 AUDI 1' : 'AB02 AUDI 2 (OVERFLOW)'}
          </p>
        </div>
      </div>

      {/* Tier Legend Bar */}
      <div className="mb-8 flex flex-wrap items-center justify-center gap-3 sm:gap-6 rounded-xl border border-red-950/60 bg-black/50 p-4 backdrop-blur-md animate-popup">
        <div className="flex items-center gap-2 text-xs font-semibold text-white hover-zoom">
          <span
            className="h-4 w-4 rounded border shadow-sm"
            style={{ borderColor: '#ff8c42', backgroundColor: 'rgba(255, 107, 26, 0.22)' }}
          ></span>
          Standard (₹67)
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 border-l border-red-950/80 pl-4">
          <span className="h-4 w-4 rounded bg-gray-800 border border-gray-700 opacity-60"></span>
          Occupied
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
          <span className="h-4 w-4 rounded bg-gradient-to-r from-amber-400 to-orange-500 shadow-md"></span>
          Selected
        </div>
      </div>

      {/* Seat Grid Layout Container */}
      <div className="overflow-x-auto pb-8">
        <div className="min-w-[780px] space-y-2">
          {rows.map((rowName) => {
            const rowSeats = Object.values(currentAudiSeatMap).filter(s => s.row === rowName);

            // Left block: seats 1..4 (4 seats)
            const leftBlock = rowSeats.slice(0, 4);
            // Center block: seats 5..14 (10 seats)
            const centerBlock = rowSeats.slice(4, 14);
            // Right block: seats 15..18 (4 seats)
            const rightBlock = rowSeats.slice(14, 18);

            return (
              <div key={rowName} className="flex items-center gap-2.5 justify-center">
                {/* Row Label Left */}
                <div className="w-8 shrink-0 text-center font-display text-sm font-black text-gray-400">
                  {rowName}
                </div>

                {/* Left Block (Seats 1..4) */}
                <div className="flex gap-1">
                  {leftBlock.map(seat => renderSeatButton(seat, selectedSeats, onToggleSeat))}
                </div>

                {/* Aisle 1 */}
                <div className="w-6 shrink-0 text-center text-[9px] font-mono text-red-950/60 font-black">
                  |
                </div>

                {/* Center Block (Seats 5..14) */}
                <div className="flex gap-1">
                  {centerBlock.map(seat => renderSeatButton(seat, selectedSeats, onToggleSeat))}
                </div>

                {/* Aisle 2 */}
                <div className="w-6 shrink-0 text-center text-[9px] font-mono text-red-950/60 font-black">
                  |
                </div>

                {/* Right Block (Seats 15..18) */}
                <div className="flex gap-1">
                  {rightBlock.map(seat => renderSeatButton(seat, selectedSeats, onToggleSeat))}
                </div>

                {/* Row Label Right */}
                <div className="w-8 shrink-0 text-center font-display text-sm font-black text-gray-400">
                  {rowName}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Sticky Bottom Selection Summary Bar */}
      {selectedSeats.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-red-500/40 bg-[#0a0815]/95 px-4 py-4 backdrop-blur-xl shadow-[0_-10px_25px_rgba(0,0,0,0.8)] animate-slide-popup">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">

            <div>
              <span className="text-[11px] font-bold text-red-400 uppercase tracking-widest">
                SELECTED SEATS ({selectedSeats.length}) — {activeAudi === 'AUDI_1' ? 'AB02 AUDI 1' : 'AB02 AUDI 2'}
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {selectedSeats.map(seatId => (
                  <span key={seatId} className="rounded bg-gradient-to-r from-red-600 to-orange-500 px-2 py-0.5 text-xs font-black text-white shadow animate-zoomin">
                    {seatId}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="block text-[10px] text-gray-400 uppercase">Total Amount</span>
                <span className="text-2xl font-black text-white">₹{totalPrice}</span>
              </div>

              <button
                onClick={onProceedToCheckout}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 px-6 py-3 text-xs sm:text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-red-950/80 transition hover:brightness-110 active:scale-95 hover-zoom"
              >
                <ShoppingBag className="h-4 w-4" /> Proceed To Pay
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// Render individual seat element
function renderSeatButton(seat, selectedSeats, onToggleSeat) {
  if (!seat) return null;

  const isSelected = selectedSeats.includes(seat.id);
  const isOccupied = seat.status === 'occupied';
  const tierConfig = SEAT_TIERS[seat.tierKey] || SEAT_TIERS.STANDARD;

  if (isOccupied) {
    return (
      <button
        key={seat.id}
        disabled
        className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded border border-gray-800 bg-gray-900/80 text-[11px] font-mono text-gray-600 cursor-not-allowed opacity-40"
        title={`Seat ${seat.id} - Occupied`}
      >
        <Lock className="h-3 w-3 text-gray-600" />
      </button>
    );
  }

  if (isSelected) {
    return (
      <button
        key={seat.id}
        onClick={() => onToggleSeat(seat.id)}
        className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded bg-gradient-to-br from-amber-400 to-orange-600 text-xs font-mono font-black text-white shadow-lg shadow-orange-950/80 scale-110 transition border-2 border-white animate-seat-pop z-10"
        title={`Seat ${seat.id} (₹${seat.price}) - Click to unselect`}
      >
        <Check className="h-3.5 w-3.5" />
      </button>
    );
  }

  // Available Seat
  return (
    <button
      key={seat.id}
      onClick={() => onToggleSeat(seat.id)}
      className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded border text-xs font-bold transition hover:scale-125 hover:z-20 active:scale-95 shadow-sm hover:border-amber-400 hover:text-white"
      style={{
        borderColor: tierConfig.borderColor,
        backgroundColor: tierConfig.lightColor,
        color: tierConfig.color
      }}
      title={`Seat ${seat.id} - ${tierConfig.name} (₹${seat.price})`}
    >
      {seat.number}
    </button>
  );
}


