import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, AlertCircle, Camera, Edit3, X, Download, Award, Star, Film, Clock, Heart, FolderPlus, Bookmark, Eye, MessageSquare, Sparkles } from 'lucide-react';
import { API_URL, getAuthHeaders, getPosterUrl } from '../config';
import { useAuth } from '../context/AuthContext';
import RatingBadge from '../components/RatingBadge';
import Avatar from '../components/Avatar';
import GlassSurface from '../components/GlassSurface';

function PolaroidCard({ movieId, angle, initialMovie }) {
  const { data: movie } = useQuery({
    queryKey: ['movieDetails', movieId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/movies/${movieId}`);
      if (!res.ok) throw new Error('Not found');
      return res.json();
    },
    initialData: initialMovie,
    staleTime: 10 * 60 * 1000
  });

  if (!movie) return <div className="aspect-[3/4] bg-white/5 rounded-xl border border-white/8 skeleton-shimmer" />;

  return (
    <div
      className="polaroid-container relative transform transition-transform hover:scale-105 duration-300 select-none cursor-pointer"
      style={{ transform: `rotate(${angle}deg)` }}
    >
      <Link to={`/media/${movie.media_type || 'movie'}/${movie.id}`}>
        <div className="aspect-square w-full overflow-hidden rounded-lg border border-white/10 mb-2.5 bg-black shadow-inner">
          <img
            src={getPosterUrl(movie.poster_path, 'w300')}
            alt={movie.title || movie.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <p className="font-display text-[11px] font-bold text-slate-200 truncate text-center">
          {movie.title || movie.name}
        </p>
      </Link>
    </div>
  );
}

function WatchlistCard({ movieId, initialMovie }) {
  const { data: movie } = useQuery({
    queryKey: ['movieDetails', movieId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/movies/${movieId}`);
      if (!res.ok) throw new Error('Not found');
      return res.json();
    },
    initialData: initialMovie,
    staleTime: 10 * 60 * 1000
  });

  if (!movie) return <div className="aspect-[2/3] bg-white/5 rounded-2xl border border-white/8 skeleton-shimmer" />;

  return (
    <Link 
      to={`/media/${movie.media_type || 'movie'}/${movie.id}`} 
      className="group relative block rounded-2xl overflow-hidden bg-[#080c14] border border-white/8 hover:border-[#00f5a0]/40 transition-all hover:-translate-y-1 shadow-lg"
    >
      <div className="aspect-[2/3] w-full">
        <img
          src={getPosterUrl(movie.poster_path, 'w300')}
          alt={movie.title || movie.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-2.5 bg-gradient-to-t from-black via-black/80 to-transparent">
        <p className="text-[11px] font-bold text-slate-200 truncate">{movie.title || movie.name}</p>
      </div>
    </Link>
  );
}

function DiaryMobileCard({ entry }) {
  const { data: movie } = useQuery({
    queryKey: ['movieDetailsSimple', entry.tmdb_movie_id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/movies/${entry.tmdb_movie_id}`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 1000 * 60 * 10
  });

  const title = movie?.title || movie?.name || `Film #${entry.tmdb_movie_id}`;
  const mediaType = movie?.media_type || entry.media_type || 'movie';

  return (
    <div className="p-4 rounded-2xl border border-white/8 bg-[#080c14] shadow-md space-y-3">
      <div className="flex items-center gap-3">
        <Link to={`/media/${mediaType}/${entry.tmdb_movie_id}`} className="shrink-0 w-14 h-20 rounded-xl overflow-hidden border border-white/10 bg-black shadow">
          <img
            src={getPosterUrl(movie?.poster_path, 'w185')}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </Link>
        <div className="flex-1 min-w-0 space-y-1.5">
          <Link to={`/media/${mediaType}/${entry.tmdb_movie_id}`} className="font-display font-bold text-sm text-slate-100 hover:text-[#00f5a0] block truncate">
            {title}
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <RatingBadge rating={entry.rating} size="xs" />
            <span className="font-mono text-[10px] text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#00f5a0]" />
              {entry.watched_date}
            </span>
          </div>
        </div>
      </div>

      {entry.review_text && (
        <p className="text-xs text-slate-300 italic bg-black/40 p-3 rounded-xl border border-white/5 leading-relaxed">
          "{entry.review_text}"
        </p>
      )}
    </div>
  );
}

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser, updateProfile } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('diary');

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

  // Fetch Rating Distribution Histogram
  const { data: ratingsDist = [] } = useQuery({
    queryKey: ['userRatingsDist', username],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/users/profile/${username}/ratings-dist`);
      if (res.ok) return res.json();
      return [];
    },
    enabled: !!profileUser
  });

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

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/social/follow/${profileUser.id}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Action failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', username] });
    }
  });

  // Watchlist query
  const { data: watchlist = [], isLoading: watchlistLoading } = useQuery({
    queryKey: ['userWatchlist', username],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/watchlist/user/${username}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!profileUser
  });

  // Diary query
  const { data: diary = [], isLoading: diaryLoading } = useQuery({
    queryKey: ['userDiary', username],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/watched/user/${username}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!profileUser
  });

  // Unique diary items by movie id
  const uniqueDiary = useMemo(() => {
    const seen = new Set();
    return diary.filter((entry) => {
      if (!entry.tmdb_movie_id || seen.has(entry.tmdb_movie_id)) return false;
      seen.add(entry.tmdb_movie_id);
      return true;
    });
  }, [diary]);

  // Reviews query
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['userReviews', username],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/reviews/user/${username}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!profileUser
  });

  // Custom Lists query
  const { data: userLists = [], isLoading: listsLoading } = useQuery({
    queryKey: ['userCustomLists', username],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/lists/user/${username}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!profileUser
  });

  // Export Diary to CSV
  const handleExportData = () => {
    if (uniqueDiary.length === 0) return;
    const headers = 'ID,TMDB_ID,Watched_Date,Rating,Review\n';
    const rows = uniqueDiary
      .map((d) => `"${d.id}","${d.tmdb_movie_id}","${d.watched_date}","${d.rating || ''}","${(d.review_text || '').replace(/"/g, '""')}"`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${username}_plothole_diary.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (profileLoading) {
    return (
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-20 flex flex-col items-center justify-center text-[#00f5a0] font-mono uppercase space-y-3">
        <div className="w-10 h-10 border-3 border-[#00f5a0] border-t-transparent rounded-full animate-spin mx-auto shadow-[0_0_15px_#00f5a0]" />
        <span className="text-xs tracking-widest font-bold">RETRIEVING PROFILE ARCHIVES...</span>
      </div>
    );
  }

  if (profileError || !profileUser) {
    return (
      <div className="flex-1 max-w-xl mx-auto px-4 py-24 text-center space-y-4 font-mono">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white uppercase">Cinephile Record Not Found</h2>
        <p className="text-xs text-slate-400 font-sans">
          The requested member dossier (@{username}) does not exist in the database.
        </p>
        <Link to="/" className="btn-primary inline-flex py-2 px-6 text-xs font-bold font-mono">
          Return to Discover
        </Link>
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser.id === profileUser.id;
  const hoursWasted = Math.max(0, uniqueDiary.length * 2.1 + (stats?.reviews || 0) * 0.4);

  const topMovieIds =
    watchlist.length > 0
      ? watchlist.slice(0, 6).map((w) => w.tmdb_movie_id)
      : uniqueDiary.slice(0, 6).map((d) => d.tmdb_movie_id);

  const rotations = [-3, 2, -1.5, 2.5, -2, 1.5];

  // Process rating histogram
  const distMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let maxCount = 1;
  ratingsDist.forEach((r) => {
    const star = Math.round(parseFloat(r.rating) || 1);
    distMap[star] = (distMap[star] || 0) + parseInt(r.count || 0);
    if (distMap[star] > maxCount) maxCount = distMap[star];
  });

  // Calculate unlockable badges
  const badges = [
    { title: 'Film Marathoner', icon: Clock, unlocked: uniqueDiary.length >= 5, desc: 'Logged 5+ films' },
    { title: '5-Star Hunter', icon: Star, unlocked: diary.some((d) => d.rating >= 5), desc: 'Rated a film Pure Cinema' },
    { title: 'Zine Critic', icon: Film, unlocked: (stats?.reviews || 0) >= 3, desc: 'Wrote 3+ reviews' },
    { title: 'List Architect', icon: Award, unlocked: userLists.length >= 1, desc: 'Created a custom list' }
  ];

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-6 md:py-10 text-left font-sans space-y-8 md:space-y-10">
      
      {/* ================= PROFILE HEADER BENTO CARD ================= */}
      <div className="border border-white/8 bg-gradient-to-br from-[#080c14] via-[#040810] to-[#020408] p-6 md:p-8 flex flex-col lg:flex-row items-center lg:items-start gap-6 md:gap-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00f5a0]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Avatar */}
        <div className="shrink-0 w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 border-2 border-[#00f5a0]/40 rounded-3xl overflow-hidden bg-black shadow-2xl relative z-10">
          <Avatar username={profileUser.username} url={profileUser.avatar_url} className="w-full h-full" />
        </div>

        {/* User Identity & Stats */}
        <div className="flex-1 text-center lg:text-left space-y-4 w-full relative z-10">
          <div>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 sm:gap-3">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-white">
                {profileUser.display_name || profileUser.username}
              </h1>
              <span className="text-xs font-mono font-bold px-3 py-0.5 rounded-full bg-[#00f5a0]/15 text-[#00f5a0] border border-[#00f5a0]/30 shadow-[0_0_10px_rgba(0,245,160,0.2)]">
                @{profileUser.username}
              </span>
            </div>

            {/* Responsive 4-Stat Metric Pill Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3.5">
              <div className="bg-white/5 border border-white/8 p-3 rounded-2xl text-center">
                <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">Watch Time</span>
                <span className="font-mono font-black text-base text-[#00d4ff]">{hoursWasted.toFixed(0)}h</span>
              </div>
              <div className="bg-white/5 border border-white/8 p-3 rounded-2xl text-center">
                <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">Films</span>
                <span className="font-mono font-black text-base text-[#00f5a0]">{uniqueDiary.length}</span>
              </div>
              <div className="bg-white/5 border border-white/8 p-3 rounded-2xl text-center">
                <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">Reviews</span>
                <span className="font-mono font-black text-base text-[#7affd4]">{stats?.reviews || 0}</span>
              </div>
              <div className="bg-white/5 border border-white/8 p-3 rounded-2xl text-center">
                <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">Followers</span>
                <span className="font-mono font-black text-base text-purple-400">{stats?.followers || 0}</span>
              </div>
            </div>

            <p className="text-[10px] font-mono text-slate-500 mt-2.5">
              MEMBER SINCE {new Date(profileUser.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Bio */}
          <p className="text-xs md:text-sm text-slate-300 max-w-xl leading-relaxed border-l-2 border-[#00f5a0] pl-3.5 italic mx-auto lg:mx-0 text-left">
            "{profileUser.bio || 'Cinephile exploring cinema timelines.'}"
          </p>

          {/* Actions */}
          <div className="flex gap-2.5 flex-wrap justify-center lg:justify-start pt-1">
            {!isOwnProfile && currentUser && (
              <button
                onClick={() => followMutation.mutate()}
                disabled={followMutation.isPending}
                className={isFollowing ? 'btn-secondary text-xs px-5 py-2.5 w-full sm:w-auto' : 'btn-primary text-xs px-5 py-2.5 w-full sm:w-auto font-bold'}
              >
                {isFollowing ? 'Unfollow' : 'Follow Cinephile'}
              </button>
            )}

            {isOwnProfile && (
              <>
                <button onClick={openEditModal} className="btn-primary text-xs px-4 py-2.5 flex items-center justify-center gap-1.5 flex-1 sm:flex-none font-bold shadow-md">
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>

                <button onClick={handleExportData} className="btn-secondary text-xs px-4 py-2.5 flex items-center justify-center gap-1.5 text-[#00f5a0] border-[#00f5a0]/30 flex-1 sm:flex-none">
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Archive</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Rating Distribution Histogram Bento Card */}
        <div className="border border-white/8 bg-black/40 p-4.5 rounded-2xl w-full lg:w-64 space-y-3 shrink-0 shadow-lg relative z-10">
          <span className="text-[11px] font-mono font-bold text-[#00f5a0] uppercase block border-b border-white/8 pb-2 text-center lg:text-left">
            Rating Distribution
          </span>

          <div className="flex items-end justify-between h-24 gap-2 pt-2 px-1">
            {[1, 2, 3, 4, 5].map((star) => {
              const count = distMap[star] || 0;
              const heightPct = Math.max(12, Math.round((count / maxCount) * 100));
              return (
                <div key={star} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div
                    className="w-full bg-gradient-to-t from-[#00d98b] to-[#00f5a0] rounded-t transition-all hover:bg-[#7affd4]"
                    style={{ height: `${heightPct}%` }}
                    title={`${count} films rated ${star} stars`}
                  />
                  <span className="text-[9px] font-mono text-slate-400 font-bold">{star}★</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= CINEPHILE BADGES SHOWCASE ================= */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
          Cinephile Badges & Milestones
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {badges.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className={`p-3.5 border rounded-2xl flex items-center gap-3 transition-all ${
                  b.unlocked
                    ? 'bg-[#080c14] border-[#00f5a0]/30 text-slate-100 shadow-[0_0_15px_rgba(0,245,160,0.15)]'
                    : 'bg-[#04070e] border-white/5 text-slate-500 opacity-40'
                }`}
              >
                <div className={`p-2.5 rounded-xl border shrink-0 ${b.unlocked ? 'bg-[#00f5a0]/15 text-[#00f5a0] border-[#00f5a0]/30' : 'bg-black/30 border-white/5'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-display font-bold text-xs text-slate-100 uppercase truncate">{b.title}</h4>
                  <p className="text-[10px] text-slate-400 truncate">{b.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= PINNED REEL DISCOVERIES ================= */}
      {topMovieIds.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
            Pinned Reel Discoveries
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5 sm:gap-5 pt-1">
            {topMovieIds.map((mId, idx) => (
              <PolaroidCard key={mId} movieId={mId} angle={rotations[idx % rotations.length]} />
            ))}
          </div>
        </div>
      )}

      {/* ================= SLIDING PILL TABS BAR WITH GLASSSURFACE ================= */}
      <GlassSurface
        width="auto"
        height="auto"
        borderRadius={20}
        backgroundOpacity={0.82}
        blur={24}
        borderOpacity={0.16}
        className="p-1 shadow-[0_8px_32px_rgba(0,0,0,0.65),0_0_15px_rgba(0,245,160,0.05)] w-full sm:w-fit"
      >
        <div className="flex select-none overflow-x-auto gap-1.5 scrollbar-none">
          <button
            onClick={() => setActiveTab('diary')}
            className={`px-4 py-2 font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all shrink-0 cursor-pointer ${
              activeTab === 'diary' ? 'bg-gradient-to-r from-[#00f5a0] to-[#00d4ff] text-black shadow-[0_0_12px_rgba(0,245,160,0.4)]' : 'text-slate-400 hover:text-white'
            }`}
          >
            Diary ({uniqueDiary.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all shrink-0 cursor-pointer ${
              activeTab === 'reviews' ? 'bg-gradient-to-r from-[#00f5a0] to-[#00d4ff] text-black shadow-[0_0_12px_rgba(0,245,160,0.4)]' : 'text-slate-400 hover:text-white'
            }`}
          >
            Reviews ({reviews.length})
          </button>
          <button
            onClick={() => setActiveTab('lists')}
            className={`px-4 py-2 font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all shrink-0 cursor-pointer ${
              activeTab === 'lists' ? 'bg-gradient-to-r from-[#00f5a0] to-[#00d4ff] text-black shadow-[0_0_12px_rgba(0,245,160,0.4)]' : 'text-slate-400 hover:text-white'
            }`}
          >
            Lists ({userLists.length})
          </button>
          {isOwnProfile && (
            <button
              onClick={() => setActiveTab('watchlist')}
              className={`px-4 py-2 font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all shrink-0 cursor-pointer ${
                activeTab === 'watchlist' ? 'bg-gradient-to-r from-[#00f5a0] to-[#00d4ff] text-black shadow-[0_0_12px_rgba(0,245,160,0.4)]' : 'text-slate-400 hover:text-white'
              }`}
            >
              Watchlist ({watchlist.length})
            </button>
          )}
        </div>
      </GlassSurface>

      {/* ================= TAB CONTENTS ================= */}
      <div>
        {/* Diary Tab */}
        {activeTab === 'diary' && (
          <div>
            {diaryLoading ? (
              <div className="p-12 text-center text-xs font-mono text-slate-400 animate-pulse">LOADING DIARY TIMELINE...</div>
            ) : uniqueDiary.length === 0 ? (
              <div className="border border-white/8 bg-[#080c14] p-8 rounded-3xl text-center text-slate-400 text-xs font-mono">
                Diary timeline is currently empty.
              </div>
            ) : (
              <>
                {/* Mobile Screen (< md): Rich Responsive Cards */}
                <div className="block md:hidden space-y-3">
                  {uniqueDiary.map((entry) => (
                    <DiaryMobileCard key={entry.id} entry={entry} />
                  ))}
                </div>

                {/* Desktop Screen (>= md): Full Data Table */}
                <div className="hidden md:block border border-white/8 rounded-3xl overflow-hidden shadow-2xl bg-[#080c14]">
                  <table className="w-full text-xs text-left border-collapse font-sans">
                    <thead>
                      <tr className="bg-white/5 text-slate-300 font-mono uppercase text-[11px] border-b border-white/8">
                        <th className="px-6 py-4">Watched Date</th>
                        <th className="px-6 py-4">Movie</th>
                        <th className="px-6 py-4">Rating</th>
                        <th className="px-6 py-4">Review Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {uniqueDiary.map((entry) => (
                        <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-mono text-slate-400 flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-[#00f5a0]" />
                            <span>{entry.watched_date}</span>
                          </td>
                          <td className="px-6 py-4 font-display font-bold text-slate-100">
                            <MovieNameLink movieId={entry.tmdb_movie_id} className="hover:text-[#00f5a0] transition-colors" />
                          </td>
                          <td className="px-6 py-4">
                            <RatingBadge rating={entry.rating} size="xs" />
                          </td>
                          <td className="px-6 py-4 text-slate-400 max-w-xs truncate">{entry.review_text || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div>
            {reviewsLoading ? (
              <div className="p-12 text-center text-xs font-mono text-slate-400 animate-pulse">LOADING USER REVIEWS...</div>
            ) : reviews.length === 0 ? (
              <div className="border border-white/8 bg-[#080c14] p-8 rounded-3xl text-center text-slate-400 text-xs font-mono">
                No user reviews written yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="border border-white/8 bg-[#080c14] hover:border-[#00f5a0]/35 p-5 rounded-2xl space-y-3 shadow-md transition-all">
                    <div className="flex items-center justify-between border-b border-white/8 pb-3 gap-2">
                      <div className="min-w-0">
                        <span className="text-slate-400 text-[10px] font-mono uppercase block">Reviewed Film</span>
                        <MovieNameLink movieId={rev.tmdb_movie_id} className="font-display font-bold text-slate-100 hover:text-[#00f5a0] transition-colors block text-sm truncate" />
                      </div>
                      <RatingBadge rating={rev.rating} size="xs" />
                    </div>
                    {rev.review_text && (
                      <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-sans bg-black/40 border border-white/5 p-3.5 rounded-xl italic">
                        "{rev.review_text}"
                      </p>
                    )}
                    <span className="block text-[10px] font-mono text-slate-500">
                      Reviewed: {new Date(rev.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Custom Lists Tab */}
        {activeTab === 'lists' && (
          <div>
            {listsLoading ? (
              <div className="p-12 text-center text-xs animate-pulse font-mono text-slate-400">LOADING CUSTOM LISTS...</div>
            ) : userLists.length === 0 ? (
              <div className="border border-white/8 bg-[#080c14] p-8 rounded-3xl text-center text-slate-400 text-xs font-mono">
                No custom lists created yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {userLists.map((lst) => (
                  <div key={lst.id} className="border border-white/8 p-5 bg-[#080c14] hover:border-[#00f5a0]/40 rounded-2xl flex flex-col justify-between transition-all shadow-md">
                    <div>
                      <Link to={`/lists/${lst.id}`}>
                        <h3 className="font-display font-bold text-base md:text-lg text-slate-100 hover:text-[#00f5a0] transition-colors">
                          {lst.title}
                        </h3>
                      </Link>
                      {lst.description && (
                        <p className="font-sans text-xs text-slate-400 mt-2 line-clamp-2 italic">
                          "{lst.description}"
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-white/8 font-mono text-xs mt-4">
                      <span className="text-slate-400 text-[11px]">{lst.item_count || 0} Titles</span>
                      <Link to={`/lists/${lst.id}`} className="text-[#00f5a0] hover:underline font-bold uppercase text-[11px]">
                        View List →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Watchlist Tab */}
        {activeTab === 'watchlist' && isOwnProfile && (
          <div>
            {watchlistLoading ? (
              <div className="p-12 text-center text-xs animate-pulse font-mono text-slate-400">LOADING WATCHLIST POSTERS...</div>
            ) : watchlist.length === 0 ? (
              <div className="border border-white/8 bg-[#080c14] p-8 rounded-3xl text-center text-slate-400 text-xs font-mono">
                Your watchlist is currently empty.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5 sm:gap-4">
                {watchlist.map((item) => (
                  <WatchlistCard key={item.tmdb_movie_id} movieId={item.tmdb_movie_id} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-2xl">
          <div 
            className="w-full max-w-md rounded-3xl overflow-hidden border border-white/12 bg-[#080c14] text-slate-100 shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_30px_rgba(0,245,160,0.15)]"
            style={{ animation: 'fade-up 250ms cubic-bezier(0.22, 1, 0.36, 1) both' }}
          >
            <div className="flex justify-between items-center px-6 py-4 bg-white/5 border-b border-white/8">
              <span className="font-display font-bold text-sm text-slate-100 uppercase tracking-wide">
                Edit Profile Dossier
              </span>
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-5 text-left text-xs">
              {editError && <div className="p-3 bg-rose-500/20 border border-rose-500/40 text-rose-400 rounded-xl">{editError}</div>}

              <div className="flex flex-col items-center gap-3">
                <div className="relative w-20 h-20 rounded-3xl border border-[#00f5a0]/40 bg-black overflow-hidden shadow-lg">
                  <Avatar username={profileUser.username} url={editAvatar} className="w-full h-full" />
                  <label htmlFor="avatar-file-input" className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-5 h-5 text-white" />
                  </label>
                </div>
                <input id="avatar-file-input" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <button type="button" onClick={() => document.getElementById('avatar-file-input').click()} className="btn-secondary px-3.5 py-1.5 text-xs">
                  Change Avatar
                </button>
              </div>

              <div>
                <label className="block font-mono font-bold uppercase tracking-wider text-[11px] text-slate-300 mb-1.5">
                  Personal Biography
                </label>
                <textarea
                  rows={3}
                  maxLength={250}
                  required
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full p-3.5 bg-black/40 border border-white/10 rounded-xl text-slate-100 font-sans text-xs focus:outline-none focus:border-[#00f5a0]/70 leading-relaxed transition-all"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn-secondary px-4 py-2 text-xs">Cancel</button>
                <button type="submit" disabled={isSaving} className="btn-primary px-6 py-2 text-xs font-bold shadow-md">
                  {isSaving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MovieNameLink({ movieId, className = '' }) {
  const { data: movie } = useQuery({
    queryKey: ['movieDetailsSimple', movieId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/movies/${movieId}`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 1000 * 60 * 10
  });

  const title = movie?.title || movie?.name || `Film #${movieId}`;
  const mediaType = movie?.media_type || 'movie';

  return (
    <Link to={`/media/${mediaType}/${movieId}`} className={className}>
      {title}
    </Link>
  );
}
