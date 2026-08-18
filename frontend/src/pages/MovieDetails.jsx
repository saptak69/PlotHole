import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bookmark, Check, AlertCircle, Eye,
  Film, Trophy, Flame, Play, FolderPlus, MessageSquare, Heart, Share2, Tv, Star, Sparkles, Clock, User, Calendar, ExternalLink,
  AlertOctagon, MinusCircle, Ticket, ThumbsUp, Send, CheckCircle2, MessageCircle
} from 'lucide-react';
import { API_URL, getPosterUrl, getBackdropUrl, getAuthHeaders } from '../config';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fireConfetti } from '../utils/confetti';
import RatingBadge from '../components/RatingBadge';
import Avatar from '../components/Avatar';
import AddToListModal from '../components/AddToListModal';
import ReviewCommentsModal from '../components/ReviewCommentsModal';
import ShareCardModal from '../components/ShareCardModal';
import TrailerHero from '../components/TrailerHero';
import MovieCard from '../components/MovieCard';
import GlassSurface from '../components/GlassSurface';

// Clean rating tiers using Lucide icons
const RATING_TIERS = [
  { value: 1, label: 'Bullshit', icon: AlertOctagon, color: 'rose', activeBg: 'bg-rose-500/25 text-rose-300 border-rose-400/60 shadow-[0_0_12px_rgba(255,59,92,0.3)]' },
  { value: 2, label: 'Meh', icon: MinusCircle, color: 'slate', activeBg: 'bg-slate-500/25 text-slate-200 border-slate-400/60' },
  { value: 3, label: 'One-Time', icon: Ticket, color: 'cyan', activeBg: 'bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/60 shadow-[0_0_14px_rgba(0,212,255,0.3)]' },
  { value: 4, label: 'Good', icon: ThumbsUp, color: 'mint', activeBg: 'bg-[#00f5a0]/20 text-[#00f5a0] border-[#00f5a0]/60 shadow-[0_0_16px_rgba(0,245,160,0.35)]' },
  { value: 5, label: 'Pure Cinema', icon: Trophy, color: 'platinum', activeBg: 'bg-gradient-to-r from-[#00f5a0]/30 via-[#00d4ff]/25 to-white/30 text-white border-white/70 shadow-[0_0_20px_rgba(0,245,160,0.45)]' }
];

export default function MovieDetails({ onOpenPerson }) {
  const { id, mediaType } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isAddToListOpen, setIsAddToListOpen] = useState(false);
  const [isShareCardOpen, setIsShareCardOpen] = useState(false);
  const [selectedReviewForComments, setSelectedReviewForComments] = useState(null);

  // Form states for Review
  const [rating, setRating] = useState(4);
  const [watchedDate, setWatchedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reviewText, setReviewText] = useState('');
  const [reviewError, setReviewError] = useState('');

  // Consolidated Full Media Bundle (details + credits + recommendations + videos + watch providers)
  const { data: movie, isLoading: detailsLoading, error: detailsError } = useQuery({
    queryKey: ['movieDetailsFull', id, mediaType || 'auto'],
    queryFn: async () => {
      const url = mediaType ? `${API_URL}/media/${mediaType}/${id}/full` : `${API_URL}/movies/${id}/full`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Could not fetch film archive dossier');
      return res.json();
    }
  });

  // Watchlist status
  const { data: watchlistState } = useQuery({
    queryKey: ['watchlistStatus', id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/watchlist/check/${id}`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) return { onWatchlist: false };
      return res.json();
    },
    enabled: !!user && !!id
  });

  // Watched state
  const { data: watchedState = { watched: false } } = useQuery({
    queryKey: ['watchedStatus', id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/diary/check-watched/${id}`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) return { watched: false };
      return res.json();
    },
    enabled: !!user && !!id
  });

  // Movie reviews
  const { data: reviewsData = [] } = useQuery({
    queryKey: ['movieReviews', id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/reviews/movie/${id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!id
  });

  // Mutations
  const watchlistMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/watchlist/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          tmdb_movie_id: parseInt(id),
          media_type: movie?.media_type || (movie?.first_air_date ? 'tv' : 'movie'),
          title: movie?.title || movie?.name,
          poster_path: movie?.poster_path,
          release_date: movie?.release_date || movie?.first_air_date
        })
      });
      if (!res.ok) throw new Error('Failed to update watchlist');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['watchlistStatus', id] });
      queryClient.invalidateQueries({ queryKey: ['profileDetails'] });
      toast.addToast(data.added ? 'Added to your Watchlist' : 'Removed from Watchlist', data.added ? 'success' : 'info');
      if (data.added) fireConfetti();
    },
    onError: (err) => {
      toast.addToast(err.message || 'Failed to update watchlist', 'error');
    }
  });

  const watchedMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/diary/toggle-watched`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          tmdb_movie_id: parseInt(id),
          media_type: movie?.media_type || (movie?.first_air_date ? 'tv' : 'movie'),
          title: movie?.title || movie?.name,
          poster_path: movie?.poster_path,
          release_date: movie?.release_date || movie?.first_air_date
        })
      });
      if (!res.ok) throw new Error('Failed to update watched status');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['watchedStatus', id] });
      queryClient.invalidateQueries({ queryKey: ['profileDetails'] });
      queryClient.invalidateQueries({ queryKey: ['homeBundle'] });
      toast.addToast(data.watched ? 'Logged as Watched in your Diary' : 'Removed from Watched', data.watched ? 'success' : 'info');
      if (data.watched) fireConfetti();
    },
    onError: (err) => {
      toast.addToast(err.message || 'Failed to update watched status', 'error');
    }
  });

  const submitReviewMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit review');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movieReviews', id] });
      queryClient.invalidateQueries({ queryKey: ['profileDetails'] });
      queryClient.invalidateQueries({ queryKey: ['watchedStatus', id] });
      toast.addToast('Your verdict has been logged to the chronicles!', 'success');
      fireConfetti();
      setReviewText('');
      setIsReviewModalOpen(false);
    },
    onError: (err) => {
      setReviewError(err.message);
    }
  });

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    setReviewError('');
    if (!user) {
      toast.addToast('Please sign in to write a review', 'error');
      return;
    }
    submitReviewMutation.mutate({
      tmdb_movie_id: parseInt(id),
      rating,
      review_text: reviewText,
      watched_date: watchedDate,
      media_type: movie?.media_type || (movie?.first_air_date ? 'tv' : 'movie'),
      title: movie?.title || movie?.name,
      poster_path: movie?.poster_path,
      release_date: movie?.release_date || movie?.first_air_date
    });
  };

  if (detailsLoading) {
    return (
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-8 space-y-6">
        <div className="aspect-[21/9] w-full rounded-3xl bg-white/5 border border-white/8 skeleton-shimmer" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="aspect-[2/3] rounded-2xl bg-white/5 border border-white/8 skeleton-shimmer" />
          <div className="lg:col-span-2 space-y-4">
            <div className="h-10 w-3/4 rounded-xl bg-white/5 skeleton-shimmer" />
            <div className="h-24 w-full rounded-xl bg-white/5 skeleton-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (detailsError || !movie) {
    return (
      <div className="flex-1 max-w-2xl mx-auto px-4 py-24 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-2xl font-display font-bold text-white">Film Record Not Found</h2>
        <p className="text-sm text-slate-400">The requested title could not be retrieved from the cinema archive.</p>
        <Link to="/" className="btn-primary inline-flex py-2 px-6 text-xs font-bold">
          Return to Discover
        </Link>
      </div>
    );
  }

  const detectedMediaType = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');
  const displayTitle = movie.title || movie.name || 'Untitled';
  const displayReleaseDate = movie.release_date || movie.first_air_date || '';
  const displayYear = displayReleaseDate ? displayReleaseDate.split('-')[0] : '';
  const displayRuntime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : movie.number_of_seasons ? `${movie.number_of_seasons} Season${movie.number_of_seasons > 1 ? 's' : ''}` : 'N/A';

  const credits = movie.credits || {};
  const displayCast = (credits.cast || []).slice(0, 8);
  const creatorNames = (movie.created_by || []).map((c) => c.name).join(', ');
  const director = creatorNames || credits?.crew?.find((person) => person.job === 'Director')?.name || 'Unknown';
  const recMovies = (movie.recommendations?.results || []).slice(0, 5);
  const watchProviders = movie['watch/providers']?.results?.US || movie['watch/providers']?.results?.IN || {};
  const flatrateProviders = watchProviders?.flatrate || [];

  // Calculate rating breakdown distribution
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviewsData.forEach((r) => {
    if (distribution[r.rating] !== undefined) distribution[r.rating]++;
  });
  const totalRatings = reviewsData.length;

  return (
    <div className="flex-1 pb-24 font-sans text-slate-100 relative">
      {/* ================= PANORAMIC TRAILER HERO HEADER ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pt-4 sm:pt-6 pb-6 relative z-10">
        <TrailerHero
          movie={movie}
          mediaType={detectedMediaType}
          autoPlayTrailer={false}
          preloadedVideos={movie.videos?.results || []}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 space-y-10 relative z-10">
        
        {/* ================= FLOATING CINEMA ACTION BAR (WITH GLASSSURFACE) ================= */}
        <div className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-[#080c14]/90 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-start">
            <span className="font-display font-black text-lg sm:text-xl text-white">
              {displayTitle}
            </span>
            {displayYear && (
              <span className="font-mono text-xs text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                {displayYear}
              </span>
            )}
            {displayRuntime !== 'N/A' && (
              <span className="font-mono text-xs text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                {displayRuntime}
              </span>
            )}
          </div>

          {/* Action Buttons Hub */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {user ? (
              <>
                {/* Mark as Watched Button */}
                <button
                  onClick={() => watchedMutation.mutate()}
                  disabled={watchedMutation.isPending}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    watchedState?.watched
                      ? 'bg-[#00f5a0]/20 text-[#00f5a0] border border-[#00f5a0]/50 shadow-[0_0_14px_rgba(0,245,160,0.3)]'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-[#00f5a0]/30'
                  }`}
                >
                  {watchedState?.watched ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[2.5] text-[#00f5a0]" />
                      <span>Watched</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>Mark Watched</span>
                    </>
                  )}
                </button>

                {/* Watchlist Button */}
                <button
                  onClick={() => watchlistMutation.mutate()}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    watchlistState?.onWatchlist
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-400/50 shadow-[0_0_14px_rgba(255,59,92,0.25)]'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-rose-500/30'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${watchlistState?.onWatchlist ? 'fill-rose-400 text-rose-400' : ''}`} />
                  <span>{watchlistState?.onWatchlist ? 'In Watchlist' : 'Watchlist'}</span>
                </button>

                {/* Add to List Button */}
                <button
                  onClick={() => setIsAddToListOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-[#00d4ff]/30 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-[#00d4ff]" />
                  <span>Add to List</span>
                </button>
              </>
            ) : (
              <Link to="/login" className="col-span-2 sm:col-span-1 btn-secondary text-xs py-2.5 px-4 text-center">
                Sign in to Track
              </Link>
            )}

            {/* Share Button */}
            <button
              onClick={() => setIsShareCardOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              title="Share Cinephile Stamp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            {/* Jump to Review Section */}
            <button
              onClick={() => {
                document.getElementById('review-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="col-span-2 sm:col-span-1 btn-primary text-xs py-2.5 px-4 flex items-center justify-center gap-1.5 font-bold shadow-md cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Write Review</span>
            </button>
          </div>
        </div>

        {/* ================= BALANCED 2-COLUMN MAIN CONTENT ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10 items-start">
          
          {/* ================= LEFT COLUMN: POSTER & PRODUCTION DOSSIER ================= */}
          <div className="lg:col-span-1 space-y-6">
            {/* Poster Card */}
            <div className="aspect-[2/3] w-full max-w-sm sm:max-w-md mx-auto lg:max-w-none rounded-2xl overflow-hidden border border-white/12 shadow-2xl bg-black">
              <img
                src={getPosterUrl(movie.poster_path, 'w500')}
                alt={displayTitle}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Where to Stream (Streaming Services) */}
            {flatrateProviders.length > 0 && (
              <div className="p-5 rounded-2xl border border-[#00d4ff]/20 bg-[#080e1a] space-y-3 shadow-lg">
                <span className="text-xs font-mono font-bold uppercase text-[#00d4ff] flex items-center gap-1.5">
                  <Tv className="w-4 h-4" /> Available to Stream
                </span>
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {flatrateProviders.map((p) => (
                    <div
                      key={p.provider_id}
                      className="w-10 h-10 rounded-xl overflow-hidden border border-white/15 bg-black shadow hover:scale-105 transition-transform"
                      title={p.provider_name}
                    >
                      <img
                        src={`https://image.tmdb.org/t/p/original${p.logo_path}`}
                        alt={p.provider_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Production Dossier */}
            <div className="p-5 md:p-6 rounded-2xl border border-white/8 bg-[#080c14] space-y-4 shadow-lg text-xs font-sans">
              <div className="flex items-center justify-between border-b border-white/8 pb-2.5">
                <span className="text-xs font-mono font-bold uppercase text-slate-300 tracking-wider">
                  Production Dossier
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-[#00f5a0] border border-white/10 uppercase">
                  {detectedMediaType}
                </span>
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400 font-mono text-[11px]">Director / Creator</span>
                  <span className="text-slate-100 font-semibold text-right">{director}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400 font-mono text-[11px]">Release Date</span>
                  <span className="text-slate-100 font-semibold">{displayReleaseDate || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400 font-mono text-[11px]">Runtime</span>
                  <span className="text-slate-100 font-semibold">{displayRuntime}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400 font-mono text-[11px]">Global Score</span>
                  <span className="text-[#00f5a0] font-bold font-mono">
                    {movie.vote_average ? `${movie.vote_average.toFixed(1)} / 10` : 'N/A'}
                  </span>
                </div>
              </div>

              {movie.genres && (
                <div className="pt-2 border-t border-white/5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-2">Genres</span>
                  <div className="flex flex-wrap gap-1.5">
                    {movie.genres.map((g) => (
                      <span key={g.id} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-slate-300 font-medium">
                        {g.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ================= RIGHT COLUMN: SYNOPSIS, CAST, REVIEWS & SIMILAR ================= */}
          <div className="lg:col-span-2 space-y-8 md:space-y-10">
            
            {/* Synopsis Section with Apple Frosted GlassSurface */}
            <GlassSurface
              width="100%"
              height="auto"
              borderRadius={24}
              backgroundOpacity={0.82}
              blur={24}
              borderOpacity={0.2}
              className="shadow-[0_16px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(0,245,160,0.06)]"
            >
              <div className="p-6 md:p-8 space-y-3 text-left w-full">
                <span className="text-xs font-mono font-bold uppercase text-[#00f5a0] tracking-wider block">
                  Storyline & Narrative
                </span>
                <h3 className="font-display font-bold text-xl md:text-2xl text-white">
                  Synopsis
                </h3>
                <p className="text-sm md:text-base text-slate-300 leading-relaxed font-sans pt-1">
                  {movie.overview || "No synopsis recorded for this title in the archive."}
                </p>
                {movie.tagline && (
                  <p className="text-xs md:text-sm text-[#7affd4]/90 italic font-serif pt-3 border-t border-white/8">
                    "{movie.tagline}"
                  </p>
                )}
              </div>
            </GlassSurface>

            {/* Top Cast Section */}
            {displayCast.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-lg md:text-xl text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-[#00f5a0]" />
                    Top Billed Cast
                  </h3>
                  <span className="text-xs font-mono text-slate-500">Tap actor for filmography</span>
                </div>

                {/* Horizontal scroll on mobile / clean grid on tablet & desktop */}
                <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-4 gap-3.5 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 scrollbar-thin">
                  {displayCast.map((actor) => (
                    <div
                      key={actor.id}
                      onClick={() => onOpenPerson?.(actor.id)}
                      className="min-w-[170px] sm:min-w-0 p-3 rounded-xl border border-white/8 bg-[#080c14] hover:border-[#00f5a0]/40 hover:bg-[#0e1422] transition-all flex items-center gap-3 cursor-pointer shadow-md shrink-0"
                    >
                      <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border border-white/15 bg-slate-900">
                        {actor.profile_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                            alt={actor.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-slate-500 m-auto mt-3" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-display font-bold text-xs text-white truncate block">
                          {actor.name}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate block mt-0.5">
                          {actor.character || 'Cast Member'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================= PROMINENT REVIEW & COMMUNITY HUB ================= */}
            <div id="review-section" className="space-y-6 pt-4">
              
              {/* Review Hub Header with Stats */}
              <div className="p-6 md:p-8 rounded-3xl border border-[#00f5a0]/25 bg-gradient-to-b from-[#080c14] via-[#040810] to-[#020408] shadow-2xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/8 pb-5">
                  <div>
                    <span className="text-xs font-mono font-bold uppercase text-[#00f5a0] tracking-wider block">
                      Critical Verdicts
                    </span>
                    <h3 className="font-display font-bold text-xl md:text-2xl text-white mt-1">
                      Member Reviews ({reviewsData.length})
                    </h3>
                  </div>

                  {/* Overall Rating Scorecard */}
                  <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl self-start sm:self-auto">
                    <div className="text-center">
                      <div className="text-xs font-mono text-slate-400 uppercase">Community</div>
                      <div className="font-display font-extrabold text-lg text-[#00f5a0]">
                        {reviewsData.length > 0
                          ? (reviewsData.reduce((acc, r) => acc + (r.rating || 0), 0) / reviewsData.length).toFixed(1)
                          : '—'} <span className="text-xs font-mono text-slate-400">/ 5</span>
                      </div>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="text-center">
                      <div className="text-xs font-mono text-slate-400 uppercase">Logged</div>
                      <div className="font-mono font-bold text-lg text-slate-200">{totalRatings}</div>
                    </div>
                  </div>
                </div>

                {/* Rating Distribution Breakdown */}
                {totalRatings > 0 && (
                  <div className="space-y-2 bg-black/40 p-4 rounded-2xl border border-white/5">
                    <span className="text-[11px] font-mono text-slate-400 uppercase block font-semibold">
                      Rating Distribution
                    </span>
                    <div className="space-y-1.5">
                      {[5, 4, 3, 2, 1].map((starValue) => {
                        const count = distribution[starValue] || 0;
                        const pct = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0;
                        const tier = RATING_TIERS.find((t) => t.value === starValue);
                        return (
                          <div key={starValue} className="flex items-center gap-3 text-xs font-mono">
                            <span className="w-20 text-slate-300 font-semibold truncate text-[11px]">
                              {tier?.label || `${starValue} Stars`}
                            </span>
                            <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#00f5a0] to-[#00d4ff] rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-8 text-right text-slate-400 text-[10px]">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ================= INLINE REVIEW COMPOSER ================= */}
                <div className="p-5 md:p-6 rounded-2xl border border-white/10 bg-[#060910] space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display font-bold text-sm md:text-base text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#00f5a0]" />
                      {user ? 'Write Your Review' : 'Sign In to Review'}
                    </h4>
                    {user && (
                      <span className="text-[11px] font-mono text-slate-400">
                        Posting as <span className="text-[#00f5a0] font-bold">@{user.username}</span>
                      </span>
                    )}
                  </div>

                  {user ? (
                    <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs font-sans">
                      {reviewError && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">
                          {reviewError}
                        </div>
                      )}

                      {/* Tier Selector */}
                      <div className="space-y-2">
                        <label className="font-mono text-slate-300 uppercase font-bold block text-[11px]">
                          Select Rating Score
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                          {RATING_TIERS.map((tier) => {
                            const TierIcon = tier.icon;
                            const isSelected = rating === tier.value;
                            return (
                              <button
                                type="button"
                                key={tier.value}
                                onClick={() => setRating(tier.value)}
                                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                                  isSelected
                                    ? tier.activeBg + ' font-bold scale-102'
                                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                                }`}
                              >
                                <TierIcon className="w-4 h-4" />
                                <span className="text-[10px] truncate max-w-full">{tier.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Review Text */}
                      <div className="space-y-1.5">
                        <label className="font-mono text-slate-300 uppercase font-bold block text-[11px]">
                          Review Notes & Critique
                        </label>
                        <textarea
                          rows={3}
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          placeholder="Share your verdict on the direction, screenplay, pacing, performance..."
                          className="w-full bg-black/50 border border-white/10 p-3.5 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-[#00f5a0]/70 transition-colors"
                        />
                      </div>

                      {/* Watched Date and Submit Button */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                        <div className="flex items-center gap-2">
                          <label className="font-mono text-slate-400 uppercase text-[10px] shrink-0">Watched Date:</label>
                          <input
                            type="date"
                            value={watchedDate}
                            onChange={(e) => setWatchedDate(e.target.value)}
                            className="bg-black/50 border border-white/10 px-3 py-1.5 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-[#00f5a0]/70"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={submitReviewMutation.isPending}
                          className="btn-primary px-6 py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{submitReviewMutation.isPending ? 'Publishing...' : 'Post Review'}</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="text-center py-6 space-y-3 bg-black/40 rounded-2xl border border-white/5">
                      <p className="text-xs text-slate-400 font-sans">
                        Join the community to rate films, write reviews, and maintain your cinephile diary.
                      </p>
                      <Link to="/login" className="btn-primary inline-flex items-center gap-2 text-xs py-2 px-5 font-bold">
                        <span>Sign In to Review</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Community Reviews Feed */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between border-b border-white/8 pb-2">
                    <span className="text-xs font-mono font-bold uppercase text-slate-300">
                      Community Stream
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      {reviewsData.length} {reviewsData.length === 1 ? 'Review' : 'Reviews'}
                    </span>
                  </div>

                  {reviewsData.length === 0 ? (
                    <div className="p-8 rounded-2xl border border-white/8 bg-black/30 text-center space-y-2">
                      <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-slate-300 text-xs font-semibold">No member reviews recorded yet.</p>
                      <p className="text-slate-500 text-[11px] font-mono">Be the first to share your verdict on {displayTitle}!</p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {reviewsData.map((rev) => (
                        <div
                          key={rev.id}
                          className="p-5 rounded-2xl border border-white/8 bg-[#080c14] hover:border-[#00f5a0]/40 transition-all space-y-3 shadow-md"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar username={rev.username} url={rev.avatar_url} className="w-7 h-7 border border-white/15" />
                              <div>
                                <Link to={`/profile/${rev.username}`} className="font-mono text-xs font-bold text-slate-200 hover:text-[#00f5a0] block">
                                  @{rev.username}
                                </Link>
                                <span className="text-[10px] font-mono text-slate-500">
                                  {new Date(rev.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            </div>
                            <RatingBadge rating={rev.rating} size="sm" />
                          </div>

                          {rev.review_text && (
                            <p className="text-xs md:text-sm text-slate-200 leading-relaxed italic bg-black/40 p-3.5 rounded-xl border border-white/5">
                              "{rev.review_text}"
                            </p>
                          )}

                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-white/5">
                            <span className="text-slate-500">Reviewed {displayTitle}</span>
                            <button
                              onClick={() => setSelectedReviewForComments(rev)}
                              className="hover:text-[#00f5a0] transition-colors flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Comments</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ================= RECOMMENDATIONS GRID ================= */}
            {recMovies.length > 0 && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between border-b border-white/8 pb-2">
                  <h3 className="font-display font-bold text-lg md:text-xl text-white flex items-center gap-2">
                    <Film className="w-4 h-4 text-[#00f5a0]" />
                    Recommended Titles
                  </h3>
                  <span className="text-xs font-mono text-slate-500">Based on genres & themes</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 md:gap-4">
                  {recMovies.map((rec) => (
                    <MovieCard key={rec.id} movie={rec} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add To List Modal */}
      <AddToListModal
        isOpen={isAddToListOpen}
        onClose={() => setIsAddToListOpen(false)}
        movieId={parseInt(id)}
        mediaType={detectedMediaType}
        title={displayTitle}
        posterPath={movie.poster_path}
        releaseDate={displayReleaseDate}
      />

      {/* Review Comments Modal */}
      <ReviewCommentsModal
        review={selectedReviewForComments}
        onClose={() => setSelectedReviewForComments(null)}
      />

      {/* Share Card Modal */}
      <ShareCardModal
        isOpen={isShareCardOpen}
        onClose={() => setIsShareCardOpen(false)}
        movie={movie}
        rating={rating}
        review={reviewText}
        username={user?.username}
      />
    </div>
  );
}
