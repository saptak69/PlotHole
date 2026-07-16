import React from 'react';
import { Link } from 'react-router-dom';
import { getPosterUrl } from '../config';

export default function MovieCard({ movie }) {
  const mediaType = movie.media_type || (movie.name ? 'tv' : 'movie');
  const title = movie.title || movie.name;

  return (
    <Link 
      to={`/media/${mediaType}/${movie.id}`} 
      className="group relative block p-2 rounded-[16px] border border-white/10 bg-brand-card hover:shadow-[0_8px_30px_rgba(0,242,254,0.15)] hover:border-brutal-cyan/30 hover:scale-[1.04] transition-all duration-300 focus-visible:outline-none"
    >
      {/* Poster Image Container */}
      <div className="aspect-[2/3] w-full overflow-hidden relative bg-black rounded-[8px] mb-2">
        <img
          src={getPosterUrl(movie.poster_path)}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover bitmap-hover"
        />
      </div>
      
      <div className="px-1 pb-1 text-left font-sans">
        <h3 className="font-extrabold text-[11px] text-white group-hover:text-brutal-cyan uppercase truncate tracking-tight">
          {title}
        </h3>
        {movie.vote_average && (
          <span className="text-[9px] text-brand-text-muted font-mono font-medium mt-0.5 block">
            ★ {movie.vote_average.toFixed(1)} / 10
          </span>
        )}
      </div>
    </Link>
  );
}
