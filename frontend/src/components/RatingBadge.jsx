import React from 'react';
import { AlertOctagon, MinusCircle, Ticket, ThumbsUp, Trophy, Star } from 'lucide-react';
import { getRatingInfo } from '../config';

export default function RatingBadge({ rating, size = 'sm', showIcon = true, className = '' }) {
  const ratingInfo = getRatingInfo(rating);
  
  // Custom glowing capsule styles with clean Lucide icons (no emojis)
  const tierConfig = {
    1: {
      style: 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)] hover:border-rose-500/50',
      icon: AlertOctagon,
      label: 'Bullshit'
    },
    2: {
      style: 'bg-slate-500/10 text-slate-300 border-slate-500/30 hover:border-slate-400/50',
      icon: MinusCircle,
      label: 'Meh'
    },
    3: {
      style: 'bg-sky-500/10 text-sky-400 border-sky-500/30 shadow-[0_0_12px_rgba(56,189,248,0.15)] hover:border-sky-500/50',
      icon: Ticket,
      label: 'One-Time'
    },
    4: {
      style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)] hover:border-emerald-500/50',
      icon: ThumbsUp,
      label: 'Good'
    },
    5: {
      style: 'bg-amber-500/15 text-amber-300 border-amber-400/40 shadow-[0_0_16px_rgba(245,158,11,0.3)] hover:border-amber-300',
      icon: Trophy,
      label: 'Pure Cinema'
    }
  };

  const currentTier = tierConfig[rating] || {
    style: 'bg-slate-800/40 text-slate-300 border-slate-700',
    icon: Star,
    label: ratingInfo?.label || 'Rating'
  };

  const IconComponent = currentTier.icon;

  const sizeClasses = size === 'lg' 
    ? 'px-3.5 py-1.5 text-xs gap-1.5' 
    : size === 'xs'
    ? 'px-1.5 py-0.5 text-[9px] gap-1'
    : 'px-2.5 py-0.5 text-[11px] gap-1.5';

  const iconSizes = size === 'lg' 
    ? 'w-3.5 h-3.5' 
    : size === 'xs'
    ? 'w-2.5 h-2.5'
    : 'w-3 h-3';

  return (
    <div
      className={`inline-flex items-center font-mono font-semibold uppercase tracking-wider rounded-full border backdrop-blur-md transition-all duration-200 select-none ${sizeClasses} ${currentTier.style} ${className}`}
    >
      {showIcon && <IconComponent className={`${iconSizes} shrink-0`} />}
      <span className="truncate">{currentTier.label}</span>
    </div>
  );
}
