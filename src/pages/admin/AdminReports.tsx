import React, { useState } from 'react';
import { storageService } from '../../services/storage';
import { BarChart3, Download, TrendingUp, DollarSign, Ticket, Calendar, Percent } from 'lucide-react';

export const AdminReports: React.FC = () => {
  const [reportPeriod, setReportPeriod] = useState<'DAILY' | 'WEEKLY' | 'ALL'>('ALL');
  const analytics = storageService.getAnalytics();
  const bookings = storageService.getBookings();
  const movies = storageService.getMovies();
  const screens = storageService.getScreens();
  const shows = storageService.getShows();

  // Export full financial and sales CSV report
  const handleExportFullCSV = () => {
    const headers = [
      'Booking_ID',
      'Show_Date',
      'Show_Time',
      'Movie_Title',
      'Screen_Name',
      'Customer_Name',
      'Customer_Phone',
      'Seats',
      'Ticket_Subtotal',
      'Convenience_Fee',
      'GST',
      'Discount',
      'Total_Paid',
      'Booking_Status',
      'Payment_Status',
      'Payment_ID',
      'Admitted_At_Gate',
    ];

    const rows = bookings.map((b) => [
      b.id,
      b.showDate,
      b.showTime,
      `"${b.movieTitle.replace(/"/g, '""')}"`,
      `"${b.screenName}"`,
      `"${b.customerName}"`,
      b.customerPhone,
      `"${b.seats.map((s) => s.seatLabel).join(';')}"`,
      b.subtotal,
      b.convenienceFee,
      b.gstAmount,
      b.discountAmount || 0,
      b.totalAmount,
      b.bookingStatus,
      b.paymentStatus,
      b.paymentId || 'N/A',
      b.isAdmitted ? 'YES' : 'NO',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laxmi_cineplex_financial_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white font-cinema">Sales & Analytics Reports</h1>
          <p className="text-xs text-slate-400 mt-1">
            Reconcile verified gateway transactions, analyze occupancy, and export authorized financial CSVs.
          </p>
        </div>

        <button
          onClick={handleExportFullCSV}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/30 flex items-center space-x-1.5 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Full Sales Report (CSV)</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0e1422] border border-white/10 space-y-1">
          <span className="text-xs font-bold uppercase text-slate-400">Total Net Collections</span>
          <div className="text-2xl font-black text-white font-mono">
            ₹{analytics.netRevenue.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold">100% Verified Gateway Settlements</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0e1422] border border-white/10 space-y-1">
          <span className="text-xs font-bold uppercase text-slate-400">Total Tickets Sold</span>
          <div className="text-2xl font-black text-white font-mono">{analytics.ticketsSold}</div>
          <span className="text-[11px] text-slate-400">{analytics.totalBookings} Completed Bookings</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0e1422] border border-white/10 space-y-1">
          <span className="text-xs font-bold uppercase text-slate-400">Refunds Processed</span>
          <div className="text-2xl font-black text-rose-400 font-mono">
            ₹{analytics.totalRefunds.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400">{analytics.cancelledBookings} Cancellations</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0e1422] border border-white/10 space-y-1">
          <span className="text-xs font-bold uppercase text-slate-400">Active Film Releases</span>
          <div className="text-2xl font-black text-white font-mono">{analytics.activeMovies}</div>
          <span className="text-[11px] text-slate-400">Across 2 Screen Auditoriums</span>
        </div>
      </div>

      {/* Movie-by-Movie Revenue Table */}
      <div className="p-6 rounded-3xl bg-[#0e1422] border border-white/10 shadow-2xl space-y-4">
        <h3 className="text-base font-bold text-white">Movie-wise Box Office Breakdown</h3>
        {analytics.movieStats.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No transactions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-slate-400 uppercase text-[10px]">
                  <th className="py-2.5">Movie Title</th>
                  <th className="py-2.5">Tickets Sold</th>
                  <th className="py-2.5">Gross Revenue (INR)</th>
                  <th className="py-2.5">Revenue Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {analytics.movieStats.map((item) => {
                  const share = Math.round((item.revenue / (analytics.grossRevenue || 1)) * 100);
                  return (
                    <tr key={item.title} className="hover:bg-white/[0.02]">
                      <td className="py-3 font-semibold text-white">{item.title}</td>
                      <td className="py-3 font-mono text-slate-300">{item.tickets} tickets</td>
                      <td className="py-3 font-mono font-bold text-red-400">
                        ₹{item.revenue.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-slate-900 rounded-full h-2 overflow-hidden">
                            <div className="bg-red-600 h-full rounded-full" style={{ width: `${share}%` }} />
                          </div>
                          <span className="font-mono text-[11px] text-slate-400">{share}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Screen Occupancy & Technical Utilization */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {screens.map((screen) => {
          const screenShows = shows.filter((s) => s.screenId === screen.id);
          const screenBookings = bookings.filter((b) => b.screenId === screen.id && b.bookingStatus === 'CONFIRMED');
          const totalSeatsSold = screenBookings.reduce((sum, b) => sum + b.seats.length, 0);

          return (
            <div key={screen.id} className="p-6 rounded-3xl bg-[#0e1422] border border-white/10 shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h4 className="text-white font-bold text-sm">{screen.name}</h4>
                <span className="text-xs font-mono text-slate-400">{screen.totalSeats} Capacity</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-900/60 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase">Total Tickets</span>
                  <div className="text-lg font-black text-white font-mono">{totalSeatsSold}</div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase">Screenings Programmed</span>
                  <div className="text-lg font-black text-white font-mono">{screenShows.length}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
