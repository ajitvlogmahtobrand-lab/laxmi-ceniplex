import React, { useState, useEffect } from 'react';
import { Movie, Show, Screen } from '../../types';
import { storageService } from '../../services/storage';
import { useBooking } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';
import { TrailerModal } from '../../components/booking/TrailerModal';
import { VideoPlayerModal } from '../../components/video/VideoPlayerModal';
import { VideoCheckoutModal } from '../../components/video/VideoCheckoutModal';
import {
  Calendar,
  Clock,
  Volume2,
  Sparkles,
  Play,
  Film,
  MapPin,
  CheckCircle,
  ChevronRight,
  ShieldCheck,
  ShoppingBag,
  Tv,
  Layers,
  Lock,
} from 'lucide-react';

interface MovieDetailPageProps {
  movieId: string;
  onNavigate: (route: string, param?: string) => void;
}

export const MovieDetailPage: React.FC<MovieDetailPageProps> = ({ movieId, onNavigate }) => {
  const [, setRefreshKey] = useState(0);
  const { currentUser } = useAuth();
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState<'RENTAL' | 'PURCHASE'>('RENTAL');

  useEffect(() => {
    const handleUpdate = () => setRefreshKey((k) => k + 1);
    window.addEventListener('lxm_storage_update', handleUpdate);
    return () => window.removeEventListener('lxm_storage_update', handleUpdate);
  }, []);

  const movie = storageService.getMovieById(movieId);
  const screens = storageService.getScreens();
  const allShows = storageService.getShows();
  const { initiateBooking } = useBooking();

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  if (!movie) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-2xl font-bold text-[#171923]">Movie Not Found</h2>
        <p className="text-sm text-[#667085]">
          The movie record you requested does not exist or may have been archived.
        </p>
        <button
          onClick={() => onNavigate('/movies')}
          className="px-6 py-2.5 bg-[#E31837] hover:bg-[#c91430] text-white font-bold rounded-xl"
        >
          Browse All Movies
        </button>
      </div>
    );
  }

  // Next 5 dates
  const availableDates = [0, 1, 2, 3, 4, 5].map((offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const dateStr = d.toISOString().split('T')[0];
    return {
      dateStr,
      dayLabel: offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short' }),
      dateLabel: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    };
  });

  // Filter shows for this movie on the selected date
  const showsForDate = allShows.filter(
    (s) => s.movieId === movie.id && s.date === selectedDate && s.status === 'OPEN'
  );

  // Group shows by screen
  const showsByScreen: { screen: Screen; shows: Show[] }[] = [];
  screens.forEach((screen) => {
    const screenShows = showsForDate.filter((s) => s.screenId === screen.id);
    if (screenShows.length > 0) {
      showsByScreen.push({
        screen,
        shows: screenShows.sort((a, b) => a.startTime.localeCompare(b.startTime)),
      });
    }
  });

  const handleSelectShow = (showId: string) => {
    initiateBooking(showId);
    onNavigate(`/shows/${showId}/seats`);
  };

  return (
    <div className="min-h-screen pb-20 space-y-10 bg-[#F6F7FB]">
      {/* Cinematic Backdrop Hero Header */}
      <div className="relative w-full h-[380px] sm:h-[440px] bg-black overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 blur-xs scale-105"
          style={{ backgroundImage: `url(${movie.backdropUrl || movie.posterUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-transparent to-black/80" />

        {/* Hero Card Content */}
        <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-end pb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-4 sm:space-y-0 sm:space-x-6 w-full">
            {/* Poster Thumbnail */}
            <div className="w-36 sm:w-48 aspect-[2/3] rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl flex-shrink-0 bg-gray-900">
              <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
            </div>

            {/* Info Summary */}
            <div className="space-y-3 text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="px-2.5 py-0.5 text-xs font-black uppercase rounded bg-[#E31837] text-white">
                  {movie.status === 'NOW_SHOWING' ? 'Now Showing' : 'Coming Soon'}
                </span>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded bg-white/20 text-white backdrop-blur-xs border border-white/20">
                  {movie.certification}
                </span>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded bg-white/20 text-white backdrop-blur-xs border border-white/20">
                  {movie.language}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white font-cinema tracking-tight drop-shadow-md">
                {movie.title}
              </h1>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs sm:text-sm text-gray-200">
                <span className="flex items-center space-x-1">
                  <Clock className="w-4 h-4 text-red-400" />
                  <span>{movie.durationMinutes} mins</span>
                </span>
                <span>•</span>
                <span>{movie.genre.join(', ')}</span>
                <span>•</span>
                <span>Released: {new Date(movie.releaseDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>

              {/* Action Buttons: Theatrical, Streaming, Rent, and Buy */}
              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                {(() => {
                  const userIdentifier = currentUser?.id || currentUser?.email || 'guest-session';
                  const hasRental = storageService.hasActiveRental(movie.id, userIdentifier);
                  const hasPurchased = storageService.hasPurchased(movie.id, userIdentifier);
                  const isFree = movie.monetization === 'FREE' || (!movie.rentPriceINR && !movie.buyPriceINR && movie.contentType && movie.contentType !== 'CINEMA_MOVIE');
                  const canRent = movie.monetization === 'RENT' || movie.monetization === 'RENT_OR_BUY' || (movie.rentPriceINR && movie.rentPriceINR > 0);
                  const canBuy = movie.monetization === 'BUY' || movie.monetization === 'RENT_OR_BUY' || (movie.buyPriceINR && movie.buyPriceINR > 0);

                  return (
                    <>
                      {/* Stream Now Button if Free or Entitled */}
                      {(hasRental || hasPurchased || isFree) && (
                        <button
                          onClick={() => setIsVideoPlayerOpen(true)}
                          className="px-5 py-2.5 bg-[#E31837] hover:bg-red-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-red-600/30 flex items-center space-x-2 transition-all cursor-pointer"
                        >
                          <Play className="w-4 h-4 fill-white" />
                          <span>{hasPurchased ? 'Play Purchased Video' : hasRental ? 'Stream Active Rental' : 'Watch Free Stream'}</span>
                        </button>
                      )}

                      {/* Rent Button */}
                      {canRent && !hasRental && !hasPurchased && (
                        <button
                          onClick={() => {
                            setCheckoutMode('RENTAL');
                            setIsCheckoutOpen(true);
                          }}
                          className="px-5 py-2.5 bg-[#E31837] hover:bg-red-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-red-600/30 flex items-center space-x-2 transition-all cursor-pointer"
                        >
                          <Clock className="w-4 h-4" />
                          <span>Rent for ₹{movie.rentPriceINR || 49} ({movie.rentalDurationHours || 48}h)</span>
                        </button>
                      )}

                      {/* Buy to Own Button */}
                      {canBuy && !hasPurchased && (
                        <button
                          onClick={() => {
                            setCheckoutMode('PURCHASE');
                            setIsCheckoutOpen(true);
                          }}
                          className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs sm:text-sm font-bold rounded-xl border border-zinc-700 flex items-center space-x-2 transition-all cursor-pointer"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span>Buy to Own (₹{movie.buyPriceINR || 149})</span>
                        </button>
                      )}

                      <button
                        onClick={() => setIsTrailerOpen(true)}
                        className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white text-xs sm:text-sm font-semibold rounded-xl border border-white/30 backdrop-blur-xs flex items-center space-x-2 transition-colors cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Watch Trailer</span>
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Showtimes & Booking (2 Cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Date Selector Header */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#667085] flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-[#E31837]" />
                <span>Select Screening Date</span>
              </span>
              <span className="text-xs text-[#E31837] font-bold">
                Laxmi Cineplex Hazaribagh
              </span>
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto pb-1">
              {availableDates.map((item) => (
                <button
                  key={item.dateStr}
                  onClick={() => setSelectedDate(item.dateStr)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center flex-shrink-0 ${
                    selectedDate === item.dateStr
                      ? 'bg-[#E31837] text-white shadow-sm'
                      : 'bg-gray-100 hover:bg-gray-200 text-[#667085] hover:text-[#171923]'
                  }`}
                >
                  <span>{item.dayLabel}</span>
                  <span className="text-[10px] font-normal opacity-90">{item.dateLabel}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Showtimes by Screen */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-[#171923] flex items-center space-x-2">
              <Film className="w-5 h-5 text-[#E31837]" />
              <span>Available Theatrical Showtimes</span>
            </h3>

            {showsByScreen.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-[#E5E7EB] space-y-2 shadow-xs">
                <p className="text-sm text-[#171923] font-semibold">
                  No shows scheduled for {new Date(selectedDate).toLocaleDateString('en-IN', { dateStyle: 'full' })}.
                </p>
                <p className="text-xs text-[#667085]">
                  Please select another date above or check back shortly as the box office updates the schedule.
                </p>
              </div>
            ) : (
              showsByScreen.map(({ screen, shows }) => (
                <div
                  key={screen.id}
                  className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E5E7EB] space-y-4 shadow-xs"
                >
                  {/* Screen Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E7EB] pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-[#171923] font-bold text-base">{screen.name}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-red-50 text-[#E31837] font-bold border border-red-200">
                          {screen.soundSystem.includes('Atmos') ? 'ATMOS 7.1' : '4K LASER'}
                        </span>
                      </div>
                      <p className="text-xs text-[#667085] mt-0.5">
                        {screen.soundSystem} • {screen.projection}
                      </p>
                    </div>

                    <div className="text-xs text-[#667085]">
                      Pricing: <span className="text-amber-700 font-bold">Recliner ₹{shows[0]?.pricing.RECLINER || 350}</span> • Prime ₹{shows[0]?.pricing.PRIME || 240} • Classic ₹{shows[0]?.pricing.CLASSIC || 180}
                    </div>
                  </div>

                  {/* Show Timing Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {shows.map((show) => {
                      const bookedSeats = storageService.getBookedSeatsForShow(show.id);
                      const totalSeats = screen.totalSeats;
                      const availableCount = totalSeats - bookedSeats.length;
                      const isFillingFast = availableCount < totalSeats * 0.4;

                      return (
                        <button
                          key={show.id}
                          onClick={() => handleSelectShow(show.id)}
                          className="group relative p-3 rounded-xl bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-300 text-left transition-all duration-200 shadow-2xs flex flex-col justify-between"
                        >
                          <div>
                            <div className="text-sm sm:text-base font-black text-[#171923] group-hover:text-[#E31837] font-mono">
                              {show.startTime}
                            </div>
                            <div className="text-[10px] text-[#667085] mt-0.5 font-medium">
                              Ends ~{show.endTime}
                            </div>
                          </div>

                          <div className="mt-3 pt-2 border-t border-gray-200 flex items-center justify-between text-[10px]">
                            <span
                              className={`font-bold ${
                                isFillingFast ? 'text-amber-600' : 'text-emerald-600'
                              }`}
                            >
                              {isFillingFast ? 'Fast Filling' : 'Available'}
                            </span>
                            <span className="text-[#667085] font-mono">
                              {availableCount} seats
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Synopsis, Cast, Cinema Details */}
        <div className="space-y-6">
          {/* Synopsis Box */}
          <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] space-y-3 shadow-xs">
            <h4 className="text-[#171923] font-bold text-sm uppercase tracking-wider">About the Movie</h4>
            <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">{movie.synopsis}</p>
          </div>

          {/* Cast & Crew Box */}
          <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] space-y-4 shadow-xs">
            <h4 className="text-[#171923] font-bold text-sm uppercase tracking-wider">Cast & Director</h4>
            {movie.director && (
              <div>
                <span className="text-[11px] text-[#667085] uppercase font-bold">Director</span>
                <p className="text-xs sm:text-sm text-[#171923] font-semibold">{movie.director}</p>
              </div>
            )}
            {movie.cast && movie.cast.length > 0 && (
              <div>
                <span className="text-[11px] text-[#667085] uppercase font-bold">Starring Cast</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {movie.cast.map((actor) => (
                    <span
                      key={actor}
                      className="px-2.5 py-1 rounded-lg bg-gray-100 text-[#171923] text-xs font-semibold border border-gray-200"
                    >
                      {actor}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cinema Location & Amenities Card */}
          <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] space-y-4 shadow-xs">
            <div className="flex items-center space-x-2 text-[#E31837]">
              <MapPin className="w-5 h-5" />
              <h4 className="text-[#171923] font-bold text-sm">Venue Information</h4>
            </div>
            <p className="text-xs text-[#667085]">
              Laxmi Cineplex, Cinema Road, Near Jhanda Chowk, Hazaribagh, Jharkhand 825301.
            </p>
            <ul className="text-xs text-[#667085] space-y-2">
              <li className="flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Contactless QR Ticket validation at entry gates</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Dolby Atmos 7.1 high-fidelity immersion</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Plush Motorized Recliners in row A & B</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      <TrailerModal
        movie={movie}
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
      />

      {/* Video Player Modal */}
      <VideoPlayerModal
        isOpen={isVideoPlayerOpen}
        onClose={() => setIsVideoPlayerOpen(false)}
        content={movie}
      />

      {/* Video Checkout Modal */}
      <VideoCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        content={movie}
        initialMode={checkoutMode}
      />
    </div>
  );
};
