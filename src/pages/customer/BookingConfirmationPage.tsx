import React, { useEffect, useState } from 'react';
import { storageService } from '../../services/storage';
import { Booking } from '../../types';
import { TicketView } from '../../components/booking/TicketView';
import confetti from 'canvas-confetti';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Home,
  ShieldCheck,
  Building,
} from 'lucide-react';

interface BookingConfirmationPageProps {
  bookingId: string;
  onNavigate: (route: string, param?: string) => void;
}

export const BookingConfirmationPage: React.FC<BookingConfirmationPageProps> = ({
  bookingId,
  onNavigate,
}) => {
  const [booking, setBooking] = useState<Booking | null>(() =>
    storageService.getBookingById(bookingId) || null
  );

  const refreshBooking = () => {
    const updated = storageService.getBookingById(bookingId);
    setBooking(updated || null);
  };

  useEffect(() => {
    refreshBooking();
    const handleUpdate = () => refreshBooking();
    window.addEventListener('lxm_storage_update', handleUpdate);
    return () => window.removeEventListener('lxm_storage_update', handleUpdate);
  }, [bookingId]);

  useEffect(() => {
    if (booking?.bookingStatus === 'CONFIRMED') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // Confetti optional
      }
    }
  }, [booking?.bookingStatus]);

  if (!booking) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#171923]">Booking Not Found</h2>
        <p className="text-xs text-[#667085]">
          Could not find booking reference &ldquo;{bookingId}&rdquo;.
        </p>
        <button
          onClick={() => onNavigate('/')}
          className="px-5 py-2 bg-[#E31837] hover:bg-[#c91430] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
        >
          Return to Cinema Home
        </button>
      </div>
    );
  }

  const isPending = booking.bookingStatus === 'PENDING_VERIFICATION';
  const isConfirmed = booking.bookingStatus === 'CONFIRMED';
  const isRejected = booking.bookingStatus === 'REJECTED';

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8 min-h-screen bg-[#F6F7FB]">
      {/* Pending Verification Notice Card */}
      {isPending && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-6 text-[#171923]">
          <div className="flex items-center space-x-3 text-amber-600">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                Payment Verification Pending
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-[#171923] font-cinema mt-1">
                Booking Reference: {booking.id}
              </h1>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">
            Thank you, <strong className="text-[#171923]">{booking.customerName}</strong>! Your UPI payment reference{' '}
            <span className="font-mono font-bold text-[#171923]">{booking.upiReference}</span> has been received. Our box office team is currently reconciling this against our{' '}
            <strong className="text-[#171923]">India Post Payment Bank 3764</strong> statement for account <strong className="text-[#171923]">Rajan Bhogta</strong>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#667085]">Movie &amp; Screen</span>
              <p className="font-bold text-[#171923] mt-0.5">{booking.movieTitle}</p>
              <p className="text-[#667085] text-[11px]">{booking.screenName}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#667085]">Showtime &amp; Seats</span>
              <p className="font-bold text-[#171923] mt-0.5">{booking.showDate} at {booking.showTime}</p>
              <p className="text-[#E31837] font-mono font-bold text-[11px]">
                {booking.seats.map((s) => s.seatLabel).join(', ')}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#667085]">Amount Paid</span>
              <p className="text-base font-black text-emerald-700 font-mono mt-0.5">₹{booking.totalAmount}</p>
              <p className="text-[10px] text-gray-500">UTR: {booking.upiReference}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={refreshBooking}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#171923] text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Status</span>
            </button>
            <button
              onClick={() => onNavigate('/my-bookings')}
              className="px-4 py-2.5 bg-[#E31837] hover:bg-[#c91430] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Go to My Bookings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Confirmed Ticket Display */}
      {isConfirmed && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span className="font-bold">
                Payment verified &amp; confirmed! Present your admission QR ticket at the Laxmi Cineplex turnstile.
              </span>
            </div>
          </div>

          <TicketView booking={booking} />
        </div>
      )}

      {/* Rejected Status Card */}
      {isRejected && (
        <div className="p-6 rounded-3xl bg-white border border-red-200 shadow-xs space-y-4 text-[#171923]">
          <div className="flex items-center space-x-3 text-red-600">
            <AlertCircle className="w-6 h-6" />
            <h2 className="text-xl font-bold font-cinema text-[#171923]">
              Payment Verification Could Not Be Completed
            </h2>
          </div>
          <p className="text-xs text-[#667085]">
            The submitted UTR number could not be matched with incoming UPI deposits on our India Post Payment Bank statement.
          </p>
          <button
            onClick={() => onNavigate('/checkout')}
            className="px-5 py-2.5 bg-[#E31837] hover:bg-[#c91430] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
          >
            Retry Checkout
          </button>
        </div>
      )}
    </div>
  );
};
