export const API_URL = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? `${window.location.protocol}//${window.location.host}/api`
    : 'http://localhost:5000/api'
);
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// Helper to get image URLs
export function getPosterUrl(path, size = 'w342') {
  if (!path) return 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=342&auto=format&fit=crop';
  if (path.startsWith('http')) return path;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function getBackdropUrl(path, size = 'w1280') {
  if (!path) return 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1280&auto=format&fit=crop';
  if (path.startsWith('http')) return path;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

// Authentication token helper
export function getAuthHeaders() {
  const token = localStorage.getItem('plothole_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// Custom PlotHole Rating System
export const RATINGS = {
  1: { label: 'Bullshit', icon: 'Trash2', color: 'rate-bullshit', hex: '#ef4444' },
  2: { label: 'Meh', icon: 'Meh', color: 'rate-meh', hex: '#94a3b8' },
  3: { label: 'One Time Watch', icon: 'Film', color: 'rate-otw', hex: '#f59e0b' },
  4: { label: 'Good Watch', icon: 'ThumbsUp', color: 'rate-good', hex: '#10b981' },
  5: { label: 'Pure Cinema', icon: 'Trophy', color: 'rate-pure', hex: '#ec4899' }
};

export function getRatingInfo(value) {
  const val = Math.round(value);
  return RATINGS[val] || { label: 'Unrated', icon: 'HelpCircle', color: 'brand-text-muted', hex: '#4a5775' };
}
