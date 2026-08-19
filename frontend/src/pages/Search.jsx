import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, AlertCircle, Film, Users, Layers } from 'lucide-react';
import { API_URL } from '../config';
import MovieCard from '../components/MovieCard';
import Avatar from '../components/Avatar';
import GlassSurface from '../components/GlassSurface';

function UserCard({ user }) {
  return (
    <div className="border border-white/8 bg-[#121216] hover:border-[#e50914]/40 p-5 flex flex-col items-center justify-between text-center rounded-2xl shadow-lg hover:-translate-y-1 transition-all aspect-[2/3]">
      <div className="flex flex-col items-center w-full min-w-0">
        <span className="bg-[#e50914]/15 text-[#ff4d5a] font-mono text-[10px] font-bold px-2.5 py-0.5 border border-[#e50914]/30 rounded-full mb-3 uppercase shadow-[0_0_10px_rgba(229,9,20,0.2)]">
          Critic
        </span>
        
        <Avatar username={user.username} url={user.avatar_url} className="w-14 h-14 sm:w-16 sm:h-16 border-2 border-[#e50914]/30 rounded-2xl mb-2.5 shadow-md" />
        
        <span className="font-display font-bold text-slate-100 text-xs sm:text-sm truncate w-full block">
          @{user.username}
        </span>
        
        <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1.5 font-sans line-clamp-3 leading-relaxed">
          {user.bio || "Cinephile with no bio details yet."}
        </p>
      </div>

      <Link
        to={`/profile/${user.username}`}
        className="btn-secondary w-full py-2 mt-3 text-xs font-mono font-semibold"
      >
        View Profile
      </Link>
    </div>
  );
}

export default function Search() {
  const [searchParams] = useSearchParams();
  const queryStr = searchParams.get('q') || '';
  const [activeTab, setActiveTab] = useState('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['searchMovies', queryStr],
    queryFn: async () => {
      if (!queryStr) return { results: [] };
      const res = await fetch(`${API_URL}/movies/search?query=${encodeURIComponent(queryStr)}`);
      if (!res.ok) throw new Error('Search failed');
      return res.json();
    },
    enabled: !!queryStr
  });

  const movies = data?.results || [];

  const filteredResults = movies.filter((item) => {
    if (activeTab === 'movies') {
      return item.media_type !== 'user';
    }
    if (activeTab === 'users') {
      return item.media_type === 'user';
    }
    return true;
  });

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-6 md:py-10 text-left font-sans space-y-6 md:space-y-8">
      <div className="flex items-center gap-3 border-b border-white/8 pb-4">
        <SearchIcon className="w-6 h-6 sm:w-7 sm:h-7 text-[#e50914]" />
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-white">
            Search Vault: <span className="text-[#ff2e3b]">"{queryStr}"</span>
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-0.5">Found {movies.length} cinephile records</p>
        </div>
      </div>

      {/* Filter Tabs with GlassSurface */}
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
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-xs font-display font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-[#e50914] to-[#ff2e3b] text-white shadow-[0_0_15px_rgba(229,9,20,0.4)]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All ({movies.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('movies')}
            className={`px-4 py-2 text-xs font-display font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'movies'
                ? 'bg-gradient-to-r from-[#e50914] to-[#ff2e3b] text-white shadow-[0_0_15px_rgba(229,9,20,0.4)]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Films & Series ({movies.filter(m => m.media_type !== 'user').length})</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 text-xs font-display font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-[#e50914] to-[#ff2e3b] text-white shadow-[0_0_15px_rgba(229,9,20,0.4)]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Critics ({movies.filter(m => m.media_type === 'user').length})</span>
          </button>
        </div>
      </GlassSurface>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 sm:gap-4 md:gap-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-2xl bg-white/5 border border-white/8 skeleton-shimmer" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl flex items-start gap-4">
          <AlertCircle className="w-8 h-8 shrink-0" />
          <div>
            <h3 className="font-display font-bold text-lg uppercase">SEARCH PROTOCOL ERROR</h3>
            <p className="text-xs mt-1 font-mono">{error.message}</p>
          </div>
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="border border-white/8 bg-[#121216] p-8 sm:p-12 text-center text-slate-400 rounded-3xl space-y-2 shadow-lg">
          <p className="text-base font-display font-bold text-slate-200">No results found for "{queryStr}".</p>
          <p className="text-xs font-sans text-slate-400">Check spelling or search for alternative film titles, web series, or member handles.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 sm:gap-4 md:gap-5">
          {filteredResults.map((item, idx) => (
            item.media_type === 'user' ? (
              <UserCard key={`user-${item.id || idx}`} user={item} />
            ) : (
              <MovieCard key={`movie-${item.id || idx}`} movie={item} />
            )
          ))}
        </div>
      )}
    </div>
  );
}
