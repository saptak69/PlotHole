import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, AlertCircle } from 'lucide-react';
import { API_URL, getAuthHeaders, getPosterUrl } from '../config';
import { useAuth } from '../context/AuthContext';
import RatingBadge from '../components/RatingBadge';

// Polaroid Card component with masking tape effect
function PolaroidCard({ movieId, angle }) {
  const { data: movie } = useQuery({
    queryKey: ['movieDetails', movieId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/movies/${movieId}`);
      if (!res.ok) throw new Error('Not found');
      return res.json();
    }
  });

  if (!movie) return <div className="aspect-[3/4] bg-white rounded-none border-2 border-black animate-pulse" />;

  return (
    <div 
      className="polaroid-container relative select-none transform transition-transform hover:scale-105 duration-200"
      style={{ transform: `rotate(${angle}deg)` }}
    >
      <div className="masking-tape" />
      <Link to={`/movies/${movie.id}`}>
        <div className="aspect-square w-full overflow-hidden border-2 border-black mb-3">
          <img
            src={getPosterUrl(movie.poster_path)}
            alt={movie.title}
            className="w-full h-full object-cover bitmap-hover"
          />
        </div>
        <p className="font-mono text-[10px] font-black text-black uppercase tracking-tight truncate text-center">
          {movie.title}
        </p>
      </Link>
    </div>
  );
}

// Watchlist card item in list
function WatchlistCard({ movieId }) {
  const { data: movie } = useQuery({
    queryKey: ['movieDetails', movieId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/movies/${movieId}`);
      if (!res.ok) throw new Error('Not found');
      return res.json();
    }
  });

  if (!movie) return <div className="aspect-[2/3] bg-brand-card border-3 border-white animate-pulse" />;

  return (
    <Link to={`/movies/${movie.id}`} className="group relative block brutal-border-interactive overflow-hidden bg-brand-card">
      <div className="aspect-[2/3] w-full">
        <img
          src={getPosterUrl(movie.poster_path)}
          alt={movie.title}
          className="w-full h-full object-cover bitmap-hover"
        />
      </div>
    </Link>
  );
}

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('diary');

  // Fetch profile details
  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['userProfile', username, currentUser?.id],
    queryFn: async () => {
      const currentUserIdParam = currentUser ? `?currentUserId=${currentUser.id}` : '';
      const res = await fetch(`${API_URL}/users/profile/${username}${currentUserIdParam}`);
      if (!res.ok) throw new Error('User not found');
      return res.json();
    }
  });

  const profileUser = profile?.user;
  const stats = profile?.stats;
  const isFollowing = profile?.isFollowing;

  // Fetch user reviews
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['userReviews', profileUser?.id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/reviews`);
      if (res.ok) {
        const allReviews = await res.json();
        return allReviews.filter(r => r.user_id === profileUser.id);
      }
      return [];
    },
    enabled: !!profileUser?.id
  });

  // Fetch user diary logs
  const { data: diary = [], isLoading: diaryLoading } = useQuery({
    queryKey: ['userDiary', profileUser?.id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/diary/user/${profileUser.id}`);
      if (res.ok) return res.json();
      return [];
    },
    enabled: !!profileUser?.id
  });

  // Fetch user watchlist
  const { data: watchlist = [], isLoading: watchlistLoading } = useQuery({
    queryKey: ['userWatchlist', profileUser?.id, currentUser?.id],
    queryFn: async () => {
      if (currentUser && currentUser.id === profileUser.id) {
        const res = await fetch(`${API_URL}/watchlist`, {
          headers: getAuthHeaders()
        });
        if (res.ok) return res.json();
      }
      return [];
    },
    enabled: !!profileUser?.id && !!currentUser
  });

  // Follow/Unfollow Mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      const endpoint = isFollowing ? 'unfollow' : 'follow';
      const res = await fetch(`${API_URL}/social/${endpoint}/${profileUser.id}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', username, currentUser?.id] });
    }
  });

  if (profileLoading) {
    return (
      <div className="flex-1 max-w-7xl mx-auto px-6 py-12 flex flex-col items-center justify-center animate-pulse text-white font-mono uppercase">
        <h2 className="text-xl">RECLAIMING SCRAPBOOK DOSSIER...</h2>
      </div>
    );
  }

  if (profileError || !profileUser) {
    return (
      <div className="flex-1 max-w-7xl mx-auto px-6 py-12 text-left">
        <div className="p-6 bg-red-600/10 border-4 border-red-500 text-red-500 rounded-none flex items-start gap-4">
          <AlertCircle className="w-8 h-8 shrink-0" />
          <div>
            <h3 className="font-extrabold text-xl uppercase">SCRAPBOOK ERROR</h3>
            <p className="text-sm mt-1">{profileError?.message || 'USER DOSSIER NOT RETRIEVED.'}</p>
          </div>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser.id === profileUser.id;
  
  // Calculate simulated "Hours Wasted" (2 hours per watch log + 0.5 hours per rant)
  const hoursWasted = Math.max(0, ((stats.diary || 0) * 2) + ((stats.reviews || 0) * 0.5));

  // Determine top 4 films to showcase in polaroids (use first 4 items in watchlist/diary)
  const top4MovieIds = watchlist.length > 0 
    ? watchlist.slice(0, 4).map(w => w.tmdb_movie_id)
    : diary.slice(0, 4).map(d => d.tmdb_movie_id);

  // Rotation angles for top polaroids
  const rotations = [-6, 3, -2, 5];

  return (
    <div className="flex-1 max-w-7xl mx-auto px-6 md:px-12 py-12 text-left font-mono">
      
      {/* Scrapbook Header Info Panel */}
      <div className="brutal-border p-6 md:p-8 mb-12 flex flex-col lg:flex-row items-center lg:items-start gap-8">
        
        {/* Oversized square flip phone avatar */}
        <div className="shrink-0 w-32 h-32 brutal-border rounded-none overflow-hidden bg-black">
          <img
            src={profileUser.avatar_url}
            alt={profileUser.username}
            className="w-full h-full object-cover dithered-avatar"
          />
        </div>
        
        {/* Bio information */}
        <div className="flex-1 text-center lg:text-left space-y-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">@{profileUser.username}</h1>
            <p className="text-[10px] text-brand-text-muted mt-1 uppercase">JOINED PLOTHOLE DATABASE: {new Date(profileUser.created_at).toLocaleDateString()}</p>
          </div>
          <p className="text-xs text-brand-text max-w-xl leading-relaxed uppercase border-l-3 border-brutal-pink pl-4">
            {profileUser.bio}
          </p>
          
          {/* Follow Actions */}
          {!isOwnProfile && currentUser && (
            <button
              onClick={() => followMutation.mutate()}
              disabled={followMutation.isPending}
              className={`px-6 py-2 border-3 font-extrabold text-xs uppercase shadow-[4px_4px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all ${
                isFollowing
                  ? 'bg-black border-brutal-pink text-brutal-pink'
                  : 'bg-brutal-yellow border-white text-black'
              }`}
            >
              {isFollowing ? 'Unfollow Target' : 'Follow Target'}
            </button>
          )}
        </div>

        {/* THICK BLACK BORDERED UNSTYLED HTML TABLE FOR STATS */}
        <div className="w-full lg:w-auto shrink-0 select-none overflow-x-auto">
          <table className="border-4 border-white text-xs uppercase w-full lg:w-auto">
            <thead>
              <tr className="bg-white text-black font-black border-b-4 border-white">
                <th className="px-4 py-2 text-center border-r-2 border-white">Hours Wasted</th>
                <th className="px-4 py-2 text-center border-r-2 border-white">Films Slammed</th>
                <th className="px-4 py-2 text-center border-r-2 border-white">Rants</th>
                <th className="px-4 py-2 text-center border-r-2 border-white">Followers</th>
                <th className="px-4 py-2 text-center">Following</th>
              </tr>
            </thead>
            <tbody>
              <tr className="font-extrabold text-center bg-black text-white">
                <td className="px-4 py-3 border-r-2 border-brand-border text-lg text-brutal-cyan">{hoursWasted.toFixed(1)}</td>
                <td className="px-4 py-3 border-r-2 border-brand-border text-lg">{stats.diary}</td>
                <td className="px-4 py-3 border-r-2 border-brand-border text-lg text-brutal-pink">{stats.reviews}</td>
                <td className="px-4 py-3 border-r-2 border-brand-border text-lg">{stats.followers}</td>
                <td className="px-4 py-3 text-lg">{stats.following}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* TOP 4 FAVORITES TAPED POLAROID SCRAPBOOK DISPLAY */}
      {top4MovieIds.length > 0 && (
        <div className="mb-16">
          <h3 className="text-sm font-black uppercase text-black bg-white px-3 py-1.5 border-2 border-black w-fit mb-8 shadow-[4px_4px_0px_rgba(255,255,255,1)]">
            Pinned Reel Discoveries
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 px-4">
            {top4MovieIds.map((mId, idx) => (
              <PolaroidCard 
                key={mId} 
                movieId={mId} 
                angle={rotations[idx % rotations.length]} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Tabs Selector */}
      <div className="flex border-b-4 border-white mb-8 select-none">
        <button
          onClick={() => setActiveTab('diary')}
          className={`px-6 py-3 font-black text-xs uppercase border-t-3 border-l-3 border-r-3 -mb-[4px] z-10 transition-all ${
            activeTab === 'diary'
              ? 'bg-brutal-cyan text-black border-white'
              : 'bg-black text-brand-text-muted border-brand-border/40 hover:text-white'
          }`}
        >
          Diary timeline
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-6 py-3 font-black text-xs uppercase border-t-3 border-l-3 border-r-3 -mb-[4px] z-10 transition-all ${
            activeTab === 'reviews'
              ? 'bg-brutal-pink text-black border-white'
              : 'bg-black text-brand-text-muted border-brand-border/40 hover:text-white'
          }`}
        >
          Rants log ({reviews.length})
        </button>
        {isOwnProfile && (
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`px-6 py-3 font-black text-xs uppercase border-t-3 border-l-3 border-r-3 -mb-[4px] z-10 transition-all ${
              activeTab === 'watchlist'
                ? 'bg-brutal-blue text-white border-white'
                : 'bg-black text-brand-text-muted border-brand-border/40 hover:text-white'
            }`}
          >
            Watchlist ({watchlist.length})
          </button>
        )}
      </div>

      {/* Tab Contents */}
      <div>
        {activeTab === 'diary' && (
          <div>
            {diaryLoading ? (
              <div className="p-12 text-center text-xs animate-pulse">LOADING DIARY TIMELINE...</div>
            ) : diary.length === 0 ? (
              <div className="brutal-border p-8 text-center text-brand-text-muted uppercase text-xs">
                Timeline is currently empty.
              </div>
            ) : (
              <div className="border-4 border-white overflow-hidden shadow-[6px_6px_0px_#000]">
                <table className="w-full text-xs uppercase text-left border-collapse">
                  <thead>
                    <tr className="bg-white text-black font-black border-b-2 border-white">
                      <th className="px-6 py-3">Watched Date</th>
                      <th className="px-6 py-3">Movie Reference</th>
                      <th className="px-6 py-3">Verdict</th>
                      <th className="px-6 py-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white bg-black">
                    {diary.map((entry) => (
                      <tr key={entry.id} className="hover:bg-brand-card-hover transition-colors">
                        <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-brand-cyan" />
                          <span>{entry.watched_date}</span>
                        </td>
                        <td className="px-6 py-4">
                          <Link to={`/movies/${entry.tmdb_movie_id}`} className="hover:underline font-black text-brand-cyan">
                            Film #{entry.tmdb_movie_id}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <RatingBadge rating={entry.rating} />
                        </td>
                        <td className="px-6 py-4 text-brand-text max-w-xs truncate" title={entry.review_text}>
                          {entry.review_text || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            {reviewsLoading ? (
              <div className="p-12 text-center text-xs animate-pulse">LOADING USER RANTS...</div>
            ) : reviews.length === 0 ? (
              <div className="brutal-border p-8 text-center text-brand-text-muted uppercase text-xs">
                No user rants written yet.
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((rev) => (
                  <div key={rev.id} className="brutal-border p-6 text-left relative">
                    <div className="flex items-center gap-4 mb-4 border-b border-white/20 pb-3">
                      <Link to={`/movies/${rev.tmdb_movie_id}`} className="font-black text-white hover:underline text-sm">
                        Film Reference: #{rev.tmdb_movie_id}
                      </Link>
                      <div className="ml-auto">
                        <RatingBadge rating={rev.rating} />
                      </div>
                    </div>
                    <p className="text-xs text-brand-text leading-relaxed whitespace-pre-wrap font-mono uppercase bg-black border border-brand-border/20 p-4">
                      {rev.review_text}
                    </p>
                    <span className="block text-[9px] text-brand-text-muted mt-3 font-bold">
                      SLAMMING DATE: {new Date(rev.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'watchlist' && isOwnProfile && (
          <div>
            {watchlistLoading ? (
              <div className="p-12 text-center text-xs animate-pulse">LOADING WATCHLIST POSTERS...</div>
            ) : watchlist.length === 0 ? (
              <div className="brutal-border p-8 text-center text-brand-text-muted uppercase text-xs">
                Your watchlist is currently empty.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6">
                {watchlist.map((item) => (
                  <WatchlistCard key={item.tmdb_movie_id} movieId={item.tmdb_movie_id} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
