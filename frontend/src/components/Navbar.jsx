import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Users, FolderPlus, LogOut, Home, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import Logo from './Logo';
import GlassSurface from './GlassSurface';

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
        className={`sticky z-50 transition-all duration-300 select-none py-3.5 px-4 sm:px-6 md:px-12 border-b border-white/8 bg-[#030508]/85 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.8)] ${
          visible ? 'top-0' : '-top-28'
        }`}
      >
        <div className="max-w-7xl mx-auto relative flex items-center justify-between gap-4 md:gap-6">
          {/* Brand Logo */}
          <Logo size="sm" onClick={handleLinkClick} />

          {/* Desktop Navigation Links - Centered in navbar with GlassSurface */}
          <div className="hidden md:block absolute left-1/2 -translate-x-1/2">
            <GlassSurface
              width="auto"
              height="auto"
              borderRadius={18}
              backgroundOpacity={0.82}
              blur={24}
              borderOpacity={0.18}
              className="p-1 shadow-[0_8px_32px_rgba(0,0,0,0.7),0_0_15px_rgba(0,245,160,0.06)]"
            >
              <nav className="flex items-center gap-1.5 px-1 py-0.5">
                <Link
                  to="/"
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
                    isActive('/')
                      ? 'bg-gradient-to-r from-[#00f5a0] to-[#00d4ff] text-black shadow-[0_0_15px_rgba(0,245,160,0.4)]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Discover
                </Link>
                <Link
                  to="/social"
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
                    isActive('/social')
                      ? 'bg-gradient-to-r from-[#00f5a0] to-[#00d4ff] text-black shadow-[0_0_15px_rgba(0,245,160,0.4)]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Community
                </Link>
                <Link
                  to="/lists"
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
                    isActive('/lists')
                      ? 'bg-gradient-to-r from-[#00f5a0] to-[#00d4ff] text-black shadow-[0_0_15px_rgba(0,245,160,0.4)]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Lists
                </Link>
              </nav>
            </GlassSurface>
          </div>

          {/* Search & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Universal Search Bar (Desktop & Tablet) */}
            <form onSubmit={handleSearchSubmit} className="relative hidden sm:block">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search films, series, critics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 md:w-64 lg:w-72 bg-white/5 hover:bg-white/8 text-slate-100 text-xs px-3.5 py-2 pl-9 pr-10 rounded-xl border border-white/10 focus:outline-none focus:border-[#00f5a0]/70 focus:w-80 transition-all placeholder:text-slate-500"
              />
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <kbd className="absolute right-2.5 top-2 px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-mono text-slate-400 border border-white/10 pointer-events-none hidden md:block">
                ⌘K
              </kbd>
            </form>

            {/* User Account / Sign In */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to={`/profile/${user.username}`}
                  onClick={handleLinkClick}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#00f5a0]/40 transition-all group"
                >
                  <Avatar username={user.username} url={user.avatar_url} className="w-6 h-6 border border-white/15" />
                  <span className="font-mono text-xs font-semibold text-slate-200 group-hover:text-[#00f5a0] hidden md:inline truncate max-w-[90px]">
                    @{user.username}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="btn-secondary px-3.5 py-1.5 text-xs font-semibold"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="btn-primary px-3.5 py-1.5 text-xs font-bold shadow-md hidden sm:inline-flex"
                >
                  Join Free
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Floating Bottom Dock with Apple Frosted GlassSurface */}
      <div className="md:hidden fixed bottom-3 inset-x-3 z-50">
        <GlassSurface
          width="100%"
          height="auto"
          borderRadius={24}
          backgroundOpacity={0.88}
          blur={32}
          borderOpacity={0.22}
          className="glass-surface--dock shadow-[0_12px_45px_rgba(0,0,0,0.98),0_0_25px_rgba(0,245,160,0.12)]"
        >
          <div className="flex items-center justify-around w-full py-2 px-3">
            <Link
              to="/"
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                isActive('/') ? 'text-[#00f5a0] bg-white/5 font-bold shadow-[0_0_10px_rgba(0,245,160,0.2)]' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="text-[10px] font-mono uppercase tracking-wider">Discover</span>
            </Link>

            <Link
              to="/social"
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                isActive('/social') ? 'text-[#00f5a0] bg-white/5 font-bold shadow-[0_0_10px_rgba(0,245,160,0.2)]' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="text-[10px] font-mono uppercase tracking-wider">Feed</span>
            </Link>

            <Link
              to="/lists"
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                isActive('/lists') ? 'text-[#00f5a0] bg-white/5 font-bold shadow-[0_0_10px_rgba(0,245,160,0.2)]' : 'text-slate-300 hover:text-white'
              }`}
            >
              <FolderPlus className="w-4 h-4" />
              <span className="text-[10px] font-mono uppercase tracking-wider">Lists</span>
            </Link>

            {user ? (
              <Link
                to={`/profile/${user.username}`}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  isActive(`/profile/${user.username}`) ? 'text-[#00f5a0] bg-white/5 font-bold shadow-[0_0_10px_rgba(0,245,160,0.2)]' : 'text-slate-300 hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                <span className="text-[10px] font-mono uppercase tracking-wider">Profile</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex flex-col items-center gap-1 p-2 rounded-xl text-[#00f5a0] hover:bg-white/5"
              >
                <User className="w-4 h-4" />
                <span className="text-[10px] font-mono uppercase tracking-wider">Sign In</span>
              </Link>
            )}
          </div>
        </GlassSurface>
      </div>
    </>
  );
}
