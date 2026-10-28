import React, { useState, useEffect } from 'react';
import { storageService } from '../../services/storage';
import { Booking } from '../../types';
import {
  Ticket,
  Search,
  Filter,
  Eye,
  Ban,
  CheckCircle,
  AlertCircle,
  X,
  Calendar,
  Clock,
  Printer,
  ShieldCheck,
} from 'lucide-react';

export const AdminBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>(() => storageService.getBookings(undefined, true));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancellationReason, setCancellationReason] = useState('Customer requested box office cancellation');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  const refreshBookings = () => {
    setBookings(storageService.getBookings(undefined, true));
  };

  useEffect(() => {
    const handleUpdate = () => refreshBookings();
    window.addEventListener('lxm_storage_update', handleUpdate);
    return () => window.removeEventListener('lxm_storage_update', handleUpdate);
  }, []);

  const handleOpenCancel = (booking: Booking) => {
    setSelectedBooking(booking);
    setCancellationReason('Customer requested box office cancellation');
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = () => {
    if (!selectedBooking) return;
    try {
      const res = storageService.cancelBooking(selectedBooking.id, cancellationReason, 'rajanbhogta (Admin)');
      setFeedback({
        message: `Booking #${selectedBooking.id} cancelled. ₹${res.refundAmount} refunded.`,
        isError: false,
      });
      setIsCancelModalOpen(false);
      setSelectedBooking(null);
      refreshBookings();
    } catch (err: any) {
      setFeedback({ message: err.message || 'Error cancelling booking', isError: true });
    }
  };

  const filtered = bookings.filter((b) => {
    if (statusFilter !== 'ALL' && b.bookingStatus !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        b.id.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.customerPhone.includes(q) ||
        b.movieTitle.toLowerCase().includes(q) ||
        b.ticketToken.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white font-cinema">Booking & Refund Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Track transactions, inspect e-tickets, and process authorized cancellations and refunds.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between border ${
            feedback.isError
              ? 'bg-rose-950/80 border-rose-700 text-rose-200'
              : 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.isError ? (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search booking ID, customer name, phone, movie..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'CONFIRMED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                statusFilter === st
                  ? 'bg-red-950 text-red-400 border border-red-700'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="rounded-2xl bg-[#0e1422] border border-white/10 shadow-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs">
            No bookings found matching query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900/90 border-b border-white/10 text-slate-400 uppercase text-[10px]">
                  <th className="py-3 px-4">Ref ID</th>
                  <th className="py-3 px-4">Movie & Screen</th>
                  <th className="py-3 px-4">Show Date & Time</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Seats</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Admitted</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((booking) => (
                  <tr key={booking.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {booking.id}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-white text-sm">{booking.movieTitle}</span>
                      <span className="text-slate-400 text-[10px] block">{booking.screenName}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      <div>{booking.showDate}</div>
                      <div className="text-[10px] text-red-400 font-bold">{booking.showTime} (IST)</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{booking.customerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{booking.customerPhone}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-200">
                      {booking.seats.map((s) => s.seatLabel).join(', ')}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      ₹{booking.totalAmount}
                    </td>
                    <td className="py-3 px-4">
                      {booking.isAdmitted ? (
                        <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Admitted</span>
                        </span>
                      ) : (
                        <span className="text-slate-500">Not Scanned</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          booking.bookingStatus === 'CONFIRMED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {booking.bookingStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {booking.bookingStatus === 'CONFIRMED' && (
                          <button
                            onClick={() => handleOpenCancel(booking)}
                            className="p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300"
                            title="Cancel Booking & Refund"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && !isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#0e1422] border border-white/20 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-white font-bold text-base">Booking #{selectedBooking.id}</h3>
              <button onClick={() => setSelectedBooking(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-900 rounded-xl space-y-1">
                <div className="text-white font-bold text-sm">{selectedBooking.movieTitle}</div>
                <div className="text-slate-400">
                  {selectedBooking.screenName} • {selectedBooking.showDate} at {selectedBooking.showTime}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-900/60 rounded-xl">
                  <span className="text-slate-500 uppercase text-[10px] block">Customer</span>
                  <div className="text-white font-semibold">{selectedBooking.customerName}</div>
                  <div className="text-slate-400 font-mono">{selectedBooking.customerPhone}</div>
                  <div className="text-slate-400 truncate">{selectedBooking.customerEmail}</div>
                </div>

                <div className="p-3 bg-slate-900/60 rounded-xl">
                  <span className="text-slate-500 uppercase text-[10px] block">Payment Gateway</span>
                  <div className="text-white font-mono">{selectedBooking.paymentId || 'pay_test_verified'}</div>
                  <div className="text-emerald-400 font-bold">{selectedBooking.paymentStatus}</div>
                  <div className="text-slate-400 text-[10px]">{selectedBooking.paymentMethod}</div>
                </div>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl space-y-1">
                <span className="text-slate-500 uppercase text-[10px] block">Seats & Items</span>
                <div className="font-mono text-white">
                  {selectedBooking.seats.map((s) => `${s.seatLabel} (₹${s.price})`).join(', ')}
                </div>
                {selectedBooking.concessions && selectedBooking.concessions.length > 0 && (
                  <div className="text-slate-400 text-[11px] pt-1">
                    F&B: {selectedBooking.concessions.map((c) => `${c.name} x ${c.quantity}`).join(', ')}
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl flex justify-between items-center font-mono">
                <span className="text-slate-400">Total Amount Paid:</span>
                <span className="text-lg font-black text-red-400">₹{selectedBooking.totalAmount}</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 space-y-1">
                <span className="text-slate-500 uppercase text-[10px] block">Ticket Validation Token</span>
                <span className="font-mono text-slate-300 text-[11px] break-all">{selectedBooking.ticketToken}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedBooking(null)}
              className="w-full py-2 bg-slate-800 text-white text-xs font-bold rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Cancellation & Refund Modal */}
      {isCancelModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#0e1422] border border-rose-600/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-rose-500">
              <Ban className="w-5 h-5" />
              <h3 className="text-white font-bold text-base">Authorize Cancellation & Refund</h3>
            </div>

            <p className="text-xs text-slate-300">
              You are cancelling booking #{selectedBooking.id} for {selectedBooking.customerName}.
              Base ticket fare will be refunded; convenience fee remains retained per cinema policy.
            </p>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Cancellation Audit Reason *</label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow"
              >
                Execute Cancellation & Release Seats
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
