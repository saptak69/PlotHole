import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Users, FolderPlus, LogOut, Home, User, Compass, X, Film, Sparkles, TrendingUp, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL, getPosterUrl } from '../config';
import Avatar from './Avatar';
import Logo from './Logo';
import GlassSurface from './GlassSurface';
import RatingBadge from './RatingBadge';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [liveResults, setLiveResults] = useState([]);
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const searchInputRef = useRef(null);
  const modalInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 15);
      if (currentScrollY > lastScrollY.current && currentScrollY > 120) {
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
        setIsSearchModalOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchModalOpen(false);
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Autofocus search modal input when opened
  useEffect(() => {
    if (isSearchModalOpen) {
      setTimeout(() => {
        modalInputRef.current?.focus();
      }, 100);
    } else {
      setLiveResults([]);
    }
  }, [isSearchModalOpen]);

  // Live search debounced fetch
  useEffect(() => {
    if (!searchQuery.trim()) {
      setLiveResults([]);
      setIsLiveLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLiveLoading(true);
      try {
        const res = await fetch(`${API_URL}/movies/search?query=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setLiveResults((data.results || []).slice(0, 6));
        }
      } catch (err) {
        console.error('Live search error:', err);
      } finally {
        setIsLiveLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery('');
    setIsOpen(false);
    setIsSearchModalOpen(false);
  };

  const handleQuickTagClick = (tag) => {
    navigate(`/search?q=${encodeURIComponent(tag)}`);
    setSearchQuery('');
    setIsSearchModalOpen(false);
  };

  const handleLinkClick = () => {
    setIsOpen(false);
    setIsSearchModalOpen(false);
  };

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      {/* Top Header - Seamless Transparent Header */}
      <header
        className={`sticky z-50 transition-all duration-300 select-none py-2.5 sm:py-3 px-4 sm:px-6 md:px-12 ${
          visible ? 'top-0' : '-top-28'
        } ${
          scrolled
            ? 'bg-[#08080a]/65 backdrop-blur-xl border-b border-white/6 shadow-[0_4px_30px_rgba(0,0,0,0.6)]'
            : 'bg-transparent border-b border-transparent shadow-none'
        }`}
      >
        <div className="max-w-7xl mx-auto flex md:grid md:grid-cols-[1fr_auto_1fr] items-center justify-between gap-3 sm:gap-4 md:gap-6 w-full">
          {/* Column 1: Left Brand Logo */}
          <div className="flex items-center justify-start shrink-0">
            <Logo size="sm" onClick={handleLinkClick} />
          </div>

          {/* Column 2: Exact Dead-Center Navigation Links (100% True Symmetry) */}
          <div className="hidden md:flex items-center justify-center">
            <GlassSurface
              width="auto"
              height="auto"
              borderRadius={20}
              backgroundOpacity={0.05}
              blur={12}
              borderOpacity={0.12}
              className="p-1 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_15px_rgba(229,9,20,0.04)]"
            >
              <nav className="flex items-center gap-1 sm:gap-1.5 px-1 py-0.5">
                <Link
                  to="/"
                  className={`px-3.5 lg:px-4 py-1.5 lg:py-2 rounded-xl text-xs font-display font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 lg:gap-2 shrink-0 ${
                    isActive('/')
                      ? 'bg-gradient-to-r from-[#e50914] to-[#ff2e3b] text-white shadow-[0_0_15px_rgba(229,9,20,0.4)]'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Discover</span>
                </Link>
                <Link
                  to="/social"
                  className={`px-3.5 lg:px-4 py-1.5 lg:py-2 rounded-xl text-xs font-display font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 lg:gap-2 shrink-0 ${
                    isActive('/social')
                      ? 'bg-gradient-to-r from-[#e50914] to-[#ff2e3b] text-white shadow-[0_0_15px_rgba(229,9,20,0.4)]'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Community</span>
                </Link>
                <Link
                  to="/lists"
                  className={`px-3.5 lg:px-4 py-1.5 lg:py-2 rounded-xl text-xs font-display font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 lg:gap-2 shrink-0 ${
                    isActive('/lists')
                      ? 'bg-gradient-to-r from-[#e50914] to-[#ff2e3b] text-white shadow-[0_0_15px_rgba(229,9,20,0.4)]'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Lists</span>
                </Link>
              </nav>
            </GlassSurface>
          </div>

          {/* Column 3: Right Search & Actions (Right-Aligned in its Column) */}
          <div className="flex items-center justify-end gap-2 sm:gap-2.5">
            {/* Mobile Header Quick Search Button */}
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="flex sm:hidden items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 shadow-sm transition-all cursor-pointer"
              aria-label="Open Search Vault"
            >
              <Search className="w-4 h-4 text-[#e50914]" />
            </button>

            {/* Universal Search Bar (Desktop & Tablet) */}
            <form onSubmit={handleSearchSubmit} className="relative hidden sm:block">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search films, critics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchModalOpen(true)}
                className="w-32 sm:w-36 md:w-36 lg:w-48 xl:w-56 bg-white/5 hover:bg-white/8 focus:bg-black/80 focus:w-44 lg:focus:w-64 text-white placeholder-slate-400 text-xs font-mono font-medium rounded-full pl-8 pr-3 py-1.5 border border-white/10 focus:border-[#e50914] focus:ring-1 focus:ring-[#e50914] transition-all outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </form>

            {/* Auth Dropdown & User Avatar */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex items-center gap-2.5 p-1 rounded-full hover:bg-white/10 transition-colors focus:outline-none"
                >
                  <Avatar username={user.username} url={user.avatar_url} className="w-8 h-8 ring-2 ring-[#e50914]/50" />
                </button>

                {isOpen && (
                  <div
                    className="absolute right-0 mt-3 w-56 bg-[#121216]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.9)] py-2 text-left z-50 animate-in fade-in zoom-in-95 duration-150"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="px-4 py-3 border-b border-white/8">
                      <p className="text-xs font-mono text-slate-400">Signed in as</p>
                      <p className="text-sm font-display font-black text-white truncate mt-0.5">@{user.username}</p>
                    </div>

                    <Link
                      to={`/profile/${user.username}`}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-display font-bold text-slate-200 hover:text-white hover:bg-white/5 transition-colors uppercase tracking-wider"
                    >
                      <User className="w-4 h-4 text-[#e50914]" />
                      <span>Vault Profile</span>
                    </Link>

                    <Link
                      to="/lists"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-display font-bold text-slate-200 hover:text-white hover:bg-white/5 transition-colors uppercase tracking-wider"
                    >
                      <FolderPlus className="w-4 h-4 text-[#e50914]" />
                      <span>My Collections</span>
                    </Link>

                    <div className="my-1 border-t border-white/8" />

                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-display font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors uppercase tracking-wider cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-xl text-xs font-display font-black uppercase tracking-wider text-slate-300 hover:text-white transition-colors whitespace-nowrap"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="btn-primary py-1.5 px-3.5 text-xs font-black uppercase tracking-wider shadow-md whitespace-nowrap"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Floating Bottom Dock with Symmetrical 5-Item Liquid GlassSurface */}
      <div className="md:hidden fixed bottom-3 inset-x-3 z-50">
        <GlassSurface
          width="100%"
          height="auto"
          borderRadius={24}
          backgroundOpacity={0.06}
          blur={14}
          borderOpacity={0.14}
          className="glass-surface--dock shadow-[0_12px_45px_rgba(0,0,0,0.95),0_0_20px_rgba(229,9,20,0.1)] p-1"
        >
          <div className="flex items-center justify-around w-full py-1 px-0.5 gap-0.5">
            <Link
              to="/"
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
                isActive('/')
                  ? 'bg-gradient-to-r from-[#e50914] to-[#ff2e3b] text-white shadow-[0_0_12px_rgba(229,9,20,0.4)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span className="text-[9px] font-display font-black uppercase tracking-wider mt-0.5">Discover</span>
            </Link>

            <button
              onClick={() => setIsSearchModalOpen(true)}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer ${
                isActive('/search') || isSearchModalOpen
                  ? 'bg-gradient-to-r from-[#e50914] to-[#ff2e3b] text-white shadow-[0_0_12px_rgba(229,9,20,0.4)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Search className="w-4 h-4" />
              <span className="text-[9px] font-display font-black uppercase tracking-wider mt-0.5">Search</span>
            </button>

            <Link
              to="/social"
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
                isActive('/social')
                  ? 'bg-gradient-to-r from-[#e50914] to-[#ff2e3b] text-white shadow-[0_0_12px_rgba(229,9,20,0.4)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="text-[9px] font-display font-black uppercase tracking-wider mt-0.5">Feed</span>
            </Link>

            <Link
              to="/lists"
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
                isActive('/lists')
                  ? 'bg-gradient-to-r from-[#e50914] to-[#ff2e3b] text-white shadow-[0_0_12px_rgba(229,9,20,0.4)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <FolderPlus className="w-4 h-4" />
              <span className="text-[9px] font-display font-black uppercase tracking-wider mt-0.5">Lists</span>
            </Link>

            {user ? (
              <Link
                to={`/profile/${user.username}`}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
                  isActive(`/profile/${user.username}`)
                    ? 'bg-gradient-to-r from-[#e50914] to-[#ff2e3b] text-white shadow-[0_0_12px_rgba(229,9,20,0.4)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <User className="w-4 h-4" />
                <span className="text-[9px] font-display font-black uppercase tracking-wider mt-0.5">Vault</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl text-slate-300 hover:text-white hover:bg-white/5"
              >
                <User className="w-4 h-4" />
                <span className="text-[9px] font-display font-black uppercase tracking-wider mt-0.5">Sign In</span>
              </Link>
            )}
          </div>
        </GlassSurface>
      </div>

      {/* Quick Search Overlay Modal (Universal & Mobile Responsive) */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-20 px-3 sm:px-4 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-200">
          <div
            className="w-full max-w-2xl bg-[#0e0e12]/95 border border-white/12 rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_40px_rgba(229,9,20,0.18)] overflow-hidden text-left"
            style={{ animation: 'fade-up 220ms cubic-bezier(0.16, 1, 0.3, 1) both' }}
          >
            {/* Search Input Bar */}
            <form onSubmit={handleSearchSubmit} className="relative p-3.5 sm:p-4 border-b border-white/8 flex items-center gap-3">
              <Search className="w-5 h-5 text-[#e50914] shrink-0" />
              <input
                ref={modalInputRef}
                type="text"
                placeholder="Search films, series, directors, critics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-white placeholder-slate-400 font-sans text-sm sm:text-base outline-none pr-8"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsSearchModalOpen(false)}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </form>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto space-y-5 scrollbar-none">
              {/* Quick Trending Tags */}
              {!searchQuery && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase text-slate-400">
                    <TrendingUp className="w-3.5 h-3.5 text-[#ffb800]" />
                    <span>Popular Searches</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['Dune', 'Oppenheimer', 'Interstellar', 'Severance', 'Christopher Nolan', 'Denis Villeneuve', 'Pure Cinema'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleQuickTagClick(tag)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-[#e50914]/20 border border-white/8 hover:border-[#e50914]/40 text-xs font-sans text-slate-200 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3 h-3 text-[#e50914]" />
                        <span>{tag}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Search Results */}
              {isLiveLoading && (
                <div className="p-6 text-center text-xs font-mono text-slate-400 animate-pulse">
                  SEARCHING VAULT ARCHIVES...
                </div>
              )}

              {!isLiveLoading && liveResults.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block pb-1">
                    Instant Matches ({liveResults.length})
                  </span>
                  <div className="space-y-1.5">
                    {liveResults.map((item) => (
                      item.media_type === 'user' ? (
                        <Link
                          key={`user-${item.id}`}
                          to={`/profile/${item.username}`}
                          onClick={handleLinkClick}
                          className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/6 transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar username={item.username} url={item.avatar_url} className="w-9 h-9" />
                            <div className="min-w-0">
                              <span className="font-display font-bold text-sm text-white block truncate">
                                @{item.username}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 truncate block">
                                Critic Profile
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-500" />
                        </Link>
                      ) : (
                        <Link
                          key={`movie-${item.id}`}
                          to={`/media/${item.media_type || 'movie'}/${item.id}`}
                          onClick={handleLinkClick}
                          className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/6 transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-14 rounded-lg overflow-hidden bg-black shrink-0 border border-white/10">
                              <img
                                src={getPosterUrl(item.poster_path, 'w92')}
                                alt={item.title || item.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              <p className="font-display font-bold text-sm text-white truncate">
                                {item.title || item.name}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-slate-400 uppercase">
                                  {item.media_type === 'tv' ? 'Series' : 'Film'}
                                </span>
                                {(item.release_date || item.first_air_date) && (
                                  <span className="text-[10px] font-mono text-slate-500">
                                    {(item.release_date || item.first_air_date).substring(0, 4)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {item.vote_average > 0 && (
                            <RatingBadge rating={Math.round(item.vote_average / 2)} size="xs" />
                          )}
                        </Link>
                      )
                    ))}
                  </div>

                  <button
                    onClick={handleSearchSubmit}
                    className="w-full py-2.5 mt-2 rounded-xl bg-[#e50914]/20 hover:bg-[#e50914]/30 border border-[#e50914]/40 text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>View All Results for "{searchQuery}"</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {!isLiveLoading && searchQuery && liveResults.length === 0 && (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <p className="text-sm font-display font-bold text-slate-200">No instant preview found</p>
                  <p className="text-xs font-sans text-slate-400">Press Enter to perform a full database search for "{searchQuery}".</p>
                  <button
                    onClick={handleSearchSubmit}
                    className="btn-primary py-2 px-5 text-xs font-bold font-mono mt-2"
                  >
                    Run Full Search
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

