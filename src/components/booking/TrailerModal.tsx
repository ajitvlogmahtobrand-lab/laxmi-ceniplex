import React from 'react';
import { X, Play, Film, Ticket } from 'lucide-react';
import { Movie } from '../../types';

interface TrailerModalProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
  onBookNow?: (movieId: string) => void;
}

export const TrailerModal: React.FC<TrailerModalProps> = ({ movie, isOpen, onClose, onBookNow }) => {
  if (!isOpen || !movie) return null;

  // Convert youtube watch URL to embed URL if needed
  const getEmbedUrl = (url?: string) => {
    if (!url) return null;
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
    }
    return url;
  };

  const embedUrl = getEmbedUrl(movie.trailerUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#0d131f] border border-white/15 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/60">
          <div className="flex items-center space-x-2">
            <Film className="w-5 h-5 text-red-500" />
            <h3 className="text-white font-bold text-base sm:text-lg">{movie.title} — Official Trailer</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Frame */}
        <div className="relative aspect-video bg-black flex items-center justify-center">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={`${movie.title} Trailer`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="text-center p-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center mx-auto">
                <Play className="w-8 h-8 fill-red-500" />
              </div>
              <p className="text-slate-300 font-medium">Trailer preview video for &ldquo;{movie.title}&rdquo;</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Official high-definition trailer provided by Laxmi Cineplex Media Studio.
              </p>
            </div>
          )}
        </div>

        {/* Footer with actions */}
        <div className="p-4 bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 text-center sm:text-left">
            <span className="text-white font-semibold">{movie.language}</span> • {movie.genre.join(', ')} •{' '}
            {movie.durationMinutes} mins • {movie.certification}
          </div>
          {movie.status === 'NOW_SHOWING' && onBookNow && (
            <button
              onClick={() => {
                onClose();
                onBookNow(movie.id);
              }}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-700/30 flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.02]"
            >
              <Ticket className="w-4 h-4" />
              <span>Book Tickets for this Movie</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
