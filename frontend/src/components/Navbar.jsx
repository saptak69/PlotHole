import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Film, Users, FolderPlus, LogOut, Menu, X, Home, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Global Ctrl+K / Cmd+K search shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

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
    <>
      {/* Top Header */}
      <header
        className={`sticky z-50 transition-all duration-300 select-none py-3 px-4 sm:px-6 md:px-12 border-b border-white/8 bg-[#090b12]/90 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] ${
          visible ? 'top-0' : '-top-28'
        }`}
      >
        <div className="max-w-7xl mx-auto relative flex items-center justify-between gap-4 md:gap-6">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0" onClick={handleLinkClick}>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-[#090b12] shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-transform group-hover:scale-105">
              <Film className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="font-display font-bold text-lg sm:text-xl tracking-tight text-white flex items-center gap-1">
              Plot<span className="text-amber-400">Hole</span>
            </span>
          </Link>

          {/* Desktop Navigation Links - Centered in navbar */}
          <nav className="hidden md:flex items-center gap-1.5 bg-white/5 border border-white/10 p-1 rounded-2xl absolute left-1/2 -translate-x-1/2 shadow-lg backdrop-blur-md">
            <Link
              to="/"
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                isActive('/')
                  ? 'bg-amber-500 text-[#090b12] shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Discover
            </Link>
            <Link
              to="/social"
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                isActive('/social')
                  ? 'bg-amber-500 text-[#090b12] shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Community
            </Link>
            <Link
              to="/lists"
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                isActive('/lists')
                  ? 'bg-amber-500 text-[#090b12] shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Lists
            </Link>
          </nav>

          {/* Search & User Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Universal Search Bar (Desktop & Tablet) */}
            <form onSubmit={handleSearchSubmit} className="relative hidden sm:block">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search films, series, people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 md:w-72 bg-white/5 hover:bg-white/8 text-slate-100 text-xs px-3.5 py-2 pl-9 pr-10 rounded-xl border border-white/10 focus:outline-none focus:border-amber-400/60 focus:w-80 transition-all placeholder:text-slate-500"
              />
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <kbd className="absolute right-2.5 top-2 px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-mono text-slate-400 border border-white/10 pointer-events-none hidden md:block">
                ⌘K
              </kbd>
            </form>

            {/* User Account / Sign In */}
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-2 border-l border-white/10">
                <Link
                  to={`/profile/${user.username}`}
                  className="flex items-center gap-2 py-1 px-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
                  title="View your diary & profile"
                >
                  <Avatar username={user.username} url={user.avatar_url} className="w-7 h-7 border border-amber-400/30" />
                  <span className="hidden md:inline font-mono text-xs font-semibold text-slate-200">
                    @{user.username}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/8 flex items-center justify-center transition-all cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="btn-primary px-3.5 py-1.5 text-xs font-bold shadow-md"
                >
                  Join
                </Link>
              </div>
            )}

            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="sm:hidden w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white"
              aria-label="Toggle mobile search"
            >
              {isOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Drawer */}
        {isOpen && (
          <div className="sm:hidden pt-3 pb-1 border-t border-white/10 mt-2.5 animate-fade-in">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                autoFocus
                placeholder="Search films, series, actors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 text-slate-100 text-xs px-3.5 py-2.5 pl-9 pr-9 rounded-xl border border-white/15 focus:outline-none focus:border-amber-400"
              />
              <Search className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          </div>
        )}
      </header>

      {/* Dedicated Mobile Bottom Navigation Bar (Smart Dock for Phones) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#090b12]/95 backdrop-blur-2xl border-t border-white/10 px-3 py-2 flex items-center justify-around shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
            isActive('/') ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-4 h-4" />
          <span className="text-[10px] font-sans">Discover</span>
        </Link>

        <Link
          to="/search"
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
            isActive('/search') ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Search className="w-4 h-4" />
          <span className="text-[10px] font-sans">Search</span>
        </Link>

        <Link
          to="/social"
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
            isActive('/social') ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="text-[10px] font-sans">Community</span>
        </Link>

        <Link
          to="/lists"
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
            isActive('/lists') ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderPlus className="w-4 h-4" />
          <span className="text-[10px] font-sans">Lists</span>
        </Link>

        <Link
          to={user ? `/profile/${user.username}` : '/login'}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
            isActive('/profile') || isActive('/login') ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span className="text-[10px] font-sans">{user ? 'Profile' : 'Sign In'}</span>
        </Link>
      </nav>
    </>
  );
}
