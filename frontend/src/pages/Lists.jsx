import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ListPlus, Trash2, Film, Loader2, ArrowLeft, FolderPlus, Sparkles } from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Avatar from '../components/Avatar';
import MovieCard from '../components/MovieCard';
import CreateListModal from '../components/CreateListModal';

export default function ListsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);

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
      <div className="flex-1 flex flex-col items-center justify-center p-20 text-amber-400 font-mono text-xs">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <span>LOADING CINEMA LISTS...</span>
      </div>
    );
  }

  // Single List View
  if (id && listDetails) {
    return (
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 md:px-12 py-6 md:py-10 space-y-6 md:space-y-8 text-left font-sans">
        <Link
          to={user ? `/profile/${listDetails.username}` : '/'}
          className="inline-flex items-center gap-2 font-mono text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors uppercase"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Profile</span>
        </Link>

        {/* List Header */}
        <div className="border border-white/15 bg-[#0e111a]/85 backdrop-blur-2xl p-5 sm:p-6 md:p-8 rounded-2xl shadow-2xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono text-[10px] font-bold uppercase border border-amber-400/30">
                  Custom Collection
                </span>
                <span className="font-mono text-xs text-slate-400">
                  {listDetails.items?.length || 0} Titles
                </span>
              </div>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl md:text-5xl text-white tracking-tight">
                {listDetails.title}
              </h1>
              <div className="flex items-center gap-3 mt-2 font-mono text-xs text-slate-400">
                <Link
                  to={`/profile/${listDetails.username}`}
                  className="flex items-center gap-1.5 hover:text-amber-400 transition-colors"
                >
                  <Avatar username={listDetails.username} url={listDetails.avatar_url} className="w-5 h-5 border border-white/20" />
                  <span>@{listDetails.username}</span>
                </Link>
              </div>
            </div>

            {user && user.id === listDetails.user_id && (
              <button
                onClick={() => handleDeleteList(listDetails.id)}
                className="btn-danger py-2 px-4 text-xs inline-flex items-center gap-2 self-start md:self-auto"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete List</span>
              </button>
            )}
          </div>

          {listDetails.description && (
            <p className="font-sans text-xs sm:text-sm text-slate-300 italic bg-black/40 p-3.5 sm:p-4 rounded-xl border border-white/5 leading-relaxed">
              "{listDetails.description}"
            </p>
          )}
        </div>

        {/* List Items Grid */}
        <div className="space-y-4">
          <h2 className="font-display font-bold text-lg sm:text-2xl text-slate-100 flex items-center gap-2">
            <Film className="w-5 h-5 text-amber-400" />
            <span>Films in this Collection ({listDetails.items?.length || 0})</span>
          </h2>

          {!listDetails.items || listDetails.items.length === 0 ? (
            <div className="border border-white/10 bg-white/5 p-12 rounded-2xl text-center text-slate-400 font-mono text-xs">
              No films added to this list yet. Browse cinema titles and click "Add to List"!
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
                      className="absolute top-2 right-2 z-10 bg-rose-600 text-white p-1.5 rounded-lg opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 shadow-lg cursor-pointer"
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
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 md:px-12 py-6 md:py-10 space-y-6 md:space-y-8 text-left font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl md:text-4xl text-white flex items-center gap-2.5">
            <FolderPlus className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400" />
            <span>Custom Cinema Lists</span>
          </h1>
          <p className="font-mono text-xs text-slate-400 mt-1">
            Curate, organize, and share themed film & TV collections
          </p>
        </div>

        {user && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary py-2.5 px-4 sm:px-5 text-xs flex items-center justify-center gap-2 self-start sm:self-auto font-bold cursor-pointer"
          >
            <ListPlus className="w-4 h-4" />
            <span>Create New List</span>
          </button>
        )}
      </div>

      {!user ? (
        <div className="border border-white/10 bg-[#0e121e] p-8 sm:p-12 rounded-2xl text-center space-y-4 shadow-xl">
          <Film className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400 mx-auto" />
          <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-100">Sign In to Build Your Lists</h2>
          <p className="font-sans text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
            Create custom ranked movie lists, marathon watchlists, and favorite director picks to showcase on your profile.
          </p>
          <Link to="/login" className="btn-primary inline-block py-2.5 px-6 text-xs font-bold">
            Sign In Now
          </Link>
        </div>
      ) : userLists.length === 0 ? (
        <div className="border border-white/10 bg-[#0e121e] p-8 sm:p-12 rounded-2xl text-center space-y-4 shadow-xl">
          <Film className="w-10 h-10 sm:w-12 sm:h-12 text-sky-400 mx-auto" />
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
            <div key={lst.id} className="border border-white/10 p-5 sm:p-6 space-y-4 bg-[#0e121e] hover:border-amber-400/40 rounded-2xl flex flex-col justify-between transition-all shadow-lg">
              <div>
                <Link to={`/lists/${lst.id}`}>
                  <h3 className="font-display font-bold text-lg sm:text-xl text-slate-100 hover:text-amber-400 transition-colors">
                    {lst.title}
                  </h3>
                </Link>
                {lst.description && (
                  <p className="font-sans text-xs text-slate-400 mt-2 line-clamp-2 italic">
                    "{lst.description}"
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10 font-mono text-xs">
                <span className="text-slate-400 text-[11px]">{lst.item_count || 0} Titles</span>
                <div className="flex items-center gap-3">
                  <Link
                    to={`/lists/${lst.id}`}
                    className="text-amber-400 hover:underline font-bold text-xs uppercase"
                  >
                    View List →
                  </Link>
                  <button
                    onClick={() => handleDeleteList(lst.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                    title="Delete list"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
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
