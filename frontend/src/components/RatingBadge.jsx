import React from 'react';
import { AlertOctagon, MinusCircle, Ticket, ThumbsUp, Trophy, Star } from 'lucide-react';
import { getRatingInfo } from '../config';

export default function RatingBadge({ rating, size = 'sm', showIcon = true, className = '' }) {
  const ratingInfo = getRatingInfo(rating);
  
  // Avant-Garde Cinema Graded Rating Capsules
  const tierConfig = {
    1: {
      style: 'bg-rose-500/10 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(255,59,92,0.2)] hover:border-rose-400',
      icon: AlertOctagon,
      label: 'Bullshit'
    },
    2: {
      style: 'bg-slate-500/10 text-slate-300 border-slate-500/30 hover:border-slate-400',
      icon: MinusCircle,
      label: 'Meh'
    },
    3: {
      style: 'bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/40 shadow-[0_0_14px_rgba(0,212,255,0.2)] hover:border-[#00d4ff]',
      icon: Ticket,
      label: 'One-Time'
    },
    4: {
      style: 'bg-[#00f5a0]/10 text-[#00f5a0] border-[#00f5a0]/40 shadow-[0_0_16px_rgba(0,245,160,0.25)] hover:border-[#00f5a0]',
      icon: ThumbsUp,
      label: 'Good'
    },
    5: {
      style: 'bg-gradient-to-r from-[#00f5a0]/20 via-[#00d4ff]/15 to-white/20 text-white border-white/40 shadow-[0_0_22px_rgba(0,245,160,0.45)] hover:border-white',
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
