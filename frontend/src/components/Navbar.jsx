import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Film, Users, FolderPlus, LogOut, Menu, X, Sparkles } from 'lucide-react';
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
    <header
      className={`sticky z-50 transition-all duration-300 select-none py-3.5 px-6 md:px-12 border-b border-white/8 bg-[#090b12]/90 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] ${
        visible ? 'top-0' : '-top-28'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group" onClick={handleLinkClick}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-[#090b12] shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-transform group-hover:scale-105">
            <Film className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-white flex items-center gap-1">
            Plot<span className="text-amber-400">Hole</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-white/5 border border-white/8 p-1 rounded-xl">
          <Link
            to="/"
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              isActive('/')
                ? 'bg-amber-500 text-[#090b12] shadow-sm font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Discover
          </Link>
          <Link
            to="/social"
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              isActive('/social')
                ? 'bg-amber-500 text-[#090b12] shadow-sm font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Community
          </Link>
          <Link
            to="/lists"
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              isActive('/lists')
                ? 'bg-amber-500 text-[#090b12] shadow-sm font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Lists
          </Link>
        </nav>

        {/* Search & User Profile */}
        <div className="flex items-center gap-3">
          {/* Universal Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative hidden sm:block">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search films, series, people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-56 md:w-72 bg-white/5 hover:bg-white/8 text-slate-100 text-xs px-3.5 py-2 pl-9 pr-10 rounded-xl border border-white/10 focus:outline-none focus:border-amber-400/60 focus:w-80 transition-all placeholder:text-slate-500"
            />
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <kbd className="absolute right-2.5 top-2 px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-mono text-slate-400 border border-white/10 pointer-events-none">
              ⌘K
            </kbd>
          </form>

          {/* User Account / Sign In */}
          {user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-white/10">
              <Link
                to={`/profile/${user.username}`}
                className="flex items-center gap-2 py-1 px-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
                title="View your diary & profile"
              >
                <Avatar username={user.username} url={user.avatar_url} className="w-7 h-7 border border-amber-400/30" />
                <span className="hidden md:inline font-mono text-xs font-semibold text-slate-200">
                  @{user.username}
                </span>
              </Link>
              <button
                onClick={logout}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/8 flex items-center justify-center transition-all"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="btn-primary px-4 py-1.5 text-xs font-bold shadow-md"
              >
                Join Free
              </Link>
            </div>
          )}

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden pt-4 pb-2 border-t border-white/10 mt-3 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search films, series..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 text-slate-100 text-xs px-3.5 py-2.5 pl-9 rounded-xl border border-white/10"
            />
            <Search className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400" />
          </form>

          <div className="flex flex-col gap-1 text-left">
            <Link
              to="/"
              onClick={handleLinkClick}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold ${
                isActive('/') ? 'bg-amber-500 text-black font-bold' : 'text-slate-300'
              }`}
            >
              Discover
            </Link>
            <Link
              to="/social"
              onClick={handleLinkClick}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold ${
                isActive('/social') ? 'bg-amber-500 text-black font-bold' : 'text-slate-300'
              }`}
            >
              Community
            </Link>
            <Link
              to="/lists"
              onClick={handleLinkClick}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold ${
                isActive('/lists') ? 'bg-amber-500 text-black font-bold' : 'text-slate-300'
              }`}
            >
              Lists
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
