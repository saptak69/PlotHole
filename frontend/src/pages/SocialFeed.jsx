import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, UserPlus } from 'lucide-react';
import { API_URL, getAuthHeaders } from '../config';
import RatingBadge from '../components/RatingBadge';
import Avatar from '../components/Avatar';
import { useAuth } from '../context/AuthContext';

export default function SocialFeed() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // 1. Fetch current user's profile stats to see if they follow anyone
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

  // 2. Fetch the social feed
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

  // 3. Fetch suggested users
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

  // 4. Follow Mutation
  const followMutation = useMutation({
    mutationFn: async (targetId) => {
      const res = await fetch(`${API_URL}/social/follow/${targetId}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to follow user');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialFeed'] });
      queryClient.invalidateQueries({ queryKey: ['profileDetails', currentUser?.username] });
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
    }
  });

  const isLoading = isFeedLoading || isProfileLoading || isSuggestionsLoading;

  return (
    <div className="flex-1 max-w-3xl mx-auto px-6 py-12 text-left font-mono">
      <div className="flex items-center gap-3 mb-8 border-b-2 border-white/20 pb-4">
        <Users className="w-8 h-8 text-brutal-cyan" />
        <h1 className="text-2xl md:text-[32px] font-black text-white uppercase leading-tight">
          Friend Activity Feed
        </h1>
      </div>

      {isLoading ? (
        <div className="space-y-6 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-brand-card brutal-border" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 border-2 border-brutal-pink bg-brutal-pink/10 text-brutal-pink text-sm uppercase font-bold">
          [SYSTEM EXCEPTION]: {error.message}
        </div>
      ) : followingCount === 0 ? (
        // Case A: User is not following anyone -> Show other accounts on the platform
        <div className="space-y-6">
          <div className="brutal-border p-8 text-center text-brand-text-muted space-y-4 uppercase">
            <Users className="w-12 h-12 text-brand-text-muted mx-auto" />
            <h3 className="font-black text-lg text-white">Your Feed is Empty</h3>
            <p className="text-sm max-w-md mx-auto font-bold">
              You aren't following anyone yet! Follow other critics on the database below to start seeing their movie reviews and ratings in your feed.
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-black text-white uppercase flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-brutal-cyan" />
              <span>Suggested Critics to Follow</span>
            </h3>
            {suggestions.length === 0 ? (
              <div className="brutal-border p-6 text-center text-brand-text-muted uppercase text-xs font-bold">
                No other critics found on the database.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {suggestions.map((sug) => (
                  <SuggestionCard 
                    key={sug.id} 
                    sug={sug} 
                    onFollow={(id) => followMutation.mutate(id)} 
                    isPending={followMutation.isPending}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Case B: User follows at least one person -> Show feed + suggested users at the end
        <div className="space-y-8">
          {feed.length === 0 ? (
            <div className="brutal-border p-12 text-center text-brand-text-muted uppercase text-sm font-bold">
              Cinephiles you follow haven't logged any movies yet.
            </div>
          ) : (
            <div className="space-y-6">
              {feed.map((act, idx) => (
                <SocialFeedItem key={idx} act={act} />
              ))}
            </div>
          )}

          {/* Suggested Users at the end of the feed */}
          {suggestions.length > 0 && (
            <div className="mt-12 border-t-2 border-white/20 pt-8 space-y-4">
              <h3 className="text-lg font-black text-white uppercase flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brutal-cyan" />
                <span>More Suggested Critics</span>
              </h3>
              <div className="grid grid-cols-1 gap-4">
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
    <div className="brutal-border p-4 bg-brand-card flex items-center gap-4 hover:border-brutal-cyan/35 transition-all">
      <Avatar username={sug.username} url={sug.avatar_url} className="w-10 h-10" />
      <div className="text-left flex-1 min-w-0 font-mono">
        <Link to={`/profile/${sug.username}`} className="font-extrabold text-white hover:text-brutal-cyan text-sm uppercase">
          @{sug.username}
        </Link>
        <p className="text-xs text-brand-text-muted truncate mt-0.5 uppercase">
          {sug.bio || "Cinephile with no biography yet."}
        </p>
      </div>
      <button
        onClick={() => onFollow(sug.id)}
        disabled={isPending}
        className="px-4 py-1.5 bg-brutal-yellow hover:bg-white text-black font-extrabold text-xs uppercase border-2 border-white transition-all shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-50"
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

  const movieName = movie?.title || movie?.name || `Film #${act.tmdb_movie_id}`;
  const mediaType = movie?.media_type || 'movie';

  return (
    <div className="brutal-border p-5 flex gap-4 hover:border-brutal-pink/35 hover:shadow-[0_8px_25px_rgba(255,0,127,0.1)] hover:scale-[1.01] transition-all duration-300">
      <Avatar
        username={act.username}
        url={act.avatar_url}
        className="w-12 h-12"
      />
      <div className="flex-1 min-w-0 font-mono text-left">
        <div className="flex flex-wrap items-center gap-2 mb-3 border-b border-white/5 pb-2">
          <Link to={`/profile/${act.username}`} className="font-extrabold text-white hover:text-brutal-cyan transition-colors text-sm uppercase">
            @{act.username}
          </Link>
          
          <span className="text-[10px] text-brand-text-muted uppercase font-bold">
            {act.type === 'review' ? 'reviewed' : 'watched'}
          </span>
          
          <Link to={`/media/${mediaType}/${act.tmdb_movie_id}`} className="font-bold text-brutal-cyan hover:underline text-sm uppercase">
            {movieName}
          </Link>

          {/* Custom Rating Badge */}
          {act.rating && (
            <div className="ml-auto">
              <RatingBadge rating={act.rating} />
            </div>
          )}
        </div>

        {act.review_text && (
          <Link to={`/media/${mediaType}/${act.tmdb_movie_id}`} className="block group/comment">
            <p className="text-sm md:text-base text-brand-text leading-relaxed bg-black/40 p-4 rounded-xl border border-white/5 uppercase hover:border-brutal-cyan/30 hover:bg-black/60 transition-all">
              {act.review_text}
            </p>
          </Link>
        )}

        <span className="block text-[10px] text-brand-text-muted mt-3 font-bold uppercase">
          Logged: {new Date(act.created_at).toLocaleString()}
        </span>
      </div>
    </div>
  );
}
