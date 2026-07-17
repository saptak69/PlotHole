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
    <div className="flex-1 flex items-center justify-center py-16 px-6 font-mono text-[#f2e9d8] bg-[#121008]">
      <div className="relative w-full max-w-md brutal-border p-8 bg-[#1b1810] overflow-hidden">
        {/* Retro Ticket Cutouts */}
        <div className="absolute -left-4 top-24 w-8 h-8 rounded-full bg-[#121008] border-3 border-brand-border z-20" />
        <div className="absolute -right-4 top-24 w-8 h-8 rounded-full bg-[#121008] border-3 border-brand-border z-20" />
        
        {/* Ticket Header */}
        <div className="text-center pb-6 space-y-2 relative">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Film className="w-4 h-4 text-[#9c9484]" />
            <span className="font-extrabold text-[10px] tracking-widest text-[#9c9484] uppercase">CINEMA ACCESS // REGISTER ACCESS</span>
          </div>
          <h2 className="text-2xl font-black uppercase text-brand-text tracking-tight font-bangers">Join PlotHole</h2>
          <p className="text-[9px] text-[#ff4757] font-bold tracking-widest uppercase">NEW PILOT ADMIT INTERFACE // #0807-PH</p>
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
                Set Username (Min 3 chars)
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#121008] text-[#f2e9d8] border-2 border-brand-border px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-[#f4c430] transition-all uppercase placeholder-brand-text-muted/40 font-mono"
                placeholder="CHOOSE ALIAS..."
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase text-[#9c9484] tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#121008] text-[#f2e9d8] border-2 border-brand-border px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-[#f4c430] transition-all uppercase placeholder-brand-text-muted/40 font-mono"
                placeholder="ALIAS@DOMAIN.COM"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase text-[#9c9484] tracking-wider">
                Create Passcode (Min 6 chars)
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
                {loading ? 'Registering Access...' : 'Create Access Node'}
              </button>
            </div>
          </form>

          <p className="text-center text-xs text-[#9c9484] pt-4 border-t border-brand-border/20 uppercase font-mono">
            Already have an access node?{' '}
            <Link to="/login" className="text-[#3aa6e0] hover:underline font-bold transition-colors">
              Sign In here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
