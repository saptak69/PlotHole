import React, { useState } from 'react';
import { X, ListPlus, Loader2, Sparkles } from 'lucide-react';
import { API_URL } from '../config';
import { useToast } from '../context/ToastContext';

export default function CreateListModal({ isOpen, onClose, onListCreated }) {
  const { addToast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      addToast('List title is required', 'error');
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem('plothole_token');

    try {
      const res = await fetch(`${API_URL}/lists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim()
        })
      });

      if (res.ok) {
        const newList = await res.json();
        addToast('Custom list created!', 'success');
        setTitle('');
        setDescription('');
        if (onListCreated) onListCreated(newList);
        onClose();
      } else {
        const err = await res.json();
        addToast(err.error || 'Failed to create list', 'error');
      }
    } catch (err) {
      addToast('Network error creating list', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/85 flex items-center justify-center p-4 backdrop-blur-2xl animate-fade-in">
      <div 
        className="w-full max-w-md rounded-3xl overflow-hidden border border-white/12 bg-[#080c14] text-slate-100 shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_30px_rgba(0,245,160,0.15)]"
        style={{ animation: 'fade-up 250ms cubic-bezier(0.22, 1, 0.36, 1) both' }}
      >
        <div className="flex justify-between items-center px-6 py-4 bg-white/5 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#00f5a0]/15 border border-[#00f5a0]/30 flex items-center justify-center text-[#00f5a0] shadow-[0_0_10px_rgba(0,245,160,0.2)]">
              <ListPlus className="w-4 h-4" />
            </div>
            <div>
              <span className="font-display font-bold text-sm text-slate-100 uppercase tracking-wide block text-left">
                Create Cinema List
              </span>
              <span className="font-mono text-[10px] text-slate-400 uppercase text-left block">Curate custom collection</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-200 text-left">
          <div>
            <label className="block font-mono font-bold uppercase tracking-wider text-[11px] mb-1.5 text-slate-300">
              List Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Essential 90s Noir Thrillers"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#00f5a0]/70 transition-all"
              required
            />
          </div>

          <div>
            <label className="block font-mono font-bold uppercase tracking-wider text-[11px] mb-1.5 text-slate-300">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="A curated collection of gritty, dark cinema masterpieces..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#00f5a0]/70 transition-all leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs px-4 py-2 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-xs px-5 py-2 flex items-center gap-2 font-bold shadow-md cursor-pointer"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Create List</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
