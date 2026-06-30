import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Orbit, Search, LogOut, Bookmark, Users, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsOpen(false);
    }
  };

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-black border-b-4 border-white py-3 px-4 md:py-4 md:px-12 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 font-mono select-none">
      
      {/* Top Header Row: Logo & Hamburger button */}
      <div className="flex items-center justify-between w-full md:w-auto">
        <Link to="/" className="flex items-center gap-2 group" onClick={handleLinkClick}>
          <div className="w-8 h-8 md:w-10 md:h-10 border-2 border-white bg-black flex items-center justify-center shadow-[2px_2px_0px_#fff]">
            <Orbit className="w-5 h-5 md:w-6 md:h-6 text-brutal-cyan" />
          </div>
          <span 
            className="font-black text-xl md:text-2xl tracking-tighter text-white uppercase"
            style={{ textShadow: '2px 2px 0px #ff007f' }}
          >
            Plot<span className="text-brutal-cyan">Hole</span>
          </span>
        </Link>

        {/* Mobile Toggle Trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-1.5 border-2 border-white text-white hover:bg-brutal-pink hover:text-black transition-colors"
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Collapsible Menu: Search bar and Links */}
      <div className={`${
        isOpen ? 'flex' : 'hidden'
      } md:flex flex-col md:flex-row items-center gap-4 w-full md:w-auto pb-2 md:pb-0 border-t border-white/20 pt-3 md:border-t-0 md:pt-0`}>
        
        {/* Brutalist Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96 lg:w-[480px]">
          <input
            type="text"
            placeholder="Search movies, web series..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border-3 border-black text-black px-4 py-2.5 pl-10 font-bold placeholder-gray-500 text-sm focus:outline-none uppercase"
          />
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-black" />
          <button type="submit" className="hidden">Search</button>
        </form>

        {/* Navigation Links */}
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          {user ? (
            <>
              <Link 
                to="/social" 
                onClick={handleLinkClick}
                className={`${
                  isActive('/social')
                    ? 'text-brutal-cyan border-b-2 border-brutal-cyan font-black'
                    : 'text-white hover:text-brutal-cyan border-b-2 border-transparent font-bold'
                } flex items-center justify-center gap-2 text-sm uppercase transition-all py-1.5 w-full md:w-auto hover:translate-y-[-1px]`}
              >
                <Users className="w-4 h-4" />
                <span>Feed</span>
              </Link>
              
              <Link 
                to={`/profile/${user.username}`} 
                onClick={handleLinkClick}
                className={`${
                  isActive(`/profile/${user.username}`)
                    ? 'text-brutal-cyan border-b-2 border-brutal-cyan font-black'
                    : 'text-white hover:text-brutal-cyan border-b-2 border-transparent font-bold'
                } flex items-center justify-center gap-2 text-sm uppercase transition-all py-1.5 w-full md:w-auto hover:translate-y-[-1px]`}
              >
                <Bookmark className="w-4 h-4" />
                <span>Watchlist</span>
              </Link>

              {/* Profile Info */}
              <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto md:pl-4 border-t md:border-t-0 md:border-l-2 border-white/20 md:border-white pt-2.5 md:pt-0">
                <Link 
                  to={`/profile/${user.username}`} 
                  onClick={handleLinkClick}
                  className="flex items-center gap-2 group py-1"
                >
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    className="w-7 h-7 rounded-none border-2 border-white group-hover:border-brutal-cyan transition-colors dithered-avatar"
                  />
                  <span className="text-sm font-black text-white group-hover:text-brutal-cyan transition-colors">
                    @{user.username}
                  </span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    handleLinkClick();
                  }}
                  title="Log Out"
                  className="text-white hover:text-brutal-pink p-1.5 hover:bg-white/10 transition-colors w-full md:w-auto flex items-center justify-center gap-2 md:gap-0 border border-white/20 md:border-0 uppercase md:normal-case text-sm font-bold"
                >
                  <LogOut className="w-4 h-4 md:inline" />
                  <span className="md:hidden">Log Out</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto border-t md:border-t-0 border-white/20 pt-3 md:pt-0">
              <Link
                to="/login"
                onClick={handleLinkClick}
                className="text-white hover:underline text-sm font-black uppercase py-1.5"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={handleLinkClick}
                className="bg-brutal-yellow text-black border-2 border-white px-5 py-2.5 font-black text-sm uppercase shadow-[3px_3px_0px_rgba(255,255,255,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all text-center w-full md:w-auto"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
