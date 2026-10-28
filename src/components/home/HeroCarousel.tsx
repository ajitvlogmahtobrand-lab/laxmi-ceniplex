import React, { useState, useEffect } from 'react';
import { Play, Ticket, ChevronLeft, ChevronRight, Sparkles, Clock, Volume2, ArrowRight } from 'lucide-react';
import { Movie, HeroBanner } from '../../types';
import { storageService } from '../../services/storage';

interface HeroCarouselProps {
  movies: Movie[];
  onBookNow: (movieId: string) => void;
  onWatchTrailer: (movie: Movie) => void;
  onNavigateMovie: (movieId: string) => void;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({
  movies,
  onBookNow,
  onWatchTrailer,
  onNavigateMovie,
}) => {
  const [banners, setBanners] = useState<HeroBanner[]>(() =>
    storageService.getBanners().filter((b) => b.isActive !== false).sort((a, b) => a.displayOrder - b.displayOrder)
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  // Real-time synchronization listener for banner changes
  useEffect(() => {
    const handleUpdate = () => {
      const updated = storageService
        .getBanners()
        .filter((b) => b.isActive !== false)
        .sort((a, b) => a.displayOrder - b.displayOrder);
      setBanners(updated);
    };

    window.addEventListener('lxm_storage_update', handleUpdate);
    return () => window.removeEventListener('lxm_storage_update', handleUpdate);
  }, []);

  const featuredMovies = movies.filter((m) => m.status === 'NOW_SHOWING').slice(0, 5);

  // If banners are configured, use banners; otherwise fallback to featured movies
  const hasCustomBanners = banners.length > 0;
  const slideCount = hasCustomBanners ? banners.length : featuredMovies.length;

  useEffect(() => {
    if (slideCount <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slideCount);
    }, 6000);
    return () => clearInterval(timer);
  }, [slideCount]);

  if (slideCount === 0) return null;

  // Handle slide index bounds
  const safeIndex = currentIndex % slideCount;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? slideCount - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slideCount);
  };

  // Render Banner Slide
  if (hasCustomBanners) {
    const banner = banners[safeIndex];
    const targetMovie = banner.targetMovieId || banner.movieId
      ? movies.find((m) => m.id === (banner.targetMovieId || banner.movieId))
      : undefined;

    const bgImage = banner.desktopImage || banner.imageUrl || (targetMovie?.backdropUrl || targetMovie?.posterUrl) || '';

    return (
      <div className="relative w-full h-[480px] sm:h-[540px] md:h-[580px] overflow-hidden select-none bg-black">
        {/* Background Backdrop Image */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 transform scale-105"
          style={{ backgroundImage: `url(${bgImage})` }}
        >
          {/* Cinematic Vignette Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/25" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/65 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-16 z-20">
          <div className="max-w-2xl space-y-4">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-[#E31837] text-white flex items-center space-x-1 shadow-sm">
                <Sparkles className="w-3 h-3" />
                <span>FEATURED SPECIAL</span>
              </span>
              <span className="px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-white/20 text-white backdrop-blur-xs flex items-center space-x-1 border border-white/20">
                <Volume2 className="w-3 h-3 text-red-400" />
                <span>Dolby Atmos 7.1</span>
              </span>
              {targetMovie && (
                <span className="px-2 py-1 text-xs font-semibold rounded-md bg-black/60 text-white border border-white/20">
                  {targetMovie.certification}
                </span>
              )}
            </div>

            {/* Title */}
            <h1
              onClick={() => {
                if (targetMovie) onNavigateMovie(targetMovie.id);
              }}
              className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight hover:text-red-300 cursor-pointer transition-colors font-cinema drop-shadow-md"
            >
              {banner.title}
            </h1>

            {/* Subtitle */}
            {banner.subtitle && (
              <p className="text-sm sm:text-base font-semibold text-red-300">
                {banner.subtitle}
              </p>
            )}

            {/* Description */}
            {(banner.description || targetMovie?.synopsis) && (
              <p className="text-xs sm:text-sm text-gray-200 line-clamp-2 md:line-clamp-3 leading-relaxed max-w-xl drop-shadow-xs">
                {banner.description || targetMovie?.synopsis}
              </p>
            )}

            {/* Action CTAs */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {targetMovie ? (
                <button
                  onClick={() => onBookNow(targetMovie.id)}
                  className="px-6 py-3 bg-[#E31837] hover:bg-[#c91430] text-white font-bold rounded-xl shadow-lg shadow-red-600/30 flex items-center space-x-2 transition-all transform hover:scale-105 active:scale-95"
                >
                  <Ticket className="w-5 h-5" />
                  <span>{banner.ctaText || 'Book Tickets'}</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (banner.ctaLink?.startsWith('/movies/')) {
                      onBookNow(banner.ctaLink.replace('/movies/', ''));
                    } else if (featuredMovies[0]) {
                      onBookNow(featuredMovies[0].id);
                    }
                  }}
                  className="px-6 py-3 bg-[#E31837] hover:bg-[#c91430] text-white font-bold rounded-xl shadow-lg shadow-red-600/30 flex items-center space-x-2 transition-all transform hover:scale-105 active:scale-95"
                >
                  <Ticket className="w-5 h-5" />
                  <span>{banner.ctaText || 'Explore Now'}</span>
                </button>
              )}

              {targetMovie && (
                <button
                  onClick={() => onWatchTrailer(targetMovie)}
                  className="px-5 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl border border-white/30 backdrop-blur-md flex items-center space-x-2 transition-all hover:scale-105 active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Watch Trailer</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Carousel Navigation Arrows */}
        <button
          onClick={handlePrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/50 hover:bg-[#E31837] text-white backdrop-blur-xs border border-white/20 transition-all opacity-80 hover:opacity-100 hidden sm:block"
          aria-label="Previous banner"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/50 hover:bg-[#E31837] text-white backdrop-blur-xs border border-white/20 transition-all opacity-80 hover:opacity-100 hidden sm:block"
          aria-label="Next banner"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Carousel Indicator Dots */}
        <div className="absolute bottom-6 right-6 sm:right-12 z-30 flex items-center space-x-2">
          {banners.map((b, index) => (
            <button
              key={b.id}
              onClick={() => setCurrentIndex(index)}
              className={`transition-all duration-300 rounded-full ${
                index === safeIndex
                  ? 'w-8 h-2 bg-[#E31837] shadow-sm'
                  : 'w-2 h-2 bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    );
  }

  // Fallback to Featured Movies
  const current = featuredMovies[safeIndex];

  return (
    <div className="relative w-full h-[480px] sm:h-[540px] md:h-[580px] overflow-hidden select-none bg-black">
      {/* Background Backdrop Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 transform scale-105"
        style={{
          backgroundImage: `url(${current.backdropUrl || current.posterUrl})`,
        }}
      >
        {/* Cinematic Vignette Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-transparent" />
      </div>

      {/* Hero Content */}
      <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-16 z-20">
        <div className="max-w-2xl space-y-4">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-[#E31837] text-white flex items-center space-x-1 shadow-sm">
              <Sparkles className="w-3 h-3" />
              <span>NOW SHOWING</span>
            </span>
            <span className="px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-white/20 text-white backdrop-blur-xs flex items-center space-x-1 border border-white/20">
              <Volume2 className="w-3 h-3 text-red-400" />
              <span>Dolby Atmos 7.1</span>
            </span>
            <span className="px-2 py-1 text-xs font-semibold rounded-md bg-black/60 text-white border border-white/20">
              {current.certification}
            </span>
            <span className="px-2 py-1 text-xs font-semibold rounded-md bg-black/60 text-white border border-white/20 flex items-center space-x-1">
              <Clock className="w-3 h-3 text-red-400" />
              <span>{current.durationMinutes} mins</span>
            </span>
          </div>

          {/* Title */}
          <h1
            onClick={() => onNavigateMovie(current.id)}
            className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight hover:text-red-300 cursor-pointer transition-colors font-cinema drop-shadow-md"
          >
            {current.title}
          </h1>

          {/* Metadata */}
          <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-200">
            <span className="font-bold text-white">{current.language}</span>
            <span>•</span>
            <span>{current.genre.join(', ')}</span>
            {current.director && (
              <>
                <span>•</span>
                <span>Dir: {current.director}</span>
              </>
            )}
          </div>

          {/* Synopsis */}
          <p className="text-xs sm:text-sm text-gray-200 line-clamp-2 md:line-clamp-3 leading-relaxed max-w-xl drop-shadow-xs">
            {current.synopsis}
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onBookNow(current.id)}
              className="px-6 py-3 bg-[#E31837] hover:bg-[#c91430] text-white font-bold rounded-xl shadow-lg shadow-red-600/30 flex items-center space-x-2 transition-all transform hover:scale-105 active:scale-95"
            >
              <Ticket className="w-5 h-5" />
              <span>Book Tickets</span>
            </button>

            <button
              onClick={() => onWatchTrailer(current)}
              className="px-5 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl border border-white/30 backdrop-blur-md flex items-center space-x-2 transition-all hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Watch Trailer</span>
            </button>

            <button
              onClick={() => onNavigateMovie(current.id)}
              className="text-xs sm:text-sm text-gray-300 hover:text-white px-3 py-2 font-semibold underline underline-offset-4"
            >
              View Movie Details
            </button>
          </div>
        </div>
      </div>

      {/* Carousel Navigation Arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/50 hover:bg-[#E31837] text-white backdrop-blur-xs border border-white/20 transition-all opacity-80 hover:opacity-100 hidden sm:block"
        aria-label="Previous movie"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/50 hover:bg-[#E31837] text-white backdrop-blur-xs border border-white/20 transition-all opacity-80 hover:opacity-100 hidden sm:block"
        aria-label="Next movie"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Carousel Indicator Dots */}
      <div className="absolute bottom-6 right-6 sm:right-12 z-30 flex items-center space-x-2">
        {featuredMovies.map((m, index) => (
          <button
            key={m.id}
            onClick={() => setCurrentIndex(index)}
            className={`transition-all duration-300 rounded-full ${
              index === safeIndex
                ? 'w-8 h-2 bg-[#E31837] shadow-sm'
                : 'w-2 h-2 bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
