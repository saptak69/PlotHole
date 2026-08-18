import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Flame, Trophy, Film, Tv, ArrowRight, Star, Clock, Sparkles } from 'lucide-react';
import { API_URL, getPosterUrl } from '../config';
import MovieCard from '../components/MovieCard';
import RatingBadge from '../components/RatingBadge';
import Avatar from '../components/Avatar';
import TrailerHero from '../components/TrailerHero';
import MovieStack from '../components/MovieStack';
import GlassSurface from '../components/GlassSurface';
import FaultyTerminal from '../components/FaultyTerminal';

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
      {/* Ambient FaultyTerminal Matrix/Grid Layer in the Background */}
      <div className="absolute top-0 inset-x-0 h-[750px] opacity-60 pointer-events-auto -z-0">
        <FaultyTerminal
          scale={1.8}
          gridMul={[3, 1.5]}
          digitSize={1.3}
          timeScale={0.7}
          pause={false}
          scanlineIntensity={0.85}
          glitchAmount={1.2}
          flickerAmount={0.8}
          noiseAmp={1.0}
          chromaticAberration={2.0}
          dither={0.2}
          curvature={0.06}
          tint="#00f5a0"
          mouseReact={true}
          mouseStrength={0.5}
          pageLoadAnimation={false}
          brightness={1.2}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#030508]/70 to-[#030508] pointer-events-none" />
      </div>

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
                      ? 'w-10 bg-gradient-to-r from-[#00f5a0] to-[#00d4ff] shadow-[0_0_12px_rgba(0,245,160,0.5)]'
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
            backgroundOpacity={0.82}
            blur={24}
            borderOpacity={0.16}
            className="p-1 shadow-[0_8px_32px_rgba(0,0,0,0.65),0_0_15px_rgba(0,245,160,0.05)]"
          >
            <div className="flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none select-none">
              <button
                onClick={() => setSelectedCategory('trending')}
                className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                  selectedCategory === 'trending'
                    ? 'bg-gradient-to-r from-[#00f5a0] to-[#00d4ff] text-black shadow-[0_0_15px_rgba(0,245,160,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Trending Cinema</span>
              </button>

              <button
                onClick={() => setSelectedCategory('topRated')}
                className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                  selectedCategory === 'topRated'
                    ? 'bg-gradient-to-r from-[#00f5a0] to-[#00d4ff] text-black shadow-[0_0_15px_rgba(0,245,160,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Hall of Fame</span>
              </button>

              <button
                onClick={() => setSelectedCategory('upcoming')}
                className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                  selectedCategory === 'upcoming'
                    ? 'bg-gradient-to-r from-[#00f5a0] to-[#00d4ff] text-black shadow-[0_0_15px_rgba(0,245,160,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>In Theaters</span>
              </button>

              <button
                onClick={() => setSelectedCategory('tv')}
                className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                  selectedCategory === 'tv'
                    ? 'bg-gradient-to-r from-[#00f5a0] to-[#00d4ff] text-black shadow-[0_0_15px_rgba(0,245,160,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Acclaimed Series</span>
              </button>
            </div>
          </GlassSurface>

          <Link
            to="/search?q="
            className="hidden sm:flex items-center gap-1.5 font-mono text-xs font-bold text-slate-400 hover:text-[#00f5a0] transition-colors uppercase tracking-wider"
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
              <span className="w-2.5 h-2.5 rounded-full bg-[#00f5a0] shadow-[0_0_8px_#00f5a0]" />
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
                <span className="w-2.5 h-2.5 rounded-full bg-[#00d4ff] shadow-[0_0_8px_#00d4ff]" />
                <h2 className="font-display font-black text-xl sm:text-2xl text-white">
                  Fresh Member Verdicts
                </h2>
              </div>
              <Link to="/community" className="text-xs font-mono font-bold text-[#00f5a0] hover:underline uppercase">
                View All Activity →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentReviews.slice(0, 6).map((rev) => (
                <div
                  key={rev.id}
                  className="p-5 rounded-2xl border border-white/8 bg-[#080c14] hover:border-[#00f5a0]/40 transition-all space-y-3.5 shadow-md flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar username={rev.username} url={rev.avatar_url} className="w-7 h-7 border border-white/15" />
                        <Link to={`/profile/${rev.username}`} className="font-mono text-xs font-bold text-slate-200 hover:text-[#00f5a0] truncate block">
                          @{rev.username}
                        </Link>
                      </div>
                      <RatingBadge rating={rev.rating} size="sm" />
                    </div>

                    <Link
                      to={`/media/${rev.media_type || 'movie'}/${rev.tmdb_movie_id}`}
                      className="font-display font-bold text-sm text-slate-100 hover:text-[#00f5a0] transition-colors block line-clamp-1"
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
