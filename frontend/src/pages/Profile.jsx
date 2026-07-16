import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, AlertCircle, Camera, Edit3, X } from 'lucide-react';
import { API_URL, getAuthHeaders, getPosterUrl } from '../config';
import { useAuth } from '../context/AuthContext';
import RatingBadge from '../components/RatingBadge';
import Avatar from '../components/Avatar';

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
  const { user: currentUser, updateProfile } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('diary');

  // Edit profile states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editError, setEditError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  const openEditModal = () => {
    setEditBio(profileUser?.bio || '');
    setEditAvatar(profileUser?.avatar_url || '');
    setEditError('');
    setIsEditModalOpen(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setEditError('Image size should be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setEditError('');
    try {
      await updateProfile(editBio, editAvatar);
      queryClient.invalidateQueries({ queryKey: ['userProfile', username] });
      setIsEditModalOpen(false);
    } catch (err) {
      console.error(err);
      setEditError(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

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

  // Determine top 6 films to showcase in polaroids (use first 6 items in watchlist/diary)
  const topMovieIds = watchlist.length > 0 
    ? watchlist.slice(0, 6).map(w => w.tmdb_movie_id)
    : diary.slice(0, 6).map(d => d.tmdb_movie_id);

  // Rotation angles for top polaroids
  const rotations = [-3, 2, -1, 3, -2, 1];
 
  return (
    <div className="flex-1 max-w-7xl mx-auto px-6 md:px-12 py-12 text-left font-mono">
      
      {/* Scrapbook Header Info Panel */}
      <div className="brutal-border p-6 md:p-8 mb-12 flex flex-col lg:flex-row items-center lg:items-start gap-8">
        
        {/* Oversized square flip phone avatar */}
        <div className="shrink-0 w-32 h-32 brutal-border rounded-none overflow-hidden bg-black">
          <Avatar
            username={profileUser.username}
            url={profileUser.avatar_url}
            className="w-full h-full"
          />
        </div>
        
        {/* Bio information */}
        <div className="flex-1 text-center lg:text-left space-y-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">@{profileUser.username}</h1>
            
            {/* Inline Stats Line */}
            <p className="text-sm text-brutal-cyan font-black mt-2 uppercase tracking-wide">
              {hoursWasted.toFixed(0)}h wasted • {stats.diary} films logged • {stats.reviews} reviews • {stats.followers} followers • {stats.following} following
            </p>
            
            <p className="text-xs text-brand-text-muted mt-1 uppercase">JOINED DATABASE: {new Date(profileUser.created_at).toLocaleDateString()}</p>
          </div>
          <p className="text-sm md:text-base text-brand-text max-w-xl leading-relaxed uppercase border-l-3 border-brutal-pink pl-4">
            {profileUser.bio}
          </p>
          
          {/* Follow Actions */}
          {!isOwnProfile && currentUser && (
            <button
              onClick={() => followMutation.mutate()}
              disabled={followMutation.isPending}
              className={`px-6 py-2.5 border-3 font-extrabold text-xs uppercase shadow-[4px_4px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all ${
                isFollowing
                  ? 'bg-black border-brutal-pink text-brutal-pink'
                  : 'bg-brutal-yellow border-white text-black'
              }`}
            >
              {isFollowing ? 'Unfollow Target' : 'Follow Target'}
            </button>
          )}

          {isOwnProfile && (
            <button
              onClick={openEditModal}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-brutal-cyan to-blue-600 border-none text-black font-extrabold text-xs uppercase rounded-xl shadow-lg hover:shadow-brutal-cyan/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
 
        {/* Softer Detailed Dashboard Grid for Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 border-2 border-white/25 w-full lg:w-auto font-mono text-center select-none shrink-0 overflow-hidden shadow-[4px_4px_0px_#000]">
          <div className="p-3 border-r border-b border-white/20 md:border-b-0 bg-brand-card">
            <span className="block text-brand-text-muted text-xs mb-1 uppercase font-bold">Hrs Wasted</span>
            <span className="text-base md:text-lg font-black text-brutal-cyan">{hoursWasted.toFixed(1)}</span>
          </div>
          <div className="p-3 border-b border-white/20 md:border-r md:border-b-0 bg-brand-card">
            <span className="block text-brand-text-muted text-xs mb-1 uppercase font-bold">Logged</span>
            <span className="text-base md:text-lg font-black text-white">{stats.diary}</span>
          </div>
          <div className="p-3 border-r border-b border-white/20 md:border-b-0 bg-brand-card">
            <span className="block text-brand-text-muted text-xs mb-1 uppercase font-bold">Reviews</span>
            <span className="text-base md:text-lg font-black text-brutal-pink">{stats.reviews}</span>
          </div>
          <div className="p-3 border-b border-b-white/20 md:border-b-0 md:border-r bg-brand-card">
            <span className="block text-brand-text-muted text-xs mb-1 uppercase font-bold">Followers</span>
            <span className="text-base md:text-lg font-black text-white">{stats.followers}</span>
          </div>
          <div className="p-3 bg-brand-card col-span-2 md:col-span-1">
            <span className="block text-brand-text-muted text-xs mb-1 uppercase font-bold">Following</span>
            <span className="text-base md:text-lg font-black text-white">{stats.following}</span>
          </div>
        </div>
      </div>

      {/* TOP 6 FAVORITES TAPED POLAROID DISPLAY */}
      {topMovieIds.length > 0 && (
        <div className="mb-16">
          <h3 className="text-sm font-black uppercase text-black bg-white px-3 py-1.5 border-2 border-black w-fit mb-8 shadow-[4px_4px_0px_rgba(255,255,255,1)]">
            Pinned Reel Discoveries
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 px-4">
            {topMovieIds.map((mId, idx) => (
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
      <div className="flex border-b-2 border-white/20 mb-8 select-none">
        <button
          onClick={() => setActiveTab('diary')}
          className={`px-6 py-3 font-black text-sm uppercase border-t-2 border-l-2 border-r-2 -mb-[2px] z-10 transition-all ${
            activeTab === 'diary'
              ? 'bg-brutal-cyan text-black border-white/25'
              : 'bg-black text-brand-text-muted border-white/10 hover:text-white'
          }`}
        >
          Diary timeline
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-6 py-3 font-black text-sm uppercase border-t-2 border-l-2 border-r-2 -mb-[2px] z-10 transition-all ${
            activeTab === 'reviews'
              ? 'bg-brutal-pink text-black border-white/25'
              : 'bg-black text-brand-text-muted border-white/10 hover:text-white'
          }`}
        >
          Reviews log ({reviews.length})
        </button>
        {isOwnProfile && (
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`px-6 py-3 font-black text-sm uppercase border-t-2 border-l-2 border-r-2 -mb-[2px] z-10 transition-all ${
              activeTab === 'watchlist'
                ? 'bg-brutal-blue text-white border-white/25'
                : 'bg-black text-brand-text-muted border-white/10 hover:text-white'
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
              <div className="p-12 text-center text-sm animate-pulse">LOADING DIARY TIMELINE...</div>
            ) : diary.length === 0 ? (
              <div className="brutal-border p-8 text-center text-brand-text-muted uppercase text-sm font-bold">
                Timeline is currently empty.
              </div>
            ) : (
              <>
                {/* Mobile View: List of Log Cards */}
                <div className="block md:hidden space-y-4">
                  {diary.map((entry) => (
                    <div key={entry.id} className="brutal-border p-4 bg-brand-card space-y-3">
                      <div className="flex justify-between items-center border-b border-white/10 pb-2">
                        <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                          <Calendar className="w-4 h-4 text-brutal-cyan" />
                          {entry.watched_date}
                        </span>
                        <RatingBadge rating={entry.rating} />
                      </div>
                      <div className="text-sm">
                        <span className="text-brand-text-muted uppercase">Film Reference: </span>
                        <Link to={`/movies/${entry.tmdb_movie_id}`} className="font-black text-brutal-cyan hover:underline">
                          #{entry.tmdb_movie_id}
                        </Link>
                      </div>
                      {entry.review_text && (
                        <p className="text-sm text-brand-text leading-relaxed bg-black/40 p-3 rounded-lg border border-white/5 uppercase">
                          {entry.review_text}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden md:block border border-white/10 rounded-2xl overflow-hidden shadow-2xl bg-black/25">
                  <table className="w-full text-sm uppercase text-left border-collapse">
                    <thead>
                      <tr className="bg-brand-card text-white font-black border-b border-white/10">
                        <th className="px-6 py-3">Watched Date</th>
                        <th className="px-6 py-3">Movie Reference</th>
                        <th className="px-6 py-3">Verdict</th>
                        <th className="px-6 py-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 bg-[#07090e]/40">
                      {diary.map((entry) => (
                        <tr key={entry.id} className="hover:bg-brand-card-hover transition-colors">
                          <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-brutal-cyan" />
                            <span>{entry.watched_date}</span>
                          </td>
                          <td className="px-6 py-4">
                            <Link to={`/movies/${entry.tmdb_movie_id}`} className="hover:underline font-black text-brutal-cyan">
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
              </>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            {reviewsLoading ? (
              <div className="p-12 text-center text-sm animate-pulse">LOADING USER REVIEWS...</div>
            ) : reviews.length === 0 ? (
              <div className="brutal-border p-8 text-center text-brand-text-muted uppercase text-sm font-bold">
                No user reviews written yet.
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((rev) => (
                  <div key={rev.id} className="brutal-border p-6 text-left relative">
                    <div className="flex items-center gap-4 mb-4 border-b border-white/10 pb-3">
                      <Link to={`/movies/${rev.tmdb_movie_id}`} className="font-black text-white hover:underline text-sm">
                        Film Reference: #{rev.tmdb_movie_id}
                      </Link>
                      <div className="ml-auto">
                        <RatingBadge rating={rev.rating} />
                      </div>
                    </div>
                    <p className="text-sm md:text-base text-brand-text leading-relaxed whitespace-pre-wrap font-mono uppercase bg-black border border-brand-border/10 p-4">
                      {rev.review_text}
                    </p>
                    <span className="block text-xs text-brand-text-muted mt-3 font-bold">
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
              <div className="p-12 text-center text-sm animate-pulse">LOADING WATCHLIST POSTERS...</div>
            ) : watchlist.length === 0 ? (
              <div className="brutal-border p-8 text-center text-brand-text-muted uppercase text-sm font-bold">
                Your watchlist is currently empty.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {watchlist.map((item) => (
                  <WatchlistCard key={item.tmdb_movie_id} movieId={item.tmdb_movie_id} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Profile Glassmorphic Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="win95-notepad w-full max-w-md animate-in zoom-in-95 duration-150">
            <div className="win95-titlebar font-sans">
              <span>Edit_Profile.docket - Config</span>
              <button onClick={() => setIsEditModalOpen(false)} className="win95-btn">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-6 font-mono">
              {editError && (
                <div className="p-3 border border-red-600 bg-red-600/10 text-red-500 rounded-lg text-xs uppercase">
                  [SYSTEM ERROR]: {editError}
                </div>
              )}

              {/* Avatar Upload Container */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 bg-black group/avatar shadow-lg">
                  <Avatar
                    username={profileUser.username}
                    url={editAvatar}
                    className="w-full h-full"
                  />
                  <label 
                    htmlFor="avatar-file-input"
                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Camera className="w-6 h-6 text-white" />
                  </label>
                </div>
                <input
                  id="avatar-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('avatar-file-input').click()}
                  className="text-xs font-bold bg-white/5 border border-white/10 hover:bg-white/10 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  Change Photo
                </button>
              </div>

              {/* Bio Text Area */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase text-brand-text-muted">
                  Personal Biography
                </label>
                <textarea
                  rows={4}
                  maxLength={250}
                  required
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="win95-textarea w-full text-white text-sm"
                  placeholder="Enter bio details..."
                />
                <div className="text-right text-[10px] text-brand-text-muted">
                  {editBio.length}/250 chars
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-white/10 hover:bg-white/5 text-white text-xs font-bold rounded-lg transition-colors uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-gradient-to-r from-brutal-cyan to-blue-600 border-none text-black text-xs font-black rounded-lg transition-all hover:shadow-lg uppercase"
                >
                  {isSaving ? 'Saving...' : 'Save Config'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
