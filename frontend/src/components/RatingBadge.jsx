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
    ? 'px-4 py-2 text-sm rounded-none border-2 border-black font-black' 
    : 'px-2.5 py-1 text-[10px] rounded-none border-2 border-black font-black';
    
  // Dynamic border/text classes based on rating tier
  const tierStyles = {
    'rate-bullshit': 'bg-red-500 text-black',
    'rate-meh': 'bg-slate-400 text-black',
    'rate-otw': 'bg-brutal-yellow text-black',
    'rate-good': 'bg-brutal-green text-black',
    'rate-pure': 'bg-brutal-pink text-black'
  };

  const styleClass = tierStyles[ratingInfo.color] || 'bg-white border-2 border-black text-black';
  const iconSize = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <div className={`rating-pill flex items-center gap-1.5 font-bold uppercase tracking-wider w-fit cursor-default select-none ${sizeClasses} ${styleClass}`}>
      <IconComponent className={iconSize} />
      <span>{ratingInfo.label}</span>
    </div>
  );
}
