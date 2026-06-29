import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, AlertCircle } from 'lucide-react';
import { API_URL } from '../config';
import MovieCard from '../components/MovieCard';

export default function Search() {
  const [searchParams] = useSearchParams();
  const queryStr = searchParams.get('q') || '';

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

  return (
    <div className="flex-1 max-w-7xl mx-auto px-6 md:px-12 py-12 text-left font-mono">
      <div className="flex items-center gap-3 mb-8 border-b-4 border-white pb-4">
        <SearchIcon className="w-8 h-8 text-brutal-cyan" />
        <h1 className="text-2xl md:text-3xl font-black text-white uppercase">
          Search Results: <span className="text-brutal-cyan">"{queryStr}"</span>
        </h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-brand-card border-3 border-white animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-red-600/10 border-4 border-red-500 text-red-500 rounded-none flex items-start gap-4">
          <AlertCircle className="w-8 h-8 shrink-0" />
          <div>
            <h3 className="font-extrabold text-xl uppercase">SEARCH PROTOCOL ERROR</h3>
            <p className="text-sm mt-1">{error.message}</p>
          </div>
        </div>
      ) : movies.length === 0 ? (
        <div className="brutal-border p-12 text-center text-brand-text-muted uppercase">
          <p className="text-base font-black text-white">No film matches found.</p>
          <p className="text-xs mt-2">Check details or re-enter filter variables.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}
