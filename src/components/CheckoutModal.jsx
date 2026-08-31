import React, { useState } from 'react';
import { X, Copy, AlertCircle, CheckCircle2, ShieldAlert, Upload, QrCode, Check } from 'lucide-react';
import { getUserBookings } from '../utils/storage';

const UPI_DETAILS = {
  name: 'K Chakraborty',
  upiId: 'kauliknov27-1@okicici',
  qrImage: '/payment-qr.jpg'
};

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
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Safely get current active auditorium seat map dictionary
  const currentSeatMap = (seatMap && seatMap.AUDI_1) 
    ? (seatMap[selectedAudiKey] || seatMap.AUDI_1) 
    : (seatMap || {});

  // Calculate total price (₹67 per seat)
  const totalPrice = selectedSeats.reduce((sum, seatId) => sum + (currentSeatMap[seatId]?.price || 67), 0);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(UPI_DETAILS.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
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

    const cleanUtr = utrNumber.trim().replace(/\s+/g, '');

    // 1. Max seats limit check
    if (selectedSeats.length > 4) {
      setErrorMsg('Maximum 4 seats allowed per booking.');
      return;
    }

    // 2. Exact 12-digit numeric validation
    if (!/^\d{12}$/.test(cleanUtr)) {
      setErrorMsg('Please enter a valid 12-digit numeric Bank Reference / UTR Number (digits only, e.g. 660783963519).');
      return;
    }

    // 3. Repeated dummy number patterns check
    const isDummy = /^(.)\1{11}$/.test(cleanUtr) || cleanUtr === '123456789012' || cleanUtr === '012345678901' || cleanUtr === '987654321098';
    if (isDummy) {
      setErrorMsg('Invalid or dummy UTR number. Please enter the genuine 12-digit UTR from your UPI payment receipt.');
      return;
    }

    // 4. Duplicate UTR check across existing non-rejected bookings
    const existingBookings = getUserBookings();
    const isDuplicate = existingBookings.some(b => 
      b.utrNumber && 
      b.utrNumber.trim().replace(/\s+/g, '') === cleanUtr && 
      b.status !== 'REJECTED'
    );
    if (isDuplicate) {
      setErrorMsg('⚠️ This 12-digit UTR number has already been used for another booking. Please check your UPI payment receipt.');
      return;
    }

    // 5. Screenshot required check
    if (!screenshotData) {
      setErrorMsg('Please attach/upload your payment receipt screenshot before submitting.');
      return;
    }

    setIsSubmitting(true);

    const uploadToCloudinary = async (base64Data) => {
      try {
        const res = await fetch('https://api.cloudinary.com/v1_1/rai15q1n/image/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file: base64Data,
            upload_preset: 'screening_preset'
          })
        });
        const data = await res.json();
        if (data && data.secure_url) {
          return data.secure_url;
        }
      } catch (err) {
        console.warn("Cloudinary upload fallback to local base64:", err);
      }
      return base64Data;
    };

    uploadToCloudinary(screenshotData).then((finalScreenshotUrl) => {
      const formattedSeats = selectedSeats.map(id => {
        return currentSeatMap[id] || {
          id: id,
          row: id.slice(0, 1),
          number: parseInt(id.slice(1), 10) || 1,
          price: 67,
          status: 'occupied'
        };
      });

      const bookingData = {
        bookingId: `DS-${Math.floor(100000 + Math.random() * 900000)}`,
        user: verifiedUser,
        seats: formattedSeats,
        totalAmount: totalPrice,
        utrNumber: cleanUtr,
        paymentScreenshot: finalScreenshotUrl,
        timestamp: new Date().toLocaleString(),
        status: 'PENDING_VERIFICATION', // 2-Step Organiser Verification
        checkedIn: false
      };

      setIsSubmitting(false);
      onConfirmBooking(bookingData);
    }).catch(err => {
      setIsSubmitting(false);
      setErrorMsg('Error submitting booking: ' + (err.message || 'Please try again'));
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl border border-red-900/80 bg-[#0c0818] p-5 shadow-2xl sm:p-7 animate-popup">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 hover:bg-red-950/50 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-5 flex items-center gap-3 border-b border-red-950/80 pb-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-orange-600 text-white shadow-lg shrink-0">
            <QrCode className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white">Scan UPI QR To Pay</h2>
            <p className="text-xs text-gray-400">
              Total: <strong className="text-orange-400 font-mono text-sm font-bold">₹{totalPrice}</strong> for {selectedSeats.length} seat(s) ({selectedSeats.join(', ')})
            </p>
          </div>
        </div>

        {/* Official Payment QR Card */}
        <div className="rounded-2xl border border-red-900/60 bg-[#120a21] p-4 text-center space-y-3">
          
          {/* Header Banner */}
          <div className="flex items-center justify-between border-b border-red-950/80 pb-2 px-1">
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5">
              <QrCode className="h-4 w-4" /> OFFICIAL SCREENING UPI QR
            </span>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-500/40">
              GPay • PhonePe • Paytm • BHIM
            </span>
          </div>

          {/* QR Code Image Container */}
          <div className="flex justify-center py-1">
            <div className="relative rounded-2xl bg-white p-2.5 shadow-2xl border-2 border-red-500/40 max-w-[220px]">
              <img 
                src={UPI_DETAILS.qrImage} 
                alt="Payment QR Code - K Chakraborty" 
                className="w-full h-auto rounded-xl object-contain"
              />
            </div>
          </div>

          {/* Account Details & 1-Click Copy */}
          <div className="bg-black/70 p-3 rounded-xl border border-red-950 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 text-[11px] uppercase">Payee Name:</span>
              <strong className="text-white font-bold">{UPI_DETAILS.name}</strong>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-red-950/60">
              <span className="text-gray-400 text-[11px] uppercase">UPI ID:</span>
              <div className="flex items-center gap-1.5">
                <span className="text-orange-400 font-mono font-bold">{UPI_DETAILS.upiId}</span>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="flex items-center gap-1 rounded bg-red-950 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-900 border border-red-800/50 transition"
                >
                  {copiedUpi ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  {copiedUpi ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-red-950/60">
              <span className="text-gray-400 text-[11px] uppercase">Exact Amount to Pay:</span>
              <span className="text-emerald-400 font-mono font-black text-sm bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                ₹{totalPrice}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-gray-400 leading-tight">
            Scan using any UPI App (GPay, PhonePe, Paytm), pay <strong>₹{totalPrice}</strong>, and copy the <strong>12-digit UTR Number</strong>.
          </p>
        </div>

        {/* Payment Verification Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          
          {/* UTR Input Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
              1. 12-Digit Bank Reference / UTR Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={12}
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 660783963519 (12 digits from UPI receipt)"
              className="w-full rounded-xl border border-red-900/60 bg-black/60 py-2.5 px-3.5 text-sm text-white placeholder-gray-500 focus:border-red-500 focus:outline-none font-mono tracking-wider"
            />
            <span className="text-[10px] text-gray-400 mt-1 block">
              Characters: {utrNumber.length}/12
            </span>
          </div>

          {/* Payment Screenshot Upload Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
              2. Upload Payment Receipt Screenshot <span className="text-red-500">*</span>
            </label>

            {!screenshotData ? (
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl border-red-900/60 bg-black/40 hover:bg-black/60 cursor-pointer transition hover:border-red-500/80 p-3 text-center">
                <Upload className="h-6 w-6 text-red-400 mb-1 animate-pulse" />
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
              <div className="relative rounded-xl border border-emerald-500/50 bg-emerald-950/30 p-2.5 flex items-center justify-between gap-3 animate-popup">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <img 
                    src={screenshotData} 
                    alt="Payment Receipt Preview" 
                    className="h-10 w-10 object-cover rounded-lg border border-emerald-500/60 shrink-0" 
                  />
                  <div className="truncate">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 truncate">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> {screenshotFileName || 'Screenshot Attached'}
                    </span>
                    <span className="text-[10px] text-gray-400 block">Ready for submission</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => { setScreenshotData(null); setScreenshotFileName(''); }}
                  className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-950/50 transition text-xs font-bold"
                >
                  ✕ Remove
                </button>
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-red-950/80 border border-red-500 p-3 text-xs font-semibold text-red-200 animate-popup">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Information Notice */}
          <div className="flex items-start gap-2 rounded-xl bg-amber-950/30 border border-amber-600/30 p-2.5 text-[11px] text-amber-300/90">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            <span>
              <strong>Organiser Verification:</strong> Organisers cross-reference the 12-digit UTR with bank records before confirming tickets. Duplicate or fake UTRs result in automatic booking cancellation.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-red-950 px-4 py-2.5 text-xs font-bold text-gray-400 hover:bg-red-950/40 hover:text-white transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-r from-red-600 to-orange-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg hover:from-red-500 hover:to-orange-500 transition disabled:opacity-50 flex items-center gap-2 hover-zoom"
            >
              {isSubmitting ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  <span>Verifying & Uploading...</span>
                </>
              ) : (
                <>
                  <span>Submit Payment Verification</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
