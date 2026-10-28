import React, { useState, useEffect } from "react";
import { Users, Search, Phone, Mail, Ticket, Calendar, ArrowUpDown, ChevronLeft, ChevronRight, User } from "lucide-react";
import { storageService } from "../../services/storage";
import { Booking } from "../../types";

interface CustomerRecord {
  name: string;
  phone: string;
  email: string;
  totalBookings: number;
  totalTickets: number;
  totalSpent: number;
  lastBookingDate: string;
  recentMovies: string[];
}

export const AdminCustomers: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>(() => storageService.getBookings());
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);

  useEffect(() => {
    const handleUpdate = () => setBookings(storageService.getBookings());
    window.addEventListener("lxm_storage_update", handleUpdate);
    return () => window.removeEventListener("lxm_storage_update", handleUpdate);
  }, []);

  // Aggregate customers from bookings
  const customerMap = new Map<string, CustomerRecord>();

  bookings.forEach((b) => {
    const key = b.customerPhone || b.customerEmail || b.customerName;
    if (!key) return;

    if (!customerMap.has(key)) {
      customerMap.set(key, {
        name: b.customerName,
        phone: b.customerPhone,
        email: b.customerEmail,
        totalBookings: 0,
        totalTickets: 0,
        totalSpent: 0,
        lastBookingDate: b.createdAt,
        recentMovies: [],
      });
    }

    const record = customerMap.get(key)!;
    record.totalBookings += 1;
    record.totalTickets += b.seats.length;
    if (b.bookingStatus === "CONFIRMED") {
      record.totalSpent += b.totalAmount;
    }
    if (new Date(b.createdAt) > new Date(record.lastBookingDate)) {
      record.lastBookingDate = b.createdAt;
    }
    if (!record.recentMovies.includes(b.movieTitle)) {
      record.recentMovies.push(b.movieTitle);
    }
  });

  const customersList = Array.from(customerMap.values());

  const filtered = customersList.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white font-cinema tracking-wide flex items-center gap-2">
          <Users className="w-7 h-7 text-red-500" />
          <span>Customer Directory</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Registered patrons, booking frequency, lifetime cinema spend, and contact records.
        </p>
      </div>

      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, phone, email..."
            className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none"
          />
        </div>

        <div className="text-xs text-zinc-400">
          Total Customers: <strong className="text-white">{customersList.length}</strong>
        </div>
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider text-[11px] border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Bookings</th>
                <th className="py-3 px-4">Tickets</th>
                <th className="py-3 px-4">Total Spend</th>
                <th className="py-3 px-4">Last Visit</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-zinc-500">
                    No customer records found
                  </td>
                </tr>
              ) : (
                filtered.map((c, i) => (
                  <tr key={i} className="hover:bg-zinc-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 font-bold text-xs uppercase">
                          {c.name.slice(0, 2)}
                        </div>
                        <span className="font-bold text-white text-sm">{c.name}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-zinc-400">
                      <div className="flex items-center gap-1 text-zinc-300">
                        <Phone className="w-3 h-3 text-zinc-500" />
                        <span>{c.phone || "N/A"}</span>
                      </div>
                      <div className="text-[11px] text-zinc-500 truncate max-w-[160px]">{c.email}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-zinc-200">
                      {c.totalBookings}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-zinc-200">
                      {c.totalTickets}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-white text-sm">₹{c.totalSpent.toLocaleString("en-IN")}</span>
                    </td>

                    <td className="py-3.5 px-4 text-zinc-400 text-[11px]">
                      {new Date(c.lastBookingDate).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedCustomer(c)}
                        className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-white">{selectedCustomer.name}</h3>
                <p className="text-xs text-zinc-400">{selectedCustomer.phone}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-zinc-400 hover:text-white">&times;</button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-zinc-900">
                <span className="text-zinc-400">Email:</span>
                <span className="text-white">{selectedCustomer.email || "N/A"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-900">
                <span className="text-zinc-400">Total Bookings Completed:</span>
                <span className="font-bold text-white">{selectedCustomer.totalBookings}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-900">
                <span className="text-zinc-400">Total Admission Tickets:</span>
                <span className="font-bold text-white">{selectedCustomer.totalTickets}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-900">
                <span className="text-zinc-400">Total Spend at Laxmi Cineplex:</span>
                <span className="font-extrabold text-red-400 text-sm">₹{selectedCustomer.totalSpent.toLocaleString("en-IN")}</span>
              </div>
              <div className="pt-2">
                <span className="text-zinc-400 block mb-1">Movies Watched:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCustomer.recentMovies.map((m, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 text-[11px]">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
