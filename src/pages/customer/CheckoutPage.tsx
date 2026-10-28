import React, { useState } from 'react';
import { useBooking } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { INITIAL_CONCESSIONS } from '../../data/initialData';
import { PaymentModal } from '../../components/booking/PaymentModal';
import {
  ArrowLeft,
  Coffee,
  Tag,
  ShieldCheck,
  AlertCircle,
  Plus,
  Minus,
  Lock,
} from 'lucide-react';

interface CheckoutPageProps {
  onNavigate: (route: string, param?: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate }) => {
  const {
    selectedShow,
    selectedMovie,
    selectedScreen,
    selectedSeats,
    selectedConcessions,
    appliedCoupon,
    updateConcessionQuantity,
    applyCouponCode,
    removeCoupon,
    calculatePricing,
    resetBooking,
  } = useBooking();

  const { currentUser, loginCustomer } = useAuth();

  const [customerName, setCustomerName] = useState(currentUser?.name || 'Rohan Kumar');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || 'rohan.kumar@gmail.com');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '9876543210');
  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ message: string; isError: boolean } | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!selectedShow || !selectedMovie || !selectedScreen || selectedSeats.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#171923]">No Seats Selected</h2>
        <p className="text-xs text-[#667085]">
          Your seat hold session has expired or no seats were chosen.
        </p>
        <button
          onClick={() => onNavigate('/movies')}
          className="px-5 py-2.5 bg-[#E31837] hover:bg-[#c91430] text-white rounded-xl text-xs font-bold shadow-xs"
        >
          Select a Movie
        </button>
      </div>
    );
  }

  const pricing = calculatePricing();

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = applyCouponCode(couponInput);
    setCouponFeedback({ message: res.message, isError: !res.success });
  };

  const validateAndProceedToPayment = () => {
    setErrorMessage(null);

    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number for SMS/WhatsApp ticket.');
      return;
    }

    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address for e-ticket delivery.');
      return;
    }

    // Save/update customer session
    if (!currentUser) {
      loginCustomer(customerEmail, customerName, customerPhone);
    }

    setIsPaymentOpen(true);
  };

  const handlePaymentSuccess = (paymentId: string, paymentMethod: string, utr?: string, receiptUrl?: string) => {
    setIsPaymentOpen(false);
    try {
      const pendingBooking = storageService.createPendingUpiBooking({
        customerName,
        customerEmail,
        customerPhone,
        userId: currentUser?.id,
        showId: selectedShow.id,
        movieId: selectedMovie.id,
        screenId: selectedScreen.id,
        showDate: selectedShow.date,
        showTime: selectedShow.startTime,
        movieTitle: selectedMovie.title,
        screenName: selectedScreen.name,
        seats: selectedSeats,
        concessions: selectedConcessions,
        subtotal: pricing.subtotal,
        convenienceFee: pricing.convenienceFee,
        gstAmount: pricing.gstAmount,
        discountAmount: pricing.discountAmount,
        totalAmount: pricing.grandTotal,
        couponCode: appliedCoupon?.code,
        upiReference: utr || paymentId,
        receiptUrl,
      });

      resetBooking();
      onNavigate(`/booking/${pendingBooking.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error submitting booking. Please try again.');
    }
  };

  const handlePaymentFailure = (msg: string) => {
    setIsPaymentOpen(false);
    setErrorMessage(msg);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 min-h-screen bg-[#F6F7FB]">
      {/* Header & Back */}
      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
        <button
          onClick={() => onNavigate(`/shows/${selectedShow.id}/seats`)}
          className="flex items-center space-x-1.5 text-xs font-bold text-[#667085] hover:text-[#171923] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Seat Map</span>
        </button>
        <span className="text-xs text-[#E31837] font-bold uppercase tracking-wider">
          Step 2: Order Review & Payment
        </span>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details & Concessions (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Show Snapshot Card */}
          <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs flex items-center space-x-4">
            <img
              src={selectedMovie.posterUrl}
              alt={selectedMovie.title}
              className="w-16 h-24 object-cover rounded-xl border border-gray-200 shadow-xs flex-shrink-0"
            />
            <div className="space-y-1">
              <h2 className="text-[#171923] font-extrabold text-xl font-cinema">{selectedMovie.title}</h2>
              <p className="text-xs text-[#667085]">
                {selectedMovie.language} • {selectedMovie.certification} • {selectedMovie.durationMinutes} mins
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#667085] pt-1">
                <span className="font-bold text-[#E31837]">{selectedScreen.name}</span>
                <span>•</span>
                <span>
                  {new Date(selectedShow.date).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span>•</span>
                <span className="font-mono font-bold text-[#171923]">{selectedShow.startTime} (IST)</span>
              </div>
            </div>
          </div>

          {/* Patron Contact Form */}
          <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] space-y-4 shadow-xs">
            <h3 className="text-[#171923] font-bold text-base flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-[#E31837]" />
              <span>Contact Details for E-Ticket Delivery</span>
            </h3>
            <p className="text-xs text-[#667085]">
              Your confirmed QR code ticket will be rendered immediately and sent to your email.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-[#171923] font-semibold block mb-1">Full Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-[#171923] placeholder-gray-400 focus:outline-none focus:border-[#E31837] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs text-[#171923] font-semibold block mb-1">Mobile (WhatsApp) *</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="10-digit number"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-[#171923] placeholder-gray-400 focus:outline-none focus:border-[#E31837] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs text-[#171923] font-semibold block mb-1">Email Address *</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-[#171923] placeholder-gray-400 focus:outline-none focus:border-[#E31837] focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Pre-book Cinema Food & Combos */}
          <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[#171923] font-bold text-base flex items-center space-x-2">
                  <Coffee className="w-5 h-5 text-[#E31837]" />
                  <span>Grab a Bite & Beverage (Optional)</span>
                </h3>
                <p className="text-xs text-[#667085] mt-0.5">
                  Skip the canteen queue! Pre-order hot snacks delivered right to your seat.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {INITIAL_CONCESSIONS.map((item) => {
                const currentQty =
                  selectedConcessions.find((c) => c.itemId === item.id)?.quantity || 0;

                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center space-x-3 justify-between"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="text-xs font-bold text-[#171923] truncate">{item.name}</div>
                      <div className="text-[11px] text-[#667085] line-clamp-1">{item.description}</div>
                      <div className="text-xs font-bold text-[#E31837] font-mono mt-1">₹{item.price}</div>
                    </div>

                    {currentQty > 0 ? (
                      <div className="flex items-center space-x-2 bg-white px-2 py-1 rounded-lg border border-gray-300 shadow-2xs">
                        <button
                          onClick={() => updateConcessionQuantity(item, -1)}
                          className="text-gray-500 hover:text-gray-900"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold text-[#171923] font-mono">{currentQty}</span>
                        <button
                          onClick={() => updateConcessionQuantity(item, 1)}
                          className="text-gray-500 hover:text-gray-900"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => updateConcessionQuantity(item, 1)}
                        className="px-3 py-1 bg-white hover:bg-red-50 text-[#171923] hover:text-[#E31837] text-xs font-bold rounded-lg border border-gray-300 hover:border-red-300 transition-colors shadow-2xs"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Bill Summary & Promo Code (1 Col) */}
        <div className="space-y-6">
          {/* Promo Coupon Card */}
          <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-3">
            <h4 className="text-[#171923] font-bold text-xs uppercase tracking-wider flex items-center space-x-2">
              <Tag className="w-4 h-4 text-[#E31837]" />
              <span>Apply Cinema Promo Code</span>
            </h4>

            {appliedCoupon ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-800 font-mono">{appliedCoupon.code}</span>
                  <p className="text-[11px] text-emerald-600">Discount: ₹{pricing.discountAmount} off</p>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-xs text-red-600 hover:underline font-bold"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="space-y-2">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="e.g. LAXMI100"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#171923] uppercase font-mono placeholder-gray-400 focus:outline-none focus:border-[#E31837] focus:bg-white"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                  >
                    Apply
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span
                    onClick={() => {
                      setCouponInput('LAXMI100');
                    }}
                    className="cursor-pointer text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-0.5 rounded border border-gray-200 font-medium"
                  >
                    LAXMI100 (₹100 off)
                  </span>
                  <span
                    onClick={() => {
                      setCouponInput('WELCOME50');
                    }}
                    className="cursor-pointer text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-0.5 rounded border border-gray-200 font-medium"
                  >
                    WELCOME50 (₹50 off)
                  </span>
                </div>
              </form>
            )}

            {couponFeedback && (
              <p
                className={`text-xs ${
                  couponFeedback.isError ? 'text-red-600' : 'text-emerald-700 font-semibold'
                }`}
              >
                {couponFeedback.message}
              </p>
            )}
          </div>

          {/* Itemized Bill Summary */}
          <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
            <h4 className="text-[#171923] font-bold text-sm uppercase tracking-wider border-b border-gray-100 pb-3">
              Order Summary
            </h4>

            {/* Selected Seats Listing */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#171923]">
                <span>
                  Tickets ({selectedSeats.length} {selectedSeats.length === 1 ? 'seat' : 'seats'}):
                </span>
                <span className="font-mono text-[#171923] font-bold">₹{pricing.ticketSubtotal}</span>
              </div>
              <div className="text-[11px] text-[#667085] font-mono">
                {selectedSeats.map((s) => `${s.seatLabel} [${s.category} ₹${s.price}]`).join(', ')}
              </div>
            </div>

            {/* Concessions listing */}
            {selectedConcessions.length > 0 && (
              <div className="border-t border-gray-100 pt-2 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-[#171923]">
                  <span>Food & Beverages:</span>
                  <span className="font-mono text-[#171923] font-bold">₹{pricing.concessionsTotal}</span>
                </div>
                {selectedConcessions.map((c) => (
                  <div key={c.itemId} className="flex justify-between text-[11px] text-[#667085]">
                    <span>
                      {c.name} x {c.quantity}
                    </span>
                    <span className="font-mono">₹{c.price * c.quantity}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Fees & Taxes */}
            <div className="border-t border-gray-100 pt-3 space-y-2 text-xs text-[#667085]">
              <div className="flex justify-between">
                <span>Cinema Convenience Fee:</span>
                <span className="font-mono text-[#171923]">₹{pricing.convenienceFee}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes & GST (18% on convenience fee):</span>
                <span className="font-mono text-[#171923]">₹{pricing.gstAmount}</span>
              </div>
              {pricing.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Coupon Discount:</span>
                  <span className="font-mono">-₹{pricing.discountAmount}</span>
                </div>
              )}
            </div>

            {/* Grand Total */}
            <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-gray-500 block">Total Amount</span>
                <span className="text-[10px] text-gray-400">Includes all taxes</span>
              </div>
              <span className="text-2xl font-black text-[#E31837] font-mono">
                ₹{pricing.grandTotal}
              </span>
            </div>

            {/* Pay Button */}
            <button
              onClick={validateAndProceedToPayment}
              className="w-full py-4 bg-[#E31837] hover:bg-[#c91430] text-white font-black rounded-xl shadow-md transition-all transform hover:scale-[1.01] active:scale-95 flex items-center justify-center space-x-2 text-base cursor-pointer"
            >
              <Lock className="w-5 h-5" />
              <span>Proceed to Pay ₹{pricing.grandTotal}</span>
            </button>

            <div className="text-[11px] text-[#667085] text-center flex items-center justify-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Direct Box Office UPI Settlement • 100% Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Gateway Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        amount={pricing.grandTotal}
        customerName={customerName}
        customerEmail={customerEmail}
        customerPhone={customerPhone}
        movieTitle={selectedMovie.title}
        onSuccess={handlePaymentSuccess}
        onFailure={handlePaymentFailure}
        onClose={() => setIsPaymentOpen(false)}
      />
    </div>
  );
};
