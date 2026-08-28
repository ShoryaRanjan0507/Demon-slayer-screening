import React, { useState } from 'react';
import { X, CreditCard, Copy, AlertCircle, Building2, CheckCircle2, ShieldAlert, Upload, Image as ImageIcon, Trash2, Eye } from 'lucide-react';
import { BANK_DETAILS } from '../data/initialData';

export default function CheckoutModal({ 
  isOpen, 
  onClose, 
  selectedSeats, 
  seatMap, 
  verifiedUser, 
  onConfirmBooking,
  selectedAudiKey = 'AUDI_1'
}) {
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshotData, setScreenshotData] = useState(null);
  const [screenshotFileName, setScreenshotFileName] = useState('');
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [copiedIfsc, setCopiedIfsc] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Safely get current active auditorium seat map dictionary
  const currentSeatMap = (seatMap && seatMap.AUDI_1) 
    ? (seatMap[selectedAudiKey] || seatMap.AUDI_1) 
    : (seatMap || {});

  // Calculate total price
  const totalPrice = selectedSeats.reduce((sum, seatId) => sum + (currentSeatMap[seatId]?.price || 69), 0);

  const handleCopyAcc = () => {
    navigator.clipboard.writeText(BANK_DETAILS.accountNumber);
    setCopiedAcc(true);
    setTimeout(() => setCopiedAcc(false), 2000);
  };

  const handleCopyIfsc = () => {
    navigator.clipboard.writeText(BANK_DETAILS.ifscCode);
    setCopiedIfsc(true);
    setTimeout(() => setCopiedIfsc(false), 2000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image screenshot (PNG, JPG, JPEG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawBase64 = event.target.result;
      
      // Compress screenshot on HTML5 Canvas to max 800px & 60% JPEG quality (~40-70 KB)
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        setScreenshotData(compressedBase64);
        setScreenshotFileName(file.name);
        setErrorMsg('');
      };
      img.src = rawBase64;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!utrNumber.trim()) {
      setErrorMsg('Please enter your 12-digit Bank Transaction / UTR Reference number.');
      return;
    }

    if (utrNumber.trim().length < 6) {
      setErrorMsg('Please enter a valid 12-digit UTR / Transaction Reference number.');
      return;
    }

    if (!screenshotData) {
      setErrorMsg('Please attach/upload your payment receipt screenshot before submitting.');
      return;
    }

    setIsSubmitting(true);

    const formattedSeats = selectedSeats.map(id => {
      return currentSeatMap[id] || {
        id: id,
        row: id.slice(0, 1),
        number: parseInt(id.slice(1), 10) || 1,
        price: 69,
        status: 'occupied'
      };
    });

    const bookingData = {
      bookingId: `DS-${Math.floor(100000 + Math.random() * 900000)}`,
      user: verifiedUser,
      seats: formattedSeats,
      totalAmount: totalPrice,
      utrNumber: utrNumber.trim(),
      paymentScreenshot: screenshotData,
      timestamp: new Date().toLocaleString(),
      status: 'PENDING_VERIFICATION', // 2-Step Organiser Verification
      checkedIn: false
    };

    setTimeout(() => {
      setIsSubmitting(false);
      onConfirmBooking(bookingData);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-red-900/80 bg-[#0c0818] p-6 shadow-2xl sm:p-8 animate-popup">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 hover:bg-red-950/50 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 flex items-center gap-3 border-b border-red-950/80 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-orange-600 text-white shadow-lg">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">Indian Bank Transfer</h2>
            <p className="text-xs text-gray-400">
              Total Payable: <strong className="text-orange-400 font-mono text-sm">₹{totalPrice}</strong> for {selectedSeats.length} seat(s) ({selectedSeats.join(', ')})
            </p>
          </div>
        </div>

        {/* Bank Account Details Card */}
        <div className="rounded-xl border border-red-900/60 bg-[#120a21] p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-red-950/80 pb-2">
            <span className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5">
              <Building2 className="h-4 w-4" /> OFFICIAL CLUB BANK DETAILS
            </span>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
              INDIAN BANK
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-black/60 p-3 rounded-xl border border-red-950">
              <span className="text-[10px] text-gray-400 block uppercase">Account Holder Name</span>
              <strong className="text-white font-bold">{BANK_DETAILS.accountName}</strong>
            </div>

            <div className="bg-black/60 p-3 rounded-xl border border-red-950 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 block uppercase">Account Number</span>
                <strong className="text-orange-400 font-mono text-sm font-black">{BANK_DETAILS.accountNumber}</strong>
              </div>
              <button
                onClick={handleCopyAcc}
                className="flex items-center gap-1 rounded bg-red-950 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-900"
              >
                <Copy className="h-3.5 w-3.5" />
                {copiedAcc ? "Copied!" : "Copy"}
              </button>
            </div>

            <div className="bg-black/60 p-3 rounded-xl border border-red-950 flex items-center justify-between sm:col-span-2">
              <div>
                <span className="text-[10px] text-gray-400 block uppercase">IFSC Code</span>
                <strong className="text-emerald-400 font-mono text-sm font-bold">{BANK_DETAILS.ifscCode}</strong>
              </div>
              <button
                onClick={handleCopyIfsc}
                className="flex items-center gap-1 rounded bg-red-950 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-900"
              >
                <Copy className="h-3.5 w-3.5" />
                {copiedIfsc ? "Copied!" : "Copy"}
              </button>
            </div>

            <div className="bg-black/60 p-3 rounded-xl border border-amber-900/40 sm:col-span-2 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 block uppercase">Branch & Branch Code</span>
                <strong className="text-gray-200 text-xs">{BANK_DETAILS.branch} (Branch Code: {BANK_DETAILS.branchCode})</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Verification Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          {/* UTR Input Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
              1. 12-Digit Bank UTR / Transaction Ref Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              placeholder="12-Digit UTR or Bank Reference ID"
              className="w-full rounded-xl border border-red-900/60 bg-black/60 py-3 px-4 text-sm text-white placeholder-gray-500 focus:border-red-500 focus:outline-none"
            />
          </div>

          {/* Payment Screenshot Upload Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
              2. Upload Payment Receipt Screenshot <span className="text-red-500">*</span>
            </label>

            {!screenshotData ? (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl border-red-900/60 bg-black/40 hover:bg-black/60 cursor-pointer transition hover:border-red-500/80 p-4 text-center">
                <Upload className="h-7 w-7 text-red-400 mb-1 animate-pulse" />
                <span className="text-xs font-bold text-gray-200">Click or Drag & Drop Payment Screenshot</span>
                <span className="text-[10px] text-gray-500 mt-0.5">Supports PNG, JPG, JPEG, WebP</span>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden" 
                />
              </label>
            ) : (
              <div className="relative rounded-xl border border-emerald-500/50 bg-emerald-950/30 p-3 flex items-center justify-between gap-3 animate-popup">
                <div className="flex items-center gap-3 overflow-hidden">
                  <img 
                    src={screenshotData} 
                    alt="Payment Receipt Preview" 
                    className="h-12 w-12 object-cover rounded-lg border border-emerald-500/60 shrink-0" 
                  />
                  <div className="truncate">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 truncate">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> {screenshotFileName || 'Screenshot Attached'}
                    </span>
                    <span className="text-[10px] text-gray-400 block">Ready for verification submission</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => { setScreenshotData(null); setScreenshotFileName(''); }}
                  className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-950/50 transition"
                  title="Remove and upload different screenshot"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
            <p className="mt-1 text-[10px] text-gray-400 flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              Transfer ₹{totalPrice} to Indian Bank above, upload receipt proof, and submit for organiser approval.
            </p>
          </div>

          {errorMsg && (
            <div className="rounded-lg border border-red-500/50 bg-red-950/40 p-3 text-xs text-red-200 flex items-center gap-2 animate-popup">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-xl transition hover:brightness-110 active:scale-98 disabled:opacity-50 hover-zoom"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                Submitting Receipt & UTR Verification...
              </span>
            ) : (
              `Submit UTR & Receipt Proof (₹${totalPrice})`
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
