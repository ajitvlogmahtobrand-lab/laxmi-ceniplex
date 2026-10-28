import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize, AlertCircle, ShieldAlert, Sparkles, Clock, RefreshCw } from 'lucide-react';
import { Movie } from '../../types';

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: Movie;
  playbackToken?: string;
  isRental?: boolean;
  expiresAt?: string;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  isOpen,
  onClose,
  content,
  playbackToken,
  isRental,
  expiresAt,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [remainingTimeStr, setRemainingTimeStr] = useState<string>('');

  // Sample or authorized direct video URL selection
  // Checks if trailerUrl or direct video is supported
  const resolvePlayableUrl = (): { url: string; isDirectVideo: boolean; isYoutube: boolean } => {
    const rawUrl = content.trailerUrl || '';

    // Check if YouTube
    if (rawUrl.includes('youtube.com') || rawUrl.includes('youtu.be')) {
      let videoId = '';
      if (rawUrl.includes('v=')) {
        videoId = rawUrl.split('v=')[1]?.split('&')[0] || '';
      } else if (rawUrl.includes('youtu.be/')) {
        videoId = rawUrl.split('youtu.be/')[1]?.split('?')[0] || '';
      }
      return {
        url: videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0` : rawUrl,
        isDirectVideo: false,
        isYoutube: true,
      };
    }

    // Direct MP4 / WebM / HLS stream URL
    if (rawUrl.endsWith('.mp4') || rawUrl.endsWith('.webm') || rawUrl.endsWith('.m3u8')) {
      return { url: rawUrl, isDirectVideo: true, isYoutube: false };
    }

    // Fallback safe sample video stream if URL is empty or unplayable
    return {
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      isDirectVideo: true,
      isYoutube: false,
    };
  };

  const resolved = resolvePlayableUrl();

  // Rental expiry countdown
  useEffect(() => {
    if (!isRental || !expiresAt) return;

    const updateTimer = () => {
      const msLeft = new Date(expiresAt).getTime() - Date.now();
      if (msLeft <= 0) {
        setRemainingTimeStr('Rental Expired');
        setIsError(true);
        setErrorMessage('Your rental access period has expired. Please renew your rental.');
        if (videoRef.current) videoRef.current.pause();
      } else {
        const hours = Math.floor(msLeft / (1000 * 60 * 60));
        const minutes = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
        setRemainingTimeStr(`${hours}h ${minutes}m remaining`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [isRental, expiresAt]);

  if (!isOpen) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    setDuration(videoRef.current.duration || 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md">
      <div className="relative w-full max-w-5xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-white">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-900/90 border-b border-zinc-800">
          <div className="flex items-center space-x-3">
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-[#E31837] text-white">
              {content.contentType?.replace('_', ' ') || 'STREAM'}
            </span>
            <h3 className="font-extrabold text-sm sm:text-base text-white truncate max-w-md">
              {content.title}
            </h3>
            {isRental && remainingTimeStr && (
              <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Clock className="w-3 h-3" />
                <span>{remainingTimeStr}</span>
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Close Player"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Canvas Container */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden group">
          {/* Watermarked Session Security Overlay */}
          <div className="absolute top-4 right-4 z-20 pointer-events-none select-none text-[10px] font-mono text-white/30 bg-black/40 px-2 py-1 rounded backdrop-blur-xs">
            LXM-ID: {playbackToken?.slice(0, 16) || 'PUBLIC-STREAM'} • HAZARIBAGH
          </div>

          {isError ? (
            <div className="p-6 text-center max-w-md space-y-3">
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
              <h4 className="text-base font-bold text-white">Playback Interrupted</h4>
              <p className="text-xs text-zinc-400">{errorMessage || 'Unable to load video stream.'}</p>
              <button
                onClick={() => {
                  setIsError(false);
                  if (videoRef.current) {
                    videoRef.current.load();
                    videoRef.current.play();
                  }
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-white"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          ) : resolved.isYoutube ? (
            <iframe
              src={resolved.url}
              title={content.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <>
              <video
                ref={videoRef}
                src={resolved.url}
                className="w-full h-full object-contain cursor-pointer"
                onClick={togglePlay}
                onTimeUpdate={handleTimeUpdate}
                onError={() => {
                  setIsError(true);
                  setErrorMessage(
                    'The configured video stream URL could not be rendered in the browser. Please verify the URL or format.'
                  );
                }}
                playsInline
              />

              {/* Center Play/Pause button on hover */}
              {!isPlaying && (
                <button
                  onClick={togglePlay}
                  className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-[#E31837]/90 hover:bg-[#E31837] text-white flex items-center justify-center shadow-xl shadow-red-600/30 transition-transform transform hover:scale-110 cursor-pointer"
                >
                  <Play className="w-8 h-8 ml-1 fill-white" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Video Player Controls (for HTML5 video) */}
        {!resolved.isYoutube && !isError && (
          <div className="px-5 py-3 bg-zinc-900 border-t border-zinc-800 space-y-2">
            {/* Seekbar */}
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#E31837]"
              />
              <span className="text-[11px] font-mono text-zinc-400 whitespace-nowrap">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Bottom buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={togglePlay}
                  className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                </button>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={toggleMute}
                    className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
                  >
                    {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setVolume(v);
                      setIsMuted(v === 0);
                      if (videoRef.current) {
                        videoRef.current.volume = v;
                        videoRef.current.muted = v === 0;
                      }
                    }}
                    className="w-16 h-1 bg-zinc-700 rounded appearance-none accent-[#E31837]"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Playback speed */}
                <div className="flex items-center space-x-1 bg-zinc-800 px-2 py-1 rounded-lg text-xs">
                  {[1, 1.25, 1.5, 2].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSpeedChange(s)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        playbackSpeed === s ? 'bg-[#E31837] text-white' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleFullscreen}
                  className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
                  title="Fullscreen"
                >
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Security & Public URL Limitation Notice */}
        <div className="px-5 py-2.5 bg-zinc-950 text-[11px] text-zinc-400 border-t border-zinc-900 flex items-start space-x-2">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p>
            <strong>Security Architecture Notice:</strong> Public direct video URLs are accessible outside this player.
            To enforce cryptographic Digital Rights Management (DRM), anti-screen-recording or signed temporary access cookies,
            configure Cloudflare Stream / Mux in <em>Admin &gt; Video Provider</em>.
          </p>
        </div>
      </div>
    </div>
  );
};
