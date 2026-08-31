import React, { useState } from 'react';
import { ShieldCheck, User, Mail, AlertTriangle, CheckCircle2, ArrowRight, Phone, IdCard, UserPlus, LogIn } from 'lucide-react';
import { addRegisteredViewer } from '../utils/storage';

export default function VerificationStep({ onVerifySuccess, registeredViewers, onRegisterNewViewer }) {
  const [activeTab, setActiveTab] = useState('register'); // 'register' or 'login'

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
    setErrorMsg('');

    const cleanName = regName.trim();
    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanRollNo = regRollNo.trim().toUpperCase();

    if (!cleanName || !cleanEmail) {
      setErrorMsg('Please fill in your Full Name and University Email.');
      return;
    }

    if (cleanName.length < 3) {
      setErrorMsg('Please enter your complete Full Name.');
      return;
    }

    if (!cleanEmail.endsWith('@vitbhopal.ac.in')) {
      setErrorMsg('Please enter your official VIT Bhopal student email (@vitbhopal.ac.in).');
      return;
    }

    if (!cleanRollNo || cleanRollNo.length < 5) {
      setErrorMsg('Please enter your valid college Registration / Roll Number (e.g., 25BCE10001).');
      return;
    }

    const newViewer = await addRegisteredViewer({
      name: cleanName,
      email: cleanEmail,
      rollNo: cleanRollNo,
      phone: regPhone.trim() || 'N/A'
    });

    if (onRegisterNewViewer) await onRegisterNewViewer();

    setSuccessUser(newViewer);
    setTimeout(() => {
      onVerifySuccess(newViewer);
    }, 900);
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
      setErrorMsg(`No registration found for "${loginQuery}". Please switch to the "Register New Viewer" tab to create your account.`);
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
          <span className="text-xs font-bold text-red-500 uppercase tracking-widest">STEP 1 OF 2</span>
          <h2 className="text-xl font-black text-white sm:text-2xl">Viewer Registration & Login</h2>
        </div>
      </div>

      {/* Tabs Switcher */}
      {!successUser && (
        <div className="mt-5 flex rounded-xl border border-red-950/80 bg-black/50 p-1">
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setErrorMsg(''); }}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition ${activeTab === 'register' ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            <UserPlus className="h-4 w-4" /> Register New Viewer
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setErrorMsg(''); }}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition ${activeTab === 'login' ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            <LogIn className="h-4 w-4" /> Log In Existing User
          </button>
        </div>
      )}

      {/* Form Content */}
      {!successUser ? (
        activeTab === 'register' ? (
          /* TAB 1: DIRECT REGISTRATION FORM */
          <form onSubmit={handleRegisterSubmit} className="mt-5 space-y-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full rounded-xl border border-red-900/60 bg-black/60 py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1 flex items-center justify-between">
                <span>Email Address <span className="text-red-500">*</span></span>
                <span className="text-[10px] font-semibold text-amber-400 font-mono">(Use University Email Only)</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="University Email Address (e.g. name@vitbhopal.ac.in)"
                  className="w-full rounded-xl border border-red-900/60 bg-black/60 py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:border-red-500 focus:outline-none"
                />
              </div>
              <p className="mt-1 text-[10px] text-amber-400/90 flex items-center gap-1 font-mono">
                ⚠️ Please register using your official University Email ID.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                  Registration No
                </label>
                <div className="relative">
                  <IdCard className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    value={regRollNo}
                    onChange={(e) => setRegRollNo(e.target.value)}
                    placeholder="Registration No"
                    className="w-full rounded-xl border border-red-900/60 bg-black/60 py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="Phone Number"
                    className="w-full rounded-xl border border-red-900/60 bg-black/60 py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-red-500/50 bg-red-950/40 p-3 text-xs text-red-200 flex items-center gap-2 animate-popup">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-red-950/80 transition hover:brightness-110 active:scale-98 hover-zoom mt-4"
            >
              Complete Registration & Select Seats <ArrowRight className="h-4 w-4" />
            </button>
          </form>
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
                  placeholder="Email / Registration No / Phone"
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
              Log In & Unlock Seat Map <ArrowRight className="h-4 w-4" />
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

