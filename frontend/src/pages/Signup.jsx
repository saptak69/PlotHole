import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Film, Sparkles, Lock, Mail, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (username.length < 3) {
      setError('Username must be at least 3 characters.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      await signup(username, email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-20 px-6 font-sans text-slate-100 relative">
      <div className="aurora-glow opacity-60" />

      <div 
        className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#0e111a]/90 backdrop-blur-2xl p-8 overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.8),0_0_40px_rgba(245,158,11,0.1)] z-10"
        style={{ animation: 'fade-up 300ms cubic-bezier(0.22, 1, 0.36, 1) both' }}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-amber-500/20 via-transparent to-transparent pointer-events-none" />

        {/* Header */}
        <div className="text-center pb-6 space-y-2 relative">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 mx-auto mb-3 shadow-lg">
            <Film className="w-6 h-6" />
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-extrabold text-white tracking-tight">
            Join the Cinephiles
          </h2>
          <p className="text-xs text-slate-400 font-sans">
            Log movies, share ratings, and discover cinema masterpieces
          </p>
        </div>

        {/* Form Content */}
        <div className="space-y-5">
          {error && (
            <div className="p-3.5 border border-rose-500/30 bg-rose-500/10 text-rose-400 rounded-xl flex items-start gap-2.5 text-xs font-sans">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="text-left leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left font-sans">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-bold uppercase text-slate-300 tracking-wider">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/40 text-slate-100 border border-white/10 px-4 py-3 pl-10 text-xs rounded-xl focus:outline-none focus:border-amber-400/60 focus:bg-black/80 transition-all placeholder:text-slate-500"
                  placeholder="cinephile_alias"
                />
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-bold uppercase text-slate-300 tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/40 text-slate-100 border border-white/10 px-4 py-3 pl-10 text-xs rounded-xl focus:outline-none focus:border-amber-400/60 focus:bg-black/80 transition-all placeholder:text-slate-500"
                  placeholder="name@domain.com"
                />
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-bold uppercase text-slate-300 tracking-wider">
                Password (Min 6 characters)
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 text-slate-100 border border-white/10 px-4 py-3 pl-10 text-xs rounded-xl focus:outline-none focus:border-amber-400/60 focus:bg-black/80 transition-all placeholder:text-slate-500"
                  placeholder="••••••••"
                />
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-xs flex items-center justify-center gap-2 shadow-lg"
              >
                <span>{loading ? 'Creating Account...' : 'Join PlotHole Free'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          <p className="text-center text-xs text-slate-400 pt-4 border-t border-white/10 font-sans">
            Already have an account?{' '}
            <Link to="/login" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">
              Sign In here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
