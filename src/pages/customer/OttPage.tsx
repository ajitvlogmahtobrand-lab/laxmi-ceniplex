import React, { useState, useEffect } from 'react';
import {
  Film,
  Tv,
  Sparkles,
  Search,
  Filter,
  Play,
  Clock,
  Tag,
  ShoppingBag,
  Layers,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { Movie, ContentType } from '../../types';
import { VideoPlayerModal } from '../../components/video/VideoPlayerModal';
import { VideoCheckoutModal } from '../../components/video/VideoCheckoutModal';

interface OttPageProps {
  onNavigate: (route: string, param?: string) => void;
}

export const OttPage: React.FC<OttPageProps> = ({ onNavigate }) => {
  const [contentList, setContentList] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedGenre, setSelectedGenre] = useState<string>('ALL');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ALL');
  const [selectedMonetization, setSelectedMonetization] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [playerModalMovie, setPlayerModalMovie] = useState<Movie | null>(null);
  const [checkoutMovie, setCheckoutMovie] = useState<Movie | null>(null);
  const [checkoutMode, setCheckoutMode] = useState<'RENTAL' | 'PURCHASE'>('RENTAL');

  const loadData = () => {
    setIsLoading(true);
    const movies = storageService.getMovies();
    // Filter to published content
    const published = movies.filter(
      (m) =>
        m.status !== 'ARCHIVED' &&
        m.status !== 'DRAFT' &&
        m.visibility !== 'DRAFT' &&
        m.visibility !== 'UNPUBLISHED'
    );
    setContentList(published);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('lxm_storage_update', handleUpdate);
    return () => window.removeEventListener('lxm_storage_update', handleUpdate);
  }, []);

  // Filter types
  const categories = [
    { id: 'ALL', label: 'All Catalog', icon: Sparkles },
    { id: 'OTT_MOVIE', label: 'OTT Movies', icon: Film },
    { id: 'WEB_SERIES', label: 'Web Series', icon: Tv },
    { id: 'SHORT_FILM', label: 'Short Films', icon: Layers },
    { id: 'DOCUMENTARY', label: 'Documentaries', icon: BookOpen },
    { id: 'VIDEO_RENT', label: 'Rent Only', icon: Clock },
    { id: 'VIDEO_BUY', label: 'Buy to Own', icon: ShoppingBag },
  ];

  const genres = ['ALL', 'Action', 'Drama', 'Crime', 'Thriller', 'Mystery', 'Comedy', 'Documentary', 'Art'];
  const languages = ['ALL', 'Hindi', 'Bhojpuri', 'Nagpuri', 'English'];
  const monetizationOptions = [
    { id: 'ALL', label: 'All Pricing' },
    { id: 'FREE', label: 'Free to Watch' },
    { id: 'RENT', label: 'Rentals' },
    { id: 'BUY', label: 'Purchases' },
  ];

  const filteredItems = contentList.filter((item) => {
    // Type filter
    if (selectedType !== 'ALL') {
      if (selectedType === 'VIDEO_RENT') {
        const isRent = item.contentType === 'VIDEO_RENT' || item.monetization === 'RENT' || item.monetization === 'RENT_OR_BUY';
        if (!isRent) return false;
      } else if (selectedType === 'VIDEO_BUY') {
        const isBuy = item.contentType === 'VIDEO_BUY' || item.monetization === 'BUY' || item.monetization === 'RENT_OR_BUY';
        if (!isBuy) return false;
      } else if (item.contentType !== selectedType) {
        return false;
      }
    }

    // Genre filter
    if (selectedGenre !== 'ALL') {
      if (!item.genre?.includes(selectedGenre)) return false;
    }

    // Language filter
    if (selectedLanguage !== 'ALL') {
      if (item.language !== selectedLanguage) return false;
    }

    // Monetization filter
    if (selectedMonetization !== 'ALL') {
      if (selectedMonetization === 'FREE' && item.monetization !== 'FREE') return false;
      if (selectedMonetization === 'RENT' && item.monetization !== 'RENT' && item.monetization !== 'RENT_OR_BUY') return false;
      if (selectedMonetization === 'BUY' && item.monetization !== 'BUY' && item.monetization !== 'RENT_OR_BUY') return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSynopsis = item.synopsis?.toLowerCase().includes(q);
      const matchCast = item.cast?.some((c) => c.toLowerCase().includes(q));
      if (!matchTitle && !matchSynopsis && !matchCast) return false;
    }

    return true;
  });

  const featuredOTT = contentList.find((m) => m.isFeatured && m.contentType && m.contentType !== 'CINEMA_MOVIE') || contentList[0];

  return (
    <div className="min-h-screen bg-[#F6F7FB] pb-16 antialiased">
      {/* Hero Banner for OTT Releases */}
      {featuredOTT && (
        <div className="relative bg-zinc-950 text-white overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-25 scale-105 filter blur-xs"
            style={{ backgroundImage: `url(${featuredOTT.backdropUrl || featuredOTT.posterUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/90 to-transparent" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-red-600/30 text-red-400 border border-red-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Featured Digital Release</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black font-cinema tracking-tight text-white">
                {featuredOTT.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300">
                <span className="font-bold text-white">{featuredOTT.language}</span>
                <span>•</span>
                <span>{featuredOTT.genre?.join(', ')}</span>
                <span>•</span>
                <span>{featuredOTT.durationMinutes} mins</span>
                <span>•</span>
                <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[11px] font-bold">
                  {featuredOTT.certification}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-zinc-300 line-clamp-3 leading-relaxed">
                {featuredOTT.synopsis}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {featuredOTT.monetization === 'FREE' ? (
                  <button
                    onClick={() => setPlayerModalMovie(featuredOTT)}
                    className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-[#E31837] hover:bg-red-700 font-bold text-white text-xs sm:text-sm shadow-lg shadow-red-700/30 transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Watch Free Stream</span>
                  </button>
                ) : (
                  <>
                    {(featuredOTT.monetization === 'RENT' || featuredOTT.monetization === 'RENT_OR_BUY') && (
                      <button
                        onClick={() => {
                          setCheckoutMovie(featuredOTT);
                          setCheckoutMode('RENTAL');
                        }}
                        className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-[#E31837] hover:bg-red-700 font-bold text-white text-xs sm:text-sm shadow-lg shadow-red-700/30 transition-all cursor-pointer"
                      >
                        <Clock className="w-4 h-4" />
                        <span>Rent from ₹{featuredOTT.rentPriceINR || 79}</span>
                      </button>
                    )}
                    {(featuredOTT.monetization === 'BUY' || featuredOTT.monetization === 'RENT_OR_BUY') && (
                      <button
                        onClick={() => {
                          setCheckoutMovie(featuredOTT);
                          setCheckoutMode('PURCHASE');
                        }}
                        className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 font-bold text-white text-xs sm:text-sm border border-zinc-700 transition-all cursor-pointer"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Buy to Own (₹{featuredOTT.buyPriceINR || 199})</span>
                      </button>
                    )}
                  </>
                )}

                <button
                  onClick={() => onNavigate(`/movies/${featuredOTT.id}`)}
                  className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 font-bold text-white text-xs sm:text-sm backdrop-blur-xs transition-colors cursor-pointer"
                >
                  View Details
                </button>
              </div>
            </div>

            {/* Poster Preview */}
            <div className="shrink-0 w-48 sm:w-64 rounded-2xl overflow-hidden shadow-2xl border-2 border-zinc-800 hidden sm:block">
              <img
                src={featuredOTT.posterUrl}
                alt={featuredOTT.title}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Catalog Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Top Header & My Library Quick Link */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#171923] font-cinema tracking-tight">
              OTT & Digital Streams
            </h2>
            <p className="text-xs text-[#667085]">
              Watch digital movies, web series, short films, and documentaries on any device
            </p>
          </div>

          <button
            onClick={() => onNavigate('/my-library')}
            className="self-start sm:self-auto flex items-center space-x-2 px-4 py-2 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#E31837] text-xs font-bold text-[#171923] shadow-xs transition-colors cursor-pointer"
          >
            <Tv className="w-4 h-4 text-[#E31837]" />
            <span>My Library & Active Rentals</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#667085]" />
          </button>
        </div>

        {/* Content Type Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedType === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedType(cat.id)}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#E31837] text-white shadow-md shadow-red-600/20'
                    : 'bg-white border border-[#E5E7EB] text-[#667085] hover:text-[#171923] hover:bg-gray-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Secondary Filter & Search Bar */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#667085] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, director, or cast..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#171923] placeholder-gray-400 focus:outline-none focus:border-[#E31837] focus:bg-white transition-all"
              />
            </div>

            {/* Select Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Genre Dropdown */}
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#E31837]"
              >
                {genres.map((g) => (
                  <option key={g} value={g}>
                    {g === 'ALL' ? 'All Genres' : g}
                  </option>
                ))}
              </select>

              {/* Language Dropdown */}
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#E31837]"
              >
                {languages.map((l) => (
                  <option key={l} value={l}>
                    {l === 'ALL' ? 'All Languages' : l}
                  </option>
                ))}
              </select>

              {/* Pricing Filter */}
              <select
                value={selectedMonetization}
                onChange={(e) => setSelectedMonetization(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#E31837]"
              >
                {monetizationOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Catalog Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 h-80 animate-pulse" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-12 text-center space-y-3">
            <Film className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Content Matches Your Filter</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try switching categories or clearing search keywords to view available digital titles.
            </p>
            <button
              onClick={() => {
                setSelectedType('ALL');
                setSelectedGenre('ALL');
                setSelectedLanguage('ALL');
                setSelectedMonetization('ALL');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-xl cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {filteredItems.map((item) => {
              const isRent = item.monetization === 'RENT' || item.monetization === 'RENT_OR_BUY';
              const isBuy = item.monetization === 'BUY' || item.monetization === 'RENT_OR_BUY';
              const isFree = item.monetization === 'FREE' || (!isRent && !isBuy && item.contentType !== 'CINEMA_MOVIE');

              return (
                <div
                  key={item.id}
                  className="group bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Poster Image Container */}
                  <div
                    onClick={() => onNavigate(`/movies/${item.id}`)}
                    className="relative aspect-[2/3] w-full bg-slate-900 cursor-pointer overflow-hidden"
                  >
                    <img
                      src={item.posterUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                    {/* Top Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-black/60 backdrop-blur-xs text-white border border-white/20">
                        {item.contentType?.replace('_', ' ') || 'CINEMA'}
                      </span>
                      {item.seasonsCount && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-[#E31837] text-white">
                          Season {item.seasonsCount} ({item.episodes?.length || 3} Eps)
                        </span>
                      )}
                    </div>

                    {/* Pricing Badge at bottom-right */}
                    <div className="absolute bottom-2 right-2">
                      {isFree ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-600 text-white shadow-xs">
                          FREE
                        </span>
                      ) : isRent ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-[#E31837] text-white shadow-xs">
                          RENT ₹{item.rentPriceINR || 49}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-600 text-white shadow-xs">
                          BUY ₹{item.buyPriceINR || 149}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metadata info */}
                  <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h4
                        onClick={() => onNavigate(`/movies/${item.id}`)}
                        className="font-black text-sm text-[#171923] hover:text-[#E31837] transition-colors truncate cursor-pointer"
                        title={item.title}
                      >
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-[#667085] flex items-center space-x-1">
                        <span>{item.language}</span>
                        <span>•</span>
                        <span>{item.genre?.[0] || 'Feature'}</span>
                        <span>•</span>
                        <span>{item.durationMinutes}m</span>
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
                      {isFree ? (
                        <button
                          onClick={() => setPlayerModalMovie(item)}
                          className="flex-1 py-1.5 bg-[#E31837] hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>Watch</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setCheckoutMovie(item);
                            setCheckoutMode(isRent ? 'RENTAL' : 'PURCHASE');
                          }}
                          className="flex-1 py-1.5 bg-[#E31837] hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                        >
                          <Clock className="w-3 h-3" />
                          <span>{isRent ? `Rent ₹${item.rentPriceINR || 49}` : `Buy ₹${item.buyPriceINR || 149}`}</span>
                        </button>
                      )}

                      <button
                        onClick={() => onNavigate(`/movies/${item.id}`)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                        title="Info"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      {playerModalMovie && (
        <VideoPlayerModal
          isOpen={!!playerModalMovie}
          onClose={() => setPlayerModalMovie(null)}
          content={playerModalMovie}
        />
      )}

      {/* Video Checkout Modal */}
      {checkoutMovie && (
        <VideoCheckoutModal
          isOpen={!!checkoutMovie}
          onClose={() => setCheckoutMovie(null)}
          content={checkoutMovie}
          initialMode={checkoutMode}
          onOrderSubmitted={() => {
            // Can redirect to library
          }}
        />
      )}
    </div>
  );
};
