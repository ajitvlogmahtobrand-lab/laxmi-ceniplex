import React, { useState, useEffect } from 'react';
import { storageService } from '../../services/storage';
import { MovieCard } from '../../components/home/MovieCard';
import { TrailerModal } from '../../components/booking/TrailerModal';
import { Movie } from '../../types';
import { Search, Sparkles, Filter } from 'lucide-react';

interface MoviesPageProps {
  onNavigate: (route: string, param?: string) => void;
  defaultStatus?: 'NOW_SHOWING' | 'COMING_SOON';
}

export const MoviesPage: React.FC<MoviesPageProps> = ({ onNavigate, defaultStatus = 'NOW_SHOWING' }) => {
  const [activeTab, setActiveTab] = useState<'NOW_SHOWING' | 'COMING_SOON'>(defaultStatus);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('ALL');
  const [selectedGenre, setSelectedGenre] = useState('ALL');
  const [selectedTrailerMovie, setSelectedTrailerMovie] = useState<Movie | null>(null);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [moviesList, setMoviesList] = useState<Movie[]>(() =>
    storageService.getMovies().filter((m) => m.status !== 'ARCHIVED' && m.status !== 'DRAFT')
  );

  useEffect(() => {
    const handleUpdate = () => {
      setMoviesList(storageService.getMovies().filter((m) => m.status !== 'ARCHIVED' && m.status !== 'DRAFT'));
    };
    window.addEventListener('lxm_storage_update', handleUpdate);
    return () => window.removeEventListener('lxm_storage_update', handleUpdate);
  }, []);

  const movies = moviesList;

  // Extract all unique genres & languages
  const allLanguages = Array.from(new Set(movies.map((m) => m.language)));
  const allGenres = Array.from(new Set(movies.flatMap((m) => m.genre)));

  const filteredMovies = movies.filter((m) => {
    if (m.status !== activeTab) return false;
    if (selectedLanguage !== 'ALL' && m.language.toLowerCase() !== selectedLanguage.toLowerCase()) return false;
    if (selectedGenre !== 'ALL' && !m.genre.some((g) => g.toLowerCase() === selectedGenre.toLowerCase())) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = m.title.toLowerCase().includes(q);
      const matchCast = m.cast?.some((c) => c.toLowerCase().includes(q));
      const matchGenre = m.genre.some((g) => g.toLowerCase().includes(q));
      if (!matchTitle && !matchCast && !matchGenre) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 min-h-screen bg-[#F6F7FB]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E5E7EB] pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-[#E31837] uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Laxmi Cineplex Catalogue</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#171923] font-cinema mt-1">
            {activeTab === 'NOW_SHOWING' ? 'Now Showing Movies' : 'Upcoming Theatrical Releases'}
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Experience cinema in 4K Laser Projection and Dolby Atmos 7.1 at Hazaribagh.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center p-1 rounded-xl bg-gray-100 border border-gray-200">
          <button
            onClick={() => setActiveTab('NOW_SHOWING')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'NOW_SHOWING' ? 'bg-[#E31837] text-white shadow-xs' : 'text-[#667085] hover:text-[#171923]'
            }`}
          >
            Now Showing
          </button>
          <button
            onClick={() => setActiveTab('COMING_SOON')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'COMING_SOON' ? 'bg-[#E31837] text-white shadow-xs' : 'text-[#667085] hover:text-[#171923]'
            }`}
          >
            Coming Soon
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#667085] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search movie title, star cast..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs text-[#171923] placeholder-gray-400 focus:outline-none focus:border-[#E31837] focus:bg-white"
          />
        </div>

        {/* Language Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-[#667085] flex-shrink-0" />
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#171923] focus:outline-none focus:border-[#E31837] focus:bg-white"
          >
            <option value="ALL">All Languages</option>
            {allLanguages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        {/* Genre Filter */}
        <div>
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#171923] focus:outline-none focus:border-[#E31837] focus:bg-white"
          >
            <option value="ALL">All Genres</option>
            {allGenres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Movie Grid */}
      {filteredMovies.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-[#E5E7EB] space-y-3 shadow-xs">
          <p className="text-base font-bold text-[#171923]">No movies match your criteria</p>
          <p className="text-xs text-[#667085]">
            Try adjusting your search query, language, or genre filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedLanguage('ALL');
              setSelectedGenre('ALL');
            }}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-xs font-bold text-[#171923] rounded-xl transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredMovies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onBookNow={(id) => onNavigate(`/movies/${id}`)}
              onWatchTrailer={(m) => {
                setSelectedTrailerMovie(m);
                setIsTrailerOpen(true);
              }}
              onSelectMovie={(id) => onNavigate(`/movies/${id}`)}
            />
          ))}
        </div>
      )}

      {/* Trailer Modal */}
      <TrailerModal
        movie={selectedTrailerMovie}
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
        onBookNow={(id) => onNavigate(`/movies/${id}`)}
      />
    </div>
  );
};
