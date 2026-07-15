import React from 'react';
import { Link } from 'react-router-dom';
import { getPosterUrl } from '../config';

export default function MovieCard({ movie }) {
  const mediaType = movie.media_type || (movie.name ? 'tv' : 'movie');
  const title = movie.title || movie.name;

  return (
    <Link 
      to={`/media/${mediaType}/${movie.id}`} 
      className="group relative block rounded-2xl border border-white/10 bg-brand-card overflow-hidden shadow-lg hover:shadow-[0_8px_30px_rgba(0,242,254,0.15)] hover:border-brutal-cyan/30 hover:scale-[1.04] transition-all duration-300 focus-visible:outline-none"
    >
      {/* Poster Image Container */}
      <div className="aspect-[2/3] w-full overflow-hidden relative bg-black">
        <img
          src={getPosterUrl(movie.poster_path)}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover bitmap-hover"
        />
        
        {/* Brutalist Title Bar Pinned to bottom of Card */}
        <div className="absolute bottom-0 inset-x-0 bg-black/80 backdrop-blur-md border-t border-white/10 py-3 px-3.5 text-left font-sans group-hover:bg-gradient-to-r group-hover:from-brutal-cyan/20 group-hover:to-blue-600/20 transition-all duration-300">
          <h3 className="font-bold text-xs md:text-sm text-white group-hover:text-brutal-cyan uppercase truncate tracking-tight">
            {title}
          </h3>
        </div>
      </div>
    </Link>
  );
}
