import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Lock, Mail, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BrandMark } from '../components/Logo';
import GlassSurface from '../components/GlassSurface';

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
    <div className="flex-1 flex items-center justify-center py-16 sm:py-24 px-4 sm:px-6 font-sans text-slate-100 relative min-h-[85vh] overflow-hidden">
      <div className="relative z-10 w-full max-w-md">
        <GlassSurface
          width="100%"
          height="auto"
          borderRadius={28}
          backgroundOpacity={0.72}
          blur={20}
          borderOpacity={0.16}
          frosted={true}
          className="shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_35px_rgba(229,9,20,0.12)]"
        >
          <div className="p-6 sm:p-8 space-y-6 w-full">
            {/* Header */}
            <div className="text-center pb-2 space-y-2 relative">
              <div className="flex justify-center mb-3">
                <BrandMark size="lg" />
              </div>
              <h2 className="text-2xl md:text-3xl font-display font-black uppercase text-white tracking-tight">
                Join PlotHole
              </h2>
              <p className="text-xs text-slate-200 font-medium font-sans">
                Log movies, share verdicts, and mind the gap in cinema
              </p>
            </div>

            {/* Form Content */}
            <div className="space-y-5">
              {error && (
                <div className="p-3.5 border border-rose-500/40 bg-rose-500/15 text-rose-300 rounded-2xl flex items-start gap-2.5 text-xs font-sans font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="text-left leading-relaxed">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-left font-sans">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono font-black uppercase text-slate-200 tracking-wider">
                    Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-black/60 text-slate-100 border border-white/15 px-4 py-3 pl-10 text-xs rounded-xl focus:outline-none focus:border-[#e50914] focus:bg-black/80 transition-all placeholder:text-slate-500"
                      placeholder="cinephile_alias"
                    />
                    <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono font-black uppercase text-slate-200 tracking-wider">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black/60 text-slate-100 border border-white/15 px-4 py-3 pl-10 text-xs rounded-xl focus:outline-none focus:border-[#e50914] focus:bg-black/80 transition-all placeholder:text-slate-500"
                      placeholder="name@domain.com"
                    />
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono font-black uppercase text-slate-200 tracking-wider">
                    Password (Min 6 characters)
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-black/60 text-slate-100 border border-white/15 px-4 py-3 pl-10 text-xs rounded-xl focus:outline-none focus:border-[#e50914] focus:bg-black/80 transition-all placeholder:text-slate-500"
                      placeholder="••••••••"
                    />
                    <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary py-3 text-xs flex items-center justify-center gap-2 shadow-lg font-display font-black uppercase tracking-wider cursor-pointer"
                  >
                    <span>{loading ? 'Creating Account...' : 'Join PlotHole Free'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>

              <p className="text-center text-xs text-slate-300 pt-4 border-t border-white/10 font-sans">
                Already have an account?{' '}
                <Link to="/login" className="text-[#ff4d5a] hover:text-[#ffb800] font-bold font-mono uppercase tracking-wide transition-colors">
                  Sign In here
                </Link>
              </p>
            </div>
          </div>
        </GlassSurface>
      </div>
    </div>
  );
}
