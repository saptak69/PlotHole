import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, AlertCircle, Film, Users, Sparkles } from 'lucide-react';
import { API_URL } from '../config';
import MovieCard from '../components/MovieCard';
import Avatar from '../components/Avatar';

function UserCard({ user }) {
  return (
    <div className="border border-white/10 bg-white/5 hover:border-amber-400/40 p-5 flex flex-col items-center justify-between text-center rounded-2xl shadow-lg hover:-translate-y-1 transition-all aspect-[2/3]">
      <div className="flex flex-col items-center w-full min-w-0">
        <span className="bg-amber-400/20 text-amber-300 font-mono text-[10px] font-bold px-2.5 py-0.5 border border-amber-400/30 rounded-full mb-3 uppercase">
          Critic
        </span>
        
        <Avatar username={user.username} url={user.avatar_url} className="w-16 h-16 border border-white/20 rounded-2xl mb-3 shadow-md" />
        
        <span className="font-display font-bold text-slate-100 text-sm truncate w-full block">
          @{user.username}
        </span>
        
        <p className="text-[11px] text-slate-400 mt-2 font-sans line-clamp-3 leading-relaxed">
          {user.bio || "Cinephile with no bio details yet."}
        </p>
      </div>

      <Link
        to={`/profile/${user.username}`}
        className="btn-secondary w-full py-2 mt-4 text-xs font-mono"
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
    <div className="flex-1 max-w-7xl mx-auto px-6 md:px-12 py-10 text-left font-sans space-y-8">
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <SearchIcon className="w-7 h-7 text-amber-400" />
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-extrabold text-white">
            Search Vault: <span className="text-amber-400">"{queryStr}"</span>
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-0.5">Found {movies.length} cinephile records</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-white/5 border border-white/10 rounded-xl w-fit select-none">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all ${
            activeTab === 'all'
              ? 'bg-amber-500 text-[#08090d] shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          All ({movies.length})
        </button>
        <button
          onClick={() => setActiveTab('movies')}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all ${
            activeTab === 'movies'
              ? 'bg-amber-500 text-[#08090d] shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Films & Series ({movies.filter(m => m.media_type !== 'user').length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all ${
            activeTab === 'users'
              ? 'bg-amber-500 text-[#08090d] shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Critics ({movies.filter(m => m.media_type === 'user').length})
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-xl bg-white/5 border border-white/10 skeleton-shimmer" />
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
        <div className="border border-white/10 bg-white/5 p-12 text-center text-slate-400 rounded-2xl space-y-2">
          <p className="text-base font-display font-bold text-slate-200">No results found for "{queryStr}".</p>
          <p className="text-xs font-sans">Check spelling or search for alternative film titles, web series, or member handles.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
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
