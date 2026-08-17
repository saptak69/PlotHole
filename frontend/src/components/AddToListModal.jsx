import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Plus, Check, Loader2 } from 'lucide-react';
import { API_URL, getPosterUrl } from '../config';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import CreateListModal from './CreateListModal';

export default function AddToListModal({ isOpen, onClose, movie }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);
  const [addedListIds, setAddedListIds] = useState(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;

    let isMounted = true;
    setLoading(true);

    fetch(`${API_URL}/lists/user/${user.username}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        setLists(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, user]);

  const handleAddToList = async (listId) => {
    if (!movie) return;
    setAddingId(listId);

    const token = localStorage.getItem('plothole_token');
    const mediaType = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');
    const title = movie.title || movie.name;

    try {
      const res = await fetch(`${API_URL}/lists/${listId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          tmdb_movie_id: movie.id,
          media_type: mediaType,
          title: title,
          poster_path: movie.poster_path,
          release_date: movie.release_date || movie.first_air_date
        })
      });

      if (res.ok) {
        setAddedListIds((prev) => new Set([...prev, listId]));
        addToast(`Added "${title}" to list!`, 'success');
      } else {
        const err = await res.json();
        addToast(err.error || 'Failed to add item to list', 'error');
      }
    } catch (err) {
      addToast('Error adding to list', 'error');
    } finally {
      setAddingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[1000] bg-black/85 flex items-center justify-center p-4 backdrop-blur-2xl animate-fade-in">
        <div 
          className="w-full max-w-md rounded-2xl overflow-hidden border border-white/15 bg-[#0e111a] text-slate-100 shadow-[0_25px_70px_rgba(0,0,0,0.9)]"
          style={{ animation: 'fade-up 250ms cubic-bezier(0.22, 1, 0.36, 1) both' }}
        >
          <div className="flex justify-between items-center px-6 py-4 bg-white/5 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
                <FolderPlus className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-display font-bold text-sm text-slate-100 uppercase tracking-wide block">
                  Add to List
                </span>
                <span className="font-mono text-[10px] text-slate-400 uppercase">Manage custom collection</span>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-4 text-xs">
            {/* Film snapshot */}
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
              {movie?.poster_path && (
                <img
                  src={getPosterUrl(movie.poster_path, 'w92')}
                  alt={movie.title || movie.name}
                  className="w-10 h-14 object-cover rounded-lg border border-white/10"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold text-sm text-slate-100 truncate">
                  {movie?.title || movie?.name}
                </p>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  {(movie?.release_date || movie?.first_air_date || '').split('-')[0]} • {movie?.media_type === 'tv' ? 'TV SERIES' : 'FILM'}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-1 border-t border-white/10">
              <span className="font-mono font-bold uppercase text-slate-400 text-[11px]">Your Lists</span>
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono font-bold text-[11px] uppercase transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New List</span>
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {loading ? (
                <div className="p-6 text-center text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-amber-400" />
                </div>
              ) : lists.length === 0 ? (
                <div className="text-center p-6 text-slate-400 space-y-2">
                  <p>You haven't created any custom lists yet.</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary py-1.5 px-3 text-[11px]"
                  >
                    Create Your First List
                  </button>
                </div>
              ) : (
                lists.map((lst) => {
                  const isAdded = addedListIds.has(lst.id);
                  const isAdding = addingId === lst.id;

                  return (
                    <div
                      key={lst.id}
                      className="p-3 bg-white/5 border border-white/10 hover:border-amber-400/30 rounded-xl flex items-center justify-between transition-colors"
                    >
                      <div>
                        <p className="font-display font-bold text-slate-100">{lst.title}</p>
                        <p className="text-[10px] font-mono text-slate-400">{lst.item_count || 0} items</p>
                      </div>
                      <button
                        onClick={() => handleAddToList(lst.id)}
                        disabled={isAdded || isAdding}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-1 ${
                          isAdded
                            ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                            : 'bg-white/5 text-slate-200 border border-white/10 hover:border-amber-400/50 hover:text-amber-300'
                        }`}
                      >
                        {isAdding ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={onClose} className="btn-secondary px-4 py-1.5 text-xs">
                Done
              </button>
            </div>
          </div>
        </div>
      </div>

      <CreateListModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onListCreated={(newList) => setLists((prev) => [newList, ...prev])}
      />
    </>
  );
}
