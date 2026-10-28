import React from 'react';
import { Screen, Show, BookingSeat, SeatCategory } from '../../types';
import { Clock, Armchair, Sparkles, Accessibility } from 'lucide-react';
import { useBooking } from '../../context/BookingContext';
import { storageService } from '../../services/storage';

interface SeatMapProps {
  show: Show;
  screen: Screen;
  bookedSeats: string[];
  onProceedToCheckout: () => void;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  show,
  screen,
  bookedSeats,
  onProceedToCheckout,
}) => {
  const { selectedSeats, toggleSeat, holdSecondsLeft, calculatePricing } = useBooking();
  const pricingSummary = calculatePricing();

  // Get active holds for this show
  const activeHolds = storageService.getSeatHolds(show.id);
  const heldByOthers = activeHolds
    .filter((h) => h.userId !== 'guest-session')
    .map((h) => h.seatId);

  const getSeatCategoryColor = (category: SeatCategory) => {
    switch (category) {
      case 'RECLINER':
        return 'text-amber-800 bg-amber-50 border-amber-200';
      case 'PRIME':
        return 'text-sky-800 bg-sky-50 border-sky-200';
      case 'CLASSIC':
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 select-none">
      {/* Top Banner: Hold countdown & Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs">
        <div>
          <h2 className="text-[#171923] font-bold text-lg">{screen.name}</h2>
          <p className="text-xs text-[#667085]">
            {screen.soundSystem} • {screen.projection}
          </p>
        </div>

        {selectedSeats.length > 0 && (
          <div className="flex items-center space-x-2 bg-red-50 border border-red-200 px-3.5 py-1.5 rounded-xl text-[#E31837]">
            <Clock className="w-4 h-4 text-[#E31837] animate-spin" style={{ animationDuration: '4s' }} />
            <span className="text-xs font-semibold">Hold time:</span>
            <span className="text-sm font-black font-mono text-[#E31837]">{formatTimer(holdSecondsLeft)}</span>
          </div>
        )}
      </div>

      {/* Cinema Screen Curve Visual */}
      <div className="py-6 flex flex-col items-center">
        <div className="w-3/4 max-w-2xl h-8 screen-curve bg-gradient-to-b from-sky-100 to-transparent flex items-center justify-center">
          <span className="text-[11px] font-bold tracking-widest text-sky-800 uppercase">
            All Eyes This Way • Cinema Screen
          </span>
        </div>
      </div>

      {/* Seat Rows Matrix */}
      <div className="overflow-x-auto pb-6">
        <div className="min-w-[650px] space-y-5 flex flex-col items-center">
          {screen.rows.map((row) => {
            const rowPrice = show.pricing[row.category] || row.price;
            return (
              <div key={row.rowLabel} className="w-full flex items-center justify-center space-x-3">
                {/* Row Label Left */}
                <span className="w-6 text-center text-xs font-black text-gray-500">
                  {row.rowLabel}
                </span>

                {/* Seat buttons */}
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  {row.seats.map((seat) => {
                    const isBooked = bookedSeats.includes(seat.label);
                    const isHeldByOther = heldByOthers.includes(seat.label);
                    const isSelected = selectedSeats.some((s) => s.seatLabel === seat.label);

                    const seatObj: BookingSeat = {
                      seatLabel: seat.label,
                      rowLabel: row.rowLabel,
                      seatNumber: seat.seatNumber,
                      category: row.category,
                      price: rowPrice,
                    };

                    let seatClasses =
                      'relative rounded-t-lg text-[10px] font-bold transition-all flex items-center justify-center ';

                    if (row.category === 'RECLINER') {
                      seatClasses += 'w-8 h-9 sm:w-9 sm:h-10 ';
                    } else {
                      seatClasses += 'w-7 h-8 sm:w-8 sm:h-8 ';
                    }

                    if (isBooked) {
                      seatClasses += 'bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed opacity-60 ';
                    } else if (isHeldByOther) {
                      seatClasses += 'bg-amber-100 text-amber-700 border border-amber-300 cursor-not-allowed ';
                    } else if (isSelected) {
                      seatClasses +=
                        'bg-[#E31837] text-white shadow-md shadow-red-500/30 scale-105 border border-red-600 ';
                    } else {
                      if (row.category === 'RECLINER') {
                        seatClasses +=
                          'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 hover:border-amber-500 cursor-pointer active:scale-95 shadow-2xs ';
                      } else if (row.category === 'PRIME') {
                        seatClasses +=
                          'bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-300 hover:border-sky-500 cursor-pointer active:scale-95 shadow-2xs ';
                      } else {
                        seatClasses +=
                          'bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-500 cursor-pointer active:scale-95 shadow-2xs ';
                      }
                    }

                    return (
                      <React.Fragment key={seat.label}>
                        <button
                          disabled={isBooked || isHeldByOther}
                          onClick={() => toggleSeat(seatObj)}
                          title={`${seat.label} • ${row.category} (₹${rowPrice})${isBooked ? ' - Booked' : ''}`}
                          className={seatClasses}
                        >
                          {seat.isAccessible ? (
                            <Accessibility className="w-3.5 h-3.5" />
                          ) : (
                            <span>{seat.seatNumber}</span>
                          )}
                        </button>

                        {/* Aisle Spacer */}
                        {seat.isAisle && <div className="w-4 sm:w-6" />}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Row Label Right & Price badge */}
                <span className="w-6 text-center text-xs font-black text-gray-500">
                  {row.rowLabel}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border hidden md:inline-block ${getSeatCategoryColor(
                    row.category
                  )}`}
                >
                  ₹{rowPrice}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 p-4 rounded-2xl bg-white border border-[#E5E7EB] text-xs text-[#667085] shadow-xs">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-t-md bg-white border border-gray-300" />
          <span>Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-t-md bg-[#E31837] border border-red-600 shadow-xs" />
          <span className="text-[#171923] font-bold">Selected</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-t-md bg-gray-200 border border-gray-300 opacity-60 cursor-not-allowed" />
          <span>Booked / Reserved</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-t-md bg-amber-100 border border-amber-300" />
          <span className="text-amber-800">Temporarily Held</span>
        </div>
        <div className="flex items-center space-x-1.5 text-amber-700 font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Recliner: Motorized Luxury Lounger</span>
        </div>
      </div>

      {/* Sticky Bottom Bar on selection */}
      {selectedSeats.length > 0 && (
        <div className="sticky bottom-4 z-40 bg-white border border-[#E5E7EB] p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-[#E31837]">
              <Armchair className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[#171923] font-bold text-sm sm:text-base">
                  {selectedSeats.length} {selectedSeats.length === 1 ? 'Seat' : 'Seats'} Selected:
                </span>
                <span className="text-[#E31837] font-mono font-bold text-sm">
                  {selectedSeats.map((s) => s.seatLabel).join(', ')}
                </span>
              </div>
              <p className="text-xs text-[#667085]">
                Ticket Base: ₹{pricingSummary.ticketSubtotal} • Max 10 per order
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-right">
              <div className="text-[11px] text-[#667085]">Estimated Total</div>
              <div className="text-xl font-black text-[#171923] font-mono">₹{pricingSummary.ticketSubtotal}</div>
            </div>

            <button
              onClick={onProceedToCheckout}
              className="px-6 py-3 bg-[#E31837] hover:bg-[#c91430] text-white font-bold rounded-xl shadow-md transition-all transform hover:scale-[1.02] active:scale-95 text-sm sm:text-base"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
