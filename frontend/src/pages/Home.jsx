import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MessageSquare, Play, Sparkles } from 'lucide-react';
import { API_URL, getBackdropUrl } from '../config';
import MovieCard from '../components/MovieCard';
import RatingBadge from '../components/RatingBadge';

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

  return (
    <div className="flex-1 pb-16 font-mono text-white select-none">
      {/* Featured Hero Banner */}
      {heroMovie && (
        <div className="relative h-[450px] md:h-[550px] w-full overflow-hidden mb-12 border-b-4 border-white">
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
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />
          </div>

          {/* Hero Details Content - Blended directly onto bottom of poster */}
          <div className="absolute bottom-10 left-6 md:left-12 max-w-3xl text-left space-y-4 z-10">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-brutal-cyan text-black px-3.5 py-1 font-black text-[11px] uppercase tracking-wider border-2 border-black w-fit">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Trending Film</span>
              </div>
              
              {/* Slideshow Selector Buttons */}
              <div className="flex gap-1.5 bg-black/60 p-1 border border-white/20 backdrop-blur-sm">
                {popularMovies.slice(0, 5).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentHeroIndex(idx)}
                    className={`w-5 h-5 border text-[9px] font-black flex items-center justify-center transition-all ${
                      currentHeroIndex === idx
                        ? 'bg-brutal-pink text-white border-white scale-110'
                        : 'bg-black text-white border-white hover:bg-white/20'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
            
            <h1 
              key={`title-${heroMovie.id}`}
              className="text-3xl md:text-5xl font-serif font-black text-white uppercase tracking-tighter animate-in fade-in duration-500"
              style={{ textShadow: '2px 2px 0px #ff007f' }}
            >
              {heroMovie.title}
            </h1>
            
            <p 
              key={`desc-${heroMovie.id}`}
              className="text-white text-xs leading-relaxed max-w-xl font-bold uppercase line-clamp-3 animate-in fade-in duration-500 drop-shadow-md"
            >
              {heroMovie.overview}
            </p>
            
            <div className="pt-1">
              <Link
                to={`/movies/${heroMovie.id}`}
                className="inline-flex bg-brutal-cyan text-black border-3 border-white px-5 py-2.5 font-black text-xs uppercase shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
              >
                <Play className="w-4 h-4 fill-black text-black mr-2 animate-pulse" />
                <span>Open Detail Page</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Page Layout Grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-16">
        
        {/* Popular Movies Section */}
        <section>
          <div className="flex items-center justify-between mb-6 border-b-4 border-white pb-2">
            <h2 className="text-lg font-black tracking-widest uppercase text-white">
              Popular Films
            </h2>
          </div>
          {popularLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-brand-card border-3 border-white animate-pulse" />
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
          <div className="flex items-center justify-between mb-6 border-b-4 border-white pb-2">
            <h2 className="text-lg font-black tracking-widest uppercase text-white">
              Highest Rated
            </h2>
          </div>
          {topRatedLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-brand-card border-3 border-white animate-pulse" />
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
          <div className="flex items-center justify-between mb-6 border-b-4 border-white pb-2">
            <h2 className="text-lg font-black tracking-widest uppercase text-white">
              Upcoming Discoveries
            </h2>
          </div>
          {upcomingLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-brand-card border-3 border-white animate-pulse" />
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
          <div className="flex items-center justify-between mb-6 border-b-4 border-white pb-2">
            <h2 className="text-lg font-black tracking-widest uppercase text-white">
              Popular Web Series
            </h2>
          </div>
          {popularTvLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-brand-card border-3 border-white animate-pulse" />
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
          <div className="flex items-center justify-between mb-6 border-b-4 border-white pb-2">
            <h2 className="text-lg font-black tracking-widest uppercase text-white">
              Highest Rated Web Series
            </h2>
          </div>
          {topRatedTvLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-brand-card border-3 border-white animate-pulse" />
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
            <h2 className="text-lg font-black tracking-widest uppercase text-white border-b-4 border-white pb-2 mb-6">
              Recent Logs from Cinephiles
            </h2>
            
            {reviewsLoading ? (
              <div className="space-y-4 animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-brand-card brutal-border" />
                ))}
              </div>
            ) : recentReviews.length === 0 ? (
              <div className="brutal-border p-8 text-center text-brand-text-muted uppercase text-xs">
                No logs or ratings yet. Be the first to rate a movie!
              </div>
            ) : (
              <div className="space-y-6">
                {recentReviews.map((rev) => (
                  <div key={rev.id} className="brutal-border p-5 flex gap-4 hover:border-brutal-cyan transition-colors">
                    {/* User Avatar */}
                    <img
                      src={rev.avatar_url}
                      alt={rev.username}
                      className="w-12 h-12 rounded-none border-2 border-white dithered-avatar shrink-0"
                    />
                    <div className="text-left flex-1 min-w-0 font-mono">
                      <div className="flex flex-wrap items-center gap-2 mb-3 border-b border-white/10 pb-2">
                        <Link to={`/profile/${rev.username}`} className="font-black text-white hover:text-brutal-cyan text-xs uppercase transition-colors">
                          @{rev.username}
                        </Link>
                        <span className="text-[10px] text-brand-text-muted uppercase font-bold">logged film ID #{rev.tmdb_movie_id}</span>
                        
                        {/* Custom Rating Badge */}
                        <div className="ml-auto">
                          <RatingBadge rating={rev.rating} />
                        </div>
                      </div>
                      
                      {rev.review_text && (
                        <p className="text-xs text-brand-text leading-relaxed bg-black/60 p-4 border border-white/10 uppercase">
                          {rev.review_text}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-1.5 mt-3 text-[9px] font-bold text-brand-text-muted uppercase">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Logged on {new Date(rev.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Social Stats Sidebar Card */}
          <div className="brutal-border p-6 h-fit text-left font-mono space-y-4">
            <h3 className="text-lg font-black text-white uppercase border-b-2 border-white pb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brutal-cyan animate-pulse" />
              <span>PlotHole Index</span>
            </h3>
            <p className="text-xs text-brand-text leading-relaxed uppercase">
              Stop tracking films with standard boring star ratings. PlotHole introduces a raw, honest rating system (Bullshit, Meh, One-Time Watch, Good, or Pure Cinema) for a new generation of film critics.
            </p>
            <div className="border-t border-white/20 pt-4 space-y-3">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold">
                <span className="text-brand-text-muted">Movie Database</span>
                <span className="text-brutal-cyan">TMDB Connection</span>
              </div>
              <div className="flex justify-between items-center text-[10px] uppercase font-bold">
                <span className="text-brand-text-muted">Database Engine</span>
                <span className="text-brutal-pink">Supabase (Postgres)</span>
              </div>
              <div className="flex justify-between items-center text-[10px] uppercase font-bold">
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
