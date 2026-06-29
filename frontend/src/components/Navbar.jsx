import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Orbit, Search, LogOut, Bookmark, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-black border-b-4 border-white py-4 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4 font-mono select-none">
      {/* Brand Logo - PlotHole */}
      <Link to="/" className="flex items-center gap-2.5 group">
        <div className="w-10 h-10 border-2 border-white bg-black flex items-center justify-center shadow-[2px_2px_0px_#fff]">
          <Orbit className="w-6 h-6 text-brutal-cyan animate-[spin_12s_linear_infinite]" />
        </div>
        <span 
          className="font-black text-2xl tracking-tighter text-white uppercase"
          style={{ textShadow: '2px 2px 0px #ff007f' }}
        >
          Plot<span className="text-brutal-cyan">Hole</span>
        </span>
      </Link>

      {/* Brutalist Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
        <input
          type="text"
          placeholder="SEARCH FILMS TO YELL ABOUT..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border-3 border-black text-black px-4 py-2.5 pl-11 font-black placeholder-gray-500 text-sm focus:outline-none uppercase"
        />
        <Search className="absolute left-4 top-3.5 w-4.5 h-4.5 text-black" />
        <button type="submit" className="hidden">Search</button>
      </form>

      {/* Navigation Links */}
      <div className="flex items-center gap-6">
        {user ? (
          <>
            <Link to="/social" className="text-white hover:text-brutal-cyan flex items-center gap-2 text-xs font-black uppercase transition-colors">
              <Users className="w-4 h-4" />
              <span>Feed</span>
            </Link>
            
            <Link to={`/profile/${user.username}`} className="text-white hover:text-brutal-cyan flex items-center gap-2 text-xs font-black uppercase transition-colors">
              <Bookmark className="w-4 h-4" />
              <span>Watchlist</span>
            </Link>

            {/* Profile Info */}
            <div className="flex items-center gap-3 pl-4 border-l-2 border-white">
              <Link to={`/profile/${user.username}`} className="flex items-center gap-2 group">
                <img
                  src={user.avatar_url}
                  alt={user.username}
                  className="w-8 h-8 rounded-none border-2 border-white group-hover:border-brutal-cyan transition-colors dithered-avatar"
                />
                <span className="text-xs font-black text-white group-hover:text-brutal-cyan transition-colors">
                  @{user.username}
                </span>
              </Link>
              <button
                onClick={logout}
                title="Log Out"
                className="text-white hover:text-brutal-pink p-1 hover:bg-white/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-white hover:underline text-xs font-black uppercase"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="bg-brutal-yellow text-black border-2 border-white px-5 py-2 font-black text-xs uppercase shadow-[3px_3px_0px_rgba(255,255,255,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            >
              Create Account
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
