import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Booking, Movie } from '../../types';
import { Printer, Download, Share2, CheckCircle, MapPin, Calendar, Clock, Film, AlertCircle } from 'lucide-react';
import { storageService } from '../../services/storage';

interface TicketViewProps {
  booking: Booking;
  movie?: Movie;
  onCancelBooking?: (bookingId: string) => void;
}

export const TicketView: React.FC<TicketViewProps> = ({ booking, movie, onCancelBooking }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate crisp high-resolution QR code encoding the cryptographic token
    QRCode.toDataURL(booking.ticketToken, {
      width: 280,
      margin: 1,
      color: {
        dark: '#0B0F17',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR generation error:', err));
  }, [booking.ticketToken]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Laxmi Cineplex Ticket - ${booking.movieTitle}`,
        text: `My ticket for ${booking.movieTitle} at Laxmi Cineplex Hazaribagh on ${booking.showDate} at ${booking.showTime}. Booking ID: ${booking.id}`,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(
        `Laxmi Cineplex Ticket #${booking.id} - ${booking.movieTitle} (${booking.seats.map((s) => s.seatLabel).join(', ')}) on ${booking.showDate} at ${booking.showTime}`
      );
      alert('Ticket details copied to clipboard!');
    }
  };

  const isCancelled = booking.bookingStatus === 'CANCELLED';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top action bar (hidden during print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center space-x-2">
          <span
            className={`px-3 py-1 text-xs font-bold rounded-full flex items-center space-x-1.5 ${
              isCancelled
                ? 'bg-rose-950 text-rose-400 border border-rose-800'
                : booking.isAdmitted
                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>
              {isCancelled
                ? 'BOOKING CANCELLED'
                : booking.isAdmitted
                ? 'ALREADY ADMITTED'
                : 'CONFIRMED & VALID'}
            </span>
          </span>
          <span className="text-xs text-slate-400 font-mono">ID: {booking.id}</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            <span>Print Ticket</span>
          </button>
          <button
            onClick={handleShare}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-300" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Physical Ticket Simulation Card */}
      <div
        ref={ticketRef}
        className={`bg-white text-slate-900 rounded-3xl overflow-hidden shadow-2xl border-2 transition-all ${
          isCancelled ? 'border-rose-500 opacity-80' : 'border-red-600'
        }`}
      >
        {/* Cinema Brand Header Banner */}
        <div className="bg-[#0b0f17] text-white p-6 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center font-bold text-white shadow-lg shadow-red-600/40">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-cinema text-xl font-black tracking-tight text-white">
                  LAXMI <span className="text-red-500">CINEPLEX</span>
                </h2>
                <p className="text-[11px] text-slate-300 flex items-center font-medium">
                  <MapPin className="w-3 h-3 text-red-500 mr-1" />
                  Cinema Road, Hazaribagh, Jharkhand 825301
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">
                E-TICKET
              </span>
              <div className="font-mono text-xs text-slate-300 mt-1">{booking.id}</div>
            </div>
          </div>
        </div>

        {/* Ticket Main Details */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Movie Info & Time */}
          <div className="md:col-span-2 space-y-5">
            <div>
              <span className="text-xs uppercase font-bold text-red-600 tracking-wider">Now Screening</span>
              <h1 className="text-2xl font-black text-slate-900 leading-snug font-cinema">
                {booking.movieTitle}
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {booking.screenName}
              </p>
            </div>

            {/* Date, Time, Screen grid */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Show Date</div>
                  <div className="text-xs font-bold text-slate-800">
                    {new Date(booking.showDate).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Showtime</div>
                  <div className="text-xs font-bold text-slate-800">{booking.showTime} (IST)</div>
                </div>
              </div>
            </div>

            {/* Seats Pill Matrix */}
            <div>
              <div className="text-[11px] text-slate-400 uppercase font-bold mb-2">
                Confirmed Seats ({booking.seats.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {booking.seats.map((seat) => (
                  <div
                    key={seat.seatLabel}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-mono font-bold text-sm shadow-sm flex items-center space-x-1.5"
                  >
                    <span>{seat.seatLabel}</span>
                    <span className="text-[10px] text-red-400 font-sans font-semibold">
                      ({seat.category})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Guest & Payment snapshot */}
            <div className="border-t border-slate-200 pt-3 text-xs text-slate-600 flex flex-wrap justify-between gap-2">
              <div>
                <span className="text-slate-400">Patron:</span>{' '}
                <span className="font-semibold text-slate-800">{booking.customerName}</span>
                {booking.customerPhone && (
                  <span className="text-slate-500 font-mono ml-1">({booking.customerPhone})</span>
                )}
              </div>
              <div>
                <span className="text-slate-400">Paid:</span>{' '}
                <span className="font-black text-slate-900 font-mono">₹{booking.totalAmount}</span>{' '}
                <span className="text-[11px] text-emerald-600 font-bold">(VERIFIED)</span>
              </div>
            </div>
          </div>

          {/* Right Column: QR Code verification zone */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Scan at Turnstile Gate
            </div>

            {booking.bookingStatus === "PENDING_VERIFICATION" ? (
              <div className="w-44 h-44 rounded-xl bg-amber-50 border-2 border-dashed border-amber-400/60 p-3 flex flex-col items-center justify-center text-center text-amber-700">
                <Clock className="w-8 h-8 mb-1.5 animate-pulse text-amber-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">Verification Pending</span>
                <span className="text-[10px] font-mono text-zinc-600 mt-1 font-semibold">UTR: {booking.upiReference || "Pending"}</span>
                <span className="text-[9px] text-zinc-500 mt-1 leading-tight">Turnstile entry QR activates after Box Office approval</span>
              </div>
            ) : qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Ticket QR Code"
                className="w-44 h-44 object-contain rounded-lg border border-slate-200 bg-white p-2 shadow-sm"
              />
            ) : (
              <div className="w-44 h-44 bg-slate-200 animate-pulse rounded-lg flex items-center justify-center text-xs text-slate-500">
                Generating QR...
              </div>
            )}

            <div className="font-mono text-[10px] text-slate-400 mt-2 truncate max-w-[180px]">
              {booking.ticketToken}
            </div>

            <p className="text-[9px] text-slate-400 mt-1 max-w-[170px] leading-tight">
              Single entry per ticket. Valid for Laxmi Cineplex Hazaribagh only.
            </p>
          </div>
        </div>

        {/* Cancellation Notice if cancelled */}
        {isCancelled && (
          <div className="bg-rose-50 border-t border-rose-200 p-4 text-xs text-rose-800 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Cancellation Reason:</span> {booking.cancellationReason || 'Cancelled upon customer request'}.
              Refund amount of ₹{booking.refundAmount} has been processed back to source method.
            </div>
          </div>
        )}

        {/* Instructions bar */}
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-3 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between">
          <span>• Outside food and beverages not permitted inside screening halls.</span>
          <span>• Please arrive 15 minutes before showtime.</span>
        </div>
      </div>

      {/* Customer Cancellation Action */}
      {!isCancelled && onCancelBooking && (
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 text-center no-print">
          <p className="text-xs text-slate-400 mb-3">
            Change in plans? You can cancel your ticket up to 2 hours before the showtime per our cinema cancellation policy.
          </p>
          <button
            onClick={() => {
              if (window.confirm(`Are you sure you want to cancel booking ${booking.id}? Base ticket amount will be refunded.`)) {
                onCancelBooking(booking.id);
              }
            }}
            className="px-4 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 text-xs font-semibold rounded-xl transition-colors"
          >
            Cancel Booking & Request Refund
          </button>
        </div>
      )}
    </div>
  );
};
