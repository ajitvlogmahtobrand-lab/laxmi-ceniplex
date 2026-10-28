import React, { useState, useEffect } from 'react';
import { storageService } from '../../services/storage';
import {
  DollarSign,
  Ticket,
  Film,
  Clock,
  Plus,
  QrCode,
  Calendar,
} from 'lucide-react';

interface AdminDashboardProps {
  onSelectTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSelectTab }) => {
  const [, setRefreshKey] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setRefreshKey((k) => k + 1);
    window.addEventListener('lxm_storage_update', handleUpdate);
    return () => window.removeEventListener('lxm_storage_update', handleUpdate);
  }, []);

  const analytics = storageService.getAnalytics();
  const bookings = storageService.getBookings(undefined, true).slice(0, 8); // recent 8
  const auditLogs = storageService.getAuditLogs().slice(0, 6); // recent 6

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-red-50/80 via-white to-red-50/40 border border-red-100 shadow-xs">
        <div>
          <span className="text-[11px] font-bold text-[#E31837] uppercase tracking-wider">
            Cinema Management System
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#171923] font-cinema mt-1">
            Laxmi Cineplex Overview
          </h1>
          <p className="text-xs text-[#667085] mt-1">
            Live operational dashboard for Hazaribagh screens, box office revenue, and screenings.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onSelectTab('movies')}
            className="px-3.5 py-2 bg-[#E31837] hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md shadow-red-600/20 flex items-center space-x-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Movie</span>
          </button>
          <button
            onClick={() => onSelectTab('shows')}
            className="px-3.5 py-2 bg-white hover:bg-gray-50 text-[#171923] text-xs font-bold rounded-xl border border-[#E5E7EB] shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <Calendar className="w-4 h-4 text-[#E31837]" />
            <span>Schedule Show</span>
          </button>
          <button
            onClick={() => onSelectTab('validator')}
            className="px-3.5 py-2 bg-white hover:bg-gray-50 text-[#171923] text-xs font-bold rounded-xl border border-[#E5E7EB] shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <QrCode className="w-4 h-4 text-emerald-600" />
            <span>Gate QR Scanner</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[#667085]">
            <span className="text-xs font-bold uppercase tracking-wider">Net Verified Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#171923] font-mono">
            ₹{analytics.netRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-[#667085]">
            Gross: ₹{analytics.grossRevenue.toLocaleString('en-IN')} • Refunds: ₹{analytics.totalRefunds}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[#667085]">
            <span className="text-xs font-bold uppercase tracking-wider">Tickets Sold</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 text-[#E31837] flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#171923] font-mono">
            {analytics.ticketsSold}
          </div>
          <div className="text-[11px] text-[#667085]">
            Across {analytics.totalBookings} paid bookings
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[#667085]">
            <span className="text-xs font-bold uppercase tracking-wider">Active Movies</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#171923] font-mono">
            {analytics.activeMovies}
          </div>
          <div className="text-[11px] text-[#667085]">
            Screening on Screen 1 & Screen 2
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[#667085]">
            <span className="text-xs font-bold uppercase tracking-wider">Shows Today</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#171923] font-mono">
            {analytics.todayShows}
          </div>
          <div className="text-[11px] text-[#667085]">
            Scheduled across both auditoriums
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Bookings & Movie Gross Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Bookings (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
            <div>
              <h3 className="text-base font-bold text-[#171923]">Recent Box Office Bookings</h3>
              <p className="text-xs text-[#667085]">Latest online & counter transactions</p>
            </div>
            <button
              onClick={() => onSelectTab('bookings')}
              className="text-xs font-semibold text-[#E31837] hover:underline"
            >
              View All Bookings →
            </button>
          </div>

          {bookings.length === 0 ? (
            <div className="py-12 text-center text-[#667085] text-xs">
              No bookings recorded yet. New customer orders will appear here in real time.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5E7EB] text-[#667085] uppercase text-[10px]">
                    <th className="py-2.5">Ref ID</th>
                    <th className="py-2.5">Movie</th>
                    <th className="py-2.5">Customer</th>
                    <th className="py-2.5">Seats</th>
                    <th className="py-2.5">Amount</th>
                    <th className="py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 font-mono font-bold text-[#171923]">{b.id}</td>
                      <td className="py-3 font-medium text-[#171923]">{b.movieTitle}</td>
                      <td className="py-3 text-[#667085]">{b.customerName}</td>
                      <td className="py-3 font-mono text-[#667085]">
                        {b.seats.map((s) => s.seatLabel).join(', ')}
                      </td>
                      <td className="py-3 font-mono font-bold text-[#171923]">₹{b.totalAmount}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            b.bookingStatus === 'CONFIRMED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-[#E31837] border border-red-200'
                          }`}
                        >
                          {b.bookingStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Movie Performance & Audit Log Snippet (1 Col) */}
        <div className="space-y-6">
          {/* Top Movie Gross */}
          <div className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
            <h3 className="text-base font-bold text-[#171923]">Movie Revenue Share</h3>
            {analytics.movieStats.length === 0 ? (
              <p className="text-xs text-[#667085]">No movie revenue recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {analytics.movieStats.map((item) => (
                  <div key={item.title} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-[#171923] truncate max-w-[170px]">
                        {item.title}
                      </span>
                      <span className="font-mono text-[#E31837] font-bold">
                        ₹{item.revenue.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[#E31837] h-full rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round((item.revenue / (analytics.grossRevenue || 1)) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audit trail snippet */}
          <div className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#171923] uppercase tracking-wider">
                Admin Audit Log
              </h3>
              <button
                onClick={() => onSelectTab('settings')}
                className="text-[11px] text-[#E31837] hover:underline"
              >
                View Log →
              </button>
            </div>
            <div className="space-y-2 text-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-2 rounded-lg bg-gray-50 border border-[#E5E7EB] space-y-0.5">
                  <div className="flex justify-between text-[10px] text-[#667085]">
                    <span className="font-mono text-[#E31837] font-semibold">{log.action}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString('en-IN')}</span>
                  </div>
                  <p className="text-[#171923] text-[11px] line-clamp-1">{log.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
