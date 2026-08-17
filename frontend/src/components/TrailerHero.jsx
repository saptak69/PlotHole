import React, { useState, useEffect, useRef } from 'react';
import { Play, X, Film, Loader2, Star, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { getBackdropUrl, API_URL } from '../config';

/**
 * TrailerHero Component
 * Cinematic panoramic banner with subtle transparent "Watch Trailer" button, touch swipe gestures, and mobile-optimized dimensions.
 */
export default function TrailerHero({
  movie,
  mediaType = 'movie',
  title,
  preloadedVideos,
  onPrev,
  onNext,
  onTrailerStateChange,
  showMeta = true,
  className = ''
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoKey, setVideoKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Touch swipe handling state
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const minSwipeDistance = 45;

  // Reset trailer state if movie changes
  useEffect(() => {
    setIsPlaying(false);
    setVideoKey(null);
    setError(false);
    onTrailerStateChange?.(false);
  }, [movie?.id]);

  const displayTitle = title || movie?.title || movie?.name || 'Feature Presentation';
  const backdropUrl = getBackdropUrl(movie?.backdrop_path);
  const movieDate = movie?.release_date || movie?.first_air_date;
  const year = movieDate ? new Date(movieDate).getFullYear() : null;
  const rating = movie?.vote_average ? movie.vote_average.toFixed(1) : null;

  // Extract trailer video key
  useEffect(() => {
    if (!isPlaying) return;
    if (videoKey) return;

    const parseTrailer = (videos) => {
      const trailer =
        videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
        videos.find((v) => v.site === 'YouTube' && v.type === 'Teaser') ||
        videos.find((v) => v.site === 'YouTube');

      if (trailer && trailer.key) {
        setVideoKey(trailer.key);
      } else {
        setError(true);
      }
      setLoading(false);
    };

    if (preloadedVideos && Array.isArray(preloadedVideos) && preloadedVideos.length > 0) {
      parseTrailer(preloadedVideos);
      return;
    }

    if (movie?.id) {
      setLoading(true);
      setError(false);
      fetch(`${API_URL}/media/${mediaType}/${movie.id}/videos`)
        .then((res) => res.json())
        .then((data) => {
          parseTrailer(data.results || []);
        })
        .catch(() => {
          setError(true);
          setLoading(false);
        });
    }
  }, [isPlaying, movie?.id, mediaType, preloadedVideos, videoKey]);

  const handleStartTrailer = () => {
    setIsPlaying(true);
    onTrailerStateChange?.(true);
  };

  const handleStopTrailer = () => {
    setIsPlaying(false);
    onTrailerStateChange?.(false);
  };

  // Touch Swipe Handlers for Mobile
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && onNext) {
      onNext();
    } else if (isRightSwipe && onPrev) {
      onPrev();
    }

    // Reset touch coordinates
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full rounded-2xl md:rounded-3xl overflow-hidden border border-white/10 bg-[#090b12] shadow-[0_20px_60px_rgba(0,0,0,0.8)] transition-all select-none ${className}`}
    >
      {/* Ambient Theater Backglow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/10 via-transparent to-cyan-500/10 blur-2xl pointer-events-none opacity-60" />

      {isPlaying ? (
        /* ================= ACTIVE INLINE VIDEO STAGE ================= */
        <div className="relative aspect-video w-full bg-black flex items-center justify-center min-h-[300px] md:min-h-[440px]">
          {/* Close Button */}
          <button
            onClick={handleStopTrailer}
            className="absolute top-3 right-3 md:top-4 md:right-4 z-30 px-3 py-1.5 rounded-full bg-black/80 hover:bg-black text-slate-200 hover:text-white border border-white/20 text-xs font-mono font-semibold flex items-center gap-1.5 backdrop-blur-md transition-all shadow-xl cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Close</span>
          </button>

          {loading ? (
            <div className="flex flex-col items-center gap-3 text-slate-400 font-mono text-xs">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              <span>Loading Official Cinema Stream...</span>
            </div>
          ) : error || !videoKey ? (
            <div className="text-center p-6 md:p-8 space-y-3 font-sans max-w-md">
              <Film className="w-10 h-10 text-amber-400/60 mx-auto mb-2" />
              <h4 className="text-sm font-display font-bold text-slate-200 uppercase">
                Trailer Video Unavailable
              </h4>
              <p className="text-xs text-slate-400">
                No direct YouTube stream found. Search directly on YouTube:
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(displayTitle + ' official trailer')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary inline-flex items-center gap-1.5 text-xs py-2 px-4"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Search on YouTube</span>
                </a>
                <button
                  onClick={handleStopTrailer}
                  className="btn-secondary text-xs py-2 px-4 cursor-pointer"
                >
                  Back
                </button>
              </div>
            </div>
          ) : (
            <iframe
              src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0&modestbranding=1`}
              title={`${displayTitle} Official Trailer`}
              className="w-full h-full border-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
      ) : (
        /* ================= CINEMATIC BACKDROP BANNER ================= */
        <div className="relative aspect-[4/3] sm:aspect-[16/8] md:aspect-[21/9] min-h-[380px] sm:min-h-[340px] md:min-h-[440px] w-full group overflow-hidden">
          {/* Backdrop Image */}
          {backdropUrl ? (
            <img
              src={backdropUrl}
              alt={displayTitle}
              className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-103"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-900 via-[#0d101a] to-black" />
          )}

          {/* Cinematic Vignette Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#090b12] via-[#090b12]/60 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#090b12]/90 via-[#090b12]/40 to-transparent pointer-events-none" />

          {/* Navigation Controls: Touch indicators on mobile & Desktop arrows */}
          {onPrev && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrev();
              }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/50 sm:bg-black/40 hover:bg-black/80 text-white border border-white/20 sm:border-white/15 backdrop-blur-md flex items-center justify-center opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 cursor-pointer shadow-lg"
              title="Previous Movie (Swipe Right on mobile)"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {onNext && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/50 sm:bg-black/40 hover:bg-black/80 text-white border border-white/20 sm:border-white/15 backdrop-blur-md flex items-center justify-center opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 cursor-pointer shadow-lg"
              title="Next Movie (Swipe Left on mobile)"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Centered Subtle & Transparent Play Button */}
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <button
              onClick={handleStartTrailer}
              className="pointer-events-auto group/btn flex items-center gap-2.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-black/40 hover:bg-black/65 text-white/90 hover:text-white border border-white/25 hover:border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.7)] backdrop-blur-md transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer"
              title="Play Official Trailer"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/15 group-hover/btn:bg-amber-400 group-hover/btn:text-black text-white flex items-center justify-center transition-colors shadow-inner">
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              </div>
              <span className="font-sans font-semibold text-xs sm:text-sm tracking-wide text-slate-200 group-hover/btn:text-white">
                Watch Trailer
              </span>
            </button>
          </div>

          {/* Bottom Title & Metadata Overlay */}
          {showMeta && (
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-8 sm:right-8 md:left-10 md:right-10 text-left z-20 pointer-events-none max-w-2xl">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] sm:text-xs font-mono font-bold uppercase">
                  {mediaType === 'tv' ? 'Series' : 'Feature Film'}
                </span>
                {year && (
                  <span className="font-mono text-[10px] sm:text-xs text-slate-300 bg-black/60 px-2.5 py-0.5 rounded-full border border-white/10">
                    {year}
                  </span>
                )}
                {rating && (
                  <span className="font-mono text-[10px] sm:text-xs text-amber-400 font-bold flex items-center gap-1 bg-black/60 px-2.5 py-0.5 rounded-full border border-white/10">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {rating}
                  </span>
                )}
              </div>

              <h2 className="font-display font-extrabold text-xl sm:text-3xl md:text-4xl text-white tracking-tight leading-tight drop-shadow-xl line-clamp-2">
                {displayTitle}
              </h2>

              {movie?.overview && (
                <p className="text-xs sm:text-sm text-slate-300/90 font-sans mt-2 line-clamp-2 leading-relaxed drop-shadow max-w-xl hidden sm:block">
                  {movie.overview}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
