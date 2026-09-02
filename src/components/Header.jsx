import React, { useState } from 'react';
import { Shield, Ticket, UserCheck, Flame, Menu, X, Sparkles, LogOut, Users } from 'lucide-react';

export default function Header({ 
  verifiedUser, 
  onOpenVerify, 
  onOpenMyTickets, 
  onOpenAdmin, 
  onOpenParticipants,
  registeredCount = 0,
  onLogout 
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-red-950/60 bg-[#0a0814]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-red-600 to-orange-500 opacity-60 blur transition group-hover:opacity-100 animate-pulse"></div>
            <img 
              src="/logo.png" 
              alt="Anime Club Emblem" 
              className="relative h-11 w-11 rounded-full object-cover border border-red-500/50 shadow-lg shadow-red-950/50"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=100&auto=format&fit=crop&q=80";
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold tracking-widest text-red-500 uppercase">ANIME CLUB PRESENTATION</span>
              <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
            </div>
            <h1 className="font-display text-lg font-black tracking-tight text-white sm:text-xl flex items-center gap-1">
              DEMON SLAYER <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-amber-300">INFINITY CASTLE</span>
            </h1>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-3 md:flex">
          {verifiedUser && (
            <div className="flex items-center gap-3 rounded-full border border-red-500/30 bg-red-950/20 px-3 py-1.5 text-xs text-red-200">
              <UserCheck className="h-4 w-4 text-emerald-400" />
              <span>Viewer: <strong className="text-white">{verifiedUser.name}</strong></span>
              <button 
                onClick={onLogout}
                className="ml-1 text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-900/40"
                title="Switch Viewer Account"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={onOpenMyTickets}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-600 to-red-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-red-950/60 transition hover:brightness-110 active:scale-95"
          >
            <Ticket className="h-4 w-4 text-white" />
            My Tickets
          </button>

          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-950/20 px-3 py-2 text-xs font-semibold text-amber-300 transition hover:bg-amber-900/40"
          >
            <Shield className="h-4 w-4 text-amber-400" />
            Organisers
          </button>
        </nav>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 md:hidden">
          {verifiedUser && (
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2 py-1 rounded">
              {verifiedUser.name.split(' ')[0]}
            </span>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg border border-red-900/60 p-2 text-gray-300 hover:bg-red-950/40"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-red-900/50 bg-[#0a0814] px-4 py-4 md:hidden space-y-3">
          {verifiedUser && (
            <div className="flex items-center justify-between rounded-lg bg-red-950/30 border border-red-900/50 p-3">
              <div>
                <p className="text-xs text-gray-400">Logged-in Viewer</p>
                <p className="text-sm font-bold text-white">{verifiedUser.name}</p>
                <p className="text-xs text-red-300 font-mono">{verifiedUser.email}</p>
              </div>
              <button 
                onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                className="flex items-center gap-1 text-xs text-red-400 border border-red-500/40 px-2.5 py-1.5 rounded"
              >
                <LogOut className="h-3.5 w-3.5" /> Logout
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => { onOpenMyTickets(); setMobileMenuOpen(false); }}
              className="flex items-center justify-center gap-2 rounded-lg bg-orange-600/30 border border-orange-500/50 py-2.5 text-xs font-bold text-orange-200"
            >
              <Ticket className="h-4 w-4 text-orange-400" /> My Tickets
            </button>
            <button
              onClick={() => { onOpenAdmin(); setMobileMenuOpen(false); }}
              className="flex items-center justify-center gap-2 rounded-lg border border-amber-500/40 bg-amber-950/20 py-2.5 text-xs font-semibold text-amber-300"
            >
              <Shield className="h-4 w-4 text-amber-400" /> Organisers
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
