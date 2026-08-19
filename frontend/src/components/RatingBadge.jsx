import React from 'react';
import { AlertOctagon, MinusCircle, Ticket, ThumbsUp, Trophy, Star } from 'lucide-react';
import { getRatingInfo } from '../config';

export default function RatingBadge({ rating, size = 'sm', showIcon = true, className = '' }) {
  const ratingInfo = getRatingInfo(rating);
  
  // Graded Cinema Rating Capsules (Netflix Red & Gold Aesthetic)
  const tierConfig = {
    1: {
      style: 'bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(255,59,92,0.25)] hover:border-rose-400',
      icon: AlertOctagon,
      label: 'Bullshit'
    },
    2: {
      style: 'bg-slate-500/15 text-slate-300 border-slate-500/30 hover:border-slate-400',
      icon: MinusCircle,
      label: 'Meh'
    },
    3: {
      style: 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_14px_rgba(245,158,11,0.25)] hover:border-amber-400',
      icon: Ticket,
      label: 'One-Time'
    },
    4: {
      style: 'bg-[#e50914]/15 text-[#ff4d5a] border-[#e50914]/40 shadow-[0_0_16px_rgba(229,9,20,0.3)] hover:border-[#e50914]',
      icon: ThumbsUp,
      label: 'Good Watch'
    },
    5: {
      style: 'bg-gradient-to-r from-[#e50914]/25 via-[#ffb800]/20 to-white/20 text-white border-[#ffb800]/50 shadow-[0_0_22px_rgba(229,9,20,0.45)] hover:border-white',
      icon: Trophy,
      label: 'Pure Cinema'
    }
  };

  const currentTier = tierConfig[rating] || {
    style: 'bg-white/5 text-slate-300 border-white/10',
    icon: Star,
    label: ratingInfo?.label || 'Rating'
  };

  const IconComponent = currentTier.icon;

  const sizeClasses = size === 'lg' 
    ? 'px-3.5 py-1.5 text-xs gap-1.5' 
    : size === 'xs'
    ? 'px-2 py-0.5 text-[9px] gap-1'
    : 'px-2.5 py-1 text-[10px] gap-1.5';

  const iconSizes = size === 'lg' 
    ? 'w-3.5 h-3.5' 
    : size === 'xs'
    ? 'w-2.5 h-2.5'
    : 'w-3 h-3';

  return (
    <div
      className={`inline-flex items-center font-mono font-bold uppercase tracking-wider rounded-full border backdrop-blur-md transition-all duration-200 select-none ${sizeClasses} ${currentTier.style} ${className}`}
    >
      {showIcon && <IconComponent className={`${iconSizes} shrink-0`} />}
      <span className="truncate">{currentTier.label}</span>
    </div>
  );
}
