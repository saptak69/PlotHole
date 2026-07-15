import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Film } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
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
            <span className="font-extrabold text-[10px] tracking-widest text-[#86868b] uppercase font-mono">CINEMA ACCESS // ADMIT ONE</span>
          </div>
          <h2 className="text-2xl font-black uppercase text-[#f5f5f7] tracking-tight">Login to PlotHole</h2>
          <p className="text-[10px] text-brutal-cyan font-bold tracking-widest font-mono uppercase">SECURE PORTAL ADMIT CODE // #1920-PH</p>
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
                User Identifier (Email or Username)
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 hover:border-white/20 focus:border-brutal-cyan text-[#f5f5f7] px-4 py-3 text-sm rounded-xl focus:outline-none transition-all uppercase placeholder-white/20"
                placeholder="ENTER EMAIL OR ALIAS..."
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase text-[#86868b] tracking-wider font-mono">
                Secret Passcode (Password)
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 hover:border-white/20 focus:border-brutal-cyan text-[#f5f5f7] px-4 py-3 text-sm rounded-xl focus:outline-none transition-all placeholder-white/20"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-[#0a84ff] hover:from-blue-500 hover:to-[#3399ff] text-white py-3 font-bold text-xs uppercase rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] border-none shadow-lg shadow-blue-600/15"
              >
                {loading ? 'Authenticating...' : 'Validate Access Code'}
              </button>
            </div>
          </form>

          <p className="text-center text-xs text-[#86868b] pt-4 border-t border-white/5 font-mono uppercase">
            No terminal access key?{' '}
            <Link to="/signup" className="text-[#0a84ff] hover:underline font-bold transition-colors">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
