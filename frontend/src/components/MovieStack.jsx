import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ChevronRight, Sparkles, RefreshCw, Eye } from 'lucide-react';
import { getPosterUrl } from '../config';
import ShinyText from './ShinyText';

/**
 * MovieStack Component (inspired by Stack from React Bits)
 * Interactive card deck with rotational depth and swipeable film cards.
 */
export default function MovieStack({ movies = [], title = 'Cinephile Mystery Deck' }) {
  const [cards, setCards] = useState(movies.slice(0, 5));
  const [activeIdx, setActiveIdx] = useState(0);

  // Sync if movies change
  React.useEffect(() => {
    if (movies.length > 0) {
      setCards(movies.slice(0, 5));
      setActiveIdx(0);
    }
  }, [movies]);

  if (!cards || cards.length === 0) return null;

  const handleNext = () => {
    setActiveIdx((prev) => (prev + 1) % cards.length);
  };

  const activeMovie = cards[activeIdx] || cards[0];
  const movieTitle = activeMovie.title || activeMovie.name;
  const rating = activeMovie.vote_average ? activeMovie.vote_average.toFixed(1) : '8.5';
  const mediaType = activeMovie.media_type || 'movie';

  return (
    <div className="relative border border-white/15 bg-gradient-to-br from-[#111420] via-[#0d101a] to-[#08090d] p-6 md:p-8 rounded-3xl overflow-hidden shadow-2xl">
      {/* Ambient Top Glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
        {/* Left info column */}
        <div className="text-left space-y-4 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/25 text-amber-300 font-mono text-[11px] font-bold uppercase">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <ShinyText text="Cinephile Deck // Blind Pick" />
          </div>

          <h3 className="font-display font-extrabold text-2xl md:text-3xl text-white">
            {movieTitle}
          </h3>

          <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
            {activeMovie.overview || "A compelling cinematic journey through timeless storytelling and visual mastery."}
          </p>

          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 font-mono text-xs text-amber-400 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{rating} TMDB</span>
            </div>

            <span className="text-xs font-mono text-slate-500">
              Card {activeIdx + 1} of {cards.length}
            </span>
          </div>

          <div className="flex items-center gap-3 pt-3">
            <Link
              to={`/media/${mediaType}/${activeMovie.id}`}
              className="btn-primary px-5 py-2.5 text-xs font-mono font-bold uppercase flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              <span>Explore Film</span>
            </Link>

            <button
              onClick={handleNext}
              className="btn-secondary px-4 py-2.5 text-xs font-mono font-bold flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Next Card</span>
            </button>
          </div>
        </div>

        {/* Right Stack Cards Visual */}
        <div className="relative w-64 h-88 cursor-pointer select-none" onClick={handleNext}>
          {cards.map((movie, index) => {
            const offset = (index - activeIdx + cards.length) % cards.length;
            if (offset > 3) return null; // Show top 4 layers

            // Dynamic rotation and depth offsets
            const rotations = [0, 4, -4, 8];
            const translateYs = [0, 10, 20, 30];
            const scales = [1, 0.94, 0.88, 0.82];
            const opacities = [1, 0.75, 0.5, 0.3];

            return (
              <div
                key={movie.id}
                className="absolute inset-0 rounded-2xl overflow-hidden border border-white/20 shadow-2xl transition-all duration-400 ease-out bg-slate-900"
                style={{
                  transform: `translate3d(0, ${translateYs[offset]}px, 0) rotate(${rotations[offset]}deg) scale(${scales[offset]})`,
                  zIndex: 10 - offset,
                  opacity: opacities[offset]
                }}
              >
                <img
                  src={getPosterUrl(movie.poster_path, 'w342')}
                  alt={movie.title || movie.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                
                {offset === 0 && (
                  <div className="absolute bottom-3 inset-x-3 text-left">
                    <span className="font-display font-bold text-xs text-white line-clamp-1 drop-shadow">
                      {movie.title || movie.name}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
