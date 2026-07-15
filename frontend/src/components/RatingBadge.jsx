import React from 'react';
import { Trash2, Meh, Film, ThumbsUp, Trophy, HelpCircle } from 'lucide-react';
import { getRatingInfo } from '../config';

const ICONS = {
  Trash2,
  Meh,
  Film,
  ThumbsUp,
  Trophy,
  HelpCircle
};

export default function RatingBadge({ rating, size = 'sm' }) {
  const ratingInfo = getRatingInfo(rating);
  
  // Resolve component dynamically
  const IconComponent = ICONS[ratingInfo.icon] || HelpCircle;

  // Custom styles depending on size
  const sizeClasses = size === 'lg' 
    ? 'px-4 py-1.5 text-xs rounded-full border font-bold' 
    : 'px-2.5 py-0.5 text-[10px] rounded-full border font-bold';
    
  // Dynamic border/text classes based on rating tier (Apple-inspired translucent tints)
  const tierStyles = {
    'rate-bullshit': 'bg-[#ff3b30]/10 border-[#ff3b30]/20 text-[#ff453a]',
    'rate-meh': 'bg-[#8e8e93]/10 border-[#8e8e93]/20 text-[#aeaeb2]',
    'rate-otw': 'bg-[#ff9f0a]/10 border-[#ff9f0a]/20 text-[#ffb340]',
    'rate-good': 'bg-[#30d158]/10 border-[#30d158]/20 text-[#32d74b]',
    'rate-pure': 'bg-[#bf5af2]/10 border-[#bf5af2]/20 text-[#da8fff]'
  };

  const styleClass = tierStyles[ratingInfo.color] || 'bg-white/10 border-white/10 text-[#f5f5f7]';
  const iconSize = size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5';

  return (
    <div className={`rating-pill flex items-center gap-1.5 font-bold uppercase tracking-wider w-fit cursor-default select-none ${sizeClasses} ${styleClass}`}>
      <IconComponent className={iconSize} />
      <span>{ratingInfo.label}</span>
    </div>
  );
}
