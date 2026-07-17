import React, { useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Search, X } from 'lucide-react';
import { API_URL } from './config';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import MovieDetails from './pages/MovieDetails';
import SearchPage from './pages/Search';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SocialFeed from './pages/SocialFeed';

import './App.css';

// Initialize React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Helper component to house the global "Log It" button and search overlay
function GlobalLogWrapper() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();

  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  const handleSearch = (val) => {
    setQuery(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (val.trim().length > 1) {
      setSearching(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch(
            `${API_URL}/movies/search?query=${encodeURIComponent(val)}`,
            { signal: controller.signal }
          );
          if (res.ok) {
            const data = await res.json();
            setResults(data.results || []);
          }
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error(err);
          }
        } finally {
          if (abortControllerRef.current === controller) {
            setSearching(false);
          }
        }
      }, 300);
    } else {
      setResults([]);
      setSearching(false);
    }
  };

  const handleSelectMovie = (id, mediaType) => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
    // Directs to film/show details page with log=true query param to open modal automatically
    navigate(`/media/${mediaType || 'movie'}/${id}?log=true`);
  };

  return (
    <>
      {/* Standard Brutalist Container */}
      <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col border-t border-white/10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movies/:id" element={<MovieDetails />} />
            <Route path="/media/:mediaType/:id" element={<MovieDetails />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/social" element={<SocialFeed />} />
          </Routes>
        </main>
        
        {/* Retro Zine Global Footer */}
        <footer className="py-8 border-t-3 border-brand-border text-center text-xs text-brand-text-muted font-mono">
          <div className="max-w-7xl mx-auto px-6 space-y-2">
            <p className="font-extrabold tracking-widest text-sm text-brand-text uppercase font-bangers">PLOTHOLE — THE CINEMA CHRONICLES</p>
            <p className="font-bold text-[10px] text-brand-text-muted">© {new Date().getFullYear()} SAPTAK MONDAL. ALL RIGHTS RESERVED.</p>
            <p className="text-[9px] opacity-60">This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
          </div>
        </footer>
      </div>

      {/* Massive Acid Green Fixed Log It Button */}
      {user && (
        <button
          onClick={() => setIsOpen(true)}
          className="brutal-log-btn"
          title="Slam log entry"
        >
          Log It
        </button>
      )}

      {/* Floating Brutalist Search Log Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="win95-notepad w-full max-w-xl animate-in zoom-in-95 duration-100">
            <div className="win95-titlebar">
              <span>PLOTHOLE - SELECT FILM TO COMMENT ON</span>
              <button onClick={() => setIsOpen(false)} className="win95-btn">X</button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="TYPE FILM NAME..."
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="win95-textarea w-full px-4 py-3 pl-11 text-black font-mono font-bold placeholder-gray-500 uppercase"
                  autoFocus
                />
                <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-500" />
              </div>

              {/* Results list */}
              <div className="max-h-60 overflow-y-auto divide-y divide-gray-300 bg-white border border-gray-400 font-mono text-black text-left">
                {searching && <div className="p-3 text-xs text-gray-600">SEARCHING DATABASE...</div>}
                
                {!searching && results.length === 0 && query.trim().length > 1 && (
                  <div className="p-3 text-xs text-red-500">NO FILM FOUND.</div>
                )}
                
                {results.filter(m => m.media_type !== 'user').slice(0, 5).map((m) => {
                  const title = m.title || m.name;
                  const date = m.release_date || m.first_air_date;
                  return (
                    <button
                      key={`${m.media_type || 'movie'}-${m.id}`}
                      onClick={() => handleSelectMovie(m.id, m.media_type)}
                      className="w-full text-left p-3 hover:bg-brutal-pink hover:text-black flex justify-between items-center transition-colors"
                    >
                      <span className="font-extrabold text-sm uppercase">{title}</span>
                      <span className="text-xs opacity-75 font-semibold">({date ? date.split('-')[0] : 'N/A'})</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="btn px-4 py-1.5 text-xs font-bold uppercase"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <GlobalLogWrapper />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}
