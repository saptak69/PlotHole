import React from 'react';

/**
 * Avatar Component
 * Luxury circular avatar with refined cinema palette fallback and custom image support.
 */
export default function Avatar({ username, url, className = "w-8 h-8" }) {
  const firstLetter = username ? username.trim().charAt(0).toUpperCase() : '?';
  
  // If url is set and is NOT a dicebear URL (premade avatar), we use it.
  const hasCustomAvatar = url && !url.includes('dicebear.com') && !url.includes('placeholder') && url.trim().length > 0;

  const bgGradient = username ? stringToGradient(username) : 'from-[#00f5a0] to-[#00d4ff]';

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
      className={`${className} shrink-0 flex items-center justify-center font-display font-black text-black select-none border border-white/25 rounded-full shadow-md bg-gradient-to-br ${bgGradient}`}
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
  
  // Luxury avant-garde color pairs
  const gradients = [
    'from-[#00f5a0] via-[#00d4ff] to-[#7affd4]', // Electric Mint & Cyan
    'from-sky-300 via-sky-400 to-blue-500',      // Anamorphic Cyan
    'from-rose-300 via-rose-400 to-rose-600',    // Velvet Crimson
    'from-emerald-300 via-emerald-400 to-teal-500', // Mint Emerald
    'from-purple-300 via-purple-400 to-indigo-600', // Royal Indigo
    'from-[#00f5a0] via-teal-400 to-[#00d4ff]',  // Liquid Caustic
    'from-teal-300 via-teal-400 to-cyan-600',    // Sapphire Teal
    'from-slate-200 via-slate-300 to-slate-500'  // Titanium Platinum
  ];
  
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}
