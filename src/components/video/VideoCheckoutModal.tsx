import React, { useState } from 'react';
import { X, QrCode, ShieldCheck, AlertCircle, CheckCircle2, Clock, Film, Copy, Check } from 'lucide-react';
import { Movie, VideoOrder } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';

interface VideoCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: Movie;
  initialMode?: 'RENTAL' | 'PURCHASE';
  onOrderSubmitted?: (order: VideoOrder) => void;
}

export const VideoCheckoutModal: React.FC<VideoCheckoutModalProps> = ({
  isOpen,
  onClose,
  content,
  initialMode = 'RENTAL',
  onOrderSubmitted,
}) => {
  const { currentUser, loginCustomer } = useAuth();

  // Mode: Rent or Buy
  const canRent = content.monetization === 'RENT' || content.monetization === 'RENT_OR_BUY' || (content.rentPriceINR && content.rentPriceINR > 0);
  const canBuy = content.monetization === 'BUY' || content.monetization === 'RENT_OR_BUY' || (content.buyPriceINR && content.buyPriceINR > 0);

  const [orderType, setOrderType] = useState<'RENTAL' | 'PURCHASE'>(() => {
    if (initialMode === 'PURCHASE' && canBuy) return 'PURCHASE';
    if (canRent) return 'RENTAL';
    return canBuy ? 'PURCHASE' : 'RENTAL';
  });

  // User input if guest
  const [userName, setUserName] = useState(currentUser?.name || '');
  const [userEmail, setUserEmail] = useState(currentUser?.email || '');
  const [userPhone, setUserPhone] = useState(currentUser?.phone || '');

  // Payment form
  const [upiReference, setUpiReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<VideoOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  if (!isOpen) return null;

  const currentSettings = storageService.getSettings();
  const upiConfig = currentSettings.upiConfig;

  const rentPrice = content.rentPriceINR || 49;
  const buyPrice = content.buyPriceINR || 149;
  const payableAmount = orderType === 'RENTAL' ? rentPrice : buyPrice;
  const rentalDuration = content.rentalDurationHours || 48;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiConfig.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Ensure customer identification
    const finalEmail = (currentUser?.email || userEmail).trim();
    const finalName = (currentUser?.name || userName).trim();
    const finalPhone = (currentUser?.phone || userPhone).trim();

    if (!finalEmail || !finalEmail.includes('@')) {
      setError('Please provide a valid email address for digital entitlement delivery.');
      return;
    }
    if (!finalName) {
      setError('Please enter your full name.');
      return;
    }

    if (!currentUser) {
      loginCustomer(finalEmail, finalName, finalPhone);
    }

    const cleanUtr = upiReference.trim().replace(/\s+/g, '');
    if (cleanUtr.length < 8) {
      setError('Please enter a valid 12-digit UPI UTR / Transaction Reference number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const activeUserId = currentUser?.id || `usr-${Date.now().toString(36)}`;
      const order = await storageService.createVideoOrder({
        userId: activeUserId,
        userEmail: finalEmail,
        customerName: finalName,
        customerPhone: finalPhone,
        contentId: content.id,
        contentTitle: content.title,
        orderType,
        amount: payableAmount,
        currency: 'INR',
        rentalDurationHours: orderType === 'RENTAL' ? rentalDuration : undefined,
        paymentMethod: 'UPI',
        paymentStatus: 'PENDING',
        upiReference: cleanUtr,
      });

      setSubmittedOrder(order);
      onOrderSubmitted?.(order);
    } catch (err: any) {
      setError(err.message || 'Failed to submit payment request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-[#171923] my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-150 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-[#E31837] flex items-center justify-center">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#171923] font-cinema">
                Digital Video Checkout
              </h3>
              <p className="text-xs text-[#667085]">
                {content.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedOrder ? (
          // Success / Pending Review Confirmation View
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-black text-[#171923]">
                Payment Request Submitted!
              </h4>
              <p className="text-xs text-[#667085]">
                Request ID: <span className="font-mono font-bold text-[#171923]">{submittedOrder.id}</span>
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Plan:</span>
                <span className="font-bold text-slate-900">{submittedOrder.orderType === 'RENTAL' ? `Rent (${rentalDuration}h Access)` : 'One-Time Purchase (Lifetime)'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payable Amount:</span>
                <span className="font-bold text-emerald-700">₹{submittedOrder.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Submitted UTR:</span>
                <span className="font-mono font-bold text-slate-900">{submittedOrder.upiReference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                  <Clock className="w-3 h-3" />
                  <span>Pending Admin Verification</span>
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Notice:</strong> UPI QR plus UTR submission is manual bank credit verification. Our cinema admin will cross-check the transaction and activate your digital entitlement shortly. You can track this in <strong>My Library</strong>.
            </p>

            <button
              onClick={onClose}
              className="w-full py-3 bg-[#E31837] hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Done & View Library
            </button>
          </div>
        ) : (
          // Checkout Form
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Rent vs Buy Selector */}
            {canRent && canBuy && (
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setOrderType('RENTAL')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    orderType === 'RENTAL'
                      ? 'bg-white text-[#E31837] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Rent for ₹{rentPrice} ({rentalDuration}h)
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('PURCHASE')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    orderType === 'PURCHASE'
                      ? 'bg-white text-[#E31837] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Buy for ₹{buyPrice} (Lifetime)
                </button>
              </div>
            )}

            {/* Price & Conditions Summary */}
            <div className="p-3.5 bg-red-50/70 border border-red-200/80 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-[#E31837]">
                  {orderType === 'RENTAL' ? `Rental (${rentalDuration} Hours)` : 'Permanent Purchase'}
                </span>
                <p className="text-xs text-slate-700 font-medium">
                  {orderType === 'RENTAL'
                    ? `Stream within ${rentalDuration} hours once verified.`
                    : 'Unlimited playback anytime in My Library.'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-[#E31837] font-cinema">
                  ₹{payableAmount}
                </span>
                <p className="text-[10px] text-slate-500">All Taxes Incl.</p>
              </div>
            </div>

            {/* Customer info if not signed in */}
            {!currentUser && (
              <div className="space-y-2.5 pt-1">
                <p className="text-xs font-bold text-slate-700">Patron Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Your Name *"
                    required
                    className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#E31837] focus:bg-white"
                  />
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="Email for E-Receipt *"
                    required
                    className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#E31837] focus:bg-white"
                  />
                </div>
              </div>
            )}

            {/* Official UPI QR Code */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-3">
              <div className="flex items-center justify-center space-x-1.5 text-xs font-bold text-slate-800">
                <QrCode className="w-4 h-4 text-[#E31837]" />
                <span>Scan Official Cinema QR Code</span>
              </div>

              <div className="w-44 h-44 bg-white border border-slate-200 rounded-xl p-2 mx-auto shadow-xs flex items-center justify-center">
                <img
                  src={upiConfig.qrImagePath || '/images/rajan_bhogta_upi_qr.jpeg'}
                  alt="Laxmi Cineplex UPI QR Code"
                  className="w-full h-full object-contain rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              {/* UPI ID Copy Pill */}
              <div className="flex items-center justify-center space-x-2">
                <span className="text-[11px] font-mono text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                  {upiConfig.upiId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="p-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                  title="Copy UPI ID"
                >
                  {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <p className="text-[11px] text-slate-500 leading-tight">
                Payee: <strong>{upiConfig.payeeName}</strong> ({upiConfig.bankName})
              </p>
            </div>

            {/* UTR Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800 block">
                12-Digit UPI Reference / UTR Number *
              </label>
              <input
                type="text"
                value={upiReference}
                onChange={(e) => setUpiReference(e.target.value)}
                placeholder="e.g. 430512348901 (from receipt)"
                required
                maxLength={20}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-[#E31837] transition-all"
              />
              <p className="text-[10px] text-slate-500">
                You will find this 12-digit number on your GPay/PhonePe/Paytm success receipt.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#E31837] hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-red-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting Request...' : `Submit Payment Request (₹${payableAmount})`}</span>
            </button>

            <p className="text-[10px] text-slate-400 text-center leading-tight">
              Security notice: We never ask for your UPI PIN, OTP, or bank password. Submitting a UTR initiates manual box office verification.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
