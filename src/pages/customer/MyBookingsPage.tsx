import React, { useState, useEffect } from 'react';
import { storageService } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { Booking } from '../../types';
import {
  Ticket,
  Calendar,
  Clock,
  Film,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Search,
  Building,
  RefreshCw,
  QrCode,
  XCircle,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  X,
} from 'lucide-react';
import { TicketView } from '../../components/booking/TicketView';

interface MyBookingsPageProps {
  onNavigate: (route: string, param?: string) => void;
}

export const MyBookingsPage: React.FC<MyBookingsPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedTicketBooking, setSelectedTicketBooking] = useState<Booking | null>(null);
  const [bookings, setBookings] = useState<Booking[]>(() => storageService.getBookings());

  const refreshData = () => {
    setBookings(storageService.getBookings());
  };

  useEffect(() => {
    const handleUpdate = () => refreshData();
    window.addEventListener('lxm_storage_update', handleUpdate);
    return () => window.removeEventListener('lxm_storage_update', handleUpdate);
  }, []);

  // Filter bookings strictly for the logged-in customer or verified lookup
  const userBookings = bookings.filter((b) => {
    // If logged in as customer, only show bookings belonging to this customer
    if (currentUser) {
      const isOwner =
        (b.userId && b.userId === currentUser.id) ||
        (b.customerEmail && b.customerEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
        (currentUser.phone && b.customerPhone && b.customerPhone.replace(/\D/g, '') === currentUser.phone.replace(/\D/g, ''));

      if (!isOwner) return false;

      if (!filterQuery.trim()) return true;
      const q = filterQuery.toLowerCase();
      return (
        b.id.toLowerCase().includes(q) ||
        b.movieTitle.toLowerCase().includes(q) ||
        (b.upiReference && b.upiReference.toLowerCase().includes(q))
      );
    }

    // If guest / not logged in, require explicit query (phone or booking ID) to prevent exposing other users' bookings
    if (!filterQuery.trim()) return false;
    const q = filterQuery.trim().toLowerCase();
    const cleanDigits = filterQuery.replace(/\D/g, '');

    const isMatch =
      b.id.toLowerCase() === q ||
      (b.upiReference && b.upiReference.toLowerCase() === q) ||
      (cleanDigits.length >= 10 && b.customerPhone.replace(/\D/g, '').includes(cleanDigits));

    return isMatch;
  });

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6 bg-[#F6F7FB] min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#171923] font-cinema flex items-center space-x-2.5">
            <Ticket className="w-7 h-7 text-[#E31837]" />
            <span>My Cinema Bookings &amp; Tickets</span>
          </h1>
          <p className="text-xs text-[#667085] mt-1">
            Track your UPI payment verification status and access your Laxmi Cineplex turnstile admission QR tickets.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#667085] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by phone, booking ID, UTR..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-3 py-2 text-xs text-[#171923] placeholder:text-gray-400 focus:outline-none focus:border-[#E31837] focus:ring-1 focus:ring-[#E31837] font-medium shadow-2xs"
          />
        </div>
      </div>

      {/* Bookings List */}
      {userBookings.length === 0 ? (
        <div className="p-16 text-center text-[#667085] text-xs bg-white border border-[#E5E7EB] rounded-3xl space-y-3 shadow-xs">
          <Ticket className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <p className="font-bold text-[#171923] text-base">No bookings found</p>
          <p className="text-[#667085] max-w-sm mx-auto">
            {!currentUser && !filterQuery
              ? 'Enter your mobile number, booking reference (e.g. LXM-26...), or UPI UTR in the search box above to securely view your tickets.'
              : filterQuery
              ? `No transactions match "${filterQuery}". Check your phone number or reference code.`
              : 'You have not made any movie bookings yet. Explore our Now Showing movies to book seats.'}
          </p>
          <button
            onClick={() => onNavigate('/')}
            className="mt-2 px-6 py-2.5 rounded-xl bg-[#E31837] hover:bg-[#c91430] text-white font-bold text-xs shadow-md cursor-pointer transition-colors"
          >
            Explore Now Showing
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {userBookings.map((b) => {
            const isPending = b.bookingStatus === 'PENDING_VERIFICATION';
            const isConfirmed = b.bookingStatus === 'CONFIRMED';
            const isRejected = b.bookingStatus === 'REJECTED';

            return (
              <div
                key={b.id}
                className="p-5 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-4 hover:border-gray-300 transition-all text-[#171923]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div>
                    <span className="text-[10px] text-[#667085] font-mono block">BOOKING REFERENCE</span>
                    <span className="text-base font-black text-[#171923] font-mono">{b.id}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center space-x-1.5 ${
                        isPending
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : isConfirmed
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : isRejected
                          ? 'bg-red-50 text-red-800 border border-red-200'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {isPending && <Clock className="w-3.5 h-3.5 animate-pulse text-amber-600" />}
                      {isConfirmed && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                      {isRejected && <XCircle className="w-3.5 h-3.5 text-red-600" />}
                      <span>{b.bookingStatus.replace('_', ' ')}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-[#667085] uppercase font-semibold block">Movie</span>
                    <span className="font-bold text-[#171923] text-sm block mt-0.5">{b.movieTitle}</span>
                    <span className="text-[#667085] text-[11px] block">{b.screenName}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#667085] uppercase font-semibold block">Date &amp; Seats</span>
                    <span className="text-gray-800 font-medium block mt-0.5">
                      {b.showDate} at {b.showTime} (IST)
                    </span>
                    <span className="font-mono text-[#E31837] font-bold block">
                      Seats: {b.seats.map((s) => s.seatLabel).join(', ')}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#667085] uppercase font-semibold block">Payment Info</span>
                    <span className="text-base font-black text-emerald-700 font-mono block mt-0.5">
                      ₹{b.totalAmount.toLocaleString('en-IN')}
                    </span>
                    {b.upiReference && (
                      <span className="text-[10px] text-[#667085] font-mono block">
                        UTR: {b.upiReference}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status-specific banners and action buttons */}
                {isPending && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-800">
                    <div className="flex items-start space-x-2">
                      <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Awaiting Bank Reconciliation</p>
                        <p className="text-[11px] text-amber-700 mt-0.5">
                          Your UTR is currently being verified against our India Post Payment Bank statements. Your admission QR unlocks automatically once verified.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {isConfirmed && (
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs text-emerald-700 font-semibold flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>Ready for Admission</span>
                    </span>
                    <button
                      onClick={() => setSelectedTicketBooking(b)}
                      className="px-4 py-2 bg-[#E31837] hover:bg-[#c91430] text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>View Turnstile QR Ticket</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket View Modal */}
      {selectedTicketBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-2xl my-8">
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setSelectedTicketBooking(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <TicketView booking={selectedTicketBooking} />
          </div>
        </div>
      )}
    </div>
  );
};
