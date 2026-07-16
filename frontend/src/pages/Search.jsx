import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, AlertCircle } from 'lucide-react';
import { API_URL } from '../config';
import MovieCard from '../components/MovieCard';
import Avatar from '../components/Avatar';

function UserCard({ user }) {
  return (
    <div className="border-3 border-brand-border bg-[#1b1810] p-5 flex flex-col items-center justify-between text-center shadow-[4px_4px_0_#f2e9d8] hover:translate-y-[-2px] hover:shadow-[5px_6px_0_#f4c430] transition-all duration-150 rounded-sm aspect-[2/3]">
      <div className="flex flex-col items-center w-full min-w-0">
        {/* Critic Tag */}
        <div className="bg-[#ff4757] text-[#121008] font-mono text-[9px] font-bold px-2.5 py-0.5 border border-brand-border rounded-full transform rotate-[-2deg] mb-4 select-none">
          CRITIC
        </div>
        
        {/* Avatar */}
        <Avatar username={user.username} url={user.avatar_url} className="w-16 h-16 border-2 border-brand-border rounded-none mb-3" />
        
        {/* Username */}
        <span className="font-bold text-brand-text text-xs font-mono truncate w-full block">
          @{user.username}
        </span>
        
        {/* Bio */}
        <p className="text-[9px] text-brand-text-muted mt-2 font-mono uppercase font-bold line-clamp-3 leading-normal">
          {user.bio || "Cinephile with no bio details yet."}
        </p>
      </div>

      <Link
        to={`/profile/${user.username}`}
        className="btn btn-primary w-full py-1.5 mt-4 text-[10px] tracking-wider"
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

  // Filter movies/users based on activeTab
  const filteredResults = movies.filter((item) => {
    if (activeTab === 'movies') {
      return item.media_type !== 'user';
    }
    if (activeTab === 'users') {
      return item.media_type === 'user';
    }
    return true; // 'all'
  });

  return (
    <div className="flex-1 max-w-7xl mx-auto px-6 md:px-12 py-12 text-left font-mono">
      <div className="flex items-center gap-3 mb-8 border-b-3 border-brand-border pb-4">
        <SearchIcon className="w-8 h-8 text-[#ff4757]" />
        <h1 className="text-2xl md:text-3xl font-black text-brand-text uppercase font-bangers tracking-wide">
          Search Results: <span className="text-[#f4c430]">"{queryStr}"</span>
        </h1>
      </div>

      {/* Search Filter Tabs */}
      <div className="flex flex-wrap gap-3 mb-8 select-none">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase border-2 transition-all transform ${
            activeTab === 'all'
              ? 'bg-[#f4c430] text-[#121008] border-brand-border shadow-[2px_2px_0_#f2e9d8] rotate-[-1deg]'
              : 'bg-[#1b1810] text-[#f2e9d8] border-brand-border/40 hover:border-brand-border hover:bg-[#ff4757]/10 hover:rotate-[1deg]'
          }`}
        >
          All ({movies.length})
        </button>
        <button
          onClick={() => setActiveTab('movies')}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase border-2 transition-all transform ${
            activeTab === 'movies'
              ? 'bg-[#ff4757] text-[#121008] border-brand-border shadow-[2px_2px_0_#f2e9d8] rotate-[2deg]'
              : 'bg-[#1b1810] text-[#f2e9d8] border-brand-border/40 hover:border-brand-border hover:bg-[#ff4757]/10 hover:rotate-[-1deg]'
          }`}
        >
          Movies & Shows ({movies.filter(m => m.media_type !== 'user').length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase border-2 transition-all transform ${
            activeTab === 'users'
              ? 'bg-[#3aa6e0] text-[#121008] border-brand-border shadow-[2px_2px_0_#f2e9d8] rotate-[-2deg]'
              : 'bg-[#1b1810] text-[#f2e9d8] border-brand-border/40 hover:border-brand-border hover:bg-[#ff4757]/10 hover:rotate-[1deg]'
          }`}
        >
          Critics ({movies.filter(m => m.media_type === 'user').length})
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-[#1b1810] border-3 border-brand-border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-[#1b1810] border-3 border-[#ff4757] text-[#ff4757] rounded-none flex items-start gap-4">
          <AlertCircle className="w-8 h-8 shrink-0" />
          <div>
            <h3 className="font-extrabold text-xl uppercase font-bangers">SEARCH PROTOCOL ERROR</h3>
            <p className="text-sm mt-1">{error.message}</p>
          </div>
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="border-3 border-brand-border bg-[#1b1810] p-12 text-center text-brand-text-muted uppercase">
          <p className="text-base font-black text-brand-text font-bangers tracking-wide">No results found.</p>
          <p className="text-xs mt-2 font-bold">Check spelling or search for movies, web series, or other users.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
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
