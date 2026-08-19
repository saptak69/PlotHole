import React from 'react';
import { Link } from 'react-router-dom';

/**
 * PlotHole Iconic Premium Brand Logo
 * Features a 35mm celluloid film strip shaped into a cinema popcorn bucket
 * overflowing with golden popping buttery popcorn kernels, radiant cinema sparks,
 * and obsidian film perforations.
 * 
 * Supports: 'full' (mark + wordmark), 'mark' (mark only), 'stacked' (vertical logo + wordmark)
 * Sizes: 'xs', 'sm', 'md', 'lg', 'xl'
 */
export function BrandMark({ size = 'md', className = '', animated = true }) {
  const sizeMap = {
    xs: 'w-7 h-7',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  };

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${sizeMap[size] || sizeMap.md} ${className}`}>
      {/* Radiant Outer Cinema Glow (Red & Gold) */}
      <div className="absolute inset-[-10%] rounded-2xl bg-gradient-to-tr from-[#e50914]/40 via-[#ff2e3b]/25 to-[#ffb800]/30 blur-lg pointer-events-none opacity-85 group-hover:opacity-100 group-hover:scale-115 transition-all duration-300" />

      {/* SVG Popcorn Film Bucket Mark */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full relative z-10 transition-transform duration-500 ease-out ${
          animated ? 'group-hover:scale-108 group-hover:-rotate-3' : ''
        }`}
      >
        <defs>
          {/* Netflix Red & Cinema Scarlet Bucket Strip Gradient */}
          <linearGradient id="pb-film-red" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff4d5a" />
            <stop offset="35%" stopColor="#e50914" />
            <stop offset="85%" stopColor="#b80710" />
            <stop offset="100%" stopColor="#800008" />
          </linearGradient>

          {/* Deep Obsidian Film Strip Gradient */}
          <linearGradient id="pb-film-dark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e1e26" />
            <stop offset="40%" stopColor="#121216" />
            <stop offset="100%" stopColor="#08080a" />
          </linearGradient>

          {/* Top Film Rim Strip Gradient */}
          <linearGradient id="pb-rim-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#b80710" />
            <stop offset="25%" stopColor="#e50914" />
            <stop offset="50%" stopColor="#ff2e3b" />
            <stop offset="75%" stopColor="#e50914" />
            <stop offset="100%" stopColor="#b80710" />
          </linearGradient>

          {/* Golden Butter Popcorn - Crown Kernel Gradient */}
          <radialGradient id="pb-pop-gold-1" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#fef08a" />
            <stop offset="60%" stopColor="#f59e0b" />
            <stop offset="90%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#92400e" />
          </radialGradient>

          {/* Golden Butter Popcorn - Side Kernel Gradient */}
          <radialGradient id="pb-pop-gold-2" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#fde047" />
            <stop offset="70%" stopColor="#ffb800" />
            <stop offset="95%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" />
          </radialGradient>

          {/* Popcorn Fluffy Cream Highlight */}
          <radialGradient id="pb-pop-cream" cx="35%" cy="25%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#fef9c3" />
            <stop offset="85%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </radialGradient>

          {/* Center Lens Emblem Gradient */}
          <radialGradient id="pb-lens-emblem" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#08080a" />
            <stop offset="55%" stopColor="#121216" />
            <stop offset="80%" stopColor="#e50914" />
            <stop offset="100%" stopColor="#ffb800" />
          </radialGradient>

          {/* Soft Drop Shadow for Kernels */}
          <filter id="pb-pop-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodColor="#000000" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* ================= BACKGROUND POPPING KERNEL ================= */}
        {/* Floating Popped Kernel (Top-Left) */}
        <g filter="url(#pb-pop-shadow)">
          <path
            d="M 23 20 C 20 17 21 12 25 13 C 28 10 33 13 32 17 C 35 19 32 24 28 23 C 25 25 21 23 23 20 Z"
            fill="url(#pb-pop-gold-2)"
            stroke="#ffffff"
            strokeWidth="0.6"
            strokeOpacity="0.8"
          />
          <circle cx="26" cy="16" r="2" fill="#ffffff" opacity="0.9" />
          <path d="M 27 18 Q 28 20 30 19" stroke="#b45309" strokeWidth="0.8" strokeLinecap="round" />
        </g>

        {/* ================= POPCORN CLUSTER OVERFLOWING TOP ================= */}
        <g filter="url(#pb-pop-shadow)">
          {/* Back Deep Layer Kernels */}
          {/* Back Left */}
          <path
            d="M 33 30 C 29 23 39 17 44 23 C 48 20 53 26 49 32 C 43 35 34 35 33 30 Z"
            fill="url(#pb-pop-gold-1)"
          />
          {/* Back Right */}
          <path
            d="M 67 30 C 71 23 61 17 56 23 C 52 20 47 26 51 32 C 57 35 66 35 67 30 Z"
            fill="url(#pb-pop-gold-1)"
          />

          {/* Main Top Crown Popcorn Kernel (Giant Fluffy Popped Cloud) */}
          <path
            d="M 45 22 C 42 13 58 13 55 22 C 63 16 71 26 65 33 C 70 41 59 47 50 45 C 41 47 30 41 35 33 C 29 26 37 16 45 22 Z"
            fill="url(#pb-pop-cream)"
            stroke="#ffffff"
            strokeWidth="0.8"
            strokeOpacity="0.75"
          />

          {/* Top Center Cream Highlights */}
          <ellipse cx="50" cy="23" rx="4.5" ry="3.5" fill="#ffffff" opacity="0.9" />
          <ellipse cx="42" cy="28" rx="3.5" ry="3" fill="#ffffff" opacity="0.85" />
          <ellipse cx="58" cy="28" rx="3.5" ry="3" fill="#ffffff" opacity="0.85" />
          
          {/* Kernels Buttery Shadows & Crevices */}
          <path d="M 46 27 Q 50 31 54 27" stroke="#b45309" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M 41 33 Q 46 37 49 34" stroke="#92400e" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M 59 33 Q 54 37 51 34" stroke="#92400e" strokeWidth="1.1" strokeLinecap="round" />

          {/* Left Wing Fluffy Kernel */}
          <path
            d="M 26 34 C 21 28 32 23 35 29 C 40 26 44 33 39 38 C 33 42 24 41 26 34 Z"
            fill="url(#pb-pop-gold-2)"
            stroke="#ffffff"
            strokeWidth="0.6"
            strokeOpacity="0.7"
          />
          <ellipse cx="30" cy="32" rx="3" ry="2.5" fill="#ffffff" opacity="0.9" />

          {/* Right Wing Fluffy Kernel */}
          <path
            d="M 74 34 C 79 28 68 23 65 29 C 60 26 56 33 61 38 C 67 42 76 41 74 34 Z"
            fill="url(#pb-pop-gold-2)"
            stroke="#ffffff"
            strokeWidth="0.6"
            strokeOpacity="0.7"
          />
          <ellipse cx="70" cy="32" rx="3" ry="2.5" fill="#ffffff" opacity="0.9" />

          {/* Front Overflow Kernels (Tumbling Over Top Film Rim) */}
          {/* Front Center Kernel */}
          <path
            d="M 44 39 C 42 33 58 33 56 39 C 62 38 64 46 58 48 C 53 51 47 51 42 48 C 36 46 38 38 44 39 Z"
            fill="url(#pb-pop-gold-1)"
            stroke="#ffffff"
            strokeWidth="0.7"
            strokeOpacity="0.8"
          />
          <circle cx="50" cy="41" r="3" fill="#ffffff" opacity="0.95" />
          <path d="M 47 43 Q 50 46 53 43" stroke="#b45309" strokeWidth="1" strokeLinecap="round" />

          {/* Front Left Spill */}
          <path
            d="M 33 41 C 30 36 41 33 42 39 C 45 42 41 48 36 47 C 30 48 29 44 33 41 Z"
            fill="url(#pb-pop-gold-2)"
            stroke="#ffffff"
            strokeWidth="0.6"
            strokeOpacity="0.7"
          />
          <circle cx="36" cy="41" r="2.2" fill="#ffffff" opacity="0.9" />

          {/* Front Right Spill */}
          <path
            d="M 67 41 C 70 36 59 33 58 39 C 55 42 59 48 64 47 C 70 48 71 44 67 41 Z"
            fill="url(#pb-pop-gold-2)"
            stroke="#ffffff"
            strokeWidth="0.6"
            strokeOpacity="0.7"
          />
          <circle cx="64" cy="41" r="2.2" fill="#ffffff" opacity="0.9" />
        </g>

        {/* ================= CELLULOID FILM STRIP POPCORN BUCKET BODY ================= */}
        <g>
          {/* Main Bucket Outer Glow / Shadow Base */}
          <path
            d="M 23 46 Q 50 51 77 46 L 68 89 Q 50 94 32 89 Z"
            fill="#08080a"
          />

          {/* Vertical 35mm Film Stripes across the tapered bucket */}
          {/* Stripe 1: Left Outer Red Film Strip */}
          <path
            d="M 23 46 Q 31 47.5 34 47.2 L 39 89.8 Q 35.5 89.4 32 89 Z"
            fill="url(#pb-film-red)"
          />

          {/* Stripe 2: Obsidian Film Strip with Sprocket Holes */}
          <path
            d="M 34 47.2 Q 41.5 48.4 44.5 48.4 L 46.8 90.5 Q 43 90.2 39 89.8 Z"
            fill="url(#pb-film-dark)"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="0.5"
          />

          {/* Stripe 3: Center Red Film Ribbon with Emblem */}
          <path
            d="M 44.5 48.4 Q 50 48.7 55.5 48.4 L 53.2 90.5 Q 50 90.8 46.8 90.5 Z"
            fill="url(#pb-film-red)"
          />

          {/* Stripe 4: Obsidian Film Strip with Sprocket Holes */}
          <path
            d="M 55.5 48.4 Q 58.5 48.4 66 47.2 L 61 89.8 Q 57 90.2 53.2 90.5 Z"
            fill="url(#pb-film-dark)"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="0.5"
          />

          {/* Stripe 5: Right Outer Red Film Strip */}
          <path
            d="M 66 47.2 Q 69 47.5 77 46 L 68 89 Q 64.5 89.4 61 89.8 Z"
            fill="url(#pb-film-red)"
          />

          {/* ================= 35MM FILM SPROCKET PERFORATIONS ================= */}
          {/* Left Obsidian Stripe Sprockets */}
          <rect x="36.5" y="52" width="4.5" height="3" rx="1" fill="#ffffff" fillOpacity="0.85" />
          <rect x="37.5" y="60" width="4.5" height="3" rx="1" fill="#ffffff" fillOpacity="0.85" />
          <rect x="38.5" y="68" width="4.5" height="3" rx="1" fill="#ffffff" fillOpacity="0.85" />
          <rect x="39.5" y="76" width="4.5" height="3" rx="1" fill="#ffffff" fillOpacity="0.85" />
          <rect x="40.5" y="84" width="4.2" height="2.8" rx="0.9" fill="#ffffff" fillOpacity="0.85" />

          {/* Right Obsidian Stripe Sprockets */}
          <rect x="59" y="52" width="4.5" height="3" rx="1" fill="#ffffff" fillOpacity="0.85" />
          <rect x="58" y="60" width="4.5" height="3" rx="1" fill="#ffffff" fillOpacity="0.85" />
          <rect x="57" y="68" width="4.5" height="3" rx="1" fill="#ffffff" fillOpacity="0.85" />
          <rect x="56" y="76" width="4.5" height="3" rx="1" fill="#ffffff" fillOpacity="0.85" />
          <rect x="55.3" y="84" width="4.2" height="2.8" rx="0.9" fill="#ffffff" fillOpacity="0.85" />

          {/* Outer Border Highlights */}
          <path
            d="M 23 46 L 32 89"
            stroke="#ff8088"
            strokeWidth="0.8"
            strokeOpacity="0.8"
          />
          <path
            d="M 77 46 L 68 89"
            stroke="#b80710"
            strokeWidth="0.8"
            strokeOpacity="0.8"
          />

          {/* ================= CENTER CINEMA LOGO EMBLEM ON BUCKET ================= */}
          {/* Emblem Badge Container */}
          <circle
            cx="50"
            cy="68"
            r="8.5"
            fill="url(#pb-lens-emblem)"
            stroke="#ffb800"
            strokeWidth="1.2"
            filter="url(#pb-pop-shadow)"
          />
          <circle
            cx="50"
            cy="68"
            r="6.8"
            fill="none"
            stroke="#e50914"
            strokeWidth="0.8"
            strokeDasharray="1.8 1.2"
          />
          {/* Inner Golden Star / Aperture Vortex Center */}
          <path
            d="M 50 63.5 L 51.3 66.5 L 54.5 66.8 L 52 69 L 52.8 72 L 50 70.4 L 47.2 72 L 48 69 L 45.5 66.8 L 48.7 66.5 Z"
            fill="#ffb800"
            stroke="#ffffff"
            strokeWidth="0.4"
          />
          <circle cx="50" cy="68" r="1.5" fill="#ffffff" />

          {/* ================= TOP & BOTTOM FILM RIMS ================= */}
          {/* Top Film Strip Header Rim */}
          <path
            d="M 21.5 44 Q 50 49 78.5 44 L 78 48.5 Q 50 53.5 22 48.5 Z"
            fill="url(#pb-rim-grad)"
            stroke="#ffffff"
            strokeWidth="0.6"
            strokeOpacity="0.4"
          />

          {/* Top Rim Micro Film Perforations */}
          <rect x="26" y="45.2" width="2.4" height="1.8" rx="0.5" fill="#ffffff" fillOpacity="0.9" />
          <rect x="35" y="46.3" width="2.4" height="1.8" rx="0.5" fill="#ffffff" fillOpacity="0.9" />
          <rect x="44" y="47.1" width="2.4" height="1.8" rx="0.5" fill="#ffffff" fillOpacity="0.9" />
          <rect x="53.6" y="47.1" width="2.4" height="1.8" rx="0.5" fill="#ffffff" fillOpacity="0.9" />
          <rect x="62.6" y="46.3" width="2.4" height="1.8" rx="0.5" fill="#ffffff" fillOpacity="0.9" />
          <rect x="71.6" y="45.2" width="2.4" height="1.8" rx="0.5" fill="#ffffff" fillOpacity="0.9" />

          {/* Bottom Stable Film Base Rim */}
          <path
            d="M 31 88.5 Q 50 93.5 69 88.5 L 68 91.5 Q 50 95.5 32 91.5 Z"
            fill="url(#pb-film-red)"
            stroke="#ffb800"
            strokeWidth="0.6"
            strokeOpacity="0.8"
          />
        </g>
      </svg>
    </div>
  );
}

export default function Logo({
  variant = 'full',
  size = 'md',
  showTagline = false,
  className = '',
  to = '/',
  onClick
}) {
  const textSizes = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-lg sm:text-xl',
    lg: 'text-2xl sm:text-3xl',
    xl: 'text-3xl sm:text-4xl'
  };

  const taglineSizes = {
    xs: 'text-[8px]',
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
    xl: 'text-xs sm:text-sm'
  };

  const Content = (
    <div className={`flex items-center gap-2.5 sm:gap-3 group select-none ${className}`}>
      <BrandMark size={size} />

      {variant !== 'mark' && (
        <div className="flex flex-col text-left">
          <span className={`font-display font-black tracking-tight text-white flex items-center leading-none ${textSizes[size] || textSizes.md}`}>
            PLOT<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e50914] via-[#ff2e3b] to-[#ffb800] ml-0.5">HOLE</span>
          </span>
          {showTagline && (
            <span className={`font-mono text-slate-400 tracking-wider uppercase mt-1 font-bold ${taglineSizes[size] || taglineSizes.md}`}>
              Mind the Gap in Cinema
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} onClick={onClick} className="inline-flex items-center no-underline focus-visible:outline-none">
        {Content}
      </Link>
    );
  }

  return <div onClick={onClick}>{Content}</div>;
}

