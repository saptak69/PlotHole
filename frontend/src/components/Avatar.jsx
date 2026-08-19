import React from 'react';

/**
 * Avatar Component
 * Luxury circular avatar with refined cinema palette fallback and custom image support.
 */
export default function Avatar({ username, url, className = "w-8 h-8" }) {
  const firstLetter = username ? username.trim().charAt(0).toUpperCase() : '?';
  
  // If url is set and is NOT a dicebear URL (premade avatar), we use it.
  const hasCustomAvatar = url && !url.includes('dicebear.com') && !url.includes('placeholder') && url.trim().length > 0;

  const bgGradient = username ? stringToGradient(username) : 'from-[#e50914] to-[#ffb800]';

  if (hasCustomAvatar) {
    return (
      <img
        src={url}
        alt={username}
        className={`${className} object-cover shrink-0 rounded-full border border-white/20 shadow-md`}
      />
    );
  }

  return (
    <div
      className={`${className} shrink-0 flex items-center justify-center font-display font-black text-white select-none border border-white/25 rounded-full shadow-md bg-gradient-to-br ${bgGradient}`}
    >
      <span className="text-[60%] leading-none drop-shadow-sm">{firstLetter}</span>
    </div>
  );
}

function stringToGradient(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Luxury cinema color pairs (Netflix Red & Gold Aesthetic)
  const gradients = [
    'from-[#e50914] via-[#ff2e3b] to-[#ffb800]', // Netflix Red & Cinema Gold
    'from-[#b80710] via-[#e50914] to-[#f59e0b]', // Deep Ruby & Amber
    'from-rose-500 via-rose-600 to-amber-500',   // Crimson & Amber
    'from-[#ff2e3b] via-[#ff3b5c] to-white',     // Scarlet Luster
    'from-amber-400 via-amber-500 to-[#e50914]', // Gold & Red
    'from-[#1e1e26] via-[#2a2a38] to-[#e50914]', // Obsidian & Red Spotlight
    'from-red-600 via-orange-500 to-amber-400',  // Fiery Cinema
    'from-slate-600 via-slate-700 to-slate-900'  // Slate Titanium
  ];
  
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}
