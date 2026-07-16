import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, UserPlus } from 'lucide-react';
import { API_URL, getAuthHeaders, getPosterUrl } from '../config';
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
      <div className="flex items-baseline justify-between mb-8 pb-2.5 border-b-3 border-brand-border">
        <h1 className="section-title font-bangers text-[28px] tracking-wide text-brand-text flex items-baseline gap-2">
          <Users className="w-6 h-6 text-[#ff4757] self-center" />
          <span>Friend Activity Feed</span>
        </h1>
      </div>

      {isLoading ? (
        <div className="space-y-6 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-[#1b1810] border-3 border-brand-border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 border-3 border-[#ff4757] bg-[#1b1810] text-[#ff4757] text-xs uppercase font-bold">
          [SYSTEM EXCEPTION]: {error.message}
        </div>
      ) : followingCount === 0 ? (
        // Case A: User is not following anyone -> Show other accounts on the platform
        <div className="space-y-6">
          <div className="border-3 border-brand-border bg-[#1b1810] p-8 text-center text-brand-text-muted space-y-4 uppercase shadow-[4px_4px_0_#f2e9d8]">
            <Users className="w-12 h-12 text-brand-text-muted mx-auto" />
            <h3 className="font-bangers text-2xl text-brand-text">Your Feed is Empty</h3>
            <p className="text-xs max-w-md mx-auto lowercase first-letter:uppercase normal-case font-bold font-mono">
              You aren't following anyone yet! Follow other critics on the database below to start seeing their movie reviews and ratings in your feed.
            </p>
          </div>
          
          <div className="space-y-4 pt-6">
            <h3 className="text-sm font-bold text-brand-text uppercase flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#f4c430]" />
              <span>Suggested Critics based on Movie Taste</span>
            </h3>
            {suggestions.length === 0 ? (
              <div className="border-3 border-brand-border bg-[#1b1810] p-6 text-center text-brand-text-muted uppercase text-xs font-bold font-mono">
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
            <div className="border-3 border-brand-border bg-[#1b1810] p-12 text-center text-brand-text-muted uppercase text-xs font-bold font-mono shadow-[4px_4px_0_#f2e9d8]">
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
            <div className="mt-12 border-t-3 border-brand-border pt-8 space-y-4">
              <h3 className="text-lg font-bold text-brand-text uppercase flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#f4c430]" />
                <span>Critics with Similar Movie Taste</span>
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
    <div className="border-3 border-brand-border bg-[#1b1810] p-4 flex items-center gap-4 shadow-[4px_4px_0_#f2e9d8] hover:translate-y-[-2px] hover:shadow-[5px_6px_0_#f4c430] transition-all duration-150">
      <Avatar username={sug.username} url={sug.avatar_url} className="w-10 h-10 border border-brand-border rounded-none" />
      <div className="text-left flex-1 min-w-0 font-mono">
        <Link to={`/profile/${sug.username}`} className="font-bold text-brand-text hover:text-[#f4c430] text-xs transition-colors">
          @{sug.username}
        </Link>
        <p className="text-[10px] text-brand-text-muted truncate mt-0.5 uppercase font-bold">
          {sug.mutual_count > 0 && (
            <span className="text-[#ff4757] font-extrabold mr-1.5">
              ★ SHARES {sug.mutual_count} {sug.mutual_count === 1 ? 'FILM' : 'FILMS'} IN TASTE //
            </span>
          )}
          {sug.bio || "Cinephile with no biography yet."}
        </p>
      </div>
      <button
        onClick={() => onFollow(sug.id)}
        disabled={isPending}
        className="btn btn-primary px-4 py-1.5 text-[10px]"
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
    <div className="border-3 border-brand-border bg-[#1b1810] p-5 flex gap-5 shadow-[4px_4px_0_#f2e9d8] hover:translate-y-[-2px] hover:shadow-[5px_6px_0_#f4c430] transition-all duration-150 rounded-sm">
      {/* Movie Poster Thumbnail on the left */}
      <Link to={`/media/${mediaType}/${act.tmdb_movie_id}`} className="w-14 h-20 shrink-0 overflow-hidden border-2 border-brand-border shadow-md block bg-zinc-950">
        <img
          src={getPosterUrl(movie?.poster_path)}
          alt={movieName}
          className="w-full h-full object-cover"
        />
      </Link>
      
      <div className="text-left flex-1 min-w-0 font-sans">
        <div className="flex flex-wrap items-center gap-2.5 mb-2.5 border-b-2 border-brand-border pb-2.5">
          <Avatar
            username={act.username}
            url={act.avatar_url}
            className="w-6 h-6 border border-brand-border rounded-none"
          />
          <Link to={`/profile/${act.username}`} className="font-bold text-brand-text hover:text-[#f4c430] transition-colors text-xs font-mono">
            @{act.username}
          </Link>
          
          <span className="text-[10px] text-brand-text-muted font-bold font-mono uppercase">
            {act.type === 'review' ? 'reviewed' : 'watched'}
          </span>
          
          <Link to={`/media/${mediaType}/${act.tmdb_movie_id}`} className="font-bold text-brand-text hover:text-[#f4c430] transition-colors text-xs font-mono">
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
          <Link to={`/media/${mediaType}/${act.tmdb_movie_id}`} className="block">
            <p className="text-xs md:text-sm text-brand-text leading-relaxed bg-[#121008] p-4 border border-brand-border font-medium italic">
              "{act.review_text}"
            </p>
          </Link>
        )}

        <span className="block text-[10px] text-brand-text-muted mt-3 font-bold uppercase tracking-wider font-mono">
          Logged: {new Date(act.created_at).toLocaleString()}
        </span>
      </div>
    </div>
  );
}
