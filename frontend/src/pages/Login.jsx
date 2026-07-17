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
    <div className="flex-1 flex items-center justify-center py-16 px-6 font-mono text-[#f2e9d8] bg-[#121008]">
      <div className="relative w-full max-w-md brutal-border p-8 bg-[#1b1810] overflow-hidden">
        {/* Retro Ticket Cutouts */}
        <div className="absolute -left-4 top-24 w-8 h-8 rounded-full bg-[#121008] border-3 border-brand-border z-20" />
        <div className="absolute -right-4 top-24 w-8 h-8 rounded-full bg-[#121008] border-3 border-brand-border z-20" />
        
        {/* Ticket Header */}
        <div className="text-center pb-6 space-y-2 relative">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Film className="w-4 h-4 text-[#9c9484]" />
            <span className="font-extrabold text-[10px] tracking-widest text-[#9c9484] uppercase">CINEMA ACCESS // ADMIT ONE</span>
          </div>
          <h2 className="text-2xl font-black uppercase text-brand-text tracking-tight font-bangers">Login to PlotHole</h2>
          <p className="text-[9px] text-[#3aa6e0] font-bold tracking-widest uppercase">SECURE PORTAL ADMIT CODE // #1920-PH</p>
        </div>

        {/* Dashed line separating ticket stub */}
        <div className="border-t-3 border-dashed border-brand-border/40 my-1 mx-[-32px] relative z-10" />

        {/* Form Content */}
        <div className="pt-6 space-y-6">
          {error && (
            <div className="p-3 border-2 border-red-500 bg-red-500/10 text-red-500 rounded-sm flex items-start gap-2.5 text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-semibold text-left">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left font-mono">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase text-[#9c9484] tracking-wider">
                User Identifier (Email or Username)
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#121008] text-[#f2e9d8] border-2 border-brand-border px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-[#f4c430] transition-all uppercase placeholder-brand-text-muted/40 font-mono"
                placeholder="ENTER EMAIL OR ALIAS..."
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase text-[#9c9484] tracking-wider">
                Secret Passcode (Password)
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#121008] text-[#f2e9d8] border-2 border-brand-border px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-[#f4c430] transition-all placeholder-brand-text-muted/40 font-mono"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3"
              >
                {loading ? 'Authenticating...' : 'Validate Access Code'}
              </button>
            </div>
          </form>

          <p className="text-center text-xs text-[#9c9484] pt-4 border-t border-brand-border/20 uppercase font-mono">
            No terminal access key?{' '}
            <Link to="/signup" className="text-[#3aa6e0] hover:underline font-bold transition-colors">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
