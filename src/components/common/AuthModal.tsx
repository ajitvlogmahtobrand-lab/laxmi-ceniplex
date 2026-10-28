import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, X, CheckCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { loginCustomer } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address for tickets.');
      return;
    }

    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a 10-digit mobile number for SMS/WhatsApp updates.');
      return;
    }

    loginCustomer(email.trim(), name.trim(), phone.trim());
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-[#171923]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-150 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-[#E31837] flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#171923] font-cinema">
                Patron Sign In / Register
              </h3>
              <p className="text-xs text-[#667085]">
                Fast contactless tickets & booking records
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-[#171923] font-bold block mb-1">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#667085] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#171923] placeholder-gray-400 focus:outline-none focus:border-[#E31837] focus:bg-white"
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[#171923] font-bold block mb-1">
              Email Address (For E-Ticket delivery) *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#667085] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul.sharma@example.com"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#171923] placeholder-gray-400 focus:outline-none focus:border-[#E31837] focus:bg-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[#171923] font-bold block mb-1">
              Mobile Number (WhatsApp Ticket) *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#667085] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#171923] placeholder-gray-400 focus:outline-none focus:border-[#E31837] focus:bg-white"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-[#E31837] hover:bg-[#c91430] text-white font-bold rounded-xl text-xs shadow-md transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Continue to Account</span>
            </button>
          </div>
        </form>

        <p className="text-[11px] text-[#667085] text-center">
          No password needed. Your ticket and booking history are securely synced with your contact details.
        </p>
      </div>
    </div>
  );
};
