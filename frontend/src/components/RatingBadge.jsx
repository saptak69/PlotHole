import React from 'react';
import { getRatingInfo } from '../config';

export default function RatingBadge({ rating, size = 'sm', showIcon = true, className = '' }) {
  const ratingInfo = getRatingInfo(rating);
  
  // Custom glowing capsule styles inspired by 21st.dev & transitions.dev
  const tierConfig = {
    1: {
      style: 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)] hover:border-rose-500/50',
      icon: '💩',
      label: 'Bullshit'
    },
    2: {
      style: 'bg-slate-500/10 text-slate-300 border-slate-500/30 hover:border-slate-400/50',
      icon: '🥱',
      label: 'Meh'
    },
    3: {
      style: 'bg-sky-500/10 text-sky-400 border-sky-500/30 shadow-[0_0_12px_rgba(56,189,248,0.15)] hover:border-sky-500/50',
      icon: '🎟️',
      label: 'One-Time'
    },
    4: {
      style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)] hover:border-emerald-500/50',
      icon: '🍿',
      label: 'Good'
    },
    5: {
      style: 'bg-amber-500/15 text-amber-300 border-amber-400/40 shadow-[0_0_16px_rgba(245,158,11,0.3)] hover:border-amber-300',
      icon: '🏆',
      label: 'Pure Cinema'
    }
  };

  const currentTier = tierConfig[rating] || {
    style: 'bg-slate-800/40 text-slate-300 border-slate-700',
    icon: '★',
    label: ratingInfo?.label || 'Rating'
  };

  const sizeClasses = size === 'lg' 
    ? 'px-3.5 py-1.5 text-xs gap-1.5' 
    : size === 'xs'
    ? 'px-1.5 py-0.5 text-[9px] gap-1'
    : 'px-2.5 py-0.5 text-[11px] gap-1.5';

  return (
    <div
      className={`inline-flex items-center font-mono font-semibold uppercase tracking-wider rounded-full border backdrop-blur-md transition-all duration-200 select-none ${sizeClasses} ${currentTier.style} ${className}`}
    >
      {showIcon && <span className="text-[1.1em] shrink-0 leading-none">{currentTier.icon}</span>}
      <span className="truncate">{currentTier.label}</span>
    </div>
  );
}
