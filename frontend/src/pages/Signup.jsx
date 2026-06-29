import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
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
    <div className="flex-1 flex items-center justify-center py-12 px-6 font-mono text-black">
      <div className="w-full max-w-md win95-notepad p-1 shadow-2xl">
        {/* Title bar */}
        <div className="win95-titlebar mb-4">
          <span>Register.exe</span>
          <div className="flex gap-1">
            <button className="win95-btn">?</button>
            <button className="win95-btn">X</button>
          </div>
        </div>

        <div className="p-4 space-y-6">
          <div className="text-center md:text-left border-b-2 border-dashed border-gray-400 pb-4">
            <h2 className="text-xl font-black uppercase text-black">Join PlotHole</h2>
            <p className="text-xs text-gray-700 mt-1">INITIALIZE PILOT ACCESS NODE</p>
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
                Set Username (Min 3 chars)
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="win95-textarea w-full px-3 py-2 text-black text-sm"
                placeholder="CHOOSE ALIAS..."
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="win95-textarea w-full px-3 py-2 text-black text-sm"
                placeholder="ALIAS@DOMAIN.COM"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-gray-700 mb-2">
                Create Passcode (Min 6 chars)
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
              className="win95-btn w-full py-2.5 h-auto text-sm font-black text-black active:border-t-2 active:border-l-2 active:border-r active:border-b"
            >
              {loading ? 'Registering Access...' : 'Submit_Registration'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-700 pt-2 border-t border-gray-400">
            Already have an access node?{' '}
            <Link to="/login" className="text-blue-800 hover:underline font-black">
              Sign In here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
