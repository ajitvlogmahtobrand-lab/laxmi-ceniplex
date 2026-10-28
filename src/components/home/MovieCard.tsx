import React from 'react';
import { Play, Ticket, Calendar } from 'lucide-react';
import { Movie } from '../../types';

interface MovieCardProps {
  movie: Movie;
  onBookNow: (movieId: string) => void;
  onWatchTrailer: (movie: Movie) => void;
  onSelectMovie: (movieId: string) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onBookNow,
  onWatchTrailer,
  onSelectMovie,
}) => {
  const isNowShowing = movie.status === 'NOW_SHOWING';

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden border border-[#E5E7EB] hover:border-[#E31837]/50 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/5 flex flex-col">
      {/* Poster Media Container */}
      <div
        className="relative aspect-[2/3] w-full overflow-hidden bg-gray-100 cursor-pointer"
        onClick={() => onSelectMovie(movie.id)}
      >
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <div className="space-y-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            {isNowShowing ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBookNow(movie.id);
                }}
                className="w-full py-2.5 bg-[#E31837] hover:bg-[#c91430] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Ticket className="w-4 h-4" />
                <span>Book Tickets</span>
              </button>
            ) : (
              <div className="text-center py-2 bg-amber-500/90 text-white text-xs font-bold rounded-xl shadow-sm">
                Releasing {new Date(movie.releaseDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onWatchTrailer(movie);
              }}
              className="w-full py-2 bg-white/20 hover:bg-white/30 text-white font-semibold text-xs rounded-xl border border-white/30 backdrop-blur-xs flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Watch Trailer</span>
            </button>
          </div>
        </div>

        {/* Badges on poster */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-white/90 text-[#171923] shadow-xs backdrop-blur-xs border border-gray-200">
            {movie.certification}
          </span>
          {movie.isRegional && (
            <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-amber-600 text-white shadow-xs">
              Regional
            </span>
          )}
        </div>

        <div className="absolute top-2.5 right-2.5">
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-red-600 text-white shadow-xs">
            {movie.language}
          </span>
        </div>
      </div>

      {/* Card Content Footer */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <h3
            onClick={() => onSelectMovie(movie.id)}
            className="text-[#171923] font-bold text-base leading-snug line-clamp-1 hover:text-[#E31837] cursor-pointer transition-colors"
            title={movie.title}
          >
            {movie.title}
          </h3>
          <p className="text-xs text-[#667085] line-clamp-1">
            {movie.genre.join(', ')}
          </p>
        </div>

        <div className="pt-3 mt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#667085]">
          <span>{movie.durationMinutes} mins</span>
          {isNowShowing ? (
            <button
              onClick={() => onBookNow(movie.id)}
              className="text-[#E31837] hover:text-[#b31028] font-bold flex items-center space-x-1"
            >
              <span>Showtimes</span>
              <span>→</span>
            </button>
          ) : (
            <span className="flex items-center space-x-1 text-gray-500 font-medium">
              <Calendar className="w-3 h-3" />
              <span>{new Date(movie.releaseDate).getFullYear()}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
