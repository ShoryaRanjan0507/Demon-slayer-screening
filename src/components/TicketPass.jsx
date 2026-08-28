import React, { useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';
import { Download, Calendar, Clock, MapPin, CheckCircle2, ArrowLeft, Flame, Clock3, AlertOctagon, Lock } from 'lucide-react';
import { EVENT_DETAILS } from '../data/initialData';

export default function TicketPass({ booking, onBackToHome }) {
  const ticketRef = useRef(null);

  const isConfirmed = booking.status === 'CONFIRMED' || booking.checkedIn;
  const isPending = booking.status === 'PENDING_VERIFICATION';
  const isRejected = booking.status === 'REJECTED';

  useEffect(() => {
    // Fire festive confetti animation if confirmed
    if (isConfirmed) {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.55 }
      });
    }
  }, [isConfirmed]);

  const handleDownloadTicket = async () => {
    if (!ticketRef.current) return;
    try {
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        backgroundColor: '#0c0818',
        useCORS: true
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `DemonSlayer_Ticket_${booking.bookingId}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to download ticket image:", err);
    }
  };

  const seatCodes = booking.seats.map(s => s.id).join(', ');

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      
      {/* Top Action Bar */}
      <div className="mb-6 flex items-center justify-between animate-fadeIn">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 rounded-lg border border-red-900/60 bg-black/40 px-3 py-2 text-xs font-semibold text-gray-300 hover:bg-red-950/40 hover:text-white hover-zoom"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </button>

        <button
          onClick={handleDownloadTicket}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 px-4 py-2 text-xs font-bold uppercase text-white shadow-lg shadow-red-950/80 transition hover:brightness-110 active:scale-95 hover-zoom"
        >
          <Download className="h-4 w-4" /> Download Ticket PNG
        </button>
      </div>

      {/* Ticket Pass Card */}
      <div 
        ref={ticketRef} 
        className="relative overflow-hidden rounded-3xl border-2 border-red-600/60 bg-gradient-to-b from-[#130b24] via-[#0c0818] to-[#080511] shadow-[0_0_40px_rgba(230,32,53,0.3)] p-6 sm:p-8 animate-zoomin"
      >
        {/* Ticket Header Graphic */}
        <div className="relative mb-6 rounded-2xl overflow-hidden border border-red-500/40 bg-gradient-to-r from-red-900/80 via-black to-orange-950/80 p-5 shadow-inner">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold tracking-[0.2em] text-red-400 uppercase">ANIME CLUB OFFICIAL E-TICKET</span>
              <h2 className="font-display text-xl font-black text-white sm:text-2xl mt-0.5">
                DEMON SLAYER <span className="text-orange-400">INFINITY CASTLE</span>
              </h2>
            </div>
            <div className="h-12 w-12 rounded-full border border-red-500/60 bg-red-950/60 flex items-center justify-center animate-zoomin">
              <Flame className="h-6 w-6 text-orange-400" />
            </div>
          </div>
        </div>

        {/* Ticket Status Bar */}
        <div className="mb-6 flex items-center justify-between border-b border-red-950/80 pb-4">
          <div>
            <span className="block text-[10px] font-bold text-gray-500 uppercase">TICKET BOOKING ID</span>
            <span className="font-mono text-lg font-extrabold text-orange-400 tracking-wider">{booking.bookingId}</span>
          </div>

          {booking.checkedIn ? (
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/50 bg-emerald-950/60 px-3.5 py-1 text-xs font-bold text-emerald-400 animate-popup">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> CHECKED IN
            </div>
          ) : isConfirmed ? (
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/50 bg-emerald-950/40 px-3.5 py-1 text-xs font-bold text-emerald-400 animate-popup">
              <CheckCircle2 className="h-4 w-4" /> CONFIRMED
            </div>
          ) : isPending ? (
            <div className="flex items-center gap-1.5 rounded-full border border-amber-500/50 bg-amber-950/50 px-3.5 py-1 text-xs font-bold text-amber-400 animate-pulse">
              <Clock3 className="h-4 w-4" /> VERIFICATION PENDING
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-full border border-red-500/50 bg-red-950/50 px-3.5 py-1 text-xs font-bold text-red-400 animate-popup">
              <AlertOctagon className="h-4 w-4" /> REJECTED
            </div>
          )}
        </div>

        {/* Notice Banner if Pending or Rejected */}
        {isPending && (
          <div className="mb-5 rounded-xl border border-amber-500/40 bg-amber-950/30 p-3 text-xs text-amber-200">
            <p className="font-semibold text-amber-300">⏳ Payment Verification in Progress</p>
            <p className="mt-0.5 text-[11px] text-amber-200/80">
              Your 12-digit UTR (<strong className="font-mono">{booking.utrNumber}</strong>) has been submitted. Organisers are verifying this payment against bank records. Once approved, your entry QR code will unlock.
            </p>
          </div>
        )}

        {isRejected && (
          <div className="mb-5 rounded-xl border border-red-500/50 bg-red-950/40 p-3 text-xs text-red-200">
            <p className="font-semibold text-red-300">❌ Payment Reference Rejected</p>
            <p className="mt-0.5 text-[11px] text-red-200/80">
              The submitted UTR number could not be verified on the club bank account statement. Please contact the club organisers.
            </p>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase">ATTENDEE NAME</span>
            <p className="font-bold text-white text-sm">{booking.user.name}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase">REGISTERED EMAIL</span>
            <p className="font-mono text-emerald-300 text-xs truncate">{booking.user.email}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase">SEAT NUMBERS</span>
            <p className="font-extrabold text-orange-400 text-base">{seatCodes}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase">TOTAL PAID</span>
            <p className="font-extrabold text-white text-base">₹{booking.totalAmount}</p>
          </div>
        </div>

        {/* Event Schedule Info */}
        <div className="mt-6 rounded-xl border border-red-900/40 bg-black/50 p-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="hover-zoom">
            <Calendar className="mx-auto h-4 w-4 text-red-500 mb-1" />
            <span className="text-[10px] text-gray-400 block">Date</span>
            <strong className="text-white">{EVENT_DETAILS.shortDate}</strong>
          </div>
          <div className="hover-zoom">
            <Clock className="mx-auto h-4 w-4 text-orange-400 mb-1" />
            <span className="text-[10px] text-gray-400 block">Time</span>
            <strong className="text-white">1:20 PM IST</strong>
          </div>
          <div className="hover-zoom">
            <MapPin className="mx-auto h-4 w-4 text-purple-400 mb-1" />
            <span className="text-[10px] text-gray-400 block">Venue Hall</span>
            <strong className="text-white">{booking.auditorium || 'AB02 — Audi 1'}</strong>
          </div>
        </div>

        {/* QR Code Section for Door Gate Check-in */}
        <div className="mt-6 pt-6 border-t-2 border-dashed border-red-900/60 flex flex-col items-center justify-center text-center">
          
          <div className="relative">
            <div className={`rounded-2xl border-2 p-3 shadow-xl ${isConfirmed ? 'border-emerald-500/60 bg-white' : 'border-amber-500/60 bg-gray-900 opacity-40 blur-xs'}`}>
              <QRCodeSVG 
                value={JSON.stringify({
                  bookingId: booking.bookingId,
                  email: booking.user.email,
                  seats: seatCodes,
                  utr: booking.utrNumber
                })} 
                size={135} 
              />
            </div>

            {!isConfirmed && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-amber-400 bg-black/70 rounded-2xl p-2">
                <Lock className="h-8 w-8 mb-1 animate-bounce" />
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">QR LOCKED</span>
                <span className="text-[9px] text-gray-300">Pending UTR Approval</span>
              </div>
            )}
          </div>

          <p className="mt-3 text-[11px] font-bold text-gray-300">
            {isConfirmed ? "FLASH THIS QR CODE AT AUDITORIUM DOOR ENTRY" : "ENTRY QR CODE WILL ACTIVATE ONCE VERIFIED"}
          </p>
          <p className="text-[10px] text-gray-500 font-mono">UTR Ref: {booking.utrNumber}</p>
        </div>

      </div>

    </div>
  );
}

