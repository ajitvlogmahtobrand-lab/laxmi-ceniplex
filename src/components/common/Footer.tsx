import React from 'react';
import { Film, MapPin, Phone, Mail, Clock, ShieldCheck, Heart, Volume2, Sparkles, Coffee } from 'lucide-react';

interface FooterProps {
  onNavigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#F6F7FB] border-t border-[#E5E7EB] text-[#667085] text-sm mt-20 no-print">
      {/* Amenities Banner */}
      <div className="border-b border-[#E5E7EB] py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="flex flex-col items-center p-4 rounded-2xl bg-[#F6F7FB] border border-[#E5E7EB]">
            <Volume2 className="w-6 h-6 text-[#E31837] mb-2" />
            <h5 className="text-[#171923] font-bold text-xs sm:text-sm">Dolby Atmos 7.1</h5>
            <p className="text-[11px] text-[#667085] mt-1">Immersive 360° audio sensation</p>
          </div>
          <div className="flex flex-col items-center p-4 rounded-2xl bg-[#F6F7FB] border border-[#E5E7EB]">
            <Sparkles className="w-6 h-6 text-[#E31837] mb-2" />
            <h5 className="text-[#171923] font-bold text-xs sm:text-sm">4K Laser RGB Projection</h5>
            <p className="text-[11px] text-[#667085] mt-1">High-contrast ultra-vivid picture</p>
          </div>
          <div className="flex flex-col items-center p-4 rounded-2xl bg-[#F6F7FB] border border-[#E5E7EB]">
            <Film className="w-6 h-6 text-[#E31837] mb-2" />
            <h5 className="text-[#171923] font-bold text-xs sm:text-sm">Plush Royal Recliners</h5>
            <p className="text-[11px] text-[#667085] mt-1">Motorized leather lounger rows</p>
          </div>
          <div className="flex flex-col items-center p-4 rounded-2xl bg-[#F6F7FB] border border-[#E5E7EB]">
            <Coffee className="w-6 h-6 text-[#E31837] mb-2" />
            <h5 className="text-[#171923] font-bold text-xs sm:text-sm">Gourmet Canteen & Cafe</h5>
            <p className="text-[11px] text-[#667085] mt-1">Fresh popcorn, combos & chai</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-[#E31837] flex items-center justify-center shadow-xs">
                <Film className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-lg text-[#171923] font-cinema">
                LAXMI <span className="text-[#E31837]">CINEPLEX</span>
              </span>
            </div>
            <p className="text-xs text-[#667085] leading-relaxed">
              Hazaribagh&rsquo;s premier theatrical cinema delivering world-class entertainment with 4K laser projection, immersive Dolby surround, and plush recliner comfort.
            </p>
            <div className="flex items-center space-x-2 text-xs text-[#667085]">
              <Clock className="w-4 h-4 text-[#E31837] flex-shrink-0" />
              <span>Box Office: 09:30 AM – 11:30 PM (Daily)</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-[#171923] font-bold text-xs mb-4 tracking-wider uppercase">Quick Links</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <button onClick={() => onNavigate('/movies')} className="hover:text-[#E31837] transition-colors">
                  Now Showing Movies
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/coming-soon')} className="hover:text-[#E31837] transition-colors">
                  Upcoming Releases
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/cinema')} className="hover:text-[#E31837] transition-colors">
                  Screens & Facilities
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/my-bookings')} className="hover:text-[#E31837] transition-colors">
                  My Tickets & Bookings
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/help')} className="hover:text-[#E31837] transition-colors">
                  FAQs & Help Center
                </button>
              </li>
            </ul>
          </div>

          {/* Cinema Policies & Legal */}
          <div>
            <h4 className="text-[#171923] font-bold text-xs mb-4 tracking-wider uppercase">Cinema Policies</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <button onClick={() => onNavigate('/cancellation-policy')} className="hover:text-[#E31837] transition-colors">
                  Cancellation & Refund Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/terms')} className="hover:text-[#E31837] transition-colors">
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/privacy')} className="hover:text-[#E31837] transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/admin/login')} className="hover:text-[#E31837] transition-colors flex items-center space-x-1 text-[#667085]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#E31837]" />
                  <span>Admin Portal</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Location & Contact */}
          <div className="space-y-3">
            <h4 className="text-[#171923] font-bold text-xs mb-4 tracking-wider uppercase">Location & Contact</h4>
            <div className="flex items-start space-x-2 text-xs text-[#667085]">
              <MapPin className="w-4 h-4 text-[#E31837] flex-shrink-0 mt-0.5" />
              <span>Cinema Road, Near Jhanda Chowk, Hazaribagh, Jharkhand 825301, India</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-[#667085]">
              <Phone className="w-4 h-4 text-[#E31837] flex-shrink-0" />
              <span>+91 6546 223456 / +91 9431 187654</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-[#667085]">
              <Mail className="w-4 h-4 text-[#E31837] flex-shrink-0" />
              <span>bookings@laxmicineplex.in</span>
            </div>
          </div>
        </div>

        <div className="border-t border-[#E5E7EB] mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Laxmi Cineplex Hazaribagh. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 flex items-center">
            Crafted with <Heart className="w-3.5 h-3.5 text-[#E31837] mx-1 fill-[#E31837]" /> for cinema lovers of Jharkhand.
          </p>
        </div>
      </div>
    </footer>
  );
};
