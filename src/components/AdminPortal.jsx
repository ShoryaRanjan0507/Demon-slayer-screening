import React, { useState, useEffect, useRef } from 'react';
import { X, Shield, Plus, CheckCircle2, Download, RefreshCw, Key, QrCode, Check, XCircle, Clock3, Image as ImageIcon, Camera, CameraOff } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { addRegisteredViewer, updateBookingStatus, markTicketCheckedIn } from '../utils/storage';

export default function AdminPortal({ 
  isOpen, 
  onClose, 
  registeredViewers, 
  onUpdateViewers, 
  seatMap, 
  userBookings, 
  onUpdateBookings,
  onResetData,
  isOrganiserAuthenticated = false,
  onAuthenticateOrganiser
}) {
  const [pinInput, setPinInput] = useState('');
  const [isLocalAuth, setIsLocalAuth] = useState(false);
  const [pinError, setPinError] = useState(false);

  const isAuthenticated = isOrganiserAuthenticated || isLocalAuth;
  
  const [activeTab, setActiveTab] = useState('approvals'); // 'approvals', 'viewers', 'bookings', 'scanner'

  // Screenshot preview modal state
  const [previewScreenshot, setPreviewScreenshot] = useState(null);

  // New viewer form
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRollNo, setNewRollNo] = useState('');

  // Gate Scanner state & Camera
  const [scanInput, setScanInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isSyncingDB, setIsSyncingDB] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState('');
  const qrScannerRef = useRef(null);

  const handleManualSync = async () => {
    setIsSyncingDB(true);
    setSyncSuccessMsg('');
    try {
      if (onUpdateViewers) await onUpdateViewers();
      setSyncSuccessMsg('Synced!');
    } catch (e) {
      console.error("Manual Sync Error:", e);
      setSyncSuccessMsg('Sync Error');
    } finally {
      setIsSyncingDB(false);
      setTimeout(() => setSyncSuccessMsg(''), 4000);
    }
  };

  useEffect(() => {
    // Cleanup camera when switching tabs or closing modal
    return () => {
      if (qrScannerRef.current) {
        try {
          qrScannerRef.current.stop().catch(() => {});
          qrScannerRef.current.clear();
        } catch (e) {
          // cleanup fallback
        }
        qrScannerRef.current = null;
      }
    };
  useEffect(() => {
    if (isOpen && onUpdateViewers) {
      onUpdateViewers();
    }
  }, [isOpen, onUpdateViewers]);

  if (!isOpen) return null;

  const handleLogin = (e) => {
    e.preventDefault();
    if (pinInput.trim() === 'anime2026' || pinInput.trim() === 'admin') {
      setIsLocalAuth(true);
      setPinError(false);
      if (onAuthenticateOrganiser) onAuthenticateOrganiser();
    } else {
      setPinError(true);
    }
  };

  const handleAddSingleViewer = async (e) => {
    e.preventDefault();
    if (!newEmail) return;
    await addRegisteredViewer({
      email: newEmail,
      name: newName || newEmail.split('@')[0],
      rollNo: newRollNo || 'N/A'
    });
    if (onUpdateViewers) await onUpdateViewers();
    setNewEmail('');
    setNewName('');
    setNewRollNo('');
  };

  const handleBatchImportCsv = () => {
    if (!csvText.trim()) return;
    const lines = csvText.split('\n');
    let count = 0;
    lines.forEach(line => {
      const parts = line.split(',').map(p => p.trim());
      if (parts[0] && parts[0].includes('@')) {
        addRegisteredViewer({
          email: parts[0],
          name: parts[1] || parts[0].split('@')[0],
          rollNo: parts[2] || 'N/A'
        });
        count++;
      }
    });
    onUpdateViewers();
    setImportSuccess(`Successfully imported ${count} registered viewers!`);
    setCsvText('');
    setTimeout(() => setImportSuccess(''), 4000);
  };

  const handleExportBookingsCsv = () => {
    let csvContent = "data:text/csv;charset=utf-8,BookingID,ViewerName,Email,RollNo,Seats,TotalAmount,UTR_Number,Status,CheckedIn\n";
    userBookings.forEach(b => {
      const seatCodes = b.seats ? b.seats.map(s => s.id).join(' ') : '';
      csvContent += `"${b.bookingId}","${b.user?.name || ''}","${b.user?.email || ''}","${b.user?.rollNo || ''}","${seatCodes}",${b.totalAmount},"${b.utrNumber}","${b.status}","${b.checkedIn ? 'YES' : 'NO'}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `demon_slayer_bookings_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle UTR Approval / Rejection by Organiser
  const handleSetBookingStatus = (bookingId, newStatus) => {
    const res = updateBookingStatus(bookingId, newStatus);
    if (onUpdateBookings) onUpdateBookings(res.bookings, res.seatMap);
  };

  // Process scanned code string
  const processScannedCode = (rawCode) => {
    if (!rawCode) return;
    setScanResult(null);

    let bookingIdQuery = rawCode.trim();
    try {
      if (bookingIdQuery.startsWith('{')) {
        const parsed = JSON.parse(bookingIdQuery);
        if (parsed.bookingId) bookingIdQuery = parsed.bookingId;
      }
    } catch (err) {
      bookingIdQuery = rawCode;
    }

    bookingIdQuery = bookingIdQuery.toUpperCase();

    // Find booking
    const foundBooking = userBookings.find(b => 
      b.bookingId.toUpperCase() === bookingIdQuery || 
      (b.user && b.user.email && b.user.email.toUpperCase() === bookingIdQuery) ||
      (b.utrNumber && b.utrNumber.toUpperCase() === bookingIdQuery)
    );

    if (!foundBooking) {
      setScanResult({
        status: 'DENIED',
        title: '❌ TICKET NOT FOUND',
        msg: `No booking record found for "${rawCode}".`
      });
      return;
    }

    const checkInRes = markTicketCheckedIn(foundBooking.bookingId);
    if (onUpdateBookings) {
      onUpdateBookings(userBookings, seatMap);
    }

    if (checkInRes.success) {
      setScanResult({
        status: 'ALLOWED',
        title: '🟢 ACCESS GRANTED — ENTRY ALLOWED',
        booking: checkInRes.booking,
        msg: checkInRes.msg
      });
    } else if (checkInRes.alreadyCheckedIn) {
      setScanResult({
        status: 'ALREADY_CHECKED_IN',
        title: '🔴 TICKET ALREADY USED!',
        booking: checkInRes.booking,
        msg: checkInRes.msg
      });
    } else {
      setScanResult({
        status: 'DENIED',
        title: '🔴 ENTRY DENIED!',
        booking: checkInRes.booking,
        msg: checkInRes.msg || 'ACCESS DENIED: Payment UTR not approved!'
      });
    }
  };

  // Handle Door Entry Scanner Check-in
  const handleScanTicket = (e) => {
    e.preventDefault();
    processScannedCode(scanInput);
  };

  // Start live camera scanner
  const startCameraScanner = () => {
    setCameraError(null);
    setIsCameraActive(true);

    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("reader");
        qrScannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText) => {
            setScanInput(decodedText);
            processScannedCode(decodedText);
          },
          () => {}
        );
      } catch (err) {
        console.error("Camera access error:", err);
        setCameraError(err?.message || "Unable to access device camera. Check permissions.");
        setIsCameraActive(false);
      }
    }, 300);
  };

  // Stop live camera scanner
  const stopCameraScanner = async () => {
    if (qrScannerRef.current) {
      try {
        await qrScannerRef.current.stop();
        qrScannerRef.current.clear();
      } catch (e) {
        // cleanup fallback
      }
      qrScannerRef.current = null;
    }
    setIsCameraActive(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
        <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-amber-500/40 bg-[#0e0a1a] p-6 shadow-2xl animate-popup">
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 hover:bg-amber-950/50 hover:text-white hover-zoom"
          >
            <X className="h-5 w-5" />
          </button>

          {/* PIN Authentication Step */}
          {!isAuthenticated ? (
            <div className="py-8 text-center max-w-sm mx-auto animate-zoomin">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-950 border border-amber-500/50 text-amber-400 mb-4 animate-zoomin">
                <Shield className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-black text-white">Organiser Admin Access</h2>
              <p className="text-xs text-gray-400 mt-1">Enter your Anime Club Organiser PIN</p>

              <form onSubmit={handleLogin} className="mt-6 space-y-3">
                <div className="relative">
                  <Key className="absolute left-3.5 top-3 h-4 w-4 text-amber-400" />
                  <input
                    type="password"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Enter PIN (Default: anime2026)"
                    className="w-full rounded-xl border border-amber-900/60 bg-black/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {pinError && <p className="text-xs text-red-400 font-semibold animate-popup">Incorrect PIN. Try: anime2026</p>}

                <button
                  type="submit"
                  className="w-full rounded-xl bg-amber-600 py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-amber-500 shadow-lg hover-zoom"
                >
                  Access Organiser Portal
                </button>
              </form>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-950/80 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">ORGANISER CONTROL PANEL</span>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Shield className="h-5 w-5 text-amber-400" /> Demon Slayer Movie Screening Management
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleManualSync}
                    disabled={isSyncingDB}
                    className="flex items-center gap-1.5 rounded-lg border border-amber-500/50 bg-amber-950/40 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-900/80 hover-zoom transition disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isSyncingDB ? 'animate-spin text-amber-400' : ''}`} />
                    {isSyncingDB ? 'Syncing...' : (syncSuccessMsg || 'Sync DB')}
                  </button>

                  <button
                    onClick={onResetData}
                    className="flex items-center gap-1.5 rounded-lg border border-red-500/50 bg-red-950/40 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-900/80 hover-zoom"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Reset Site Data
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="mt-4 flex flex-wrap gap-2 border-b border-amber-950/60 pb-3">
                <button
                  onClick={() => setActiveTab('approvals')}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition hover-zoom flex items-center gap-1.5 ${
                    activeTab === 'approvals' ? 'bg-amber-500 text-black shadow-md' : 'bg-black/40 text-gray-400 hover:text-white'
                  }`}
                >
                  <Clock3 className="h-3.5 w-3.5" />
                  Pending Approvals
                  <span className="ml-1 rounded-full bg-red-950 px-2 py-0.5 text-[10px] font-mono font-black text-red-400 border border-red-500/40">
                    {userBookings.filter(b => b.status === 'PENDING_VERIFICATION').length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('scanner')}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition hover-zoom flex items-center gap-1.5 ${
                    activeTab === 'scanner' ? 'bg-amber-500 text-black shadow-md' : 'bg-black/40 text-gray-400 hover:text-white'
                  }`}
                >
                  <QrCode className="h-3.5 w-3.5" />
                  Gate Entry QR Scanner
                </button>

                <button
                  onClick={() => setActiveTab('viewers')}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition hover-zoom ${
                    activeTab === 'viewers' ? 'bg-amber-500 text-black shadow-md' : 'bg-black/40 text-gray-400 hover:text-white'
                  }`}
                >
                  Registered Viewers ({registeredViewers.length})
                </button>

                <button
                  onClick={() => setActiveTab('bookings')}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition hover-zoom ${
                    activeTab === 'bookings' ? 'bg-amber-500 text-black shadow-md' : 'bg-black/40 text-gray-400 hover:text-white'
                  }`}
                >
                  All Bookings ({userBookings.length})
                </button>
              </div>

              {/* Tab Contents */}
              <div className="mt-4">
                {/* TAB 1: PENDING UTR APPROVALS */}
                {activeTab === 'approvals' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Clock3 className="h-4 w-4 text-amber-400" /> Pending UTR Payment Verification List
                      </h3>
                      <span className="text-xs text-amber-400 font-mono">
                        Cross-check 12-digit UTR & payment screenshot proof
                      </span>
                    </div>

                    {userBookings.filter(b => b.status === 'PENDING_VERIFICATION').length === 0 ? (
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-8 text-center text-xs text-emerald-300">
                        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400 mb-2" />
                        All payment submissions are verified! No pending UTR approvals.
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                        {userBookings.filter(b => b.status === 'PENDING_VERIFICATION').map(b => (
                          <div key={b.bookingId} className="p-3.5 rounded-xl border border-amber-900/60 bg-black/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover-zoom">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <strong className="text-amber-400 font-mono text-sm">{b.bookingId}</strong>
                                <span className="text-xs font-mono font-bold text-white bg-red-950 px-2 py-0.5 rounded border border-red-500/40">
                                  UTR: {b.utrNumber}
                                </span>
                                <span className="text-xs font-bold text-emerald-400">₹{b.totalAmount}</span>
                                <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
                                  {b.auditorium || 'AB02 — Audi 1'}
                                </span>
                              </div>
                              <p className="text-xs text-white mt-1">
                                Viewer: <strong>{b.user.name}</strong> ({b.user.email}) | Reg No: {b.user.rollNo}
                              </p>
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                Seats: <strong className="text-orange-400">{b.seats.map(s => s.id).join(', ')}</strong> | Submitted: {b.timestamp}
                              </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              {b.paymentScreenshot && (
                                <button
                                  onClick={() => setPreviewScreenshot(b.paymentScreenshot)}
                                  className="rounded-lg bg-indigo-950 border border-indigo-500/50 px-3 py-1.5 text-xs font-bold text-indigo-300 hover:bg-indigo-900/80 flex items-center gap-1 hover-zoom shadow"
                                >
                                  <ImageIcon className="h-3.5 w-3.5 text-indigo-400" /> View Receipt
                                </button>
                              )}

                              <button
                                onClick={() => handleSetBookingStatus(b.bookingId, 'CONFIRMED')}
                                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 flex items-center gap-1 hover-zoom shadow"
                              >
                                <Check className="h-3.5 w-3.5" /> Approve Payment
                              </button>

                              <button
                                onClick={() => handleSetBookingStatus(b.bookingId, 'REJECTED')}
                                className="rounded-lg bg-red-950 border border-red-500/50 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-900/60 flex items-center gap-1 hover-zoom"
                              >
                                <XCircle className="h-3.5 w-3.5" /> Reject UTR
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: DOOR QR SCANNER & LIVE SIGNALS */}
                {activeTab === 'scanner' && (
                  <div className="space-y-5 animate-fadeIn">
                    <div className="rounded-2xl border border-amber-500/40 bg-black/60 p-5 shadow-lg space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-950/80 pb-3">
                        <div>
                          <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                            <QrCode className="h-5 w-5 text-amber-400" /> Door Entry Gate Scanner Signal
                          </h3>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Scan viewer's ticket QR code using live camera or paste Booking ID below.
                          </p>
                        </div>

                        {/* Camera Toggle Button */}
                        {!isCameraActive ? (
                          <button
                            type="button"
                            onClick={startCameraScanner}
                            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 text-xs font-extrabold text-black uppercase hover:brightness-110 shadow-lg hover-zoom"
                          >
                            <Camera className="h-4 w-4" /> Start Camera Scanner
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={stopCameraScanner}
                            className="flex items-center gap-2 rounded-xl bg-red-950 border border-red-500/50 px-4 py-2 text-xs font-extrabold text-red-300 uppercase hover:bg-red-900/80 hover-zoom"
                          >
                            <CameraOff className="h-4 w-4" /> Stop Camera
                          </button>
                        )}
                      </div>

                      {/* Live Camera Viewfinder Element */}
                      {isCameraActive && (
                        <div className="space-y-2 animate-popup">
                          <div className="relative mx-auto max-w-sm overflow-hidden rounded-2xl border-2 border-amber-500 bg-black p-2 shadow-2xl">
                            <div id="reader" className="w-full rounded-xl overflow-hidden min-h-[250px]"></div>
                          </div>
                          <p className="text-center text-[11px] text-amber-400 font-mono animate-pulse">
                            📷 Camera Active — Align ticket QR code within viewfinder frame
                          </p>
                        </div>
                      )}

                      {cameraError && (
                        <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-3 text-xs text-red-300">
                          ⚠️ {cameraError}
                        </div>
                      )}

                      {/* Manual Input Backup Form */}
                      <form onSubmit={handleScanTicket} className="flex gap-2 pt-1">
                        <input
                          type="text"
                          value={scanInput}
                          onChange={(e) => setScanInput(e.target.value)}
                          placeholder="Or manually type Booking ID (e.g. DS-892143) / UTR"
                          className="flex-1 rounded-xl border border-amber-900/60 bg-black py-2.5 px-4 text-xs font-mono text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-extrabold text-black uppercase hover:bg-amber-500 shadow-lg hover-zoom"
                        >
                          Verify Signal
                        </button>
                      </form>
                    </div>

                    {/* Scanner Signal Result Output Screen */}
                    {scanResult && (
                      <div className={`rounded-2xl border-2 p-6 shadow-2xl animate-popup text-center ${
                        scanResult.status === 'ALLOWED' 
                          ? 'border-emerald-500 bg-emerald-950/80 text-emerald-200' 
                          : scanResult.status === 'ALREADY_CHECKED_IN'
                          ? 'border-amber-500 bg-amber-950/80 text-amber-200'
                          : 'border-red-500 bg-red-950/80 text-red-200'
                      }`}>
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-black/60 mb-3 animate-zoomin">
                          {scanResult.status === 'ALLOWED' ? (
                            <Check className="h-10 w-10 text-emerald-400" />
                          ) : scanResult.status === 'ALREADY_CHECKED_IN' ? (
                            <Clock3 className="h-10 w-10 text-amber-400" />
                          ) : (
                            <XCircle className="h-10 w-10 text-red-400" />
                          )}
                        </div>

                        <h3 className="font-display text-xl font-black uppercase tracking-wider">
                          {scanResult.msg}
                        </h3>

                        {scanResult.booking && (
                          <div className="mt-4 rounded-xl bg-black/70 p-4 text-left max-w-md mx-auto space-y-1.5 text-xs font-mono">
                            <p><span className="text-gray-400">Booking ID:</span> <strong className="text-amber-300">{scanResult.booking.bookingId}</strong></p>
                            <p><span className="text-gray-400">Name:</span> <strong className="text-white">{scanResult.booking.user.name}</strong></p>
                            <p><span className="text-gray-400">Email:</span> <strong className="text-emerald-300">{scanResult.booking.user.email}</strong></p>
                            <p><span className="text-gray-400">Seats:</span> <strong className="text-orange-400">{scanResult.booking.seats.map(s => s.id).join(', ')}</strong></p>
                            <p><span className="text-gray-400">Venue:</span> <strong className="text-purple-300">{scanResult.booking.auditorium || 'AB02 — Audi 1'}</strong></p>
                            <p><span className="text-gray-400">Payment UTR:</span> <strong className="text-gray-200">{scanResult.booking.utrNumber}</strong></p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: REGISTERED VIEWERS */}
                {activeTab === 'viewers' && (
                  <div className="space-y-4 animate-fadeIn">
                    <form onSubmit={handleAddSingleViewer} className="rounded-xl border border-amber-950/80 bg-black/40 p-4 grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <input
                        type="email"
                        required
                        placeholder="University Email Address"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="rounded-lg border border-amber-950 bg-black py-2 px-3 text-xs text-white placeholder-gray-500"
                      />
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="rounded-lg border border-amber-950 bg-black py-2 px-3 text-xs text-white placeholder-gray-500"
                      />
                      <input
                        type="text"
                        placeholder="Registration No"
                        value={newRollNo}
                        onChange={(e) => setNewRollNo(e.target.value)}
                        className="rounded-lg border border-amber-950 bg-black py-2 px-3 text-xs text-white placeholder-gray-500"
                      />
                      <button
                        type="submit"
                        className="rounded-lg bg-amber-600 text-black font-bold text-xs py-2 hover:bg-amber-500 hover-zoom"
                      >
                        + Add Viewer
                      </button>
                    </form>

                    <div className="max-h-64 overflow-y-auto rounded-xl border border-amber-950/60 bg-black/40 p-2 space-y-1">
                      {registeredViewers.map(v => (
                        <div key={v.email} className="p-2.5 rounded bg-black/60 border border-amber-950/40 text-xs flex items-center justify-between hover-zoom">
                          <div>
                            <strong className="text-white">{v.name}</strong> <span className="font-mono text-emerald-400">({v.email})</span>
                          </div>
                          <span className="font-mono text-gray-400">Reg No: {v.rollNo || 'N/A'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: ALL BOOKINGS */}
                {activeTab === 'bookings' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Total Bookings: {userBookings.length}</span>
                      <button
                        onClick={handleExportBookingsCsv}
                        className="flex items-center gap-1 rounded bg-amber-600 px-3 py-1 text-xs font-bold text-black hover:bg-amber-500 hover-zoom"
                      >
                        <Download className="h-3.5 w-3.5" /> Export Bookings CSV
                      </button>
                    </div>

                    <div className="max-h-64 overflow-y-auto rounded-xl border border-amber-950/60 bg-black/40 p-2 space-y-1.5">
                      {userBookings.length === 0 ? (
                        <p className="text-xs text-gray-500 text-center py-6">No user bookings recorded on site yet.</p>
                      ) : (
                        userBookings.map(b => (
                          <div key={b.bookingId} className="p-2.5 rounded bg-black/60 border border-amber-950/40 text-xs flex items-center justify-between hover-zoom">
                            <div>
                              <strong className="text-amber-400">{b.bookingId}</strong> — {b.user.name} ({b.user.email})
                              <p className="text-[11px] text-gray-400">Seats: {b.seats.map(s => s.id).join(', ')} | Venue: {b.auditorium || 'AB02 — Audi 1'} | UTR: {b.utrNumber}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {b.paymentScreenshot && (
                                <button
                                  onClick={() => setPreviewScreenshot(b.paymentScreenshot)}
                                  className="rounded bg-indigo-950 px-2 py-1 text-[10px] font-bold text-indigo-300 border border-indigo-500/40"
                                >
                                  Receipt Proof
                                </button>
                              )}
                              <div className="text-right">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${b.status === 'CONFIRMED' ? 'bg-emerald-950 text-emerald-400' : b.status === 'PENDING_VERIFICATION' ? 'bg-amber-950 text-amber-300' : 'bg-red-950 text-red-300'}`}>
                                  {b.status}
                                </span>
                                <p className="text-xs font-bold text-emerald-400 mt-0.5">₹{b.totalAmount}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Payment Screenshot Preview Lightbox Modal */}
      {previewScreenshot && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-fadeIn">
          <div className="relative max-w-2xl w-full bg-[#0d0918] border border-indigo-500/50 rounded-2xl p-5 shadow-2xl space-y-4 animate-popup">
            <div className="flex items-center justify-between border-b border-indigo-950/80 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-indigo-400" /> Payment Receipt Screenshot Proof
              </h3>
              <button
                onClick={() => setPreviewScreenshot(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-red-950/50 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto flex items-center justify-center rounded-xl bg-black p-2 border border-gray-800">
              <img 
                src={previewScreenshot} 
                alt="Uploaded Payment Receipt Proof" 
                className="max-h-[65vh] w-auto object-contain rounded-lg shadow-lg" 
              />
            </div>

            <div className="text-right">
              <button
                onClick={() => setPreviewScreenshot(null)}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold uppercase text-white hover:bg-indigo-500 transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
