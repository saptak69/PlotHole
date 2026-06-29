import React from 'react';
import { Link } from 'react-router-dom';
import { getPosterUrl } from '../config';

export default function MovieCard({ movie }) {
  const mediaType = movie.media_type || (movie.name ? 'tv' : 'movie');
  const title = movie.title || movie.name;

  return (
    <Link 
      to={`/media/${mediaType}/${movie.id}`} 
      className="group relative block rounded-none border-3 border-white bg-black shadow-[4px_4px_0px_#000] hover:border-brutal-pink hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
    >
      {/* Poster Image Container */}
      <div className="aspect-[2/3] w-full overflow-hidden relative rounded-none pb-9 bg-black">
        <img
          src={getPosterUrl(movie.poster_path)}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover bitmap-hover"
        />
        
        {/* Brutalist Title Bar Pinned to bottom of Card */}
        <div className="absolute bottom-0 inset-x-0 bg-black border-t-3 border-white py-2 px-2.5 text-left font-mono group-hover:bg-brutal-cyan transition-colors">
          <h3 className="font-black text-[9px] text-white group-hover:text-black uppercase truncate tracking-tight">
            {title}
          </h3>
        </div>
      </div>
    </Link>
  );
}
