import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

import Navbar from './components/Navbar';
import Logo, { BrandMark } from './components/Logo';
import Home from './pages/Home';
import MovieDetails from './pages/MovieDetails';
import SearchPage from './pages/Search';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SocialFeed from './pages/SocialFeed';
import ListsPage from './pages/Lists';
import PersonModal from './components/PersonModal';

import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes fresh cache
      gcTime: 30 * 60 * 1000, // 30 minutes cache retention
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function NavigateToMedia() {
  const { id } = useParams();
  return <Navigate to={`/media/movie/${id}`} replace />;
}

function MainLayout() {
  const [selectedPersonId, setSelectedPersonId] = useState(null);

  return (
    <>
      <div className="min-h-screen bg-[#08080a] text-slate-100 flex flex-col selection:bg-[#e50914] selection:text-white relative">
        {/* Vibrant Cinema Ambient Background Lighting Layer (GPU Native) */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 will-change-transform transform-gpu" style={{ contain: 'strict' }}>
          {/* Top Radiant Spotlight (Netflix Red & Cinema Gold) */}
          <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-[950px] h-[550px] bg-[radial-gradient(ellipse_at_top,rgba(229,9,20,0.20)_0%,rgba(255,46,59,0.09)_40%,transparent_75%)] transform-gpu" />
          
          {/* Left Radiant Cinema Gold Ambient Glow */}
          <div className="absolute top-1/4 -left-48 w-[650px] h-[650px] bg-[radial-gradient(circle_at_center,rgba(255,184,0,0.09)_0%,rgba(229,9,20,0.04)_45%,transparent_70%)] transform-gpu" />

          {/* Right Deep Crimson Ambient Glow */}
          <div className="absolute top-2/3 -right-48 w-[700px] h-[700px] bg-[radial-gradient(circle_at_center,rgba(229,9,20,0.13)_0%,rgba(184,7,16,0.05)_45%,transparent_70%)] transform-gpu" />
        </div>

        {/* Subtle Ambient Film Grain */}
        <div className="film-grain" />

        <Navbar />

        <main className="flex-1 flex flex-col pb-16 md:pb-0 relative z-10">
          <Routes>
            <Route path="/" element={<Home onOpenPerson={(id) => setSelectedPersonId(id)} />} />
            <Route path="/movies/:id" element={<NavigateToMedia />} />
            <Route path="/media/:mediaType/:id" element={<MovieDetails onOpenPerson={(id) => setSelectedPersonId(id)} />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/social" element={<SocialFeed />} />
            <Route path="/lists" element={<ListsPage />} />
            <Route path="/lists/:id" element={<ListsPage />} />
          </Routes>
        </main>

        {/* Luxury Cinema Footer */}
        <footer className="py-14 border-t border-white/8 bg-[#040406] text-slate-400 font-sans relative overflow-hidden">
          {/* Ambient Bottom Glow */}
          <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#e50914]/8 via-transparent to-transparent pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 space-y-8 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-white/8 text-center md:text-left">
              <div className="space-y-2">
                <Logo size="md" showTagline={true} />
                <p className="text-xs text-slate-400 max-w-md leading-relaxed pt-1">
                  The social chronicle & review vault for discerning cinephiles. Discover masterworks, log honest verdicts, and mind the gap in cinema.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-mono">
                <Link to="/" className="hover:text-[#e50914] transition-colors">Discover</Link>
                <Link to="/social" className="hover:text-[#e50914] transition-colors">Community Feed</Link>
                <Link to="/lists" className="hover:text-[#e50914] transition-colors">Curated Lists</Link>
                <Link to="/search" className="hover:text-[#e50914] transition-colors">Search Vault</Link>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
              <p>© {new Date().getFullYear()} PlotHole Chronicles. All rights reserved.</p>
              <p className="flex items-center gap-2">
                <span>Curated with craft</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#e50914] inline-block shadow-[0_0_8px_#e50914]" />
                <span>Powered by TMDB API</span>
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* Global Person Filmography Modal */}
      <PersonModal personId={selectedPersonId} onClose={() => setSelectedPersonId(null)} />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <MainLayout />
          </Router>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
