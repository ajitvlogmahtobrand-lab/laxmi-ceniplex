import React from 'react';
import { storageService } from '../../services/storage';
import {
  Volume2,
  Film,
  MapPin,
  Phone,
  Mail,
  Clock,
  Sparkles,
  Coffee,
  ShieldCheck,
  Car,
  Accessibility,
  Wifi,
  Wind,
} from 'lucide-react';

interface CinemaInfoPageProps {
  onNavigate: (route: string) => void;
}

export const CinemaInfoPage: React.FC<CinemaInfoPageProps> = ({ onNavigate }) => {
  const screens = storageService.getScreens();
  const settings = storageService.getSettings();

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-12 min-h-screen bg-[#F6F7FB]">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-white border border-[#E5E7EB] p-8 sm:p-12 shadow-xs text-[#171923]">
        <div className="max-w-2xl space-y-4">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-red-50 text-[#E31837] border border-red-200">
            The Premier Multiplex of Hazaribagh
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-[#171923] font-cinema tracking-tight">
            Laxmi Cineplex Hazaribagh
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">
            Welcome to Laxmi Cineplex, Jharkhand&rsquo;s state-of-the-art cinematic palace. Equipped with cutting-edge 4K RGB Laser projection, immersive Dolby Atmos 7.1 surround sound, and luxurious motorized recliners, we bring the magic of world and Indian cinema alive.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-[#667085]">
            <span className="flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-[#E31837]" />
              <span>Cinema Road, Jhanda Chowk, Hazaribagh 825301</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Phone className="w-4 h-4 text-[#E31837]" />
              <span>{settings.phone}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Auditorium & Screen Specifications */}
      <section className="space-y-6">
        <div className="border-b border-[#E5E7EB] pb-4">
          <span className="text-xs font-bold text-[#E31837] uppercase tracking-wider">
            Auditorium Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#171923] font-cinema mt-1">
            Our Cinema Screens
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {screens.map((screen, idx) => (
            <div
              key={screen.id}
              className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-5 text-[#171923]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#E31837] bg-red-50 px-2.5 py-0.5 rounded border border-red-200">
                    Audi {idx + 1}
                  </span>
                  <h3 className="text-xl font-black text-[#171923] mt-1.5">{screen.name}</h3>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-[#171923] font-mono">{screen.totalSeats}</span>
                  <span className="text-[11px] text-[#667085] block uppercase font-medium">Seats Capacity</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs">
                <div className="space-y-1">
                  <div className="text-[#667085] font-bold uppercase text-[10px]">Audio Configuration</div>
                  <div className="text-[#171923] font-bold">{screen.soundSystem}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[#667085] font-bold uppercase text-[10px]">Projection Engine</div>
                  <div className="text-[#171923] font-bold">{screen.projection}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] text-[#667085] uppercase font-bold">Seating Tiers</div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                    👑 Royal Recliner (Motorized Leather)
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-sky-50 text-sky-800 border border-sky-200 font-bold">
                    ⭐ Prime VIP (Cushioned Loungers)
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-gray-100 text-gray-800 border border-gray-200 font-bold">
                    🎟️ Classic Executive
                  </span>
                </div>
              </div>

              <button
                onClick={() => onNavigate('/movies')}
                className="w-full py-2.5 bg-[#E31837] hover:bg-[#c91430] text-white text-xs font-bold rounded-xl transition-colors shadow-2xs cursor-pointer"
              >
                Browse Screenings on {screen.name.split(' - ')[0]}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Cinema Facilities & Guest Comforts */}
      <section className="space-y-6">
        <div className="border-b border-[#E5E7EB] pb-4">
          <span className="text-xs font-bold text-[#E31837] uppercase tracking-wider">
            Guest Amenities
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#171923] font-cinema mt-1">
            World-Class Facilities
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-2 text-center sm:text-left shadow-xs">
            <Wind className="w-6 h-6 text-[#E31837] mx-auto sm:mx-0" />
            <h4 className="text-[#171923] font-bold text-sm">HVAC Climate Controlled</h4>
            <p className="text-xs text-[#667085]">100% fresh air air-conditioned screening halls.</p>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-2 text-center sm:text-left shadow-xs">
            <Accessibility className="w-6 h-6 text-[#E31837] mx-auto sm:mx-0" />
            <h4 className="text-[#171923] font-bold text-sm">Wheelchair Accessible</h4>
            <p className="text-xs text-[#667085]">Dedicated ramps, elevators, and accessible seating.</p>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-2 text-center sm:text-left shadow-xs">
            <Car className="w-6 h-6 text-[#E31837] mx-auto sm:mx-0" />
            <h4 className="text-[#171923] font-bold text-sm">Secured Parking</h4>
            <p className="text-xs text-[#667085]">Valet and dedicated 2-wheeler &amp; 4-wheeler parking.</p>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-2 text-center sm:text-left shadow-xs">
            <Coffee className="w-6 h-6 text-[#E31837] mx-auto sm:mx-0" />
            <h4 className="text-[#171923] font-bold text-sm">Gourmet Canteen</h4>
            <p className="text-xs text-[#667085]">Fresh buttery popcorn, samosas, nachos &amp; beverages.</p>
          </div>
        </div>
      </section>

      {/* Location, Directions & Contact Map */}
      <section className="p-8 rounded-3xl bg-white border border-[#E5E7EB] space-y-6 shadow-xs text-[#171923]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black text-[#171923] font-cinema">Find Us in Hazaribagh</h3>
            <p className="text-xs sm:text-sm text-[#667085] mt-1">
              Centrally situated in Hazaribagh close to prominent shopping centers and transit hubs.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200">
              Open Today: 09:30 AM – 11:30 PM
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-200">
          <div className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-[#667085]">Box Office Address</div>
            <div className="text-xs text-[#171923] font-semibold leading-relaxed">
              Cinema Road, Near Jhanda Chowk, Hazaribagh, Jharkhand 825301
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-[#667085]">Booking Hotline</div>
            <div className="text-xs text-[#171923] leading-relaxed font-mono font-bold">
              +91 6546 223456 / +91 9431 187654
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-[#667085]">Customer Support</div>
            <div className="text-xs text-[#171923] leading-relaxed font-mono font-bold">
              support@laxmicineplex.in
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
