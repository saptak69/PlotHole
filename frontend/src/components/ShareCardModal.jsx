import React from 'react';
import { X, Share2, Copy, Check, Star } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getPosterUrl } from '../config';
import GlassSurface from './GlassSurface';

export default function ShareCardModal({ movie, review, rating, username, isOpen, onClose }) {
  const [copied, setCopied] = React.useState(false);
  const toast = useToast();

  if (!isOpen || !movie) return null;

  const title = movie.title || movie.name;
  const year = (movie.release_date || movie.first_air_date || '').split('-')[0];

  const handleCopyText = () => {
    const textToCopy = `FILM: "${title}" (${year})\nRating: ${rating || 5}/5\n\n"${review || 'Watched on PlotHole!'}"\n\n— Reviewed by @${username || 'cinephile'} on PlotHole Cinema Chronicles`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.addToast('Copied review quote to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/85 flex items-center justify-center p-4 backdrop-blur-2xl animate-fade-in">
      <GlassSurface
        width="100%"
        height="auto"
        borderRadius={28}
        backgroundOpacity={0.45}
        blur={14}
        borderOpacity={0.14}
        className="max-w-lg shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_30px_rgba(229,9,20,0.08)]"
      >
        <div className="w-full text-slate-100">
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 bg-white/5 border-b border-white/8">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#e50914]/15 border border-[#e50914]/30 flex items-center justify-center text-[#ff2e3b] shadow-[0_0_10px_rgba(229,9,20,0.2)]">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-display font-black text-sm text-slate-100 uppercase tracking-wider block text-left">
                  Cinephile Stamp
                </span>
                <span className="font-mono text-[10px] text-slate-400 font-bold uppercase text-left block">Shareable Review Card</span>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Card Preview */}
            <div className="relative border border-white/12 bg-gradient-to-br from-[#1a1a24] via-[#121216] to-[#08080a] rounded-2xl p-6 overflow-hidden shadow-2xl">
              {/* Backdrop Glow */}
              {movie.backdrop_path && (
                <img
                  src={`https://image.tmdb.org/t/p/w780${movie.backdrop_path}`}
                  alt="Backdrop"
                  className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm pointer-events-none"
                />
              )}

              <div className="relative z-10 space-y-4 text-left">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-white/8 pb-3">
                  <span className="font-display font-black text-xs text-[#e50914] uppercase tracking-widest">PLOTHOLE CHRONICLES</span>
                  <span className="font-mono text-[10px] text-slate-400 uppercase">REVIEWED BY @{username || 'CINEPHILE'}</span>
                </div>

                {/* Film details */}
                <div className="flex gap-4 items-center">
                  {movie.poster_path && (
                    <img
                      src={getPosterUrl(movie.poster_path, 'w185')}
                      alt={title}
                      className="w-16 h-24 object-cover border border-white/15 rounded-xl shadow-xl shrink-0"
                    />
                  )}
                  <div className="space-y-1">
                    <h3 className="font-display font-bold text-lg text-white leading-tight">{title}</h3>
                    <p className="font-mono text-xs text-slate-400">{year} • {movie.media_type === 'tv' ? 'TV SERIES' : 'FEATURE FILM'}</p>
                    
                    {/* Rating Stars */}
                    <div className="flex items-center gap-1 text-[#ffb800] text-sm font-bold pt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${star <= (rating || 5) ? 'fill-[#ffb800] text-[#ffb800]' : 'text-slate-700'}`}
                        />
                      ))}
                      <span className="ml-1 text-xs font-mono font-bold text-slate-300">({rating || 5}/5)</span>
                    </div>
                  </div>
                </div>

                {/* Review Text */}
                {review && (
                  <div className="p-3.5 bg-black/40 border border-white/8 rounded-xl italic text-xs font-sans text-slate-200 leading-relaxed">
                    "{review}"
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <button onClick={onClose} className="btn-secondary text-xs px-4 py-2 cursor-pointer">
                Close
              </button>
              <button
                onClick={handleCopyText}
                className="btn-primary px-5 py-2.5 text-xs flex items-center gap-2 font-bold shadow-md cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy Stamp Text'}</span>
              </button>
            </div>
          </div>
        </div>
      </GlassSurface>
    </div>
  );
}
