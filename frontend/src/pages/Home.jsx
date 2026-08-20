import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Flame, Trophy, Film, Tv, ArrowRight, Star, Clock } from 'lucide-react';
import { API_URL, getPosterUrl } from '../config';
import MovieCard from '../components/MovieCard';
import RatingBadge from '../components/RatingBadge';
import Avatar from '../components/Avatar';
import TrailerHero from '../components/TrailerHero';
import MovieStack from '../components/MovieStack';
import GlassSurface from '../components/GlassSurface';

export default function Home({ onOpenPerson }) {
  const { data: homeBundle, isLoading: bundleLoading } = useQuery({
    queryKey: ['homeBundle'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/home/bundle`);
      if (!res.ok) throw new Error('Failed to fetch home bundle');
      return res.json();
    }
  });

  const popularMovies = homeBundle?.popularMovies || [];
  const topRatedMovies = homeBundle?.topRatedMovies || [];
  const upcomingMovies = homeBundle?.upcomingMovies || [];
  const popularTv = homeBundle?.popularTv || [];
  const recentReviews = homeBundle?.recentReviews || [];

  const [heroIndex, setHeroIndex] = useState(0);
  const [isTrailerActive, setIsTrailerActive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('trending');

  const featuredList = popularMovies.slice(0, 6);
  const heroMovie = featuredList[heroIndex] || featuredList[0];

  // Automatic slideshow cycle every 6 seconds (paused if trailer is playing)
  useEffect(() => {
    if (featuredList.length <= 1 || isTrailerActive) return;

    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % featuredList.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [featuredList.length, isTrailerActive, heroIndex]);

  // Keyboard navigation for slideshow
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isTrailerActive) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') {
        handlePrevSlide();
      } else if (e.key === 'ArrowRight') {
        handleNextSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [featuredList.length, isTrailerActive]);

  const handlePrevSlide = () => {
    if (featuredList.length <= 1) return;
    setHeroIndex((prev) => (prev - 1 + featuredList.length) % featuredList.length);
  };

  const handleNextSlide = () => {
    if (featuredList.length <= 1) return;
    setHeroIndex((prev) => (prev + 1) % featuredList.length);
  };

  return (
    <div className="flex-1 pb-24 font-sans text-slate-100 relative overflow-hidden">

      {/* Symmetrical Hero Slideshow Showcase */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pt-4 sm:pt-6 pb-8 md:pb-10 space-y-4 relative z-10">
        {heroMovie ? (
          <div className="space-y-3.5">
            {/* Direct Trailer Hero with Transparent Play Button & Touch Swipe Support */}
            <TrailerHero
              movie={heroMovie}
              mediaType={heroMovie.name ? 'tv' : 'movie'}
              onPrev={featuredList.length > 1 ? handlePrevSlide : null}
              onNext={featuredList.length > 1 ? handleNextSlide : null}
              onTrailerStateChange={(active) => setIsTrailerActive(active)}
            />

            {/* Symmetrical Slideshow Indicator Dots with Progress Animation */}
            <div className="flex items-center justify-center gap-2 pt-2">
              {featuredList.map((movieItem, idx) => (
                <button
                  key={`dot-${movieItem.id || idx}`}
                  onClick={() => setHeroIndex(idx)}
                  className={`relative h-2 rounded-full transition-all duration-500 cursor-pointer overflow-hidden ${
                    heroIndex === idx
                      ? 'w-10 bg-gradient-to-r from-[#e50914] to-[#ff2e3b] shadow-[0_0_12px_rgba(229,9,20,0.5)]'
                      : 'w-2.5 bg-white/20 hover:bg-white/40'
                  }`}
                  title={`Go to ${movieItem.title || movieItem.name || `slide ${idx + 1}`}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="aspect-[21/9] w-full rounded-3xl bg-white/5 border border-white/8 skeleton-shimmer" />
        )}
      </div>

      {/* Symmetrical Category Navigation Rail with GlassSurface */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 mb-8 relative z-10">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <GlassSurface
            width="auto"
            height="auto"
            borderRadius={20}
            backgroundOpacity={0.05}
            blur={12}
            borderOpacity={0.12}
            className="p-1 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_15px_rgba(229,9,20,0.04)]"
          >
            <div className="flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none select-none">
              <button
                onClick={() => setSelectedCategory('trending')}
                className={`px-4 py-2 text-xs font-display font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                  selectedCategory === 'trending'
                    ? 'bg-gradient-to-r from-[#e50914] to-[#ff2e3b] text-white shadow-[0_0_15px_rgba(229,9,20,0.4)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Trending Cinema</span>
              </button>

              <button
                onClick={() => setSelectedCategory('topRated')}
                className={`px-4 py-2 text-xs font-display font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                  selectedCategory === 'topRated'
                    ? 'bg-gradient-to-r from-[#e50914] to-[#ff2e3b] text-white shadow-[0_0_15px_rgba(229,9,20,0.4)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Hall of Fame</span>
              </button>

              <button
                onClick={() => setSelectedCategory('upcoming')}
                className={`px-4 py-2 text-xs font-display font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                  selectedCategory === 'upcoming'
                    ? 'bg-gradient-to-r from-[#e50914] to-[#ff2e3b] text-white shadow-[0_0_15px_rgba(229,9,20,0.4)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>In Theaters</span>
              </button>

              <button
                onClick={() => setSelectedCategory('tv')}
                className={`px-4 py-2 text-xs font-display font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                  selectedCategory === 'tv'
                    ? 'bg-gradient-to-r from-[#e50914] to-[#ff2e3b] text-white shadow-[0_0_15px_rgba(229,9,20,0.4)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Acclaimed Series</span>
              </button>
            </div>
          </GlassSurface>

          <Link
            to="/search?q="
            className="hidden sm:flex items-center gap-1.5 font-mono text-xs font-bold text-slate-400 hover:text-[#e50914] transition-colors uppercase tracking-wider"
          >
            <span>Explore Vault</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 space-y-12 md:space-y-16 relative z-10">
        {/* Dynamic Category Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/8 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e50914] shadow-[0_0_8px_#e50914]" />
              <h2 className="font-display font-black text-xl sm:text-2xl text-white">
                {selectedCategory === 'trending' && 'Trending Films Right Now'}
                {selectedCategory === 'topRated' && 'All-Time Pure Cinema Classics'}
                {selectedCategory === 'upcoming' && 'Anticipated Theatrical Releases'}
                {selectedCategory === 'tv' && 'Prestige Television & Miniseries'}
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-500">Curated TMDB Feed</span>
          </div>

          {bundleLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4 md:gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[2/3] rounded-2xl bg-white/5 border border-white/8 skeleton-shimmer" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4 md:gap-5">
              {(selectedCategory === 'trending'
                ? popularMovies.slice(0, 12)
                : selectedCategory === 'topRated'
                ? topRatedMovies.slice(0, 12)
                : selectedCategory === 'upcoming'
                ? upcomingMovies.slice(0, 12)
                : popularTv.slice(0, 12)
              ).map((movie) => (
                <MovieCard key={`${movie.media_type || 'm'}-${movie.id}`} movie={movie} />
              ))}
            </div>
          )}
        </section>

        {/* Interactive Blind Pick Mystery Stack */}
        {popularMovies.length > 0 && (
          <section className="pt-2">
            <MovieStack movies={topRatedMovies.length > 0 ? topRatedMovies : popularMovies} />
          </section>
        )}

        {/* Member Reviews & Verdicts Feed */}
        {recentReviews.length > 0 && (
          <section className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-white/8 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffb800] shadow-[0_0_8px_#ffb800]" />
                <h2 className="font-display font-black text-xl sm:text-2xl text-white">
                  Fresh Member Verdicts
                </h2>
              </div>
              <Link to="/social" className="text-xs font-mono font-bold text-[#e50914] hover:underline uppercase">
                View All Activity →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentReviews.slice(0, 6).map((rev) => (
                <div
                  key={rev.id}
                  className="p-5 rounded-2xl border border-white/8 bg-[#121216] hover:border-[#e50914]/40 transition-all space-y-3.5 shadow-md flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar username={rev.username} url={rev.avatar_url} className="w-7 h-7 border border-white/15" />
                        <Link to={`/profile/${rev.username}`} className="font-mono text-xs font-bold text-slate-200 hover:text-[#ff2e3b] truncate block">
                          @{rev.username}
                        </Link>
                      </div>
                      <RatingBadge rating={rev.rating} size="sm" />
                    </div>

                    <Link
                      to={`/media/${rev.media_type || 'movie'}/${rev.tmdb_movie_id}`}
                      className="font-display font-bold text-sm text-slate-100 hover:text-[#ff2e3b] transition-colors block line-clamp-1"
                    >
                      {rev.title || `Film #${rev.tmdb_movie_id}`}
                    </Link>

                    {rev.review_text && (
                      <p className="text-xs text-slate-300 italic line-clamp-3 leading-relaxed bg-black/40 p-3 rounded-xl border border-white/5">
                        "{rev.review_text}"
                      </p>
                    )}
                  </div>

                  <span className="text-[10px] font-mono text-slate-500 block pt-1 border-t border-white/5">
                    Logged: {new Date(rev.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
