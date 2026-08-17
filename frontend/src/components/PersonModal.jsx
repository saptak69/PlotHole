import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Film, Calendar, User, Loader2, ArrowRight } from 'lucide-react';
import { API_URL, getPosterUrl } from '../config';

export default function PersonModal({ personId, onClose }) {
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!personId) return;
    setLoading(true);

    fetch(`${API_URL}/person/${personId}`)
      .then((res) => res.json())
      .then((data) => {
        setPerson(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [personId]);

  if (!personId) return null;

  const topCredits = (person?.credits?.cast || [])
    .filter((c) => c.poster_path && (c.title || c.name))
    .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
    .slice(0, 10);

  return (
    <div className="fixed inset-0 z-[1000] bg-black/85 flex items-center justify-center p-4 backdrop-blur-2xl animate-fade-in">
      <div 
        className="w-full max-w-3xl rounded-2xl overflow-hidden border border-white/15 bg-[#0e111a] text-slate-100 shadow-[0_25px_70px_rgba(0,0,0,0.9)] max-h-[90vh] flex flex-col"
        style={{ animation: 'fade-up 250ms cubic-bezier(0.22, 1, 0.36, 1) both' }}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-white/5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <User className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-display font-bold text-sm text-slate-100 uppercase tracking-wide block">
                {person?.name || 'Artist Dossier'}
              </span>
              <span className="font-mono text-[10px] text-slate-400 uppercase">Filmography & Biography</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-sky-400" />
            <p className="font-mono text-xs text-sky-400 font-bold uppercase tracking-widest">FETCHING ARTIST ARCHIVE...</p>
          </div>
        ) : person ? (
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
            {/* Person Header */}
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {person.profile_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w300${person.profile_path}`}
                  alt={person.name}
                  className="w-28 h-40 object-cover rounded-xl border border-white/10 shadow-lg shrink-0"
                />
              ) : (
                <div className="w-28 h-40 bg-slate-900 border border-white/10 rounded-xl flex items-center justify-center shrink-0">
                  <User className="w-10 h-10 text-slate-600" />
                </div>
              )}

              <div className="space-y-2.5 flex-1">
                <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-100">
                  {person.name}
                </h2>
                {person.known_for_department && (
                  <span className="inline-block px-2.5 py-0.5 bg-sky-500/15 text-sky-400 border border-sky-500/30 text-[11px] font-mono font-bold uppercase rounded-md">
                    {person.known_for_department}
                  </span>
                )}
                {person.birthday && (
                  <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Born: {person.birthday} {person.place_of_birth && `in ${person.place_of_birth}`}</span>
                  </div>
                )}
                {person.biography && (
                  <p className="text-xs font-sans text-slate-300 line-clamp-4 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
                    {person.biography}
                  </p>
                )}
              </div>
            </div>

            {/* Known For / Top Credits */}
            <div className="space-y-3.5 pt-4 border-t border-white/10">
              <h3 className="font-display font-bold text-base text-slate-100 uppercase tracking-wide flex items-center gap-2">
                <Film className="w-4 h-4 text-amber-400" />
                <span>Featured Filmography ({person.credits?.cast?.length || 0} Titles)</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {topCredits.map((credit) => (
                  <div
                    key={`${credit.media_type}-${credit.id}`}
                    onClick={() => {
                      onClose();
                      navigate(`/media/${credit.media_type || 'movie'}/${credit.id}`);
                    }}
                    className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/40 rounded-xl p-2 text-center cursor-pointer transition-all hover:-translate-y-1"
                  >
                    <img
                      src={`https://image.tmdb.org/t/p/w185${credit.poster_path}`}
                      alt={credit.title || credit.name}
                      className="w-full h-36 object-cover rounded-lg border border-white/10 mb-2"
                    />
                    <h4 className="font-display font-bold text-xs truncate text-slate-200 group-hover:text-amber-300">
                      {credit.title || credit.name}
                    </h4>
                    <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                      {credit.character ? credit.character : credit.media_type?.toUpperCase()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
