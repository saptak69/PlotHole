import React, { useState, useEffect } from 'react';
import { X, Heart, MessageSquare, Send, Trash2, Loader2 } from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Avatar from './Avatar';
import RatingBadge from './RatingBadge';
import GlassSurface from './GlassSurface';

export default function ReviewCommentsModal({ isOpen, onClose, review }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [comments, setComments] = useState([]);
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !review) return;

    let isMounted = true;
    setLoading(true);

    const token = localStorage.getItem('plothole_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`${API_URL}/reviews/${review.id}/comments`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        setComments(data.comments || []);
        setLikesCount(data.likesCount || 0);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, review]);

  const handleToggleLike = async () => {
    if (!user) {
      addToast('Please log in to like reviews', 'error');
      return;
    }

    const token = localStorage.getItem('plothole_token');
    try {
      const res = await fetch(`${API_URL}/reviews/${review.id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHasLiked(data.liked);
        setLikesCount(data.count);
        addToast(data.liked ? 'Review liked!' : 'Unliked review', 'info');
      }
    } catch (err) {
      addToast('Failed to like review', 'error');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user) {
      addToast('Please log in to comment', 'error');
      return;
    }
    if (!newComment.trim()) return;

    setSubmitting(true);
    const token = localStorage.getItem('plothole_token');

    try {
      const res = await fetch(`${API_URL}/reviews/${review.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ comment_text: newComment.trim() })
      });

      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [...prev, comment]);
        setNewComment('');
        addToast('Comment added!', 'success');
      } else {
        const errData = await res.json();
        addToast(errData.error || 'Failed to add comment', 'error');
      }
    } catch (err) {
      addToast('Error submitting comment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    const token = localStorage.getItem('plothole_token');
    try {
      const res = await fetch(`${API_URL}/reviews/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        addToast('Comment deleted', 'info');
      }
    } catch (err) {
      addToast('Failed to delete comment', 'error');
    }
  };

  if (!isOpen || !review) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/85 flex items-center justify-center p-4 backdrop-blur-2xl animate-fade-in">
      <div 
        className="w-full max-w-xl max-h-[85vh] flex flex-col rounded-3xl overflow-hidden border border-white/12 bg-[#080c14] text-slate-100 shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_30px_rgba(0,245,160,0.15)]"
        style={{ animation: 'fade-up 250ms cubic-bezier(0.22, 1, 0.36, 1) both' }}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-white/5 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#00f5a0]/15 border border-[#00f5a0]/30 flex items-center justify-center text-[#00f5a0] shadow-[0_0_10px_rgba(0,245,160,0.2)]">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <span className="font-display font-bold text-sm text-slate-100 uppercase tracking-wide block text-left">
                Review Discussion
              </span>
              <span className="font-mono text-[10px] text-slate-400 text-left block">by @{review.username}</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Review snippet card */}
        <div className="p-4 bg-white/5 border-b border-white/8 shrink-0 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar username={review.username} url={review.avatar_url} className="w-6 h-6 border border-[#00f5a0]/30" />
              <span className="font-mono text-xs font-bold text-slate-200">@{review.username}</span>
            </div>
            <RatingBadge rating={review.rating} size="xs" />
          </div>
          <p className="text-xs font-sans text-slate-200 line-clamp-3 italic bg-black/40 p-3.5 rounded-xl border border-white/5 leading-relaxed text-left">
            "{review.review_text}"
          </p>
          <div className="flex items-center justify-between pt-1 font-mono text-[11px] text-slate-400">
            <button
              onClick={handleToggleLike}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border font-bold transition-all cursor-pointer ${
                hasLiked
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-sm'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:border-rose-500/40 hover:text-rose-400'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-current text-rose-500' : ''}`} />
              <span>{likesCount} Likes</span>
            </button>
            <span>{comments.length} Comments</span>
          </div>
        </div>

        {/* Comments Scroll area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-[#04070e]">
          {loading ? (
            <div className="flex justify-center p-8 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#00f5a0]" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center p-8 text-xs font-mono text-slate-500">
              No comments yet. Start the cinephile conversation!
            </div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="p-3 bg-white/5 rounded-2xl border border-white/8 text-xs space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar username={c.username} url={c.avatar_url} className="w-5 h-5 border border-white/10" />
                    <span className="font-mono font-bold text-[#00f5a0]">@{c.username}</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {user && user.id === c.user_id && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                      title="Delete comment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-slate-200 font-sans text-xs leading-relaxed pl-7">{c.comment_text}</p>
              </div>
            ))
          )}
        </div>

        {/* Input box */}
        <form onSubmit={handleAddComment} className="p-3 bg-white/5 border-t border-white/8 flex gap-2 shrink-0">
          <input
            type="text"
            placeholder={user ? "Write a cinephile response..." : "Log in to post a comment..."}
            disabled={!user || submitting}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-sans text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#00f5a0]/70"
          />
          <button
            type="submit"
            disabled={!user || submitting || !newComment.trim()}
            className="btn-primary px-4 py-2 text-xs flex items-center gap-1.5 disabled:opacity-40 font-bold shadow-md cursor-pointer"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Post</span>
          </button>
        </form>
      </div>
    </div>
  );
}
