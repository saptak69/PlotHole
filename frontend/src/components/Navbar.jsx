import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, LogOut, Bookmark, Users, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // 1. Add/remove tint based on whether we are at the very top (y = 0)
      if (currentScrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      // 2. Hide when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        setVisible(false);
      } else {
        setVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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
    <nav className={`sticky z-50 transition-all duration-300 select-none py-4 px-6 md:px-12 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 border-b-3 border-brand-border bg-[#121008] ${
      visible ? 'top-0' : '-top-32 md:-top-28'
    }`}>
      
      {/* Top Header Row: Logo & Hamburger button */}
      <div className="flex items-center justify-between w-full md:w-auto">
        <Link to="/" className="flex items-center gap-3 transition-transform hover:opacity-95" onClick={handleLinkClick}>
          <div className="w-[42px] h-[42px] border-3 border-brand-border rounded-full flex items-center justify-center bg-[#f4c430] text-[#121008] font-bangers text-[22px] transform rotate-[-6deg] shadow-md">
            P!
          </div>
          <div className="flex flex-col text-left">
            <span className="font-bangers text-[30px] tracking-wide leading-none text-brand-text">
              Plot<span className="text-[#ff4757]">Hole</span>
            </span>
            <span className="font-mono text-[9px] tracking-widest text-brand-text-muted uppercase font-bold mt-1">
              The Cinema Chronicles
            </span>
          </div>
        </Link>

        {/* Mobile Toggle Trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden w-10 h-10 bg-[#1b1810] border-3 border-brand-border flex items-center justify-center hover:bg-[#2b2820] text-brand-text transition-colors"
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Collapsible Menu: Search bar and Links */}
      <div className={`${
        isOpen ? 'flex' : 'hidden'
      } md:flex flex-col md:flex-row items-center gap-6 w-full md:w-auto pb-4 md:pb-0 pt-3 md:pt-0 bg-[#121008] md:bg-transparent p-4 md:p-0 border-3 border-brand-border md:border-none mt-2 md:mt-0`}>
        
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-auto">
          <input
            type="text"
            placeholder="Search movies, TV shows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64 bg-[#1b1810] text-brand-text font-medium border-2 border-brand-border px-4 py-2 pl-9 text-xs placeholder-[#9c9484] focus:outline-none focus:border-[#f4c430] transition-all md:focus:w-80"
          />
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#9c9484]" />
          <button type="submit" className="hidden">Search</button>
        </form>

        {/* Navigation Links */}
        <div className="flex flex-col md:flex-row items-center gap-5 w-full md:w-auto">
          {user ? (
            <>
              <Link 
                to="/social" 
                onClick={handleLinkClick}
                className={`${
                  isActive('/social')
                    ? 'bg-[#ff4757] text-[#121008] border-brand-border shadow-[2px_2px_0_#f2e9d8] rotate-[-2deg]'
                    : 'bg-[#1b1810] text-[#f2e9d8] border-brand-border/40 hover:border-brand-border hover:bg-[#ff4757]/10 hover:text-[#ff4757] hover:rotate-[1deg]'
                } flex items-center justify-center gap-1.5 text-[10px] font-mono font-bold tracking-wider uppercase px-4 py-2 border-2 transition-all transform select-none w-full md:w-auto`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Cine-Feed</span>
              </Link>


              {/* Profile Info */}
              <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto md:pl-4 border-t-3 md:border-t-0 md:border-l-3 border-brand-border pt-3 md:pt-0">
                <Link 
                  to={`/profile/${user.username}`} 
                  onClick={handleLinkClick}
                  className="flex items-center gap-2 group py-1"
                >
                  <Avatar
                    username={user.username}
                    url={user.avatar_url}
                    className="w-6 h-6 border-2 border-brand-border group-hover:border-[#ff4757] transition-colors rounded-none"
                  />
                  <span className="text-xs font-mono font-bold text-brand-text group-hover:text-[#ff4757] transition-colors tracking-wider">
                    @{user.username}
                  </span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    handleLinkClick();
                  }}
                  title="Log Out"
                  className="text-[#9c9484] hover:text-[#ff4757] p-2 hover:bg-[#ff4757]/5 transition-colors w-full md:w-auto flex items-center justify-center gap-1.5 md:gap-0 border-2 border-brand-border md:border-0 rounded-none text-xs font-mono font-bold uppercase tracking-wider"
                >
                  <LogOut className="w-3.5 h-3.5 md:inline" />
                  <span className="md:hidden">Log Out</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto border-t-3 md:border-t-0 border-brand-border pt-3 md:pt-0">
              <Link
                to="/login"
                onClick={handleLinkClick}
                className="text-[#9c9484] hover:text-brand-text text-xs font-mono font-bold uppercase tracking-wider py-1.5"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={handleLinkClick}
                className="btn-primary px-4 py-2 w-full md:w-auto"
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
