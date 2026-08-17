import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bookmark, Plus, Check, X, AlertCircle, Eye,
  Film, Trophy, Flame, Play, FolderPlus, MessageSquare, Heart, Share2, Tv, Star, Sparkles, Clock, User, Calendar, ExternalLink
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

const RATING_TIERS = [
  { value: 1, label: 'Bullshit', icon: '💩', color: 'rose' },
  { value: 2, label: 'Meh', icon: '🥱', color: 'slate' },
  { value: 3, label: 'One-Time', icon: '🎟️', color: 'sky' },
  { value: 4, label: 'Good', icon: '🍿', color: 'emerald' },
  { value: 5, label: 'Pure Cinema', icon: '🏆', color: 'amber' }
];

export default function MovieDetails({ onOpenPerson }) {
  const { id, mediaType } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isAddToListOpen, setIsAddToListOpen] = useState(false);
  const [isShareCardOpen, setIsShareCardOpen] = useState(false);
  const [selectedReviewForComments, setSelectedReviewForComments] = useState(null);

  // Form states for Logging
  const [rating, setRating] = useState(4);
  const [watchedDate, setWatchedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reviewText, setReviewText] = useState('');
  const [logError, setLogError] = useState('');

  // Consolidated Full Media Bundle (details + credits + recommendations + videos + watch providers)
  const { data: movie, isLoading: detailsLoading, error: detailsError } = useQuery({
    queryKey: ['movieDetailsFull', id, mediaType || 'auto'],
    queryFn: async () => {
      const url = mediaType ? `${API_URL}/media/${mediaType}/${id}/full` : `${API_URL}/movies/${id}/full`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Film or show not found');
      return res.json();
    }
  });

  const detectedMediaType = movie?.media_type || mediaType || 'movie';
  const credits = movie?.credits || { cast: [], crew: [] };
  const recommendations = movie?.recommendations || { results: [] };
  const providersData = movie?.providers || { results: {} };
  const providers = providersData?.results?.US || providersData?.results?.IN || providersData?.results?.GB || {};
  const flatrateProviders = providers.flatrate || [];

  const movieDate = movie?.release_date || movie?.first_air_date;
  const isUpcoming = movieDate ? new Date(movieDate) > new Date() : false;

  useEffect(() => {
    if (isUpcoming) {
      setRating(0);
    } else {
      setRating(4);
    }
  }, [isUpcoming]);

  // Fetch excited state
  const { data: excitedData } = useQuery({
    queryKey: ['excitedState', id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/movies/${id}/excited`, {
        headers: getAuthHeaders()
      });
      if (res.ok) return res.json();
      return { count: 0, excited: false };
    },
    enabled: !!movie && isUpcoming
  });

  const excitedMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/diary/toggle-watched`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ tmdb_movie_id: parseInt(id), media_type: detectedMediaType, is_upcoming: isUpcoming })
      });
      return res.json();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['excitedState', id] });
    }
  });

  // Fetch watched state
  const { data: watchedState } = useQuery({
    queryKey: ['watchedState', id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/diary/check-watched/${id}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) return res.json();
      return { watched: false };
    },
    enabled: !!user && !!movie && !isUpcoming
  });

  const watchedMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/diary/toggle-watched`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ tmdb_movie_id: parseInt(id), media_type: detectedMediaType })
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['watchedState', id] });
      queryClient.invalidateQueries({ queryKey: ['userDiary', user?.username] });
      if (data.watched) {
        toast.addToast('Logged to your diary', 'success');
      } else {
        toast.addToast('Removed from watched diary', 'info');
      }
    }
  });

  // Fetch watchlist state
  const { data: watchlistState } = useQuery({
    queryKey: ['watchlistState', id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/watchlist/check/${id}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) return res.json();
      return { onWatchlist: false };
    },
    enabled: !!user && !!movie
  });

  const watchlistMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/watchlist/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ tmdb_movie_id: parseInt(id), media_type: detectedMediaType })
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['watchlistState', id] });
      queryClient.invalidateQueries({ queryKey: ['userWatchlist', user?.username] });
      if (data.onWatchlist) {
        toast.addToast('Added to watchlist', 'success');
      } else {
        toast.addToast('Removed from watchlist', 'info');
      }
    }
  });

  // Fetch movie reviews
  const { data: reviewsData = [] } = useQuery({
    queryKey: ['movieReviews', id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/reviews/movie/${id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!id
  });

  const logReviewMutation = useMutation({
    mutationFn: async (reviewPayload) => {
      const res = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(reviewPayload)
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit log');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movieReviews', id] });
      queryClient.invalidateQueries({ queryKey: ['watchedState', id] });
      queryClient.invalidateQueries({ queryKey: ['userDiary', user?.username] });
      setIsLogModalOpen(false);
      setReviewText('');
      toast.addToast('Review & diary entry saved!', 'success');
      fireConfetti();
    },
    onError: (err) => {
      setLogError(err.message);
    }
  });

  const handleLogSubmit = (e) => {
    e.preventDefault();
    setLogError('');
    logReviewMutation.mutate({
      tmdb_movie_id: parseInt(id),
      media_type: detectedMediaType,
      rating: isUpcoming ? 0 : rating,
      review_text: reviewText,
      watched_date: watchedDate
    });
  };

  if (detailsLoading) {
    return (
      <div className="flex-1 max-w-7xl mx-auto px-6 py-24 flex flex-col items-center justify-center text-amber-400 font-mono space-y-4">
        <div className="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <span className="text-xs tracking-widest font-bold">LOADING CINEMA DOSSIER...</span>
      </div>
    );
  }

  if (detailsError || !movie) {
    return (
      <div className="flex-1 max-w-7xl mx-auto px-6 py-16 text-left">
        <div className="p-8 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl flex items-start gap-4">
          <AlertCircle className="w-8 h-8 shrink-0" />
          <div>
            <h3 className="font-display font-bold text-xl">RECORD NOT FOUND</h3>
            <p className="text-xs mt-1 font-mono">{detailsError?.message || 'Could not retrieve cinema data.'}</p>
          </div>
        </div>
      </div>
    );
  }

  const creatorNames = movie.created_by?.map((c) => c.name).join(', ');
  const director = creatorNames || credits?.crew?.find((person) => person.job === 'Director')?.name || 'Unknown';
  const displayCast = credits?.cast?.slice(0, 8) || [];
  const recMovies = recommendations?.results?.slice(0, 5) || [];

  const displayTitle = movie.title || movie.name;
  const displayReleaseDate = movie.release_date || movie.first_air_date;
  const displayRuntime = movie.runtime ? `${movie.runtime} min` : movie.episode_run_time ? `${movie.episode_run_time[0]} min/ep` : 'N/A';

  return (
    <div className="flex-1 pb-28 text-left font-sans text-slate-100">
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-6 space-y-8">
        
        {/* ================= HERO STAGE: DIRECT TRAILER / BANNER ================= */}
        <TrailerHero
          movie={movie}
          mediaType={detectedMediaType}
          title={displayTitle}
          preloadedVideos={movie.videos?.results || []}
        />

        {/* ================= ACTION & RATING BAR ================= */}
        <div className="p-5 md:p-6 rounded-2xl border border-white/10 bg-[#0d101a] shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Quick Rating Selector (1 to 5 Stars) */}
          <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full lg:w-auto">
            <span className="text-xs font-mono font-bold uppercase text-slate-400 shrink-0">
              Rate Film:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {RATING_TIERS.map((tier) => {
                const isSelected = rating === tier.value;
                return (
                  <button
                    key={tier.value}
                    onClick={() => {
                      setRating(tier.value);
                      if (user) setIsLogModalOpen(true);
                      else toast.addToast('Please sign in to rate', 'info');
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-md'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:border-amber-400/40 hover:bg-white/8'
                    }`}
                  >
                    <span>{tier.icon}</span>
                    <span>{tier.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 w-full lg:w-auto justify-end flex-wrap">
            {user ? (
              <>
                <button
                  onClick={() => watchedMutation.mutate()}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    watchedState?.watched
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{watchedState?.watched ? 'Watched' : 'Mark Watched'}</span>
                </button>

                <button
                  onClick={() => watchlistMutation.mutate()}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    watchlistState?.onWatchlist
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{watchlistState?.onWatchlist ? 'In Watchlist' : 'Watchlist'}</span>
                </button>

                <button
                  onClick={() => setIsAddToListOpen(true)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-sky-400" />
                  <span>Add to List</span>
                </button>
              </>
            ) : (
              <Link to="/login" className="btn-secondary text-xs py-2 px-4">
                Sign in to Log & Track
              </Link>
            )}

            <button
              onClick={() => setIsShareCardOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs flex items-center gap-1.5 cursor-pointer"
              title="Share Cinephile Stamp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            <button
              onClick={() => setIsLogModalOpen(true)}
              className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 font-bold shadow-md cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Log Review</span>
            </button>
          </div>
        </div>

        {/* ================= BALANCED 2-COLUMN MAIN CONTENT ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          {/* LEFT COLUMN: Poster, Streaming, and Technical Dossier */}
          <div className="lg:col-span-1 space-y-6">
            {/* Poster Card */}
            <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-black">
              <img
                src={getPosterUrl(movie.poster_path, 'w500')}
                alt={displayTitle}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Where to Watch */}
            {flatrateProviders.length > 0 && (
              <div className="p-5 rounded-2xl border border-white/10 bg-[#0d101a] space-y-3 shadow-lg">
                <span className="text-xs font-mono font-bold uppercase text-amber-400 flex items-center gap-1.5">
                  <Tv className="w-4 h-4" /> Where to Stream
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {flatrateProviders.map((p) => (
                    <div
                      key={p.provider_id}
                      className="w-10 h-10 rounded-xl overflow-hidden border border-white/15 bg-black shadow"
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

            {/* Metadata Dossier */}
            <div className="p-5 rounded-2xl border border-white/10 bg-[#0d101a] space-y-3.5 shadow-lg text-xs font-sans">
              <span className="text-xs font-mono font-bold uppercase text-slate-400 block border-b border-white/10 pb-2">
                Production Dossier
              </span>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Director</span>
                <span className="text-slate-100 font-semibold">{director}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Release Date</span>
                <span className="text-slate-100 font-semibold">{displayReleaseDate || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Runtime</span>
                <span className="text-slate-100 font-semibold">{displayRuntime}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Score</span>
                <span className="text-amber-400 font-bold font-mono">
                  ★ {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'} / 10
                </span>
              </div>
              {movie.genres && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {movie.genres.map((g) => (
                    <span key={g.id} className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/8 text-[11px] text-slate-300">
                      {g.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Synopsis, Cast, Reviews & Similar */}
          <div className="lg:col-span-2 space-y-10">
            {/* Synopsis Section */}
            <div className="p-6 md:p-8 rounded-2xl border border-white/10 bg-[#0d101a] shadow-xl space-y-3">
              <h3 className="font-display font-bold text-xl text-white">
                Synopsis
              </h3>
              <p className="text-sm md:text-base text-slate-300 leading-relaxed font-sans">
                {movie.overview || "No synopsis recorded for this title."}
              </p>
              {movie.tagline && (
                <p className="text-xs text-amber-400/90 italic font-serif pt-2 border-t border-white/5">
                  "{movie.tagline}"
                </p>
              )}
            </div>

            {/* Top Cast Section */}
            {displayCast.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-display font-bold text-xl text-white">
                  Top Billed Cast
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  {displayCast.map((actor) => (
                    <div
                      key={actor.id}
                      onClick={() => onOpenPerson?.(actor.id)}
                      className="p-3 rounded-xl border border-white/8 bg-[#0d101a] hover:border-amber-400/40 transition-all flex items-center gap-3 cursor-pointer shadow-md"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/15 bg-slate-900">
                        {actor.profile_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                            alt={actor.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-slate-500 m-auto mt-2.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="font-display font-bold text-xs text-white truncate block">
                          {actor.name}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate block mt-0.5">
                          {actor.character}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Community Reviews Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-display font-bold text-xl text-white">
                  Community Reviews ({reviewsData.length})
                </h3>
                {user && (
                  <button
                    onClick={() => setIsLogModalOpen(true)}
                    className="text-xs font-mono text-amber-400 hover:underline font-semibold uppercase"
                  >
                    + Write Review
                  </button>
                )}
              </div>

              {reviewsData.length === 0 ? (
                <div className="p-8 rounded-2xl border border-white/10 bg-[#0d101a] text-center text-slate-400 text-xs font-mono">
                  No member reviews logged yet. Be the first to share your verdict!
                </div>
              ) : (
                <div className="space-y-3.5">
                  {reviewsData.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-5 rounded-2xl border border-white/8 bg-[#0d101a] hover:border-white/15 transition-all space-y-2.5 shadow-md"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar username={rev.username} url={rev.avatar_url} className="w-6 h-6 border border-white/15" />
                          <Link to={`/profile/${rev.username}`} className="font-mono text-xs font-bold text-slate-200 hover:text-amber-400">
                            @{rev.username}
                          </Link>
                        </div>
                        <RatingBadge rating={rev.rating} size="xs" />
                      </div>

                      {rev.review_text && (
                        <p className="text-xs md:text-sm text-slate-300 leading-relaxed italic bg-black/40 p-3 rounded-xl border border-white/5">
                          "{rev.review_text}"
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                        <span>Logged {new Date(rev.created_at).toLocaleDateString()}</span>
                        <button
                          onClick={() => setSelectedReviewForComments(rev)}
                          className="hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Comments</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommendations Grid */}
            {recMovies.length > 0 && (
              <div className="space-y-4 pt-4">
                <h3 className="font-display font-bold text-xl text-white">
                  You Might Also Enjoy
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {recMovies.map((rec) => (
                    <MovieCard key={rec.id} movie={rec} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Log Review Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/85 flex items-center justify-center p-4 backdrop-blur-2xl animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl overflow-hidden border border-white/15 bg-[#0e111a] text-slate-100 shadow-2xl p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-display font-bold text-lg text-white">
                Log {displayTitle}
              </h3>
              <button onClick={() => setIsLogModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {logError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">
                {logError}
              </div>
            )}

            <form onSubmit={handleLogSubmit} className="space-y-4 text-xs font-sans">
              <div className="space-y-2">
                <label className="font-mono text-slate-300 uppercase font-bold block">Rating Score</label>
                <div className="grid grid-cols-5 gap-2">
                  {RATING_TIERS.map((tier) => (
                    <button
                      type="button"
                      key={tier.value}
                      onClick={() => setRating(tier.value)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        rating === tier.value
                          ? 'bg-amber-500 text-black border-amber-400 font-bold'
                          : 'bg-white/5 border-white/10 text-slate-300'
                      }`}
                    >
                      <div className="text-base">{tier.icon}</div>
                      <div className="text-[10px] mt-0.5 truncate">{tier.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-slate-300 uppercase font-bold block">Review / Notes</label>
                <textarea
                  rows={4}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your thoughts on the cinematography, plot twists, performance..."
                  className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-amber-400/60"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-slate-300 uppercase font-bold block">Date Watched</label>
                <input
                  type="date"
                  value={watchedDate}
                  onChange={(e) => setWatchedDate(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 p-2.5 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-amber-400/60"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="btn-secondary px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={logReviewMutation.isPending}
                  className="btn-primary px-5 py-2 text-xs font-bold"
                >
                  {logReviewMutation.isPending ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
        reviewText={reviewText}
      />
    </div>
  );
}
