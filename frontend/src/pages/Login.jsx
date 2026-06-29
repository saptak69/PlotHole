import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
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
    <div className="flex-1 flex items-center justify-center py-12 px-6 font-mono text-black">
      <div className="w-full max-w-md win95-notepad p-1 shadow-2xl">
        {/* Title bar */}
        <div className="win95-titlebar mb-4">
          <span>Login.exe</span>
          <div className="flex gap-1">
            <button className="win95-btn">?</button>
            <button className="win95-btn">X</button>
          </div>
        </div>

        <div className="p-4 space-y-6">
          <div className="text-center md:text-left border-b-2 border-dashed border-gray-400 pb-4">
            <h2 className="text-xl font-black uppercase text-black">Login to PlotHole</h2>
            <p className="text-xs text-gray-700 mt-1">RESTRICTED TERMINAL INTERFACE</p>
          </div>

          {error && (
            <div className="p-3 border-2 border-red-600 bg-red-600/10 text-red-600 rounded-none flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
              <span className="font-bold">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase text-gray-700 mb-2">
                User Identifier (Email or Username)
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="win95-textarea w-full px-3 py-2 text-black text-sm"
                placeholder="INPUT ID..."
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-gray-700 mb-2">
                Secret Passcode (Password)
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="win95-textarea w-full px-3 py-2 text-black text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brutal-cyan text-black border-3 border-black py-2.5 font-black text-xs uppercase shadow-[4px_4px_0px_#000] hover:bg-white transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              {loading ? 'Authenticating...' : 'Submit_Auth'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-700 pt-2 border-t border-gray-400">
            No terminal access key?{' '}
            <Link to="/signup" className="text-blue-800 hover:underline font-black">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
