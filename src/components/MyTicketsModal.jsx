import React, { useState } from 'react';
import { X, Ticket, CheckCircle2, ShieldCheck, Flame, Clock3, AlertOctagon, Search } from 'lucide-react';

export default function MyTicketsModal({ 
  isOpen, 
  onClose, 
  userBookings = [], 
  onSelectTicket,
  verifiedUser
}) {
  const [searchQuery, setSearchQuery] = useState(verifiedUser?.email || '');

  if (!isOpen) return null;

  // Filter bookings based on active user or search query
  const query = searchQuery.trim().toLowerCase();
  const matchedBookings = userBookings.filter(b => {
    if (!query) {
      if (verifiedUser) {
        return b.user?.email?.toLowerCase() === verifiedUser.email?.toLowerCase();
      }
      return false;
    }
    const matchEmail = b.user?.email?.toLowerCase().includes(query);
    const matchName = b.user?.name?.toLowerCase().includes(query);
    const matchRoll = b.user?.rollNo?.toLowerCase().includes(query);
    const matchId = b.bookingId?.toLowerCase().includes(query);
    const matchUtr = b.utrNumber?.toLowerCase().includes(query);
    return matchEmail || matchName || matchRoll || matchId || matchUtr;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-red-900/80 bg-[#0d091a] p-6 shadow-2xl animate-popup">
        
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 hover:bg-red-950/50 hover:text-white hover-zoom"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-red-950/80 pb-4 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 animate-zoomin shadow-lg">
            <Ticket className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Find My Movie Tickets</h2>
            <p className="text-xs text-gray-400">Search and view your booked Demon Slayer passes</p>
          </div>
        </div>

        {/* Direct Search Bar */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
            Search by Email, Roll No, or Booking ID
          </label>
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. name@vitbhopal.ac.in, 25BCE10001, or DS-123456"
              className="w-full rounded-xl border border-red-900/60 bg-black/60 py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:border-red-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Results */}
        {matchedBookings.length === 0 ? (
          <div className="py-8 text-center text-gray-400 space-y-3 animate-fadeIn">
            <Ticket className="mx-auto h-12 w-12 text-gray-600 opacity-40" />
            <div>
              <p className="text-sm font-bold text-white">
                {query ? `No booked passes found for "${searchQuery}"` : "Enter your details above to find your ticket"}
              </p>
              <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                {query 
                  ? "Please double-check your email or roll number used during booking." 
                  : "All previously confirmed and submitted tickets are preserved safely in the database."}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 animate-fadeIn">
            <p className="text-xs text-emerald-400 font-bold mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Found {matchedBookings.length} booking pass(es):
            </p>
            {matchedBookings.map((b) => (
              <div 
                key={b.bookingId} 
                className="rounded-xl border border-red-900/50 bg-black/50 p-4 hover:border-orange-500 transition flex items-center justify-between hover-zoom"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-orange-400">{b.bookingId}</span>
                    
                    {b.checkedIn ? (
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40 font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Checked-In
                      </span>
                    ) : b.status === 'CONFIRMED' ? (
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                        Confirmed
                      </span>
                    ) : b.status === 'PENDING_VERIFICATION' ? (
                      <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 font-bold flex items-center gap-1">
                        <Clock3 className="h-3 w-3 text-amber-400 animate-spin" /> Verification Pending
                      </span>
                    ) : (
                      <span className="text-[10px] bg-red-950 text-red-300 px-2 py-0.5 rounded border border-red-500/30 font-bold flex items-center gap-1">
                        <AlertOctagon className="h-3 w-3 text-red-400" /> Rejected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white mt-1">
                    Name: <strong className="text-gray-200">{b.user?.name}</strong> • Seats: <strong className="text-amber-300">{Array.isArray(b.seats) ? b.seats.map(s => s.id).join(', ') : ''}</strong>
                  </p>
                  <p className="text-[11px] text-gray-400 font-mono">Email: {b.user?.email}</p>
                </div>

                <button
                  onClick={() => {
                    onSelectTicket(b);
                    onClose();
                  }}
                  className="rounded-lg bg-red-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-600 hover-zoom shadow shrink-0 ml-3"
                >
                  View Pass
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

