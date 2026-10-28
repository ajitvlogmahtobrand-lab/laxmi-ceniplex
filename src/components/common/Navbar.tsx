import React, { useState } from 'react';
import { Film, MapPin, Search, User, ShieldCheck, Ticket, Menu, X, Sparkles, Tv } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { Movie } from '../../types';

interface NavbarProps {
  onNavigate: (route: string, param?: string) => void;
  currentRoute: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentRoute }) => {
  const { currentUser, adminUser, logoutCustomer } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const q = query.toLowerCase();
    const matches = storageService
      .getMovies()
      .filter(
        (m) =>
          m.status !== 'ARCHIVED' &&
          (m.title.toLowerCase().includes(q) ||
            m.language.toLowerCase().includes(q) ||
            m.genre.some((g) => g.toLowerCase().includes(q)))
      );
    setSearchResults(matches);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div
              onClick={() => onNavigate('/')}
              className="flex items-center space-x-3 cursor-pointer group select-none"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#E31837] to-[#b31028] flex items-center justify-center shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform duration-200">
                <Film className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-xl tracking-tight text-[#171923] font-cinema">
                    LAXMI <span className="text-[#E31837]">CINEPLEX</span>
                  </span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-red-50 text-[#E31837] border border-red-200 rounded">
                    4K Atmos
                  </span>
                </div>
                <p className="text-xs text-[#667085] flex items-center font-medium">
                  <MapPin className="w-3 h-3 text-[#E31837] mr-1" />
                  Hazaribagh, Jharkhand
                </p>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              <button
                onClick={() => onNavigate('/')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  currentRoute === '/'
                    ? 'text-[#E31837] bg-red-50 font-bold'
                    : 'text-[#667085] hover:text-[#171923] hover:bg-gray-100'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => onNavigate('/movies')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  currentRoute === '/movies'
                    ? 'text-[#E31837] bg-red-50 font-bold'
                    : 'text-[#667085] hover:text-[#171923] hover:bg-gray-100'
                }`}
              >
                Now Showing
              </button>
              <button
                onClick={() => onNavigate('/coming-soon')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  currentRoute === '/coming-soon'
                    ? 'text-[#E31837] bg-red-50 font-bold'
                    : 'text-[#667085] hover:text-[#171923] hover:bg-gray-100'
                }`}
              >
                Coming Soon
              </button>
              <button
                onClick={() => onNavigate('/ott')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1.5 ${
                  currentRoute === '/ott'
                    ? 'text-[#E31837] bg-red-50 font-bold'
                    : 'text-[#667085] hover:text-[#171923] hover:bg-gray-100'
                }`}
              >
                <Film className="w-4 h-4 text-[#E31837]" />
                <span>OTT &amp; Rent</span>
                <span className="px-1 py-0.2 rounded text-[9px] font-extrabold bg-[#E31837] text-white">NEW</span>
              </button>
              <button
                onClick={() => onNavigate('/my-library')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1.5 ${
                  currentRoute === '/my-library'
                    ? 'text-[#E31837] bg-red-50 font-bold'
                    : 'text-[#667085] hover:text-[#171923] hover:bg-gray-100'
                }`}
              >
                <Tv className="w-4 h-4 text-[#E31837]" />
                <span>My Library</span>
              </button>
              <button
                onClick={() => onNavigate('/cinema')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  currentRoute === '/cinema'
                    ? 'text-[#E31837] bg-red-50 font-bold'
                    : 'text-[#667085] hover:text-[#171923] hover:bg-gray-100'
                }`}
              >
                Cinema & Screens
              </button>
              <button
                onClick={() => onNavigate('/my-bookings')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1.5 ${
                  currentRoute === '/my-bookings'
                    ? 'text-[#E31837] bg-red-50 font-bold'
                    : 'text-[#667085] hover:text-[#171923] hover:bg-gray-100'
                }`}
              >
                <Ticket className="w-4 h-4 text-[#E31837]" />
                <span>My Tickets</span>
              </button>
            </nav>

            {/* Right Action Icons */}
            <div className="flex items-center space-x-3">
              {/* Central DB Live Sync Status Pill */}
              <div
                className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs select-none"
                title="All movies, showtimes, banners, and seat bookings are synchronized live across all devices."
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Sync</span>
              </div>

              {/* Quick Search Button */}
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center space-x-2 bg-[#F6F7FB] hover:bg-gray-100 text-[#667085] hover:text-[#171923] px-3.5 py-2 rounded-xl text-xs sm:text-sm border border-[#E5E7EB] transition-all shadow-2xs"
              >
                <Search className="w-4 h-4 text-[#667085]" />
                <span className="hidden sm:inline">Search movies, genres...</span>
                <span className="sm:hidden">Search</span>
              </button>

              {/* Customer Account Button */}
              {currentUser ? (
                <div className="relative group">
                  <button
                    onClick={() => onNavigate('/profile')}
                    className="flex items-center space-x-2 bg-red-50 border border-red-200 text-[#E31837] px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors"
                  >
                    <User className="w-4 h-4 text-[#E31837]" />
                    <span className="max-w-[90px] truncate">{currentUser.name}</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onNavigate('/login')}
                  className="hidden sm:flex items-center space-x-1.5 bg-white hover:bg-gray-50 text-[#171923] px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 shadow-2xs transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-gray-500" />
                  <span>Sign In</span>
                </button>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#E5E7EB] px-4 pt-2 pb-6 space-y-2 shadow-lg">
            <button
              onClick={() => {
                onNavigate('/');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-[#171923] hover:bg-gray-100"
            >
              Home
            </button>
            <button
              onClick={() => {
                onNavigate('/movies');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-[#171923] hover:bg-gray-100"
            >
              Now Showing
            </button>
            <button
              onClick={() => {
                onNavigate('/coming-soon');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-[#171923] hover:bg-gray-100"
            >
              Coming Soon
            </button>
            <button
              onClick={() => {
                onNavigate('/ott');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-[#171923] hover:bg-gray-100 flex items-center space-x-2"
            >
              <Film className="w-4 h-4 text-[#E31837]" />
              <span>OTT &amp; Video Rentals</span>
            </button>
            <button
              onClick={() => {
                onNavigate('/my-library');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-[#171923] hover:bg-gray-100 flex items-center space-x-2"
            >
              <Tv className="w-4 h-4 text-[#E31837]" />
              <span>My Video Library</span>
            </button>
            <button
              onClick={() => {
                onNavigate('/cinema');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-[#171923] hover:bg-gray-100"
            >
              Cinema & Screens
            </button>
            <button
              onClick={() => {
                onNavigate('/my-bookings');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-[#171923] hover:bg-gray-100 flex items-center space-x-2"
            >
              <Ticket className="w-4 h-4 text-[#E31837]" />
              <span>My Tickets</span>
            </button>
            <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
              {currentUser ? (
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs text-[#667085]">Signed in as {currentUser.name}</span>
                  <button
                    onClick={() => {
                      logoutCustomer();
                      setMobileMenuOpen(false);
                    }}
                    className="text-xs text-[#E31837] font-bold"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onNavigate('/login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 bg-gray-900 text-white text-center rounded-lg text-sm font-semibold shadow-xs"
                >
                  Sign In to Account
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Instant Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start justify-center pt-20 px-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-gray-150 flex items-center space-x-3 bg-gray-50/70">
              <Search className="w-5 h-5 text-[#E31837]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search movies by title, language (Hindi, Bhojpuri), or genre..."
                autoFocus
                className="w-full bg-transparent text-[#171923] placeholder-gray-400 focus:outline-none text-base sm:text-lg font-medium"
              />
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-[#171923]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-4 space-y-2">
              {searchQuery.trim() === '' ? (
                <div className="py-8 text-center text-gray-400 text-sm">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  Type movie title, genre (Action, Horror, Comedy), or language (Hindi, Bhojpuri)
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-sm">
                  No movies found matching &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : (
                searchResults.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSearchOpen(false);
                      onNavigate(`/movies/${m.id}`);
                    }}
                    className="flex items-center space-x-4 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200 transition-colors"
                  >
                    <img
                      src={m.posterUrl}
                      alt={m.title}
                      className="w-12 h-16 object-cover rounded-md shadow-xs flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-[#171923] font-bold text-sm truncate">{m.title}</h4>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-bold border border-gray-200">
                          {m.certification}
                        </span>
                      </div>
                      <p className="text-xs text-[#667085] mt-0.5">
                        {m.language} • {m.genre.join(', ')} • {m.durationMinutes} mins
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                        m.status === 'NOW_SHOWING'
                          ? 'bg-red-50 text-[#E31837] border border-red-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {m.status === 'NOW_SHOWING' ? 'Book' : 'Coming'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
