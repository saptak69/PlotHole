import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Film } from 'lucide-react';

import Navbar from './components/Navbar';
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
      <div className="min-h-screen bg-[#08090d] text-slate-100 flex flex-col selection:bg-amber-400 selection:text-black">
        <Navbar />

        <main className="flex-1 flex flex-col pb-16 md:pb-0">
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

        <footer className="py-12 border-t border-white/8 text-center text-xs text-slate-400 font-sans bg-[#08090d]">
          <div className="max-w-7xl mx-auto px-6 space-y-3">
            <div className="flex items-center justify-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold">
                <Film className="w-3.5 h-3.5" />
              </div>
              <span className="font-display font-bold text-base text-slate-100">
                Plot<span className="text-amber-400">Hole</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              The social network & diary for cinephiles. Discover masterpieces, log honest ratings, and follow film lovers.
            </p>
            <p className="font-mono text-[11px] text-slate-500 pt-1">
              © {new Date().getFullYear()} PlotHole. Powered by TMDB API.
            </p>
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
