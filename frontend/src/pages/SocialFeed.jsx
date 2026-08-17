import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, UserPlus, MessageSquare, Flame, Sparkles, Star, Clock } from 'lucide-react';
import { API_URL, getAuthHeaders, getPosterUrl } from '../config';
import RatingBadge from '../components/RatingBadge';
import Avatar from '../components/Avatar';
import { useAuth } from '../context/AuthContext';

export default function SocialFeed() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [feedMode, setFeedMode] = useState('following');

  // Profile Data
  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profileDetails', currentUser?.username],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/users/profile/${currentUser?.username}`);
      if (!res.ok) throw new Error('Failed to load profile');
      return res.json();
    },
    enabled: !!currentUser
  });

  const followingCount = profileData?.stats?.following || 0;

  // Social Feed Data
  const { data: feed = [], isLoading: isFeedLoading, error } = useQuery({
    queryKey: ['socialFeed'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/social/feed`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to load social feed');
      return res.json();
    },
    enabled: !!currentUser
  });

  // Global Reviews Data (for Global tab)
  const { data: globalReviews = [], isLoading: isGlobalLoading } = useQuery({
    queryKey: ['globalReviewsFeed'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/reviews`);
      if (!res.ok) return [];
      return res.json();
    }
  });

  // Suggested Critics
  const { data: suggestions = [], isLoading: isSuggestionsLoading } = useQuery({
    queryKey: ['suggestions'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/users/suggestions`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to load suggestions');
      return res.json();
    },
    enabled: !!currentUser
  });

  const followMutation = useMutation({
    mutationFn: async (targetId) => {
      const res = await fetch(`${API_URL}/social/follow/${targetId}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to follow user');
      return res.json();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['socialFeed'] });
      queryClient.invalidateQueries({ queryKey: ['profileDetails', currentUser?.username] });
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
    }
  });

  const isLoading = isFeedLoading || isProfileLoading || isSuggestionsLoading;
  const activeFeed = feedMode === 'following' ? feed : globalReviews;

  return (
    <div className="flex-1 max-w-4xl mx-auto px-6 py-10 text-left font-sans space-y-8">
      {/* Page Header & Feed Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-slate-100 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-amber-400" />
            <span>Community Feed</span>
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-0.5">Live diary logs and ratings from fellow cinephiles</p>
        </div>

        <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-xl">
          <button
            onClick={() => setFeedMode('following')}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all ${
              feedMode === 'following'
                ? 'bg-amber-500 text-[#08090d] shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Following ({followingCount})
          </button>
          <button
            onClick={() => setFeedMode('global')}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all ${
              feedMode === 'global'
                ? 'bg-amber-500 text-[#08090d] shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Global Stream
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-white/5 border border-white/10 skeleton-shimmer" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 border border-rose-500/30 bg-rose-500/10 text-rose-400 rounded-2xl text-xs font-mono">
          [Error loading feed]: {error.message}
        </div>
      ) : feedMode === 'following' && followingCount === 0 ? (
        <div className="space-y-6">
          <div className="border border-white/10 bg-white/5 p-8 text-center text-slate-400 space-y-3 rounded-2xl shadow-xl">
            <Users className="w-10 h-10 text-amber-400 mx-auto" />
            <h3 className="font-display font-bold text-xl text-slate-100">Your Following Feed is Quiet</h3>
            <p className="text-xs max-w-md mx-auto font-sans leading-relaxed">
              You aren't following any critics yet! Discover fellow cinephiles below or switch to Global Stream to explore recent logs.
            </p>
          </div>

          <div className="space-y-3.5 pt-2">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-amber-400" />
              <span>Suggested Cinephiles to Follow</span>
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {suggestions.map((sug) => (
                <SuggestionCard
                  key={sug.id}
                  sug={sug}
                  onFollow={(id) => followMutation.mutate(id)}
                  isPending={followMutation.isPending}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {activeFeed.length === 0 ? (
            <div className="border border-white/10 bg-white/5 p-10 text-center text-slate-400 text-xs font-mono rounded-2xl">
              No activity logged yet in this stream.
            </div>
          ) : (
            <div className="space-y-4">
              {activeFeed.map((act, idx) => (
                <SocialFeedItem key={act.id || idx} act={act} />
              ))}
            </div>
          )}

          {suggestions.length > 0 && feedMode === 'following' && (
            <div className="mt-10 border-t border-white/10 pt-6 space-y-3.5">
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-400" />
                <span>Critics with Shared Movie Taste</span>
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {suggestions.map((sug) => (
                  <SuggestionCard
                    key={sug.id}
                    sug={sug}
                    onFollow={(id) => followMutation.mutate(id)}
                    isPending={followMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SuggestionCard({ sug, onFollow, isPending }) {
  return (
    <div className="border border-white/10 bg-white/5 hover:bg-white/8 hover:border-amber-400/30 p-4 flex items-center gap-4 transition-all rounded-2xl shadow-md">
      <Avatar username={sug.username} url={sug.avatar_url} className="w-10 h-10 border border-white/15" />
      <div className="text-left flex-1 min-w-0 font-sans">
        <Link to={`/profile/${sug.username}`} className="font-mono font-bold text-slate-200 hover:text-amber-400 text-xs transition-colors">
          @{sug.username}
        </Link>
        <p className="text-xs text-slate-400 truncate mt-0.5">
          {sug.mutual_count > 0 && (
            <span className="text-amber-400 font-mono font-semibold mr-1.5 inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Shares {sug.mutual_count} films •
            </span>
          )}
          {sug.bio || 'Cinephile exploring film archives.'}
        </p>
      </div>
      <button 
        onClick={() => onFollow(sug.id)} 
        disabled={isPending} 
        className="btn-primary px-4 py-1.5 text-xs shrink-0"
      >
        Follow
      </button>
    </div>
  );
}

function SocialFeedItem({ act }) {
  const { data: movie } = useQuery({
    queryKey: ['movieDetailsSimple', act.tmdb_movie_id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/movies/${act.tmdb_movie_id}`);
      if (!res.ok) throw new Error('Not found');
      return res.json();
    },
    staleTime: 1000 * 60 * 10
  });

  const movieName = movie?.title || movie?.name || 'Film';
  const mediaType = movie?.media_type || 'movie';

  return (
    <div className="border border-white/10 bg-white/5 hover:bg-white/8 hover:border-amber-400/30 p-4 rounded-2xl flex gap-4 transition-all shadow-md">
      <Link to={`/media/${mediaType}/${act.tmdb_movie_id}`} className="w-14 h-20 shrink-0 overflow-hidden rounded-xl border border-white/10 block bg-slate-900">
        <img src={getPosterUrl(movie?.poster_path, 'w185')} alt={movieName} className="w-full h-full object-cover" />
      </Link>

      <div className="text-left flex-1 min-w-0 font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-white/10">
          <div className="flex flex-wrap items-center gap-2">
            <Avatar username={act.username} url={act.avatar_url} className="w-5 h-5 border border-white/15" />
            <Link to={`/profile/${act.username}`} className="font-mono font-bold text-slate-200 hover:text-amber-400 transition-colors text-xs">
              @{act.username}
            </Link>

            <span className="text-[11px] text-slate-500 font-mono">
              {act.review_text ? 'reviewed' : 'logged'}
            </span>

            <Link to={`/media/${mediaType}/${act.tmdb_movie_id}`} className="font-display font-bold text-slate-100 hover:text-amber-300 transition-colors text-xs">
              {movieName}
            </Link>
          </div>

          {act.rating && (
            <div className="shrink-0 flex justify-end">
              <RatingBadge rating={act.rating} size="xs" />
            </div>
          )}
        </div>

        {act.review_text && (
          <Link to={`/media/${mediaType}/${act.tmdb_movie_id}`} className="block">
            <p className="text-xs md:text-sm text-slate-200 leading-relaxed bg-black/40 p-3 rounded-xl border border-white/5 italic">
              "{act.review_text}"
            </p>
          </Link>
        )}

        <div className="flex items-center gap-1.5 mt-2.5 text-[10px] font-mono text-slate-500">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>Logged {new Date(act.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
