import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Film, Tv, Bookmark } from 'lucide-react';
import { getPosterUrl } from '../config';

/**
 * 3D Perspective Card Component
 * Inspired by originkit.dev & 21st.dev & ui.aceternity.com
 */
export default function MovieCard({ movie, featured = false }) {
  const cardRef = useRef(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const mediaType = movie.media_type || (movie.name ? 'tv' : 'movie');
  const title = movie.title || movie.name;

  const year = (movie.release_date || movie.first_air_date) 
    ? new Date(movie.release_date || movie.first_air_date).getFullYear() 
    : '';

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Max 10 degrees tilt
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    
    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
  };

  return (
    <Link 
      to={`/media/${mediaType}/${movie.id}`} 
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group relative block rounded-xl overflow-hidden bg-[#111420] border border-white/10 transition-all duration-200 select-none focus-visible:outline-none ${
        featured ? 'ring-1 ring-amber-400/40 shadow-[0_0_25px_rgba(245,158,11,0.2)]' : 'hover:border-amber-400/30'
      }`}
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) translateY(-4px)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)',
        boxShadow: isHovered
          ? '0 20px 35px -10px rgba(0, 0, 0, 0.7), 0 0 20px -5px rgba(245, 158, 11, 0.2)'
          : '0 8px 20px -6px rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* Poster Image Area */}
      <div className="aspect-[2/3] w-full overflow-hidden relative bg-[#0a0c13]">
        {movie.poster_path ? (
          <img
            src={getPosterUrl(movie.poster_path, 'w500')}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-xs font-mono font-medium text-slate-500 bg-slate-900/50">
            <Film className="w-8 h-8 mb-2 opacity-40 text-amber-400" />
            <span className="line-clamp-2">{title}</span>
          </div>
        )}

        {/* Gradient dark vignette for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111420] via-transparent to-black/20 opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Media type badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-slate-300 uppercase">
            {mediaType === 'tv' ? <Tv className="w-3 h-3 text-sky-400" /> : <Film className="w-3 h-3 text-amber-400" />}
            <span>{mediaType === 'tv' ? 'Series' : 'Film'}</span>
          </span>
        </div>

        {/* TMDB Rating floating badge */}
        {movie.vote_average ? (
          <div className="absolute bottom-2.5 right-2.5 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-amber-400/30 text-amber-300 font-mono text-[11px] font-bold shadow-lg">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{movie.vote_average.toFixed(1)}</span>
          </div>
        ) : null}
      </div>

      {/* Card Info Area */}
      <div className="p-3 text-left bg-gradient-to-b from-[#111420] to-[#0d101a]">
        <h3 className="font-display font-bold text-[13px] text-slate-100 group-hover:text-amber-400 transition-colors leading-snug truncate">
          {title}
        </h3>
        <div className="flex items-center justify-between mt-1 text-[11px] font-mono text-slate-400">
          <span>{year || 'Cinema'}</span>
          {movie.popularity && (
            <span className="text-[10px] text-slate-500 font-normal">
              {Math.round(movie.popularity)} pts
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
