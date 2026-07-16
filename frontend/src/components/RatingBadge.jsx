import React from 'react';
import { getRatingInfo } from '../config';

export default function RatingBadge({ rating, size = 'sm' }) {
  const ratingInfo = getRatingInfo(rating);
  
  // Custom certificate style classes based on rating tier
  const tierStyles = {
    'rate-bullshit': 'border-rose-500/40 text-rose-450 bg-rose-500/5',
    'rate-meh': 'border-zinc-700 text-zinc-400 bg-zinc-800/10',
    'rate-otw': 'border-cyan-500/40 text-cyan-400 bg-cyan-500/5',
    'rate-good': 'border-emerald-500/40 text-emerald-450 bg-emerald-500/5',
    'rate-pure': 'border-lime-400/40 text-lime-400 bg-lime-450/5'
  };

  const styleClass = tierStyles[ratingInfo.color] || 'border-zinc-700 text-zinc-400';
  const paddingClasses = size === 'lg' 
    ? 'px-3 py-1 text-xs' 
    : 'px-2 py-0.5 text-[9px]';

  return (
    <div className={`inline-flex items-center gap-1.5 font-mono font-bold uppercase border rounded-none tracking-wider ${paddingClasses} ${styleClass} select-none`}>
      <span className="opacity-35">PH:</span>
      <span>{ratingInfo.label}</span>
    </div>
  );
}
