import React, { useState } from 'react';
import { storageService } from '../../services/storage';
import { Booking } from '../../types';
import {
  QrCode,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Search,
  Film,
  Calendar,
  Clock,
  User,
  ShieldCheck,
} from 'lucide-react';

export const AdminValidator: React.FC = () => {
  const [tokenInput, setTokenInput] = useState('');
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    booking?: Booking;
    status: 'VALID_NEW' | 'ALREADY_USED' | 'CANCELLED' | 'INVALID';
    message: string;
  } | null>(null);

  const recentBookings = storageService.getBookings().slice(0, 5);

  const handleValidate = (tokenOrId: string) => {
    if (!tokenOrId.trim()) return;
    const result = storageService.validateTicketToken(tokenOrId.trim(), 'rajanbhogta (Gate Staff)');
    setValidationResult(result);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2 border-b border-white/10 pb-6">
        <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 border border-emerald-600/50 text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
          <QrCode className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white font-cinema">
          Turnstile QR Ticket Validator
        </h1>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Scan QR barcode or input the cryptographic ticket token to verify entry credentials and prevent duplicate entry at Laxmi Cineplex gates.
        </p>
      </div>

      {/* Input Box */}
      <div className="p-6 rounded-3xl bg-[#0e1422] border border-white/10 shadow-2xl space-y-4">
        <label className="text-xs text-slate-300 font-bold uppercase tracking-wider block">
          Scan or Enter Ticket Validation Token / Booking ID
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="e.g. TOKEN_LXM-... or LXM-..."
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-11 pr-4 py-3 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>
          <button
            onClick={() => handleValidate(tokenInput)}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-red-600/30 flex items-center justify-center space-x-2 transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Validate & Admit</span>
          </button>
        </div>

        {/* Quick test token helpers */}
        {recentBookings.length > 0 && (
          <div className="pt-2 border-t border-white/5 space-y-1.5">
            <span className="text-[11px] text-slate-500 font-semibold uppercase block">
              Quick Test: Recent Booking Tokens:
            </span>
            <div className="flex flex-wrap gap-2">
              {recentBookings.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setTokenInput(b.ticketToken);
                    handleValidate(b.ticketToken);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-300 font-mono border border-white/5 transition-colors"
                >
                  {b.id} ({b.customerName})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Validation Result Display */}
      {validationResult && (
        <div
          className={`p-6 rounded-3xl border-2 shadow-2xl transition-all space-y-4 ${
            validationResult.status === 'VALID_NEW'
              ? 'bg-emerald-950/40 border-emerald-500'
              : validationResult.status === 'ALREADY_USED'
              ? 'bg-amber-950/40 border-amber-500'
              : 'bg-rose-950/40 border-rose-500'
          }`}
        >
          <div className="flex items-start space-x-4">
            {validationResult.status === 'VALID_NEW' ? (
              <CheckCircle className="w-10 h-10 text-emerald-400 flex-shrink-0" />
            ) : validationResult.status === 'ALREADY_USED' ? (
              <AlertTriangle className="w-10 h-10 text-amber-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-10 h-10 text-rose-400 flex-shrink-0" />
            )}

            <div className="space-y-1">
              <span
                className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded ${
                  validationResult.status === 'VALID_NEW'
                    ? 'bg-emerald-900 text-emerald-300'
                    : validationResult.status === 'ALREADY_USED'
                    ? 'bg-amber-900 text-amber-300'
                    : 'bg-rose-900 text-rose-300'
                }`}
              >
                {validationResult.status.replace('_', ' ')}
              </span>
              <h3 className="text-lg font-bold text-white pt-1">{validationResult.message}</h3>
            </div>
          </div>

          {validationResult.booking && (
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 space-y-3 text-xs">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="font-mono text-slate-400 font-bold">
                  Ref: {validationResult.booking.id}
                </span>
                <span className="text-white font-bold">{validationResult.booking.screenName}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Movie</span>
                  <div className="text-white font-bold text-sm">
                    {validationResult.booking.movieTitle}
                  </div>
                  <div className="text-slate-400">
                    {validationResult.booking.showDate} at {validationResult.booking.showTime} (IST)
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Seats Admitted</span>
                  <div className="font-mono text-red-400 font-black text-sm">
                    {validationResult.booking.seats.map((s) => s.seatLabel).join(', ')}
                  </div>
                  <div className="text-slate-400">
                    Guest: {validationResult.booking.customerName} ({validationResult.booking.customerPhone})
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
