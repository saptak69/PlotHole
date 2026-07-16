import React from 'react';
import { Link } from 'react-router-dom';
import { getPosterUrl } from '../config';

export default function MovieCard({ movie }) {
  const mediaType = movie.media_type || (movie.name ? 'tv' : 'movie');
  const title = movie.title || movie.name;
  
  // Deterministic halftone pattern based on movie id
  const halftones = ['halftone-red', 'halftone-blue', 'halftone-yellow', 'halftone-dark'];
  const halftoneClass = halftones[movie.id % halftones.length];
  
  // Deterministic tilt class to recreate organic zine catalog layout
  const tiltClass = movie.id % 2 === 0 ? 'rotate-[0.8deg]' : 'rotate-[-0.8deg]';
  
  // Issue identifier based on movie id
  const issueNumber = movie.id ? `#${String(movie.id).slice(-4)}` : '#0000';
  
  const genreLabel = movie.media_type 
    ? movie.media_type 
    : (movie.name ? 'TV' : 'MOVIE');

  const year = (movie.release_date || movie.first_air_date) 
    ? new Date(movie.release_date || movie.first_air_date).getFullYear() 
    : '';

  return (
    <Link 
      to={`/media/${mediaType}/${movie.id}`} 
      className={`card block border-3 border-brand-border bg-[#1b1810] shadow-[4px_4px_0_#f2e9d8] hover:shadow-[5px_6px_0_#f4c430] hover:translate-y-[-4px] hover:rotate-0 transition-all duration-150 select-none group focus-visible:outline-none ${tiltClass}`}
    >
      {/* Poster Image Container */}
      <div className={`poster aspect-[2/3] w-full overflow-hidden relative border-b-3 border-brand-border ${halftoneClass}`}>
        <div className="issue-badge absolute top-1.5 left-1.5 bg-[#121008] text-[#f2e9d8] font-mono text-[9px] font-bold px-2 py-0.5 border border-brand-border select-none z-10">
          {issueNumber}
        </div>
        
        {movie.poster_path && (
          <img
            src={getPosterUrl(movie.poster_path)}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover bitmap-hover"
          />
        )}
        
        {/* Speed lines hover overlay */}
        <div className="speed"></div>
        
        {movie.vote_average && (
          <div className="bubble absolute bottom-2 right-2">
            {movie.vote_average.toFixed(1)}
          </div>
        )}
      </div>
      
      <div className="card-meta p-3 text-left font-sans">
        <h3 className="card-title font-bold text-xs text-brand-text group-hover:text-[#f4c430] transition-colors leading-tight mb-1 truncate uppercase">
          {title}
        </h3>
        <span className="card-sub font-mono text-[9px] text-brand-text-muted font-bold tracking-wider uppercase block">
          {genreLabel} {year ? `· ${year}` : ''}
        </span>
      </div>
    </Link>
  );
}
