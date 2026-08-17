import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Film, X, ArrowRight, Brain, CloudRain, Flame, Trophy, Theater, Film as MovieIcon, Star } from 'lucide-react';
import { API_URL, getPosterUrl } from '../config';
import GlowingOrb from './GlowingOrb';

const VIBE_PRESETS = [
  { label: 'Mind-Bending', icon: Brain, query: 'mind bending sci-fi psychological thriller' },
  { label: 'Neon Noir', icon: CloudRain, query: 'atmospheric neon noir mystery' },
  { label: 'High-Octane Action', icon: Flame, query: 'intense fast-paced action masterpiece' },
  { label: '90s Cult Classics', icon: Trophy, query: '90s iconic cult classic film' },
  { label: 'Character Drama', icon: Theater, query: 'emotional deep drama masterpiece' },
  { label: 'Popcorn Blockbuster', icon: MovieIcon, query: 'fun exciting popcorn blockbuster' }
];

export default function AICriticModal({ isOpen, onClose }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleAskAI = async (searchQuery) => {
    const q = searchQuery || prompt;
    if (!q.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`${API_URL}/ai/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: q })
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const orbState = loading ? 'thinking' : result ? 'speaking' : 'idle';

  return (
    <div className="fixed inset-0 z-[1000] bg-black/80 flex items-center justify-center p-4 backdrop-blur-xl animate-fade-in">
      <div 
        className="relative w-full max-w-2xl rounded-2xl overflow-hidden border border-white/15 bg-[#0e111a]/95 text-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(245,158,11,0.15)]"
        style={{ animation: 'fade-up 300ms cubic-bezier(0.22, 1, 0.36, 1) both' }}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-amber-500/15 via-purple-500/10 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="relative px-6 py-5 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
            <GlowingOrb size="sm" state={orbState} />
            <div>
              <h2 className="font-display font-bold text-lg text-slate-100 flex items-center gap-2">
                <span>AI Director's Cut</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  GENAI CURATOR
                </span>
              </h2>
              <p className="text-[11px] font-mono text-slate-400">
                Context-aware cinephile recommendations
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Central Orb Display on Initial State */}
          {!result && !loading && (
            <div className="flex flex-col items-center justify-center py-4 text-center space-y-3">
              <GlowingOrb size="lg" state="idle" />
              <p className="text-xs text-slate-400 max-w-md font-sans">
                Tell the AI Director your mood, favorite filmmaker, or specific aesthetic, and get tailor-made cinephile gems.
              </p>
            </div>
          )}

          {/* Prompt Section */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. A psychological thriller like Shutter Island or Se7en..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                className="flex-1 px-4 py-3 text-sm font-sans placeholder:text-slate-500 bg-white/5 text-slate-100 rounded-xl border border-white/10 focus:border-amber-400/60 focus:bg-black/60 outline-none transition-all shadow-inner"
              />
              <button
                onClick={() => handleAskAI()}
                disabled={loading || !prompt.trim()}
                className="btn-primary px-5 py-3 text-xs disabled:opacity-40"
              >
                {loading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Curate</span>
              </button>
            </div>

            {/* Vibe Suggestion Chips (Inspired by Beautiful UI) */}
            <div className="flex flex-wrap gap-2 pt-1">
              {VIBE_PRESETS.map((vibe) => {
                const PresetIcon = vibe.icon;
                return (
                  <button
                    key={vibe.label}
                    onClick={() => {
                      setPrompt(vibe.label);
                      handleAskAI(vibe.query);
                    }}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/40 text-slate-300 hover:text-amber-300 text-xs font-mono rounded-lg transition-all flex items-center gap-1.5 text-left"
                  >
                    <PresetIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>{vibe.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loading Thinking State */}
          {loading && (
            <div className="p-8 text-center space-y-4 rounded-xl bg-white/5 border border-amber-400/20">
              <GlowingOrb size="md" state="thinking" className="mx-auto" />
              <div>
                <p className="font-mono text-xs font-bold text-amber-300 uppercase tracking-widest animate-pulse">
                  Querying Global TMDB Archives & Director Cut Metrics...
                </p>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  Synthesizing themes, cinematographers, and user rating weights
                </p>
              </div>
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="space-y-4">
              {result.verdict && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-300 font-sans text-xs font-medium leading-relaxed">
                  <span className="font-mono font-bold mr-1">✦ AI DIRECTORS VERDICT:</span> {result.verdict}
                </div>
              )}

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {result.recommendations?.map((film) => (
                  <div
                    key={film.id}
                    onClick={() => {
                      onClose();
                      navigate(`/media/${film.media_type || 'movie'}/${film.id}`);
                    }}
                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/50 rounded-xl flex gap-3.5 items-center cursor-pointer transition-all hover:translate-x-1 group"
                  >
                    {film.poster_path ? (
                      <img
                        src={getPosterUrl(film.poster_path, 'w92')}
                        alt={film.title}
                        className="w-12 h-16 object-cover rounded-lg border border-white/10 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-16 bg-slate-900 rounded-lg border border-white/10 flex items-center justify-center shrink-0">
                        <Film className="w-6 h-6 text-slate-600" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center gap-2">
                        <h4 className="font-display font-bold text-sm text-slate-100 group-hover:text-amber-300 truncate">
                          {film.title || film.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded bg-amber-400/15 border border-amber-400/30 text-amber-300 font-mono text-[10px] font-bold shrink-0">
                          {film.match_score || 95}% MATCH
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 italic line-clamp-1 mt-1">
                        "{film.curator_note || film.overview}"
                      </p>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
