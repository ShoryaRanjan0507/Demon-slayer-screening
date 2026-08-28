import React from 'react';
import { X, Ticket, CheckCircle2, ShieldCheck, Flame, Clock3, AlertOctagon } from 'lucide-react';

export default function MyTicketsModal({ 
  isOpen, 
  onClose, 
  userBookings = [], 
  onSelectTicket,
  verifiedUser,
  onOpenVerify 
}) {
  if (!isOpen) return null;

  // Filter bookings strictly for the currently verified user
  const myBookings = verifiedUser 
    ? userBookings.filter(b => b.user && b.user.email?.toLowerCase() === verifiedUser.email?.toLowerCase())
    : [];

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
            <h2 className="text-xl font-black text-white">My Movie Tickets</h2>
            <p className="text-xs text-gray-400">View and download your Demon Slayer screening passes</p>
          </div>
        </div>

        {!verifiedUser ? (
          /* Unverified State Prompt */
          <div className="py-8 text-center space-y-4 animate-zoomin">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-950 border border-red-500/40 text-red-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Registration / Login Required</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                Please log in or register your account to view your booked tickets.
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                if (onOpenVerify) onOpenVerify();
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 px-5 py-2.5 text-xs font-bold uppercase text-white shadow-lg hover:brightness-110 hover-zoom"
            >
              <Flame className="h-4 w-4" /> Register / Log In Now
            </button>
          </div>
        ) : myBookings.length === 0 ? (
          /* Verified User Has No Bookings */
          <div className="py-10 text-center text-gray-400 space-y-3 animate-fadeIn">
            <Ticket className="mx-auto h-12 w-12 text-gray-600 opacity-40" />
            <div>
              <p className="text-sm font-bold text-white">No passes found for {verifiedUser.name}</p>
              <p className="text-xs text-red-300 font-mono mt-0.5">{verifiedUser.email}</p>
            </div>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">
              You haven't booked any seats yet. Choose your seat from the interactive seat map!
            </p>
          </div>
        ) : (
          /* Verified User Passes */
          <div className="space-y-3 animate-fadeIn">
            <p className="text-xs text-emerald-400 font-bold mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Showing tickets for <strong>{verifiedUser.name}</strong> ({myBookings.length})
            </p>
            {myBookings.map((b) => (
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
                        <Clock3 className="h-3 w-3 text-amber-400 animate-spin" /> UTR Verification Pending
                      </span>
                    ) : (
                      <span className="text-[10px] bg-red-950 text-red-300 px-2 py-0.5 rounded border border-red-500/30 font-bold flex items-center gap-1">
                        <AlertOctagon className="h-3 w-3 text-red-400" /> Rejected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white mt-1">
                    Seats: <strong className="text-amber-300">{b.seats.map(s => s.id).join(', ')}</strong>
                  </p>
                  <p className="text-[11px] text-gray-400 font-mono">UTR Ref: {b.utrNumber}</p>
                </div>

                <button
                  onClick={() => {
                    onSelectTicket(b);
                    onClose();
                  }}
                  className="rounded-lg bg-red-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-600 hover-zoom shadow"
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

