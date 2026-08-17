import React, { useState, useEffect } from 'react';
import { Play, X, Film, Loader2, Star, Sparkles, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { getBackdropUrl, getPosterUrl, API_URL } from '../config';

/**
 * TrailerHero Component
 * Cinematic panoramic banner with "Watch Trailer" button and optional slideshow controls.
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

  return (
    <div
      className={`relative w-full rounded-2xl md:rounded-3xl overflow-hidden border border-white/10 bg-[#090b12] shadow-[0_20px_60px_rgba(0,0,0,0.8)] transition-all ${className}`}
    >
      {/* Ambient Theater Backglow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/10 via-transparent to-cyan-500/10 blur-2xl pointer-events-none opacity-60" />

      {isPlaying ? (
        /* ================= ACTIVE INLINE VIDEO STAGE ================= */
        <div className="relative aspect-video w-full bg-black flex items-center justify-center">
          {/* Close Button */}
          <button
            onClick={handleStopTrailer}
            className="absolute top-4 right-4 z-30 px-3.5 py-1.5 rounded-full bg-black/70 hover:bg-black/90 text-slate-200 hover:text-white border border-white/20 text-xs font-mono font-semibold flex items-center gap-1.5 backdrop-blur-md transition-all shadow-xl cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Close Trailer</span>
          </button>

          {loading ? (
            <div className="flex flex-col items-center gap-3 text-slate-400 font-mono text-xs">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              <span>Loading Official Cinema Stream...</span>
            </div>
          ) : error || !videoKey ? (
            <div className="text-center p-8 space-y-3 font-sans max-w-md">
              <Film className="w-10 h-10 text-amber-400/60 mx-auto mb-2" />
              <h4 className="text-sm font-display font-bold text-slate-200 uppercase">
                Trailer Video Unavailable in Archive
              </h4>
              <p className="text-xs text-slate-400">
                No direct YouTube stream found for this title. Search directly on YouTube:
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
                  Back to Banner
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
        <div className="relative aspect-[16/8] md:aspect-[21/9] w-full group overflow-hidden">
          {/* Backdrop Image */}
          {backdropUrl ? (
            <img
              src={backdropUrl}
              alt={displayTitle}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-103"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-900 via-[#0d101a] to-black" />
          )}

          {/* Vignette Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#090b12] via-[#090b12]/40 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#090b12]/90 via-[#090b12]/40 to-transparent pointer-events-none" />

          {/* Slideshow Arrow Controls (if provided) */}
          {onPrev && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrev();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/15 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 cursor-pointer"
              title="Previous Movie"
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
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/15 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 cursor-pointer"
              title="Next Movie"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Centered Large Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <button
              onClick={handleStartTrailer}
              className="group/btn flex items-center gap-3 px-6 py-3.5 rounded-full bg-[#090b12]/80 hover:bg-amber-500 text-white hover:text-black border border-amber-400/40 hover:border-amber-300 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_25px_rgba(245,158,11,0.3)] backdrop-blur-xl transition-all duration-300 transform hover:scale-108 cursor-pointer"
              title="Play Official Trailer"
            >
              <div className="w-8 h-8 rounded-full bg-amber-400 group-hover/btn:bg-black text-black group-hover/btn:text-amber-400 flex items-center justify-center transition-colors">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </div>
              <span className="font-display font-bold text-xs md:text-sm tracking-wider uppercase">
                Watch Trailer
              </span>
            </button>
          </div>

          {/* Bottom Title & Metadata Overlay */}
          {showMeta && (
            <div className="absolute bottom-6 left-6 right-6 md:left-10 md:right-10 text-left z-20 pointer-events-none max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-mono font-bold uppercase">
                  {mediaType === 'tv' ? 'Series' : 'Feature Film'}
                </span>
                {year && (
                  <span className="font-mono text-xs text-slate-300 bg-black/40 px-2 py-0.5 rounded border border-white/10">
                    {year}
                  </span>
                )}
                {rating && (
                  <span className="font-mono text-xs text-amber-400 font-bold flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded border border-white/10">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {rating}
                  </span>
                )}
              </div>

              <h2 className="font-display font-extrabold text-2xl md:text-4xl text-white tracking-tight leading-tight drop-shadow-xl line-clamp-2">
                {displayTitle}
              </h2>

              {movie?.overview && (
                <p className="text-xs text-slate-300 font-sans mt-2 line-clamp-2 leading-relaxed drop-shadow max-w-xl hidden sm:block">
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
