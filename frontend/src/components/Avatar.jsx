import React from 'react';

export default function Avatar({ username, url, className = "w-8 h-8" }) {
  const firstLetter = username ? username.trim().charAt(0).toUpperCase() : '?';
  
  // If url is set and is NOT a dicebear URL (premade avatar), we use it.
  const hasCustomAvatar = url && !url.includes('dicebear.com') && !url.includes('placeholder') && url.trim().length > 0;

  const bgColor = username ? stringToColor(username) : '#86868b';

  if (hasCustomAvatar) {
    return (
      <img
        src={url}
        alt={username}
        className={`${className} object-cover shrink-0 rounded-none border border-white/20`}
      />
    );
  }

  return (
    <div
      className={`${className} shrink-0 flex items-center justify-center font-mono text-black font-black select-none border border-white/20 rounded-none`}
      style={{ backgroundColor: bgColor }}
    >
      <span className="text-[55%] leading-none">{firstLetter}</span>
    </div>
  );
}

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Original bright cyber/brutalist color palette
  const colors = [
    '#0a84ff', // Cyber Blue/Cyan
    '#ff2d55', // Cyber Pink
    '#ff9f0a', // Neon Yellow
    '#30d158', // Brutal Green
    '#5e5ce6', // Purple/Indigo
    '#af52de', // Purple
    '#ff9500', // Orange
    '#00f2fe'  // Neon Cyan
  ];
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
