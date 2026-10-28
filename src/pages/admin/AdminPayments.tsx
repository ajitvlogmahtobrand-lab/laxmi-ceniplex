import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  QrCode,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  User,
  Phone,
  Film,
  Building,
  Image,
  Eye,
  AlertTriangle,
  X,
  CreditCard,
  CheckCircle,
  Calendar,
  FileCheck,
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { Booking } from '../../types';

export const AdminPayments: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>(() => storageService.getBookings());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'PENDING_VERIFICATION' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'REFUNDED'
  >('PENDING_VERIFICATION');

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [reviewModalBooking, setReviewModalBooking] = useState<Booking | null>(null);
  const [rejectionModalBooking, setRejectionModalBooking] = useState<Booking | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);
  const [bankConfirmedCheck, setBankConfirmedCheck] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  const refreshData = () => {
    setBookings(storageService.getBookings());
  };

  useEffect(() => {
    const handleUpdate = () => refreshData();
    window.addEventListener('lxm_storage_update', handleUpdate);
    return () => window.removeEventListener('lxm_storage_update', handleUpdate);
  }, []);

  const upiConfig = storageService.getSettings().upiConfig || {
    enabled: true,
    payeeName: 'Rajan Bhogta',
    bankName: 'India Post Payment Bank 3764',
    upiId: 'rajanbhogta714@okhdfcbank',
    qrImagePath: '/images/rajan_bhogta_upi_qr.jpeg',
    instructions: '',
    allowManualVerification: true,
  };

  const handleCopyUpiId = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUtr(text);
    setTimeout(() => setCopiedUtr(null), 2500);
  };

  // Open Accept Payment Review Modal
  const handleOpenAcceptModal = (booking: Booking) => {
    setReviewModalBooking(booking);
    setBankConfirmedCheck(false);
  };

  // Confirm Verification & Accept Payment
  const handleConfirmAccept = () => {
    if (!reviewModalBooking) return;
    if (!bankConfirmedCheck) {
      alert('Please check the confirmation box verifying that the payment credit was sighted in the India Post Payment Bank / HDFC bank statement.');
      return;
    }

    setIsProcessing(true);
    try {
      storageService.verifyUpiPayment(reviewModalBooking.id, 'rajanbhogta');
      setFeedbackMessage({
        type: 'success',
        text: `✓ Payment verified for booking ${reviewModalBooking.id}! Customer ticket has been activated and admission QR code is live.`,
      });
      setReviewModalBooking(null);
      refreshData();
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Failed to verify payment.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Open Rejection Modal
  const handleOpenRejection = (booking: Booking) => {
    setRejectionModalBooking(booking);
    setRejectionReason('');
  };

  // Confirm Payment Rejection
  const handleConfirmRejection = () => {
    if (!rejectionModalBooking) return;
    if (!rejectionReason.trim()) {
      alert('Please provide a specific rejection reason (e.g., UTR not matching bank credit statement, insufficient amount, etc.).');
      return;
    }

    setIsProcessing(true);
    try {
      storageService.rejectUpiPayment(rejectionModalBooking.id, rejectionReason.trim(), 'rajanbhogta');
      setFeedbackMessage({
        type: 'success',
        text: `Booking ${rejectionModalBooking.id} payment has been rejected. Held seats have been released back to theater inventory.`,
      });
      setRejectionModalBooking(null);
      refreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to reject payment.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Status filter
      if (statusFilter === 'PENDING_VERIFICATION') {
        if (b.bookingStatus !== 'PENDING_VERIFICATION') return false;
      } else if (statusFilter === 'ACCEPTED') {
        if (b.bookingStatus !== 'CONFIRMED') return false;
      } else if (statusFilter === 'REJECTED') {
        if (b.bookingStatus !== 'REJECTED') return false;
      } else if (statusFilter === 'EXPIRED') {
        if (b.bookingStatus !== 'EXPIRED') return false;
      } else if (statusFilter === 'REFUNDED') {
        if (b.bookingStatus !== 'REFUNDED') return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesId = b.id.toLowerCase().includes(term);
        const matchesUtr = (b.upiReference || '').toLowerCase().includes(term);
        const matchesName = b.customerName.toLowerCase().includes(term);
        const matchesPhone = b.customerPhone.includes(term);
        const matchesMovie = b.movieTitle.toLowerCase().includes(term);
        return matchesId || matchesUtr || matchesName || matchesPhone || matchesMovie;
      }

      return true;
    });
  }, [bookings, statusFilter, searchTerm]);

  // Statistics Counts
  const counts = useMemo(() => {
    return {
      all: bookings.length,
      pending: bookings.filter((b) => b.bookingStatus === 'PENDING_VERIFICATION').length,
      accepted: bookings.filter((b) => b.bookingStatus === 'CONFIRMED').length,
      rejected: bookings.filter((b) => b.bookingStatus === 'REJECTED').length,
      expired: bookings.filter((b) => b.bookingStatus === 'EXPIRED').length,
      refunded: bookings.filter((b) => b.bookingStatus === 'REFUNDED').length,
    };
  }, [bookings]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white font-cinema flex items-center space-x-2.5">
            <ShieldCheck className="w-6 h-6 text-red-500" />
            <span>Payment Verification &amp; Box Office Desk</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Reconcile customer UPI QR transfers with India Post Payment Bank / HDFC credit records before issuing admission turnstile tickets.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={refreshData}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center space-x-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Records</span>
          </button>
        </div>
      </div>

      {/* Active UPI Configuration Summary Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 bg-white p-1 rounded-xl flex items-center justify-center border border-white/20 flex-shrink-0">
            <img
              src={upiConfig.qrImagePath || '/images/rajan_bhogta_upi_qr.jpeg'}
              alt="UPI QR"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-white">{upiConfig.payeeName}</span>
              <span className="text-[10px] bg-red-950 text-red-400 border border-red-700 px-2 py-0.5 rounded-full font-mono uppercase">
                Active QR Account
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
              <span>{upiConfig.bankName}</span>
              <span>•</span>
              <code className="text-amber-300 font-mono font-semibold">{upiConfig.upiId}</code>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400">Box Office Mode:</span>
          <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-1 rounded-lg font-semibold flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Manual Statement Reconciliation Active</span>
          </span>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between transition-all ${
            feedbackMessage.type === 'error'
              ? 'bg-rose-950/80 border-rose-700 text-rose-200'
              : 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {feedbackMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            )}
            <span className="font-medium">{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Tabs and Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-red-950 text-red-400 border border-red-700 shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All Payments ({counts.all})
            </button>
            <button
              onClick={() => setStatusFilter('PENDING_VERIFICATION')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                statusFilter === 'PENDING_VERIFICATION'
                  ? 'bg-amber-950 text-amber-300 border border-amber-600 shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Pending Verification ({counts.pending})</span>
            </button>
            <button
              onClick={() => setStatusFilter('ACCEPTED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                statusFilter === 'ACCEPTED'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-700 shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Accepted ({counts.accepted})</span>
            </button>
            <button
              onClick={() => setStatusFilter('REJECTED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                statusFilter === 'REJECTED'
                  ? 'bg-rose-950 text-rose-400 border border-rose-700 shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Rejected ({counts.rejected})</span>
            </button>
            <button
              onClick={() => setStatusFilter('EXPIRED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'EXPIRED'
                  ? 'bg-slate-700 text-white border border-slate-600'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Expired ({counts.expired})
            </button>
            <button
              onClick={() => setStatusFilter('REFUNDED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'REFUNDED'
                  ? 'bg-purple-950 text-purple-400 border border-purple-700'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Refunded ({counts.refunded})
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Booking ID, UTR, Phone, Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="rounded-2xl bg-[#0e1422] border border-white/10 shadow-2xl overflow-hidden">
        {filteredBookings.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs space-y-2">
            <ShieldCheck className="w-10 h-10 mx-auto text-slate-600 mb-1" />
            <p className="font-bold text-white text-base">No payments found</p>
            <p className="text-slate-500">
              There are no transactions matching the selected filter ({statusFilter}).
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900/90 border-b border-white/10 text-slate-400 uppercase text-[10px]">
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Movie &amp; Showtime</th>
                  <th className="py-3 px-4">Seats</th>
                  <th className="py-3 px-4">Payable Amount</th>
                  <th className="py-3 px-4">UTR / Transaction Ref</th>
                  <th className="py-3 px-4">Receipt</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredBookings.map((b) => {
                  const isPending = b.bookingStatus === 'PENDING_VERIFICATION';
                  const isConfirmed = b.bookingStatus === 'CONFIRMED';
                  const isRejected = b.bookingStatus === 'REJECTED';

                  return (
                    <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Booking Ref */}
                      <td className="py-3.5 px-4 font-mono">
                        <span className="font-bold text-white text-xs block">{b.id}</span>
                        <span className="text-[10px] text-slate-500 block">
                          {new Date(b.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white text-xs block">{b.customerName}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">{b.customerPhone}</span>
                      </td>

                      {/* Movie & Show */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-200 text-xs block">{b.movieTitle}</span>
                        <span className="text-[10px] text-slate-400 block">
                          {b.screenName} • {b.showDate} at {b.showTime}
                        </span>
                      </td>

                      {/* Seats */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-white font-bold text-xs">
                          {b.seats.map((s) => s.seatLabel).join(', ')}
                        </span>
                        <span className="text-[10px] text-slate-400 block">({b.seats.length} seats)</span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-mono">
                        <span className="font-black text-emerald-400 text-sm block">
                          ₹{b.totalAmount.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-500">UPI QR</span>
                      </td>

                      {/* UTR */}
                      <td className="py-3.5 px-4 font-mono">
                        {b.upiReference ? (
                          <div className="flex items-center space-x-1.5">
                            <span className="bg-slate-950 px-2 py-1 rounded text-amber-300 font-bold text-xs border border-white/5">
                              {b.upiReference}
                            </span>
                            <button
                              onClick={() => handleCopyUpiId(b.upiReference!)}
                              className="text-slate-500 hover:text-white p-1"
                              title="Copy UTR"
                            >
                              {copiedUtr === b.upiReference ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-600 italic text-[11px]">No UTR provided</span>
                        )}
                      </td>

                      {/* Receipt Screenshot */}
                      <td className="py-3.5 px-4">
                        {b.receiptUrl ? (
                          <button
                            type="button"
                            onClick={() => setPreviewReceiptUrl(b.receiptUrl!)}
                            className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-semibold border border-white/5 cursor-pointer"
                          >
                            <Image className="w-3 h-3 text-red-400" />
                            <span>View Proof</span>
                          </button>
                        ) : (
                          <span className="text-slate-600 text-[10px] italic">No receipt file</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center space-x-1 ${
                            isPending
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-600'
                              : isConfirmed
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600'
                              : isRejected
                              ? 'bg-rose-950/80 text-rose-300 border border-rose-600'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {isPending && <Clock className="w-3 h-3 animate-pulse text-amber-400" />}
                          {isConfirmed && <CheckCircle className="w-3 h-3 text-emerald-400" />}
                          {isRejected && <XCircle className="w-3 h-3 text-rose-400" />}
                          <span>{b.bookingStatus.replace('_', ' ')}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold transition-colors cursor-pointer"
                          title="View Details & Audit Trail"
                        >
                          <Eye className="w-3.5 h-3.5 inline mr-1" />
                          <span>Details</span>
                        </button>

                        {isPending && (
                          <>
                            <button
                              onClick={() => handleOpenAcceptModal(b)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold shadow-md shadow-emerald-700/20 transition-colors cursor-pointer"
                              title="Accept & Confirm Ticket"
                            >
                              <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
                              <span>Accept</span>
                            </button>

                            <button
                              onClick={() => handleOpenRejection(b)}
                              className="px-2.5 py-1 rounded-lg bg-rose-900/80 hover:bg-rose-800 text-rose-200 text-[11px] font-bold border border-rose-700 transition-colors cursor-pointer"
                              title="Reject Payment"
                            >
                              <XCircle className="w-3.5 h-3.5 inline mr-1" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review & Accept Payment Modal */}
      {reviewModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#0e1422] border border-emerald-600/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-white font-bold text-base font-cinema">
                  Verify &amp; Accept UPI Payment
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalBooking(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-900 rounded-2xl border border-white/5 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Booking Reference:</span>
                <span className="font-mono font-bold text-white">{reviewModalBooking.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Customer:</span>
                <span className="font-bold text-white">{reviewModalBooking.customerName} ({reviewModalBooking.customerPhone})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Movie &amp; Show:</span>
                <span className="font-medium text-slate-200">{reviewModalBooking.movieTitle} • {reviewModalBooking.showTime}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Seats ({reviewModalBooking.seats.length}):</span>
                <span className="font-mono font-bold text-white">{reviewModalBooking.seats.map((s) => s.seatLabel).join(', ')}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <span className="text-slate-300 font-bold">Booking Amount:</span>
                <span className="font-mono font-black text-emerald-400 text-lg">
                  ₹{reviewModalBooking.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-bold">Customer UTR:</span>
                <span className="font-mono font-bold text-amber-300 bg-slate-950 px-2 py-0.5 rounded border border-white/10">
                  {reviewModalBooking.upiReference}
                </span>
              </div>
            </div>

            {/* Receipt Preview Thumbnail if uploaded */}
            {reviewModalBooking.receiptUrl && (
              <div className="p-3 bg-slate-950 border border-white/10 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={reviewModalBooking.receiptUrl}
                    alt="Receipt"
                    className="w-12 h-12 object-cover rounded-lg border border-white/10"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Payment Receipt Attached</span>
                    <span className="text-[10px] text-slate-400">Uploaded by customer</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewReceiptUrl(reviewModalBooking.receiptUrl!)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  Inspect Full Image
                </button>
              </div>
            )}

            {/* Verification Checklist */}
            <label className="flex items-start space-x-3 p-3.5 bg-emerald-950/30 border border-emerald-600/40 rounded-2xl cursor-pointer">
              <input
                type="checkbox"
                checked={bankConfirmedCheck}
                onChange={(e) => setBankConfirmedCheck(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs text-emerald-200 leading-relaxed">
                I confirm that I have verified the credit of <strong>₹{reviewModalBooking.totalAmount}</strong> with UTR <strong>{reviewModalBooking.upiReference}</strong> in the India Post Payment Bank 3764 statement, and that this UTR is not a duplicate.
              </span>
            </label>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setReviewModalBooking(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAccept}
                disabled={!bankConfirmedCheck || isProcessing}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-emerald-600/30 transition-all flex items-center space-x-2 cursor-pointer"
              >
                {isProcessing ? (
                  <span>Activating Ticket...</span>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirm &amp; Issue Ticket</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Payment Modal */}
      {rejectionModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#0e1422] border border-rose-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <h3 className="text-white font-bold text-base font-cinema">
                  Reject UPI Payment
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectionModalBooking(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Rejecting payment for booking <strong className="font-mono text-white">{rejectionModalBooking.id}</strong> (Customer: {rejectionModalBooking.customerName}). This will immediately release the held seats back to inventory.
            </p>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Reason for Rejection <span className="text-red-400">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g., UTR not found in India Post Payment Bank credit statement; Amount credited was less than ₹180; Fraudulent / recycled transaction ID."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-500 placeholder:text-slate-600"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  'UTR not found in bank statement',
                  'Incorrect transfer amount',
                  'Duplicate / expired transaction reference',
                  'Payment credited to wrong account',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRejectionReason(preset)}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-lg"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setRejectionModalBooking(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                disabled={!rejectionReason.trim() || isProcessing}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white shadow-lg shadow-rose-600/30 transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details & Audit Trail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#0e1422] border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 my-6">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-red-500" />
                <h3 className="text-white font-bold text-base font-cinema">
                  Booking &amp; Payment Verification Record
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-900 rounded-xl border border-white/5 space-y-1.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Customer Information</span>
                <p className="font-bold text-white text-sm">{selectedBooking.customerName}</p>
                <p className="text-slate-300">Phone: {selectedBooking.customerPhone}</p>
                <p className="text-slate-400">Email: {selectedBooking.customerEmail}</p>
              </div>

              <div className="p-3.5 bg-slate-900 rounded-xl border border-white/5 space-y-1.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Show &amp; Auditorium</span>
                <p className="font-bold text-white text-sm">{selectedBooking.movieTitle}</p>
                <p className="text-slate-300">{selectedBooking.screenName}</p>
                <p className="text-slate-400">{selectedBooking.showDate} at {selectedBooking.showTime} (IST)</p>
              </div>
            </div>

            {/* Financial Details */}
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Seats Reserved:</span>
                <span className="font-mono font-bold text-white">{selectedBooking.seats.map((s) => `${s.seatLabel} (₹${s.price})`).join(', ')}</span>
              </div>
              {selectedBooking.concessions?.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Concessions / Snacks:</span>
                  <span className="font-medium text-slate-200">
                    {selectedBooking.concessions.map((c) => `${c.name} x${c.quantity}`).join(', ')}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Subtotal:</span>
                <span className="font-mono text-slate-200">₹{selectedBooking.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Convenience Fee + GST:</span>
                <span className="font-mono text-slate-200">₹{selectedBooking.convenienceFee + selectedBooking.gstAmount}</span>
              </div>
              {selectedBooking.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Coupon Discount ({selectedBooking.couponCode}):</span>
                  <span className="font-mono">-₹{selectedBooking.discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-white/10 font-bold text-sm">
                <span className="text-white">Total Amount Received:</span>
                <span className="font-mono text-emerald-400">₹{selectedBooking.totalAmount}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-400">Submitted UTR Reference:</span>
                <span className="font-mono font-bold text-amber-300 bg-slate-950 px-2 py-0.5 rounded border border-white/10">
                  {selectedBooking.upiReference || 'N/A'}
                </span>
              </div>
            </div>

            {/* Rejection notice if rejected */}
            {selectedBooking.rejectionReason && (
              <div className="p-3 bg-rose-950/60 border border-rose-700/60 rounded-xl text-xs text-rose-200 space-y-0.5">
                <span className="font-bold text-rose-300 block">Rejection Reason:</span>
                <p>{selectedBooking.rejectionReason}</p>
                <p className="text-[10px] text-slate-400">Recorded by {selectedBooking.verifiedBy || 'Admin'} on {selectedBooking.verifiedAt}</p>
              </div>
            )}

            {/* Audit History */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Booking Status History &amp; Audit Trail
              </span>
              <div className="p-3 bg-slate-950 border border-white/5 rounded-xl space-y-2 text-xs font-mono max-h-40 overflow-y-auto">
                {selectedBooking.statusHistory && selectedBooking.statusHistory.length > 0 ? (
                  selectedBooking.statusHistory.map((h, i) => (
                    <div key={i} className="text-slate-400 border-b border-white/5 pb-1 last:border-none">
                      <span className="text-white font-bold">[{h.status}]</span>{' '}
                      <span className="text-slate-500 text-[10px]">
                        {new Date(h.changedAt).toLocaleString('en-IN')}
                      </span>{' '}
                      <span className="text-amber-400 text-[11px]">by {h.changedBy}</span>
                      {h.notes && <p className="text-[11px] text-slate-300 font-sans mt-0.5">{h.notes}</p>}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-xs">Created: {new Date(selectedBooking.createdAt).toLocaleString('en-IN')}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Receipt Image Viewer Modal */}
      {previewReceiptUrl && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setPreviewReceiptUrl(null)}
        >
          <div className="bg-[#0e1422] p-4 rounded-3xl max-w-lg w-full space-y-3 border border-white/20" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center text-white pb-2 border-b border-white/10">
              <span className="font-bold text-sm">Customer Payment Screenshot</span>
              <button onClick={() => setPreviewReceiptUrl(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto rounded-xl border border-white/10">
              <img src={previewReceiptUrl} alt="Payment Receipt" className="w-full h-auto" />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setPreviewReceiptUrl(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
