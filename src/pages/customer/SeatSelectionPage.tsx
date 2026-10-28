import React, { useEffect } from 'react';
import { useBooking } from '../../context/BookingContext';
import { storageService } from '../../services/storage';
import { SeatMap } from '../../components/booking/SeatMap';
import { ArrowLeft, Film, Calendar, Clock, MapPin, Sparkles } from 'lucide-react';

interface SeatSelectionPageProps {
  showId: string;
  onNavigate: (route: string, param?: string) => void;
}

export const SeatSelectionPage: React.FC<SeatSelectionPageProps> = ({ showId, onNavigate }) => {
  const { selectedShow, selectedMovie, selectedScreen, selectedSeats, initiateBooking } = useBooking();

  const [, setRefreshKey] = React.useState(0);

  useEffect(() => {
    if (!selectedShow || selectedShow.id !== showId) {
      initiateBooking(showId);
    }
  }, [showId, selectedShow]);

  useEffect(() => {
    const handleUpdate = () => setRefreshKey((k) => k + 1);
    window.addEventListener('lxm_storage_update', handleUpdate);
    return () => window.removeEventListener('lxm_storage_update', handleUpdate);
  }, []);

  const show = selectedShow || storageService.getShowById(showId);
  const movie = selectedMovie || (show ? storageService.getMovieById(show.movieId) : undefined);
  const screen = selectedScreen || (show ? storageService.getScreenById(show.screenId) : undefined);

  if (!show || !movie || !screen) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#171923]">Show Not Found</h2>
        <p className="text-xs text-[#667085]">
          The requested screening is unavailable or has completed.
        </p>
        <button
          onClick={() => onNavigate('/movies')}
          className="px-5 py-2 bg-[#E31837] hover:bg-[#c91430] text-white rounded-xl text-xs font-bold"
        >
          Return to Movies
        </button>
      </div>
    );
  }

  const bookedSeats = storageService.getBookedSeatsForShow(show.id);

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 space-y-8 bg-[#F6F7FB]">
      {/* Back button & Breadcrumb */}
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <button
          onClick={() => onNavigate(`/movies/${movie.id}`)}
          className="flex items-center space-x-1.5 text-xs font-bold text-[#667085] hover:text-[#171923] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Movie & Showtimes</span>
        </button>

        <span className="text-xs text-[#E31837] font-bold uppercase tracking-wider">
          Step 1: Choose Your Seats
        </span>
      </div>

      {/* Movie & Show Banner Info */}
      <div className="max-w-5xl mx-auto p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="w-12 h-16 object-cover rounded-lg border border-gray-200 shadow-xs flex-shrink-0"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-[#171923] font-extrabold text-lg sm:text-xl font-cinema">{movie.title}</h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-bold border border-gray-200">
                {movie.certification}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#667085] mt-1">
              <span className="text-[#171923] font-bold">{screen.name}</span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-[#E31837]" />
                <span>{new Date(show.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-[#E31837]" />
                <span className="font-bold text-[#171923]">{show.startTime} (IST)</span>
              </span>
            </div>
          </div>
        </div>

        <div className="text-xs text-[#667085] text-right hidden sm:block">
          <span className="text-[#E31837] font-bold block">Laxmi Cineplex Hazaribagh</span>
          <span>Automatic 8-minute seat reservation hold</span>
        </div>
      </div>

      {/* Interactive Seat Matrix */}
      <SeatMap
        show={show}
        screen={screen}
        bookedSeats={bookedSeats}
        onProceedToCheckout={() => onNavigate('/checkout')}
      />
    </div>
  );
};
