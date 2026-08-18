import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BrandMark } from '../components/Logo';
import GlassSurface from '../components/GlassSurface';
import FaultyTerminal from '../components/FaultyTerminal';

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
    <div className="flex-1 flex items-center justify-center py-16 sm:py-24 px-4 sm:px-6 font-sans text-slate-100 relative min-h-[85vh] overflow-hidden">
      {/* Interactive FaultyTerminal Matrix Background Layer */}
      <div className="absolute inset-0 w-full h-full pointer-events-auto z-0 opacity-60">
        <FaultyTerminal
          scale={1.8}
          gridMul={[3, 1.5]}
          digitSize={1.3}
          timeScale={0.8}
          pause={false}
          scanlineIntensity={0.85}
          glitchAmount={1.2}
          flickerAmount={0.8}
          noiseAmp={1.0}
          chromaticAberration={2.5}
          dither={0.25}
          curvature={0.08}
          tint="#00f5a0"
          mouseReact={true}
          mouseStrength={0.55}
          pageLoadAnimation={false}
          brightness={1.15}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030508] via-transparent to-[#030508]/60 pointer-events-none" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <GlassSurface
          width="100%"
          height="auto"
          borderRadius={28}
          backgroundOpacity={0.84}
          blur={28}
          borderOpacity={0.18}
          className="shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_35px_rgba(0,245,160,0.12)]"
        >
          <div className="p-6 sm:p-8 space-y-6 w-full">
            {/* Header */}
            <div className="text-center pb-2 space-y-2 relative">
              <div className="flex justify-center mb-3">
                <BrandMark size="lg" />
              </div>
              <h2 className="text-2xl md:text-3xl font-display font-black text-white tracking-tight">
                Welcome Back
              </h2>
              <p className="text-xs text-slate-300 font-sans">
                Sign in to access your cinephile diary and watchlist
              </p>
            </div>

            {/* Form Content */}
            <div className="space-y-5">
              {error && (
                <div className="p-3.5 border border-rose-500/40 bg-rose-500/15 text-rose-300 rounded-2xl flex items-start gap-2.5 text-xs font-sans">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="text-left leading-relaxed">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-left font-sans">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono font-bold uppercase text-slate-300 tracking-wider">
                    Email or Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black/60 text-slate-100 border border-white/15 px-4 py-3 pl-10 text-xs rounded-xl focus:outline-none focus:border-[#00f5a0] focus:bg-black/80 transition-all placeholder:text-slate-500"
                      placeholder="name@domain.com or @username"
                    />
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono font-bold uppercase text-slate-300 tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-black/60 text-slate-100 border border-white/15 px-4 py-3 pl-10 text-xs rounded-xl focus:outline-none focus:border-[#00f5a0] focus:bg-black/80 transition-all placeholder:text-slate-500"
                      placeholder="••••••••"
                    />
                    <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary py-3 text-xs flex items-center justify-center gap-2 shadow-lg font-bold cursor-pointer"
                  >
                    <span>{loading ? 'Authenticating...' : 'Sign In to PlotHole'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>

              <p className="text-center text-xs text-slate-400 pt-4 border-t border-white/10 font-sans">
                Don't have an account?{' '}
                <Link to="/signup" className="text-[#00f5a0] hover:text-[#7affd4] font-semibold transition-colors">
                  Create one now
                </Link>
              </p>
            </div>
          </div>
        </GlassSurface>
      </div>
    </div>
  );
}
