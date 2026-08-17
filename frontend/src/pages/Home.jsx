import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Flame, Trophy, Film, Tv, ArrowRight, Star, Clock, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_URL, getPosterUrl } from '../config';
import MovieCard from '../components/MovieCard';
import RatingBadge from '../components/RatingBadge';
import Avatar from '../components/Avatar';
import TrailerHero from '../components/TrailerHero';
import MovieStack from '../components/MovieStack';

export default function Home() {
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
    if (featuredList.length === 0 || isTrailerActive) return;

    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % featuredList.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [featuredList.length, isTrailerActive]);

  const handlePrevSlide = () => {
    setHeroIndex((prev) => (prev - 1 + featuredList.length) % featuredList.length);
  };

  const handleNextSlide = () => {
    setHeroIndex((prev) => (prev + 1) % featuredList.length);
  };

  return (
    <div className="flex-1 pb-24 font-sans text-slate-100 relative">
      {/* Symmetrical Hero Slideshow Showcase */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-6 pb-10 space-y-4">
        {heroMovie ? (
          <div className="space-y-3.5">
            {/* Direct Trailer Hero with Watch Trailer Button & Slideshow Arrows */}
            <TrailerHero
              key={`hero-${heroMovie.id}`}
              movie={heroMovie}
              mediaType={heroMovie.name ? 'tv' : 'movie'}
              onPrev={featuredList.length > 1 ? handlePrevSlide : null}
              onNext={featuredList.length > 1 ? handleNextSlide : null}
              onTrailerStateChange={(active) => setIsTrailerActive(active)}
            />

            {/* Perfectly Centered Symmetrical Slideshow Indicator Dots */}
            <div className="flex items-center justify-center gap-2 pt-2">
              {featuredList.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setHeroIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    heroIndex === idx
                      ? 'w-8 bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                      : 'w-2 bg-white/20 hover:bg-white/40'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        ) : bundleLoading ? (
          <div className="aspect-[21/9] w-full rounded-3xl bg-white/5 border border-white/10 skeleton-shimmer" />
        ) : null}
      </div>

      {/* Main Content Vault */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-16">
        {/* Category Rails Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 flex-wrap gap-4">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-1 rounded-xl">
            {[
              { id: 'trending', label: 'Trending', icon: Flame },
              { id: 'toprated', label: 'Hall of Fame', icon: Trophy },
              { id: 'upcoming', label: 'In Theaters', icon: Film },
              { id: 'series', label: 'TV Shows', icon: Tv }
            ].map((tab) => {
              const Icon = tab.icon;
              const active = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 select-none cursor-pointer ${
                    active
                      ? 'bg-amber-500 text-black font-bold shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <Link
            to="/search"
            className="text-xs font-mono text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 uppercase"
          >
            <span>Explore All Titles</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Selected Movie Grid */}
        <section>
          {selectedCategory === 'trending' && (
            <MovieGrid movies={popularMovies} loading={bundleLoading} title="Trending Cinema Today" />
          )}
          {selectedCategory === 'toprated' && (
            <MovieGrid movies={topRatedMovies} loading={bundleLoading} title="All-Time Masterpieces" />
          )}
          {selectedCategory === 'upcoming' && (
            <MovieGrid movies={upcomingMovies} loading={bundleLoading} title="Upcoming in Theaters" />
          )}
          {selectedCategory === 'series' && (
            <MovieGrid
              movies={popularTv.map((s) => ({ ...s, media_type: 'tv' }))}
              loading={bundleLoading}
              title="Acclaimed Series"
            />
          )}
        </section>

        {/* Interactive Blind Pick Mystery Deck */}
        {topRatedMovies.length > 0 && (
          <section>
            <MovieStack movies={topRatedMovies} />
          </section>
        )}

        {/* Community Diary Stream */}
        <section className="space-y-6 text-left">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="font-display font-bold text-xl text-white">
                Recent Community Reviews
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-sans">
                Unfiltered ratings and logs from fellow cinephiles
              </p>
            </div>
            <Link
              to="/social"
              className="text-xs font-mono text-amber-400 hover:text-amber-300 font-semibold uppercase"
            >
              View Community Stream →
            </Link>
          </div>

          {bundleLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-white/5 border border-white/10 skeleton-shimmer" />
              ))}
            </div>
          ) : recentReviews.length === 0 ? (
            <div className="p-8 rounded-2xl border border-white/10 bg-white/5 text-center text-slate-400 text-xs font-mono">
              No reviews logged yet. Be the first cinephile to share your thoughts!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentReviews.slice(0, 6).map((rev) => (
                <ReviewCard key={rev.id} rev={rev} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function MovieGrid({ movies, loading, title }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="aspect-[2/3] rounded-2xl bg-white/5 border border-white/10 skeleton-shimmer" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 text-left">
      <h3 className="font-display font-bold text-lg text-slate-200">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
        {movies.slice(0, 10).map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
}

function ReviewCard({ rev }) {
  const { data: movie } = useQuery({
    queryKey: ['movieDetailsSimple', rev.tmdb_movie_id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/movies/${rev.tmdb_movie_id}`);
      if (!res.ok) throw new Error('Not found');
      return res.json();
    },
    staleTime: 1000 * 60 * 10
  });

  const movieName = movie?.title || movie?.name || 'Film';
  const mediaType = movie?.media_type || 'movie';

  return (
    <div className="rounded-2xl border border-white/8 bg-white/4 hover:bg-white/7 hover:border-white/15 p-4 flex gap-4 transition-all shadow-md">
      <Link
        to={`/media/${mediaType}/${rev.tmdb_movie_id}`}
        className="w-14 h-20 shrink-0 overflow-hidden rounded-xl border border-white/10 block bg-slate-900"
      >
        <img
          src={getPosterUrl(movie?.poster_path, 'w185')}
          alt={movieName}
          className="w-full h-full object-cover"
        />
      </Link>

      <div className="text-left flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2 truncate">
              <Avatar username={rev.username} url={rev.avatar_url} className="w-5 h-5 border border-white/15" />
              <Link
                to={`/profile/${rev.username}`}
                className="font-mono text-xs font-bold text-slate-200 hover:text-amber-400 transition-colors"
              >
                @{rev.username}
              </Link>
            </div>
            <RatingBadge rating={rev.rating} size="xs" />
          </div>

          <Link
            to={`/media/${mediaType}/${rev.tmdb_movie_id}`}
            className="font-display font-bold text-xs text-white hover:text-amber-300 transition-colors line-clamp-1"
          >
            {movieName}
          </Link>

          {rev.review_text && (
            <p className="text-xs text-slate-300 mt-1 line-clamp-2 italic font-sans">
              "{rev.review_text}"
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 mt-2">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>{new Date(rev.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
