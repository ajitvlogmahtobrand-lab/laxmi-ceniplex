import React, { useState, useEffect } from 'react';
import { HeroCarousel } from '../../components/home/HeroCarousel';
import { AnnouncementTicker } from '../../components/home/AnnouncementTicker';
import { MovieCard } from '../../components/home/MovieCard';
import { TrailerModal } from '../../components/booking/TrailerModal';
import { Movie, Announcement } from '../../types';
import { storageService } from '../../services/storage';
import { Sparkles, Calendar, Volume2, Film, MapPin, Phone, Coffee, ArrowRight } from 'lucide-react';

interface HomePageProps {
  onNavigate: (route: string, param?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [selectedTrailerMovie, setSelectedTrailerMovie] = useState<Movie | null>(null);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ALL');
  const [selectedDateOffset, setSelectedDateOffset] = useState<number>(0);
  const [movies, setMovies] = useState<Movie[]>(() => storageService.getMovies());
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => storageService.getAnnouncements());

  useEffect(() => {
    const handleUpdate = () => {
      setMovies(storageService.getMovies());
      setAnnouncements(storageService.getAnnouncements());
    };
    window.addEventListener('lxm_storage_update', handleUpdate);
    return () => window.removeEventListener('lxm_storage_update', handleUpdate);
  }, []);

  const nowShowingMovies = movies.filter((m) => m.status === 'NOW_SHOWING');
  const comingSoonMovies = movies.filter((m) => m.status === 'COMING_SOON');
  const regionalMovies = movies.filter((m) => m.isRegional || m.language === 'Bhojpuri' || m.language === 'Nagpuri');

  // Filter now showing movies by language
  const filteredNowShowing = nowShowingMovies.filter((m) => {
    if (selectedLanguage === 'ALL') return true;
    return m.language.toUpperCase() === selectedLanguage.toUpperCase();
  });

  const handleWatchTrailer = (movie: Movie) => {
    setSelectedTrailerMovie(movie);
    setIsTrailerOpen(true);
  };

  const handleBookNow = (movieId: string) => {
    onNavigate(`/movies/${movieId}`);
  };

  // Date buttons for next 5 days
  const dateOptions = [0, 1, 2, 3, 4].map((offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return {
      offset,
      dayName: offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short' }),
      dateFormatted: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    };
  });

  return (
    <div className="min-h-screen space-y-12 pb-16 bg-[#F6F7FB]">
      {/* Top Announcement Bar */}
      <AnnouncementTicker announcements={announcements} onNavigate={onNavigate} />

      {/* Cinematic Hero Slider */}
      <HeroCarousel
        movies={nowShowingMovies}
        onBookNow={handleBookNow}
        onWatchTrailer={handleWatchTrailer}
        onNavigateMovie={(id) => onNavigate(`/movies/${id}`)}
      />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Date & Filter Bar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Date Selector */}
          <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs uppercase font-bold text-[#667085] mr-2 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-[#E31837]" />
              <span>Date:</span>
            </span>
            {dateOptions.map((item) => (
              <button
                key={item.offset}
                onClick={() => setSelectedDateOffset(item.offset)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center flex-shrink-0 ${
                  selectedDateOffset === item.offset
                    ? 'bg-[#E31837] text-white shadow-sm'
                    : 'bg-gray-100 hover:bg-gray-200 text-[#667085] hover:text-[#171923]'
                }`}
              >
                <span>{item.dayName}</span>
                <span className="text-[10px] font-normal opacity-90">{item.dateFormatted}</span>
              </button>
            ))}
          </div>

          {/* Language filter pills */}
          <div className="flex items-center space-x-1.5 w-full md:w-auto overflow-x-auto">
            {['ALL', 'HINDI', 'BHOJPURI', 'NAGPURI', 'ENGLISH'].map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-shrink-0 ${
                  selectedLanguage === lang
                    ? 'bg-red-50 text-[#E31837] border border-red-200 font-bold'
                    : 'bg-gray-100 text-[#667085] hover:text-[#171923] hover:bg-gray-200'
                }`}
              >
                {lang === 'ALL' ? 'All Languages' : lang}
              </button>
            ))}
          </div>
        </div>

        {/* NOW SHOWING SECTION */}
        <section className="space-y-6">
          <div className="flex items-end justify-between border-b border-[#E5E7EB] pb-4">
            <div>
              <div className="flex items-center space-x-2 text-[#E31837] text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>In Screening Theatres</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#171923] tracking-tight mt-1 font-cinema">
                Now Showing at Laxmi Cineplex
              </h2>
            </div>
            <button
              onClick={() => onNavigate('/movies')}
              className="text-xs sm:text-sm font-bold text-[#E31837] hover:text-[#b31028] flex items-center space-x-1 transition-colors"
            >
              <span>View All Movies</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {filteredNowShowing.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-[#E5E7EB] text-[#667085]">
              No movies currently matching the selected language filter.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredNowShowing.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onBookNow={handleBookNow}
                  onWatchTrailer={handleWatchTrailer}
                  onSelectMovie={(id) => onNavigate(`/movies/${id}`)}
                />
              ))}
            </div>
          )}
        </section>

        {/* REGIONAL / LOCAL CINEMA SPOTLIGHT */}
        {regionalMovies.length > 0 && (
          <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold tracking-widest text-amber-800 uppercase bg-amber-100 px-2.5 py-1 rounded-md border border-amber-300">
                  Jharkhand & Bhojpuri Cinema
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-[#171923] mt-2 font-cinema">
                  Regional Spotlight at Laxmi Cineplex
                </h3>
              </div>
              <p className="text-xs text-[#667085] max-w-md">
                Dedicated screenings celebrating authentic Bhojpuri, Nagpuri, and regional folk cinema on the big 4K screen.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
              {regionalMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onBookNow={handleBookNow}
                  onWatchTrailer={handleWatchTrailer}
                  onSelectMovie={(id) => onNavigate(`/movies/${id}`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* COMING SOON SECTION */}
        <section className="space-y-6">
          <div className="flex items-end justify-between border-b border-[#E5E7EB] pb-4">
            <div>
              <div className="flex items-center space-x-2 text-[#667085] text-xs font-bold uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>Upcoming Theatrical Releases</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#171923] tracking-tight mt-1 font-cinema">
                Coming Soon
              </h2>
            </div>
            <button
              onClick={() => onNavigate('/coming-soon')}
              className="text-xs sm:text-sm font-bold text-[#E31837] hover:text-[#b31028] flex items-center space-x-1"
            >
              <span>See Upcoming</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
            {comingSoonMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onBookNow={handleBookNow}
                onWatchTrailer={handleWatchTrailer}
                onSelectMovie={(id) => onNavigate(`/movies/${id}`)}
              />
            ))}
          </div>
        </section>

        {/* WHY LAXMI CINEPLEX HAZARIBAGH FEATURETTE */}
        <section className="rounded-3xl bg-white border border-[#E5E7EB] p-8 sm:p-10 space-y-8 shadow-xs">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold tracking-widest text-[#E31837] uppercase">
              The Ultimate Cinema Experience
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#171923] font-cinema">
              Why Laxmi Cineplex Hazaribagh?
            </h2>
            <p className="text-xs sm:text-sm text-[#667085]">
              Designed to elevate every frame, score, and dialogue with cutting-edge cinematic technology right here in the heart of Hazaribagh.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#F6F7FB] border border-[#E5E7EB] hover:border-red-300 transition-colors space-y-3">
              <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 text-[#E31837] flex items-center justify-center">
                <Volume2 className="w-6 h-6" />
              </div>
              <h4 className="text-[#171923] font-bold text-base">Dolby Atmos 7.1 Surround</h4>
              <p className="text-xs text-[#667085] leading-relaxed">
                Overhead and spatial acoustic transducers envelop the auditorium, letting you hear every whisper and thunderous detonation exactly as the filmmakers intended.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F6F7FB] border border-[#E5E7EB] hover:border-red-300 transition-colors space-y-3">
              <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 text-[#E31837] flex items-center justify-center">
                <Film className="w-6 h-6" />
              </div>
              <h4 className="text-[#171923] font-bold text-base">Barco 4K Laser Projection</h4>
              <p className="text-xs text-[#667085] leading-relaxed">
                High dynamic range laser optics deliver unparalleled illumination, lifelike color depth, and crystal sharpness without dimming on expansive silver screens.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F6F7FB] border border-[#E5E7EB] hover:border-red-300 transition-colors space-y-3">
              <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 text-[#E31837] flex items-center justify-center">
                <Coffee className="w-6 h-6" />
              </div>
              <h4 className="text-[#171923] font-bold text-base">Royal Recliner Lounges</h4>
              <p className="text-xs text-[#667085] leading-relaxed">
                Plush imported motorized leather recliners with personal charging sockets, spacious legroom, and in-seat gourmet snack service from our artisanal canteen.
              </p>
            </div>
          </div>

          {/* Location & Contact Bar */}
          <div className="border-t border-[#E5E7EB] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#667085]">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-[#E31837]" />
              <span>Cinema Road, Near Jhanda Chowk, Hazaribagh, Jharkhand 825301</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <Phone className="w-4 h-4 text-[#E31837]" />
                <span>+91 6546 223456</span>
              </span>
              <button
                onClick={() => onNavigate('/cinema')}
                className="px-3.5 py-1.5 bg-[#E31837] hover:bg-[#c91430] text-white font-bold rounded-lg transition-colors shadow-2xs"
              >
                Directions & Info
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Trailer Modal */}
      <TrailerModal
        movie={selectedTrailerMovie}
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
        onBookNow={handleBookNow}
      />
    </div>
  );
};
