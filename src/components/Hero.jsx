import React from 'react';
import { MapPin, Flame, CheckCircle, Tag, AlertTriangle, LogIn } from 'lucide-react';
import { EVENT_DETAILS } from '../data/initialData';

export default function Hero({ verifiedUser, onStartBooking }) {
  return (
    <section className="relative overflow-hidden border-b border-red-900/60 bg-[#100a1c]">
      {/* Background Graphic Poster focused on Middle Part (Balanced Goldilocks Visibility) */}
      <div className="absolute inset-0 z-0 opacity-65 overflow-hidden">
        <img
          src="/hero_bg.jpg"
          alt="Demon Slayer Infinity Castle Official Poster"
          className="h-full w-full object-cover object-[center_50%] animate-zoom-breathing brightness-100"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/hero_bg.png";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0918] via-[#0d0918]/35 to-black/40"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0918]/60 via-transparent to-[#0d0918]/60"></div>
      </div>

      {/* Floating Ember Particles Effect */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/5 h-2 w-2 rounded-full bg-orange-500 blur-xs animate-ping"></div>
        <div className="absolute top-1/3 right-1/4 h-3 w-3 rounded-full bg-red-600 blur-xs animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/3 h-1.5 w-1.5 rounded-full bg-amber-400 blur-2xs animate-bounce"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20 lg:py-24">
        <div className="max-w-3xl">

          {/* Top Badge with Zoom-In entrance */}
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-950/40 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-red-400 shadow-inner backdrop-blur-md animate-zoomin">
            <Flame className="h-4 w-4 text-orange-400" />
            <span>ANIME CLUB EXCLUSIVE MOVIE SCREENING</span>
          </div>

          {/* Main Title with Pop Up animation */}
          <h1 className="font-display mt-4 text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl leading-tight animate-popup">
            DEMON SLAYER <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-amber-300 drop-shadow-[0_5px_15px_rgba(230,32,53,0.4)]">
              INFINITY CASTLE
            </span>
          </h1>

          <p className="mt-4 text-base text-gray-300 sm:text-lg max-w-2xl leading-relaxed animate-fadeIn">
            Step into Muzan Kibutsuji's dimensional fortress. Join fellow anime enthusiasts for the ultimate cinematic experience on the massive auditorium screen with spatial surround sound.
          </p>

          {/* Event Quick Details & Postponed Status Banner */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4 max-w-2xl animate-popup">
            {/* Prominent Postponement Card in place of Screening Date & Lights Out */}
            <div className="sm:col-span-2 rounded-xl border border-amber-500/60 bg-gradient-to-r from-amber-950/70 via-red-950/60 to-black/80 p-3.5 backdrop-blur-md shadow-lg shadow-amber-950/40 hover-zoom">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-400">
                <AlertTriangle className="h-4 w-4 text-amber-400 animate-pulse" /> Event Status
              </div>
              <p className="mt-1 text-base font-black text-white">Event Postponed For Now</p>
              <p className="mt-0.5 text-xs text-amber-200/90 font-medium">Please wait for further instructions & announcements.</p>
            </div>

            <div className="rounded-xl border border-red-900/50 bg-black/60 p-3 backdrop-blur-sm hover-zoom">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                <MapPin className="h-3.5 w-3.5 text-purple-400" /> Venue
              </div>
              <p className="mt-1 text-sm font-bold text-white">{EVENT_DETAILS.venue}</p>
            </div>

            <div className="rounded-xl border border-red-900/50 bg-black/60 p-3 backdrop-blur-sm hover-zoom">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                <Tag className="h-3.5 w-3.5 text-emerald-400" /> Tickets From
              </div>
              <p className="mt-1 text-sm font-bold text-emerald-400">₹67</p>
            </div>
          </div>

          {/* Primary Call to Action Button */}
          <div className="mt-8 flex flex-wrap items-center gap-4 animate-zoomin">
            {verifiedUser ? (
              <button
                onClick={onStartBooking}
                className="group relative inline-flex items-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 px-8 py-4 text-sm font-black uppercase tracking-wider text-white shadow-xl shadow-red-950/80 transition-all hover:scale-105 active:scale-95 hover-zoom"
              >
                <span className="absolute inset-0 bg-white/20 opacity-0 transition group-hover:opacity-100"></span>
                <Flame className="h-5 w-5 text-amber-200" />
                VIEW SEAT MAP & PASS
              </button>
            ) : (
              <button
                onClick={onStartBooking}
                className="group relative inline-flex items-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-amber-600 via-red-600 to-orange-600 px-7 py-4 text-xs sm:text-sm font-black uppercase tracking-wider text-white shadow-xl shadow-red-950/80 transition-all hover:scale-105 active:scale-95 hover-zoom"
              >
                <AlertTriangle className="h-4 w-4 text-amber-200 animate-pulse" />
                <span>Registrations Paused • Log In</span>
              </button>
            )}

            {verifiedUser && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-950/30 px-4 py-3 text-xs font-semibold text-emerald-300 animate-popup">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                Registered as <span className="text-white font-bold">{verifiedUser.name}</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
