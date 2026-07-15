import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Film } from 'lucide-react';
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
    <div className="flex-1 flex items-center justify-center py-16 px-6 font-sans text-[#e2e2e7] select-none bg-[#08080c]">
      <div className="relative w-full max-w-md bg-[#121420]/80 backdrop-blur-xl border border-white/[0.08] p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Retro Ticket Cutouts */}
        <div className="absolute -left-3 top-24 w-6 h-6 rounded-full bg-[#08080c] border border-white/[0.08] z-20" />
        <div className="absolute -right-3 top-24 w-6 h-6 rounded-full bg-[#08080c] border border-white/[0.08] z-20" />
        
        {/* Ticket Header */}
        <div className="text-center pb-6 space-y-2 relative">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Film className="w-4 h-4 text-[#86868b]" />
            <span className="font-extrabold text-[10px] tracking-widest text-[#86868b] uppercase font-mono">CINEMA ACCESS // REGISTER ACCESS</span>
          </div>
          <h2 className="text-2xl font-black uppercase text-[#f5f5f7] tracking-tight">Join PlotHole</h2>
          <p className="text-[10px] text-brutal-pink font-bold tracking-widest font-mono uppercase">NEW PILOT ADMIT INTERFACE // #0807-PH</p>
        </div>

        {/* Dashed line separating ticket stub */}
        <div className="border-t border-dashed border-white/10 my-1 mx-[-32px] relative z-10" />

        {/* Form Content */}
        <div className="pt-6 space-y-6">
          {error && (
            <div className="p-3 border border-red-500/20 bg-red-500/10 text-red-400 rounded-xl flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-semibold text-left">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase text-[#86868b] tracking-wider font-mono">
                Set Username (Min 3 chars)
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 hover:border-white/20 focus:border-brutal-pink text-[#f5f5f7] px-4 py-3 text-sm rounded-xl focus:outline-none transition-all uppercase placeholder-white/20"
                placeholder="CHOOSE ALIAS..."
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase text-[#86868b] tracking-wider font-mono">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 hover:border-white/20 focus:border-brutal-pink text-[#f5f5f7] px-4 py-3 text-sm rounded-xl focus:outline-none transition-all uppercase placeholder-white/20"
                placeholder="ALIAS@DOMAIN.COM"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase text-[#86868b] tracking-wider font-mono">
                Create Passcode (Min 6 chars)
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 hover:border-white/20 focus:border-brutal-pink text-[#f5f5f7] px-4 py-3 text-sm rounded-xl focus:outline-none transition-all placeholder-white/20"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#ff2d55] to-[#ff3b30] hover:from-[#ff453a] hover:to-[#ff5e7d] text-white py-3 font-bold text-xs uppercase rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] border-none shadow-lg shadow-red-600/15"
              >
                {loading ? 'Registering Access...' : 'Create Access Node'}
              </button>
            </div>
          </form>

          <p className="text-center text-xs text-[#86868b] pt-4 border-t border-white/5 font-mono uppercase">
            Already have an access node?{' '}
            <Link to="/login" className="text-[#0a84ff] hover:underline font-bold transition-colors">
              Sign In here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
