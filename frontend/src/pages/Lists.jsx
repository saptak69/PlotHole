import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ListPlus, Trash2, Film, Loader2, ArrowLeft, FolderPlus, Layers, Trophy, User } from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Avatar from '../components/Avatar';
import MovieCard from '../components/MovieCard';
import CreateListModal from '../components/CreateListModal';
import GlassSurface from '../components/GlassSurface';

export default function ListsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  // Fetch single list details
  const { data: listDetails, isLoading: listLoading } = useQuery({
    queryKey: ['singleList', id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/lists/${id}`);
      if (!res.ok) throw new Error('List not found');
      return res.json();
    },
    enabled: !!id
  });

  // Fetch current user lists
  const { data: userLists = [], isLoading: userListsLoading } = useQuery({
    queryKey: ['currentUserLists', user?.username],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/lists/user/${user.username}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !id && !!user?.username
  });

  const deleteListMutation = useMutation({
    mutationFn: async (listId) => {
      const token = localStorage.getItem('plothole_token');
      const res = await fetch(`${API_URL}/lists/${listId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete list');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserLists', user?.username] });
      queryClient.invalidateQueries({ queryKey: ['userLists', user?.username] });
      addToast('List deleted', 'info');
    },
    onError: () => {
      addToast('Failed to delete list', 'error');
    }
  });

  const removeItemMutation = useMutation({
    mutationFn: async ({ listId, movieId }) => {
      const token = localStorage.getItem('plothole_token');
      const res = await fetch(`${API_URL}/lists/${listId}/items/${movieId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to remove item');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['singleList', id] });
      addToast('Movie removed from list', 'info');
    },
    onError: () => {
      addToast('Failed to remove item', 'error');
    }
  });

  const handleDeleteList = (listId) => {
    if (!window.confirm('Are you sure you want to delete this list?')) return;
    deleteListMutation.mutate(listId);
  };

  const handleRemoveItem = (listId, movieId) => {
    removeItemMutation.mutate({ listId, movieId });
  };

  const loading = id ? listLoading : userListsLoading;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-20 text-[#e50914] font-mono text-xs space-y-3">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="tracking-widest uppercase font-bold">Loading Cinema Lists...</span>
      </div>
    );
  }

  // Single List View
  if (id && listDetails) {
    return (
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 md:px-12 py-6 md:py-10 space-y-6 md:space-y-8 text-left font-sans pb-32 sm:pb-24">
        <Link
          to={user ? `/profile/${listDetails.username}` : '/lists'}
          className="inline-flex items-center gap-2 font-mono text-xs font-bold text-slate-400 hover:text-[#ff2e3b] transition-colors uppercase"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Profile</span>
        </Link>

        {/* List Header with Transparent Liquid GlassSurface */}
        <GlassSurface
          width="100%"
          height="auto"
          borderRadius={24}
          backgroundOpacity={0.35}
          blur={12}
          borderOpacity={0.12}
          className="shadow-[0_12px_36px_rgba(0,0,0,0.7),0_0_20px_rgba(229,9,20,0.04)]"
        >
          <div className="p-6 md:p-8 space-y-4 w-full text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#e50914]/15 text-[#ff4d5a] font-mono text-[10px] font-black uppercase border border-[#e50914]/30 shadow-[0_0_10px_rgba(229,9,20,0.2)] tracking-widest">
                    Curated Collection
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-300 bg-black/40 px-2.5 py-0.5 rounded-full border border-white/10">
                    {listDetails.items?.length || 0} Titles
                  </span>
                </div>
                <h1 className="font-display font-black text-2xl sm:text-3xl md:text-5xl uppercase tracking-tight text-white">
                  {listDetails.title}
                </h1>
                <div className="flex items-center gap-3 mt-2.5 font-mono text-xs text-slate-300">
                  <Link
                    to={`/profile/${listDetails.username}`}
                    className="flex items-center gap-2 hover:text-[#ff2e3b] transition-colors"
                  >
                    <Avatar username={listDetails.username} url={listDetails.avatar_url} className="w-6 h-6 border border-white/20" />
                    <span className="font-bold text-slate-100">@{listDetails.username}</span>
                  </Link>
                </div>
              </div>

              {user && user.id === listDetails.user_id && (
                <button
                  onClick={() => handleDeleteList(listDetails.id)}
                  className="btn-danger py-2 px-4 text-xs inline-flex items-center gap-2 self-start md:self-auto shadow-md font-bold font-display uppercase tracking-wider"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete List</span>
                </button>
              )}
            </div>

            {listDetails.description && (
              <p className="font-sans text-xs sm:text-sm text-slate-100 font-medium italic bg-black/40 p-4 rounded-2xl border border-white/5 leading-relaxed relative z-10">
                "{listDetails.description}"
              </p>
            )}
          </div>
        </GlassSurface>

        {/* List Items Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/8 pb-3">
            <h2 className="font-display font-bold text-lg sm:text-2xl text-slate-100 flex items-center gap-2">
              <Film className="w-5 h-5 text-[#e50914]" />
              <span>Films in this Collection ({listDetails.items?.length || 0})</span>
            </h2>
            <span className="text-xs font-mono text-slate-500">Ranked by Curator</span>
          </div>

          {!listDetails.items || listDetails.items.length === 0 ? (
            <div className="border border-white/8 bg-[#121216] p-12 rounded-3xl text-center text-slate-400 font-mono text-xs space-y-2">
              <Film className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-300 font-semibold text-sm">No films added to this list yet.</p>
              <p className="text-slate-500">Browse cinema titles and click "Add to List" to build this collection!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4 md:gap-5">
              {listDetails.items.map((item) => (
                <div key={item.tmdb_movie_id} className="relative group">
                  <MovieCard
                    movie={{
                      id: item.tmdb_movie_id,
                      media_type: item.media_type,
                      title: item.title,
                      name: item.title,
                      poster_path: item.poster_path,
                      release_date: item.release_date
                    }}
                  />
                  {user && user.id === listDetails.user_id && (
                    <button
                      onClick={() => handleRemoveItem(listDetails.id, item.tmdb_movie_id)}
                      className="absolute top-2 right-2 z-20 bg-rose-600/90 text-white p-1.5 rounded-lg opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 shadow-lg cursor-pointer"
                      title="Remove from list"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // General Lists Overview
  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 md:px-12 py-6 md:py-10 space-y-6 md:space-y-8 text-left font-sans pb-32 sm:pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/8 pb-5">
        <div>
          <h1 className="font-display font-extrabold text-xl sm:text-2xl md:text-4xl text-white flex items-center gap-2.5">
            <FolderPlus className="w-6 h-6 sm:w-7 sm:h-7 text-[#e50914]" />
            <span>Custom Cinema Lists</span>
          </h1>
          <p className="font-mono text-xs text-slate-400 mt-1">
            Curate, organize, and share themed film & TV collections
          </p>
        </div>

        {user && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary py-2.5 px-5 text-xs flex items-center justify-center gap-2 self-start sm:self-auto font-bold shadow-md cursor-pointer"
          >
            <ListPlus className="w-4 h-4" />
            <span>Create New List</span>
          </button>
        )}
      </div>

      {/* Symmetrical Lists Filter Rail with GlassSurface */}
      <GlassSurface
        width="auto"
        height="auto"
        borderRadius={20}
        backgroundOpacity={0.05}
        blur={12}
        borderOpacity={0.12}
        className="p-1 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_15px_rgba(229,9,20,0.04)] w-full sm:w-fit"
      >
        <div className="flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none select-none">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 text-xs font-display font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeFilter === 'all'
                ? 'bg-gradient-to-r from-[#e50914] to-[#ff2e3b] text-white shadow-[0_0_15px_rgba(229,9,20,0.4)]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>All Collections ({userLists.length})</span>
          </button>

          <button
            onClick={() => setActiveFilter('myLists')}
            className={`px-4 py-2 text-xs font-display font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeFilter === 'myLists'
                ? 'bg-gradient-to-r from-[#e50914] to-[#ff2e3b] text-white shadow-[0_0_15px_rgba(229,9,20,0.4)]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>My Collections</span>
          </button>

          <button
            onClick={() => setActiveFilter('curated')}
            className={`px-4 py-2 text-xs font-display font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeFilter === 'curated'
                ? 'bg-gradient-to-r from-[#e50914] to-[#ff2e3b] text-white shadow-[0_0_15px_rgba(229,9,20,0.4)]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Hall of Fame Picks</span>
          </button>
        </div>
      </GlassSurface>

      {!user ? (
        <div className="border border-white/8 bg-[#121216] p-8 sm:p-12 rounded-3xl text-center space-y-4 shadow-xl">
          <Layers className="w-10 h-10 sm:w-12 sm:h-12 text-[#e50914] mx-auto" />
          <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-100">Sign In to Build Your Lists</h2>
          <p className="font-sans text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
            Create custom ranked movie lists, marathon watchlists, and favorite director picks to showcase on your profile.
          </p>
          <Link to="/login" className="btn-primary inline-block py-2.5 px-6 text-xs font-bold">
            Sign In Now
          </Link>
        </div>
      ) : userLists.length === 0 ? (
        <div className="border border-white/8 bg-[#121216] p-8 sm:p-12 rounded-3xl text-center space-y-4 shadow-xl">
          <FolderPlus className="w-10 h-10 sm:w-12 sm:h-12 text-[#e50914] mx-auto" />
          <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-100">You Have No Custom Lists Yet</h2>
          <p className="font-sans text-xs text-slate-300 max-w-md mx-auto">
            Start curating your cinephile collections right now!
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary py-2.5 px-6 text-xs font-bold"
          >
            Create Your First List
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {userLists.map((lst) => (
            <div
              key={lst.id}
              className="border border-white/8 p-5 sm:p-6 space-y-4 bg-[#121216] hover:bg-[#1a1a22] hover:border-[#e50914]/35 rounded-2xl flex flex-col justify-between transition-all shadow-lg hover:-translate-y-1"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#e50914]/10 text-[#ff4d5a] border border-[#e50914]/20 text-[10px] font-mono font-bold uppercase">
                    Collection
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {lst.item_count || 0} Titles
                  </span>
                </div>

                <Link to={`/lists/${lst.id}`}>
                  <h3 className="font-display font-bold text-lg sm:text-xl text-slate-100 hover:text-[#ff2e3b] transition-colors line-clamp-1">
                    {lst.title}
                  </h3>
                </Link>

                {lst.description && (
                  <p className="font-sans text-xs text-slate-400 mt-2 line-clamp-2 italic leading-relaxed">
                    "{lst.description}"
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/8 font-mono text-xs">
                <Link
                  to={`/lists/${lst.id}`}
                  className="text-[#e50914] hover:text-[#ff2e3b] font-bold text-xs uppercase flex items-center gap-1"
                >
                  <span>Explore List</span>
                  <span>→</span>
                </Link>
                <button
                  onClick={() => handleDeleteList(lst.id)}
                  className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all cursor-pointer"
                  title="Delete list"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateListModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onListCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['currentUserLists', user?.username] });
          queryClient.invalidateQueries({ queryKey: ['userLists', user?.username] });
        }}
      />
    </div>
  );
}
