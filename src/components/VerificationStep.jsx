import React, { useState } from 'react';
import { ShieldCheck, User, Mail, AlertTriangle, CheckCircle2, ArrowRight, Phone, IdCard, UserPlus, LogIn } from 'lucide-react';
import { addRegisteredViewer } from '../utils/storage';

export default function VerificationStep({ onVerifySuccess, registeredViewers, onRegisterNewViewer }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'

  // Registration Form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRollNo, setRegRollNo] = useState('');
  const [regPhone, setRegPhone] = useState('');

  // Login Form state
  const [loginQuery, setLoginQuery] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successUser, setSuccessUser] = useState(null);

  // Handle New Viewer Registration
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('⚠️ Registrations are currently paused as the event has been postponed. Please wait for further instructions.');
  };

  // Handle Existing Viewer Login
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessUser(null);

    const query = loginQuery.trim().toLowerCase();
    if (!query) {
      setErrorMsg('Please enter your registered Email Address or Roll Number.');
      return;
    }

    const found = registeredViewers.find(v =>
      v.email.toLowerCase() === query ||
      (v.rollNo && v.rollNo.toLowerCase() === query) ||
      (v.phone && v.phone.replace(/\D/g, '') === query.replace(/\D/g, ''))
    );

    if (found) {
      setSuccessUser(found);
      setTimeout(() => {
        onVerifySuccess(found);
      }, 900);
    } else {
      setErrorMsg(`No registration record found for "${loginQuery}". New registrations are currently paused due to event postponement.`);
    }
  };



  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-red-900/60 bg-[#0d091a] p-6 shadow-2xl backdrop-blur-xl sm:p-8 animate-popup">

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-red-950/80 pb-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-orange-600 shadow-lg shadow-red-950/80 animate-zoomin">
          <ShieldCheck className="h-6 w-6 text-white" />
        </div>
        <div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest font-mono">EVENT POSTPONED • AUTHENTICATION</span>
          <h2 className="text-xl font-black text-white sm:text-2xl">Viewer Login & Credentials</h2>
        </div>
      </div>

      {/* Tabs Switcher */}
      {!successUser && (
        <div className="mt-5 flex rounded-xl border border-red-950/80 bg-black/50 p-1">
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setErrorMsg(''); }}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition ${activeTab === 'login' ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            <LogIn className="h-4 w-4" /> Log In Existing User
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setErrorMsg(''); }}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition ${activeTab === 'register' ? 'bg-gradient-to-r from-amber-600 to-red-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            <UserPlus className="h-4 w-4" /> Register (Paused)
          </button>
        </div>
      )}

      {/* Form Content */}
      {!successUser ? (
        activeTab === 'register' ? (
          /* TAB 1: REGISTRATION PAUSED NOTICE */
          <div className="mt-5 space-y-4 animate-fadeIn">
            <div className="rounded-xl border border-amber-500/50 bg-amber-950/30 p-6 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/40">
                <AlertTriangle className="h-6 w-6 text-amber-400 animate-pulse" />
              </div>
              <h3 className="text-base font-extrabold uppercase tracking-wide text-white">Registrations Temporarily Paused</h3>
              <p className="text-xs text-amber-200/90 leading-relaxed max-w-md mx-auto">
                The Demon Slayer Infinity Castle screening event is <strong>postponed for now</strong>. We have stopped taking new registrations until further notice.
              </p>
              <div className="rounded-lg bg-black/50 border border-amber-500/30 p-3 text-xs text-gray-300 max-w-sm mx-auto">
                <p className="font-semibold text-amber-300">📢 Please wait for further instructions & announcements.</p>
                <p className="text-[11px] text-gray-400 mt-1">Already registered? You can switch to Log In to view your pass or seat details.</p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-red-950/80 transition hover:brightness-110 active:scale-98 hover-zoom"
                >
                  <LogIn className="h-4 w-4" /> Switch to Existing User Log In
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* TAB 2: EXISTING USER LOGIN FORM */
          <form onSubmit={handleLoginSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                Registered University Email / Registration No / Phone
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-500" />
                <input
                  type="text"
                  value={loginQuery}
                  onChange={(e) => setLoginQuery(e.target.value)}
                  placeholder="e.g. name@vitbhopal.ac.in or 25BCE10001"
                  className="w-full rounded-xl border border-red-900/60 bg-black/60 py-3.5 pl-11 pr-4 text-sm text-white placeholder-gray-500 focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-red-500/50 bg-red-950/40 p-3.5 text-xs text-red-200 flex items-center gap-2 animate-popup">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-red-950/80 transition hover:brightness-110 active:scale-98 hover-zoom"
            >
              Log In & View Status <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )
      ) : (
        /* Success State View */
        <div className="mt-6 rounded-xl border border-emerald-500/50 bg-emerald-950/30 p-5 text-center space-y-3 animate-zoomin">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400 animate-bounce" />
          <h3 className="text-lg font-bold text-white">Viewer Registered Successfully!</h3>
          <div className="inline-block text-left rounded-lg bg-black/40 border border-emerald-900/50 p-3 text-xs text-emerald-200">
            <p><strong>Name:</strong> {successUser.name}</p>
            <p><strong>Email:</strong> {successUser.email}</p>
            <p><strong>Registration No:</strong> {successUser.rollNo}</p>
          </div>
          <p className="text-xs text-emerald-400 animate-pulse font-semibold">
            Unlocking Interactive Seat Map...
          </p>
        </div>
      )}



    </div>
  );
}

