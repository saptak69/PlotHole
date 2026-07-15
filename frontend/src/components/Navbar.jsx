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
    <nav className="sticky top-0 z-50 bg-[#090a10]/80 backdrop-blur-md border-b border-white/[0.08] py-3 px-4 md:py-4 md:px-12 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 font-mono select-none">
      
      {/* Top Header Row: Logo & Hamburger button */}
      <div className="flex items-center justify-between w-full md:w-auto">
        <Link to="/" className="flex items-center gap-3.5 group" onClick={handleLinkClick}>
          <div className="w-11 h-11 border border-white/10 bg-[#161821] flex items-center justify-center rounded-xl shadow-md group-hover:bg-[#1c1e29] transition-all duration-300 relative shrink-0">
            <svg 
              className="w-8 h-8 text-[#86868b] group-hover:text-[#f5f5f7] transition-colors duration-300" 
              viewBox="0 0 100 100" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Double Film Magazines (IMAX twin lobes) at top */}
              <circle cx="37" cy="30" r="14" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity="0.04" />
              <circle cx="37" cy="30" r="4.5" stroke="currentColor" strokeWidth="2" />
              
              <circle cx="63" cy="30" r="14" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity="0.04" />
              <circle cx="63" cy="30" r="4.5" stroke="currentColor" strokeWidth="2" />

              {/* Connecting bridge */}
              <path d="M37 30 H63" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />

              {/* Camera Body */}
              <rect x="26" y="41" width="48" height="32" rx="3" stroke="currentColor" strokeWidth="3" fill="#0d0e12" />

              {/* Front Matte Box */}
              <path d="M26 48 L13 41 V69 L26 62 Z" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity="0.1" strokeLinejoin="round" />
              {/* Subtle metallic lens reflection flare */}
              <line x1="15" y1="45" x2="15" y2="65" stroke="currentColor" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />

              {/* Technical dial details */}
              <line x1="66" y1="46" x2="69" y2="46" stroke="currentColor" strokeWidth="1.5" />
              <line x1="66" y1="50" x2="69" y2="50" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="67.5" cy="58" r="2" fill="currentColor" />

              {/* Minimal Clean Engraved 'P' (Cupertino-style branding) */}
              <path 
                d="M45 49 V65 M45 49 H51 C53.5 49 55 50.5 55 53 C55 55.5 53 57 51 57 H45" 
                stroke="currentColor" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex flex-col text-left">
            <span 
              className="font-bold text-lg md:text-xl tracking-tight text-[#f5f5f7] uppercase font-sans transition-all duration-300 leading-none"
            >
              Plot<span className="text-[#86868b] font-light">Hole</span>
            </span>
            <span className="text-[9px] font-bold text-[#86868b] uppercase tracking-widest mt-0.5 font-mono hidden sm:inline-block">Cinema Registry</span>
          </div>
        </Link>

        {/* Mobile Toggle Trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-1.5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors"
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Collapsible Menu: Search bar and Links */}
      <div className={`${
        isOpen ? 'flex' : 'hidden'
      } md:flex flex-col md:flex-row items-center gap-4 w-full md:w-auto pb-4 md:pb-0 pt-3 md:pt-0 md:border-t-0 bg-[#0e111e]/95 md:bg-transparent backdrop-blur-md md:backdrop-blur-none p-4 md:p-0 rounded-2xl border border-white/[0.05] md:border-none mt-2 md:mt-0`}>
        
        {/* Brutalist Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96 lg:w-[480px]">
          <input
            type="text"
            placeholder="Search movies, web series..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 hover:border-white/25 focus:border-brutal-cyan text-white px-4 py-2.5 pl-10 font-bold placeholder-gray-400 text-sm focus:outline-none uppercase rounded-xl transition-all"
          />
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-white/50" />
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
