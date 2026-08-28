import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Sparkles, Flame, CheckCircle, ChevronDown, Tag } from 'lucide-react';
import { SEAT_TIERS, EVENT_DETAILS } from '../data/initialData';

export default function Hero({ verifiedUser, onStartBooking }) {
  const calculateTimeLeft = () => {
    const target = new Date(EVENT_DETAILS.targetIso).getTime();
    const now = new Date().getTime();
    const diff = target - now;
    if (diff <= 0) return { days: 0, hours: 0, mins: 0, secs: 0 };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      mins: Math.floor((diff / (1000 * 60)) % 60),
      secs: Math.floor((diff / 1000) % 60)
    };
  };

  // Countdown timer logic targeting 3rd Sept 2026
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

          {/* Event Quick Details Cards with Hover Zoom */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 max-w-2xl animate-popup">
            <div className="rounded-xl border border-red-900/50 bg-black/60 p-3 backdrop-blur-sm hover-zoom">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                <Calendar className="h-3.5 w-3.5 text-red-500" /> Screening Date
              </div>
              <p className="mt-1 text-sm font-bold text-white">{EVENT_DETAILS.heroDate}</p>
            </div>

            <div className="rounded-xl border border-red-900/50 bg-black/60 p-3 backdrop-blur-sm hover-zoom">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                <Clock className="h-3.5 w-3.5 text-orange-400" /> Lights Out
              </div>
              <p className="mt-1 text-sm font-bold text-white">{EVENT_DETAILS.time}</p>
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
              <p className="mt-1 text-sm font-bold text-emerald-400">₹59 onwards</p>
            </div>
          </div>

          {/* Primary Call to Action Button */}
          <div className="mt-8 flex flex-wrap items-center gap-4 animate-zoomin">
            <button
              onClick={onStartBooking}
              className="group relative inline-flex items-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 px-8 py-4 text-sm font-black uppercase tracking-wider text-white shadow-xl shadow-red-950/80 transition-all hover:scale-110 active:scale-95 hover-zoom"
            >
              <span className="absolute inset-0 bg-white/20 opacity-0 transition group-hover:opacity-100"></span>
              <Flame className="h-5 w-5 text-amber-200" />
              {verifiedUser ? "SELECT YOUR SEAT NOW" : "REGISTER & BOOK SEATS NOW"}
            </button>

            {verifiedUser && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-950/30 px-4 py-3 text-xs font-semibold text-emerald-300 animate-popup">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                Registered as <span className="text-white font-bold">{verifiedUser.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Formation Countdown Timer Container with Pop Up Entrance */}
        <div className="mt-12 rounded-2xl border border-red-950/80 bg-black/70 p-6 backdrop-blur-md max-w-4xl shadow-2xl animate-popup">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-red-900/40 pb-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-red-500">INFINITY CASTLE OPENS IN</span>
              <h3 className="text-lg font-bold text-white">Live Event Countdown</h3>
            </div>
            <div className="flex gap-2 sm:gap-4">
              <div className="min-w-16 rounded-xl border border-red-900/60 bg-red-950/40 px-3 py-2 text-center hover-zoom">
                <span className="block text-2xl font-black text-white tabular-nums">{String(timeLeft.days).padStart(2, '0')}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">DAYS</span>
              </div>
              <div className="min-w-16 rounded-xl border border-red-900/60 bg-red-950/40 px-3 py-2 text-center hover-zoom">
                <span className="block text-2xl font-black text-white tabular-nums">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">HRS</span>
              </div>
              <div className="min-w-16 rounded-xl border border-red-900/60 bg-red-950/40 px-3 py-2 text-center hover-zoom">
                <span className="block text-2xl font-black text-white tabular-nums">{String(timeLeft.mins).padStart(2, '0')}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">MIN</span>
              </div>
              <div className="min-w-16 rounded-xl border border-red-900/60 bg-red-950/40 px-3 py-2 text-center hover-zoom">
                <span className="block text-2xl font-black text-orange-400 tabular-nums">{String(timeLeft.secs).padStart(2, '0')}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">SEC</span>
              </div>
            </div>
          </div>

          {/* Seat Tiers Overview Cards with Zoom-In Hover */}
          <div className="mt-6">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Hall Seat Tier Pricing</h4>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
              {Object.entries(SEAT_TIERS).map(([key, tier]) => (
                <div
                  key={key}
                  className="rounded-xl border p-3.5 hover-zoom cursor-pointer"
                  style={{
                    borderColor: tier.borderColor,
                    backgroundColor: tier.lightColor
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase" style={{ color: tier.color }}>{tier.name}</span>
                    <span className="text-base font-black text-white">₹{tier.price}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-300 line-clamp-2">{tier.description}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
