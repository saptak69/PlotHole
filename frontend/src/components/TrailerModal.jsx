import React, { useState, useEffect } from 'react';
import { X, Play, Loader2, Film } from 'lucide-react';
import { API_URL } from '../config';

export default function TrailerModal({ isOpen, onClose, movieId, mediaType = 'movie', title, preloadedVideos }) {
  const [videoKey, setVideoKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isOpen || !movieId) return;

    let isMounted = true;
    setLoading(true);
    setError(false);

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

    fetch(`${API_URL}/media/${mediaType}/${movieId}/videos`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch videos');
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        parseTrailer(data.results || []);
      })
      .catch(() => {
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, movieId, mediaType, preloadedVideos]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/85 flex items-center justify-center p-4 backdrop-blur-2xl animate-fade-in">
      <div 
        className="w-full max-w-4xl rounded-2xl overflow-hidden border border-white/15 bg-[#0e111a] text-slate-100 shadow-[0_25px_70px_rgba(0,0,0,0.9)]"
        style={{ animation: 'fade-up 250ms cubic-bezier(0.22, 1, 0.36, 1) both' }}
      >
        {/* Title bar */}
        <div className="flex justify-between items-center px-6 py-4 bg-white/5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Play className="w-3.5 h-3.5 fill-amber-400" />
            </div>
            <div>
              <span className="font-display font-bold text-sm text-slate-100 uppercase tracking-wide block truncate max-w-lg">
                {title || 'Cinema Preview'}
              </span>
              <span className="font-mono text-[10px] text-slate-400 uppercase">Official Trailer</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Area */}
        <div className="relative aspect-video bg-black flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-slate-400 font-mono text-xs">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              <span>STREAMING TRAILER FROM TMDB ARCHIVE...</span>
            </div>
          ) : error || !videoKey ? (
            <div className="text-center p-8 space-y-3 font-sans">
              <Film className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-rose-400 font-bold text-sm font-display">NO DIRECT TRAILER STREAM AVAILABLE</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No YouTube trailer embed was found for this specific title. You can search directly on YouTube.
              </p>
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent((title || '') + ' official trailer')}`}
                target="_blank"
                rel="noreferrer"
                className="btn-primary inline-flex items-center gap-2 text-xs py-2 px-5 mt-2"
              >
                Search on YouTube
              </a>
            </div>
          ) : (
            <iframe
              src={`https://www.youtube.com/embed/${videoKey}?autoplay=1`}
              title={`${title} Trailer`}
              className="w-full h-full border-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
      </div>
    </div>
  );
}
