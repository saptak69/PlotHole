import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MessageSquare, Play, Sparkles } from 'lucide-react';
import { API_URL, getBackdropUrl, getPosterUrl } from '../config';
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
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);

  // Auto-slide effect every 6 seconds
  useEffect(() => {
    if (popularMovies.length === 0) return;
    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % Math.min(5, popularMovies.length));
    }, 6000);
    return () => clearInterval(interval);
  }, [popularMovies]);

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const startX = touchStartXRef.current;
    const endX = touchEndXRef.current;
    if (!startX || !endX) return;
    const diffX = startX - endX;

    if (Math.abs(diffX) > 50) {
      if (diffX > 0) {
        // Swiped left -> Next movie
        setCurrentHeroIndex((prev) => (prev + 1) % Math.min(5, popularMovies.length));
      } else {
        // Swiped right -> Previous movie
        setCurrentHeroIndex((prev) => (prev - 1 + Math.min(5, popularMovies.length)) % Math.min(5, popularMovies.length));
      }
    }
    // Reset refs
    touchStartXRef.current = 0;
    touchEndXRef.current = 0;
  };

  // Hero Movie is selected from rotation index
  const heroMovie = popularMovies[currentHeroIndex];
  const movieDate = heroMovie ? (heroMovie.release_date || heroMovie.first_air_date) : null;

  return (
    <div className="flex-1 pb-16 font-sans text-white">
      {/* Featured Hero Banner */}
      {heroMovie && (
        <div 
          className="relative h-[480px] md:h-[550px] w-full overflow-hidden mb-12 border-b border-white/10"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Background Images - Posters on mobile, Backdrops on desktop */}
          <div className="absolute inset-0 bg-black">
            {/* Mobile: Vertical Posters fit narrow screens perfectly */}
            {popularMovies.slice(0, 5).map((movie, idx) => (
              <img
                key={`poster-${movie.id}`}
                src={getPosterUrl(movie.poster_path, 'w780')}
                alt={movie.title}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out md:hidden ${
                  currentHeroIndex === idx ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ))}
            {/* Desktop: Horizontal Backdrops */}
            {popularMovies.slice(0, 5).map((movie, idx) => (
              <img
                key={`backdrop-${movie.id}`}
                src={getBackdropUrl(movie.backdrop_path)}
                alt={movie.title}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out hidden md:block ${
                  currentHeroIndex === idx ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ))}
            {/* Smooth bottom gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-transparent pointer-events-none" />
          </div>

          {/* Hero Details Content - Blended directly onto bottom of background image */}
          <div className="absolute bottom-16 left-6 right-6 md:left-12 md:right-auto max-w-3xl text-left space-y-4 z-10">
            
            <h1 
              key={`title-${heroMovie.id}`}
              className="text-3xl md:text-[52px] font-black text-white uppercase tracking-tight leading-none animate-in slide-in-from-bottom-4 duration-500 font-sans"
              style={{ textShadow: '0 4px 15px rgba(0, 0, 0, 0.9)' }}
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
              className="text-white/80 text-xs md:text-base leading-relaxed max-w-xl font-medium line-clamp-3 md:line-clamp-4 animate-in fade-in duration-500 drop-shadow-md"
            >
              {heroMovie.overview}
            </p>
            
            <div className="pt-1">
              <Link
                to={`/media/${heroMovie.name ? 'tv' : 'movie'}/${heroMovie.id}`}
                className="btn btn-primary"
              >
                <Play className="w-4 h-4 fill-[#121008] text-[#121008] mr-2" />
                <span>View Film Details</span>
              </Link>
            </div>
          </div>

          {/* Comic Booky Slideshow Selector Dots at the bottom middle */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
            {popularMovies.slice(0, 5).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentHeroIndex(idx)}
                className={`w-3.5 h-3.5 rounded-full border-2 border-brand-border transition-all duration-200 cursor-pointer ${
                  currentHeroIndex === idx
                    ? 'bg-brutal-yellow translate-y-[-2px] shadow-[2px_2px_0_#ff4757]'
                    : 'bg-brand-card hover:bg-brand-border/20'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Page Layout Grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-16 mt-8">
        
        {/* Popular Movies Section */}
        <section>
          <div className="flex items-baseline justify-between mb-8 pb-2.5 border-b-3 border-brand-border">
            <h2 className="section-title font-bangers text-[28px] tracking-wide text-brand-text flex items-baseline gap-2">
              <span className="font-mono text-[11px] font-bold text-[#ff4757] tracking-wider uppercase">CH. 01</span>
              New on the stands
            </h2>
            <div className="font-mono text-[11px] font-bold text-brand-text-muted uppercase">
              Full chapter →
            </div>
          </div>
          {popularLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-[#1b1810] border-3 border-brand-border animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
              {popularMovies.slice(0, 5).map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          )}
        </section>

        {/* Top Rated Movies Section */}
        <section>
          <div className="flex items-baseline justify-between mb-8 pb-2.5 border-b-3 border-brand-border">
            <h2 className="section-title font-bangers text-[28px] tracking-wide text-brand-text flex items-baseline gap-2">
              <span className="font-mono text-[11px] font-bold text-[#ff4757] tracking-wider uppercase">CH. 02</span>
              Hall of fame — top rated
            </h2>
            <div className="font-mono text-[11px] font-bold text-brand-text-muted uppercase">
              Full chapter →
            </div>
          </div>
          {topRatedLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-[#1b1810] border-3 border-brand-border animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
              {topRatedMovies.slice(0, 5).map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Movies Section */}
        <section>
          <div className="flex items-baseline justify-between mb-8 pb-2.5 border-b-3 border-brand-border">
            <h2 className="section-title font-bangers text-[28px] tracking-wide text-brand-text flex items-baseline gap-2">
              <span className="font-mono text-[11px] font-bold text-[#ff4757] tracking-wider uppercase">CH. 03</span>
              Upcoming Discoveries
            </h2>
            <div className="font-mono text-[11px] font-bold text-brand-text-muted uppercase">
              Full chapter →
            </div>
          </div>
          {upcomingLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-[#1b1810] border-3 border-brand-border animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
              {upcomingMovies.slice(0, 5).map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          )}
        </section>

        {/* Popular TV/Web Series Section */}
        <section>
          <div className="flex items-baseline justify-between mb-8 pb-2.5 border-b-3 border-brand-border">
            <h2 className="section-title font-bangers text-[28px] tracking-wide text-brand-text flex items-baseline gap-2">
              <span className="font-mono text-[11px] font-bold text-[#ff4757] tracking-wider uppercase">CH. 04</span>
              Popular Series
            </h2>
            <div className="font-mono text-[11px] font-bold text-brand-text-muted uppercase">
              Full chapter →
            </div>
          </div>
          {popularTvLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-[#1b1810] border-3 border-brand-border animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
              {popularTv.slice(0, 5).map((show) => (
                <MovieCard key={show.id} movie={{ ...show, media_type: 'tv' }} />
              ))}
            </div>
          )}
        </section>

        {/* Top Rated TV/Web Series Section */}
        <section>
          <div className="flex items-baseline justify-between mb-8 pb-2.5 border-b-3 border-brand-border">
            <h2 className="section-title font-bangers text-[28px] tracking-wide text-brand-text flex items-baseline gap-2">
              <span className="font-mono text-[11px] font-bold text-[#ff4757] tracking-wider uppercase">CH. 05</span>
              Highest Rated Series
            </h2>
            <div className="font-mono text-[11px] font-bold text-brand-text-muted uppercase">
              Full chapter →
            </div>
          </div>
          {topRatedTvLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-[#1b1810] border-3 border-brand-border animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
              {topRatedTv.slice(0, 5).map((show) => (
                <MovieCard key={show.id} movie={{ ...show, media_type: 'tv' }} />
              ))}
            </div>
          )}
        </section>

        {/* Reviews Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left pb-12">
          <div className="lg:col-span-2">
            <div className="flex items-baseline justify-between mb-8 pb-2.5 border-b-3 border-brand-border">
              <h2 className="section-title font-bangers text-[28px] tracking-wide text-brand-text flex items-baseline gap-2">
                <span className="font-mono text-[11px] font-bold text-[#ff4757] tracking-wider uppercase">CH. 06</span>
                Recent Logs from Cinephiles
              </h2>
            </div>
            
            {reviewsLoading ? (
              <div className="space-y-4 animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-[#1b1810] border-3 border-brand-border" />
                ))}
              </div>
            ) : recentReviews.length === 0 ? (
              <div className="border-3 border-brand-border bg-[#1b1810] p-8 text-center text-brand-text-muted uppercase text-xs font-bold font-mono">
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
          <div className="border-3 border-brand-border bg-[#1b1810] p-6 h-fit text-left space-y-4 shadow-[4px_4px_0_#f2e9d8]">
            <h3 className="font-bangers text-2xl text-brand-text border-b-3 border-brand-border pb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#f4c430]" />
              <span>PlotHole Index</span>
            </h3>
            <p className="text-xs text-brand-text-muted leading-relaxed font-bold font-mono uppercase">
              Stop tracking films with standard boring star ratings. PlotHole introduces a raw, honest rating system (Bullshit, Meh, One-Time Watch, Good, or Pure Cinema) for a new generation of film critics.
            </p>
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
    <div className="border-3 border-brand-border bg-[#1b1810] p-5 flex gap-5 shadow-[4px_4px_0_#f2e9d8] hover:translate-y-[-2px] hover:shadow-[5px_6px_0_#f4c430] transition-all duration-150 rounded-sm">
      {/* Movie Poster Thumbnail on the left */}
      <Link to={`/media/${mediaType}/${rev.tmdb_movie_id}`} className="w-14 h-20 shrink-0 overflow-hidden border-2 border-brand-border shadow-md block bg-zinc-950">
        <img
          src={getPosterUrl(movie?.poster_path)}
          alt={movieName}
          className="w-full h-full object-cover"
        />
      </Link>
      
      <div className="text-left flex-1 min-w-0 font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5 border-b-2 border-brand-border pb-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <Avatar
              username={rev.username}
              url={rev.avatar_url}
              className="w-6 h-6 border border-brand-border rounded-none"
            />
            <Link to={`/profile/${rev.username}`} className="font-bold text-brand-text hover:text-[#f4c430] text-xs transition-colors font-mono">
              @{rev.username}
            </Link>
            <span className="text-[10px] text-brand-text-muted font-bold font-mono uppercase">
              logged <Link to={`/media/${mediaType}/${rev.tmdb_movie_id}`} className="text-brand-text hover:text-[#f4c430] transition-colors">{movieName}</Link>
            </span>
          </div>
          
          {/* Custom Rating Badge */}
          <div className="shrink-0 flex justify-end">
            <RatingBadge rating={rev.rating} />
          </div>
        </div>
        
        {rev.review_text && (
          <Link to={`/media/${mediaType}/${rev.tmdb_movie_id}`} className="block">
            <p className="text-xs md:text-sm text-brand-text leading-relaxed bg-[#121008] p-4 border border-brand-border font-medium italic">
              "{rev.review_text}"
            </p>
          </Link>
        )}
        
        <div className="flex items-center gap-1.5 mt-3 text-[10px] font-bold text-brand-text-muted uppercase tracking-wider font-mono">
          <MessageSquare className="w-3.5 h-3.5 text-[#ff4757]" />
          <span>Logged on {new Date(rev.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
