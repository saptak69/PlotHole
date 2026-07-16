import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MessageSquare, Play, Sparkles } from 'lucide-react';
import { API_URL, getBackdropUrl } from '../config';
import MovieCard from '../components/MovieCard';
import RatingBadge from '../components/RatingBadge';
import Avatar from '../components/Avatar';

const GENRES = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  10759: 'Action & Adventure',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics'
};

const getGenresText = (genreIds) => {
  if (!genreIds || !Array.isArray(genreIds)) return '';
  return genreIds.map(id => GENRES[id]).filter(Boolean).slice(0, 3).join(', ');
};

export default function Home() {
  // Fetch Popular Movies
  const { data: popularData, isLoading: popularLoading } = useQuery({
    queryKey: ['popularMovies'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/movies/popular`);
      if (!res.ok) throw new Error('Failed to fetch popular movies');
      return res.json();
    }
  });

  // Fetch Top Rated Movies
  const { data: topRatedData, isLoading: topRatedLoading } = useQuery({
    queryKey: ['topRatedMovies'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/movies/top-rated`);
      if (!res.ok) throw new Error('Failed to fetch top rated movies');
      return res.json();
    }
  });

  // Fetch Recent Reviews
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['recentReviews'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/reviews`);
      if (!res.ok) throw new Error('Failed to fetch reviews');
      return res.json();
    }
  });

  // Fetch Upcoming Movies
  const { data: upcomingData, isLoading: upcomingLoading } = useQuery({
    queryKey: ['upcomingMovies'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/movies/upcoming`);
      if (!res.ok) throw new Error('Failed to fetch upcoming movies');
      return res.json();
    }
  });

  // Fetch Popular TV Shows
  const { data: popularTvData, isLoading: popularTvLoading } = useQuery({
    queryKey: ['popularTv'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/tv/popular`);
      if (!res.ok) throw new Error('Failed to fetch popular web series');
      return res.json();
    }
  });

  // Fetch Top Rated TV Shows
  const { data: topRatedTvData, isLoading: topRatedTvLoading } = useQuery({
    queryKey: ['topRatedTv'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/tv/top-rated`);
      if (!res.ok) throw new Error('Failed to fetch top rated web series');
      return res.json();
    }
  });

  const popularMovies = popularData?.results || [];
  const topRatedMovies = topRatedData?.results || [];
  const upcomingMovies = upcomingData?.results || [];
  const popularTv = popularTvData?.results || [];
  const topRatedTv = topRatedTvData?.results || [];
  const recentReviews = reviewsData || [];

  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  // Auto-slide effect every 6 seconds
  useEffect(() => {
    if (popularMovies.length === 0) return;
    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % Math.min(5, popularMovies.length));
    }, 6000);
    return () => clearInterval(interval);
  }, [popularMovies]);

  // Hero Movie is selected from rotation index
  const heroMovie = popularMovies[currentHeroIndex];
  const movieDate = heroMovie ? (heroMovie.release_date || heroMovie.first_air_date) : null;

  return (
    <div className="flex-1 pb-16 font-sans text-white select-none">
      {/* Featured Hero Banner */}
      {heroMovie && (
        <div className="relative h-[450px] md:h-[550px] w-full overflow-hidden mb-12 border-b border-white/10">
          {/* Backdrop Image - Smooth GPU accelerated crossfade */}
          <div className="absolute inset-0 bg-black">
            {popularMovies.slice(0, 5).map((movie, idx) => (
              <img
                key={movie.id}
                src={getBackdropUrl(movie.backdrop_path)}
                alt={movie.title}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                  currentHeroIndex === idx ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ))}
            {/* Smooth bottom gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />
          </div>

          {/* Hero Details Content - Blended directly onto bottom of poster */}
          <div className="absolute bottom-10 left-6 md:left-12 max-w-3xl text-left space-y-4 z-10">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-brutal-cyan/20 border border-brutal-cyan/30 text-brutal-cyan px-3 py-1 font-extrabold text-[10px] uppercase tracking-widest rounded-full w-fit">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Trending Film</span>
              </div>
              
              {/* Slideshow Selector Buttons */}
              <div className="flex gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                {popularMovies.slice(0, 5).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentHeroIndex(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      currentHeroIndex === idx
                        ? 'bg-brutal-cyan w-6 shadow-[0_0_8px_var(--color-brutal-cyan)]'
                        : 'bg-white/30 hover:bg-white/60'
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
            
            <h1 
              key={`title-${heroMovie.id}`}
              className="text-3xl md:text-[52px] font-black text-white uppercase tracking-tight leading-none animate-in slide-in-from-bottom-4 duration-500 font-sans"
              style={{ textShadow: '0 4px 15px rgba(0, 0, 0, 0.6)' }}
            >
              {heroMovie.title}
            </h1>

            {/* Year, Genres, and Rating Info */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-bold uppercase tracking-wider text-gray-300 font-mono">
              {movieDate && (
                <span className="bg-white/10 px-2 py-0.5 rounded border border-white/15">
                  {new Date(movieDate).getFullYear()}
                </span>
              )}
              {heroMovie.vote_average && (
                <span className="text-brutal-yellow font-bold">
                  ★ {heroMovie.vote_average.toFixed(1)} Rating
                </span>
              )}
              {heroMovie.genre_ids && (
                <span className="text-brutal-cyan">
                  {getGenresText(heroMovie.genre_ids)}
                </span>
              )}
            </div>
            
            <p 
              key={`desc-${heroMovie.id}`}
              className="text-white/80 text-sm md:text-base leading-relaxed max-w-xl font-medium line-clamp-3 animate-in fade-in duration-500 drop-shadow-md"
            >
              {heroMovie.overview}
            </p>
            
            <div className="pt-1">
              <Link
                to={`/movies/${heroMovie.id}`}
                className="inline-flex bg-gradient-to-r from-brutal-cyan to-blue-600 border-none text-black px-6 py-3 font-bold text-sm uppercase rounded-xl shadow-lg hover:shadow-brutal-cyan/20 hover:scale-[1.03] transition-all"
              >
                <Play className="w-4 h-4 fill-black text-black mr-2 animate-pulse" />
                <span>View Film Details</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Page Layout Grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-16">
        
        {/* Popular Movies Section */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-xl md:text-2xl font-extrabold uppercase tracking-wider text-white shrink-0">
              Popular Films
            </h2>
            <div className="h-[1px] bg-white/10 flex-1" />
          </div>
          {popularLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-brand-card border-2 border-white/10 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6">
              {popularMovies.slice(0, 6).map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          )}
        </section>

        {/* Top Rated Movies Section */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-xl md:text-2xl font-extrabold uppercase tracking-wider text-white shrink-0">
              Highest Rated
            </h2>
            <div className="h-[1px] bg-white/10 flex-1" />
          </div>
          {topRatedLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-brand-card border-2 border-white/10 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6">
              {topRatedMovies.slice(0, 6).map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Movies Section */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-xl md:text-2xl font-extrabold uppercase tracking-wider text-white shrink-0">
              Upcoming Discoveries
            </h2>
            <div className="h-[1px] bg-white/10 flex-1" />
          </div>
          {upcomingLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-brand-card border-2 border-white/10 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6">
              {upcomingMovies.slice(0, 6).map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          )}
        </section>

        {/* Popular TV/Web Series Section */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-xl md:text-2xl font-extrabold uppercase tracking-wider text-white shrink-0">
              Popular Web Series
            </h2>
            <div className="h-[1px] bg-white/10 flex-1" />
          </div>
          {popularTvLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-brand-card border-2 border-white/10 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6">
              {popularTv.slice(0, 6).map((show) => (
                <MovieCard key={show.id} movie={{ ...show, media_type: 'tv' }} />
              ))}
            </div>
          )}
        </section>

        {/* Top Rated TV/Web Series Section */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-xl md:text-2xl font-extrabold uppercase tracking-wider text-white shrink-0">
              Highest Rated Web Series
            </h2>
            <div className="h-[1px] bg-white/10 flex-1" />
          </div>
          {topRatedTvLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-brand-card border-2 border-white/10 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6">
              {topRatedTv.slice(0, 6).map((show) => (
                <MovieCard key={show.id} movie={{ ...show, media_type: 'tv' }} />
              ))}
            </div>
          )}
        </section>

        {/* Reviews Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-xl md:text-2xl font-extrabold uppercase tracking-wider text-white shrink-0">
                Recent Logs from Cinephiles
              </h2>
              <div className="h-[1px] bg-white/10 flex-1" />
            </div>
            
            {reviewsLoading ? (
              <div className="space-y-4 animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-brand-card brutal-border" />
                ))}
              </div>
            ) : recentReviews.length === 0 ? (
              <div className="brutal-border p-8 text-center text-brand-text-muted uppercase text-sm font-bold">
                No logs or ratings yet. Be the first to rate a movie!
              </div>
            ) : (
              <div className="space-y-6">
                {recentReviews.map((rev) => (
                  <HomeReviewItem key={rev.id} rev={rev} />
                ))}
              </div>
            )}
          </div>

          {/* Social Stats Sidebar Card */}
          <div className="brutal-border p-6 h-fit text-left font-mono space-y-4">
            <h3 className="text-xl font-black text-white uppercase border-b-2 border-white/20 pb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brutal-cyan" />
              <span>PlotHole Index</span>
            </h3>
            <p className="text-sm text-brand-text leading-relaxed uppercase font-bold">
              Stop tracking films with standard boring star ratings. PlotHole introduces a raw, honest rating system (Bullshit, Meh, One-Time Watch, Good, or Pure Cinema) for a new generation of film critics.
            </p>
            <div className="border-t border-white/20 pt-4 space-y-3">
              <div className="flex justify-between items-center text-xs uppercase font-bold">
                <span className="text-brand-text-muted">Movie Database</span>
                <span className="text-brutal-cyan">TMDB Connection</span>
              </div>
              <div className="flex justify-between items-center text-xs uppercase font-bold">
                <span className="text-brand-text-muted">Database Engine</span>
                <span className="text-brutal-pink">Supabase (Postgres)</span>
              </div>
              <div className="flex justify-between items-center text-xs uppercase font-bold">
                <span className="text-brand-text-muted">Hosting Service</span>
                <span className="text-brutal-yellow">Vercel & Render</span>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

function HomeReviewItem({ rev }) {
  const { data: movie } = useQuery({
    queryKey: ['movieDetailsSimple', rev.tmdb_movie_id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/movies/${rev.tmdb_movie_id}`);
      if (!res.ok) throw new Error('Not found');
      return res.json();
    },
    staleTime: 1000 * 60 * 10
  });

  const movieName = movie?.title || movie?.name || `Film #${rev.tmdb_movie_id}`;
  const mediaType = movie?.media_type || 'movie';

  return (
    <div className="brutal-border p-5 flex gap-4 hover:border-brutal-cyan/35 hover:shadow-[0_8px_25px_rgba(0,242,254,0.1)] hover:scale-[1.01] transition-all duration-300">
      {/* User Avatar */}
      <Avatar
        username={rev.username}
        url={rev.avatar_url}
        className="w-12 h-12"
      />
      <div className="text-left flex-1 min-w-0 font-mono">
        <div className="flex flex-wrap items-center gap-2 mb-3 border-b border-white/5 pb-2">
          <Link to={`/profile/${rev.username}`} className="font-extrabold text-white hover:text-brutal-cyan text-sm uppercase transition-colors">
            @{rev.username}
          </Link>
          <span className="text-[10px] text-brand-text-muted uppercase font-bold">
            logged <Link to={`/media/${mediaType}/${rev.tmdb_movie_id}`} className="text-brutal-cyan hover:underline">{movieName}</Link>
          </span>
          
          {/* Custom Rating Badge */}
          <div className="ml-auto">
            <RatingBadge rating={rev.rating} />
          </div>
        </div>
        
        {rev.review_text && (
          <Link to={`/media/${mediaType}/${rev.tmdb_movie_id}`} className="block group/comment">
            <p className="text-sm md:text-base text-brand-text leading-relaxed bg-black/40 p-4 rounded-xl border border-white/5 uppercase hover:border-brutal-cyan/30 hover:bg-black/60 transition-all">
              {rev.review_text}
            </p>
          </Link>
        )}
        
        <div className="flex items-center gap-1.5 mt-3 text-[10px] font-bold text-brand-text-muted uppercase">
          <MessageSquare className="w-3.5 h-3.5 text-brutal-cyan" />
          <span>Logged on {new Date(rev.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
