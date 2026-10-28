import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { User, Mail, Phone, Ticket, LogOut, ArrowRight, ShieldCheck } from 'lucide-react';

interface ProfilePageProps {
  onNavigate: (route: string, param?: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { currentUser, logoutCustomer } = useAuth();
  const allBookings = storageService.getBookings();

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#171923]">Not Signed In</h2>
        <p className="text-xs text-[#667085]">
          Sign in or book a movie ticket to access your profile.
        </p>
        <button
          onClick={() => onNavigate('/')}
          className="px-5 py-2 bg-[#E31837] hover:bg-[#c91430] text-white text-xs font-bold rounded-xl shadow-xs"
        >
          Explore Movies
        </button>
      </div>
    );
  }

  const userBookings = allBookings.filter(
    (b) =>
      (b.userId && b.userId === currentUser.id) ||
      b.customerEmail.toLowerCase() === currentUser.email.toLowerCase() ||
      (currentUser.phone && b.customerPhone === currentUser.phone)
  );

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8 min-h-screen bg-[#F6F7FB]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-6">
        <div>
          <span className="text-xs font-bold text-[#E31837] uppercase tracking-wider">
            Patron Account
          </span>
          <h1 className="text-3xl font-black text-[#171923] font-cinema mt-1">{currentUser.name}</h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Registered member at Laxmi Cineplex Hazaribagh
          </p>
        </div>

        <button
          onClick={() => {
            logoutCustomer();
            onNavigate('/');
          }}
          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-[#E31837] text-xs font-bold rounded-xl border border-red-200 transition-colors flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Account Info Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-1">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-[#E31837] flex items-center justify-center mb-3">
            <User className="w-5 h-5" />
          </div>
          <span className="text-[10px] uppercase font-bold text-[#667085]">Full Name</span>
          <p className="text-base font-bold text-[#171923]">{currentUser.name}</p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-1">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center mb-3">
            <Mail className="w-5 h-5" />
          </div>
          <span className="text-[10px] uppercase font-bold text-[#667085]">Email Address</span>
          <p className="text-base font-bold text-[#171923] truncate">{currentUser.email}</p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-1">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
            <Phone className="w-5 h-5" />
          </div>
          <span className="text-[10px] uppercase font-bold text-[#667085]">Mobile Number</span>
          <p className="text-base font-bold text-[#171923]">{currentUser.phone || '+91 Not Provided'}</p>
        </div>
      </div>

      {/* My Bookings Quick Link */}
      <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 text-[#E31837] flex items-center justify-center">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#171923]">My Movie Tickets</h3>
            <p className="text-xs text-[#667085]">
              You have {userBookings.length} booking record(s) on file with Laxmi Cineplex.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('/my-bookings')}
          className="px-5 py-2.5 bg-[#E31837] hover:bg-[#c91430] text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
        >
          <span>View All Tickets</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
