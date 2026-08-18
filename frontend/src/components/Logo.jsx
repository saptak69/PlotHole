import React from 'react';
import { Link } from 'react-router-dom';

/**
 * PlotHole Iconic Brand Logo
 * Features a geometric optical aperture vortex ("the PlotHole") with concentric film reel arcs and prismatic neon mint/cyan luminescence.
 * Supports: 'full' (mark + wordmark), 'mark' (mark only), 'stacked' (vertical logo + wordmark)
 * Sizes: 'xs', 'sm', 'md', 'lg', 'xl'
 */
export function BrandMark({ size = 'md', className = '', animated = true }) {
  const sizeMap = {
    xs: 'w-6 h-6',
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${sizeMap[size] || sizeMap.md} ${className}`}>
      {/* Ambient Outer Mint/Cyan Luminescence */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#00f5a0]/30 via-[#00d4ff]/20 to-[#7928ca]/15 blur-md pointer-events-none opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />

      {/* SVG Aperture Vortex */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full relative z-10 transition-transform duration-500 ease-out ${
          animated ? 'group-hover:rotate-45' : ''
        }`}
      >
        <defs>
          {/* Obsidian Base Gradient */}
          <linearGradient id="plothole-base-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#08101a" />
            <stop offset="50%" stopColor="#040810" />
            <stop offset="100%" stopColor="#020408" />
          </linearGradient>

          {/* Electric Mint & Cyan Gradient */}
          <linearGradient id="plothole-mint-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7affd4" />
            <stop offset="40%" stopColor="#00f5a0" />
            <stop offset="80%" stopColor="#00d4ff" />
            <stop offset="100%" stopColor="#0099ff" />
          </linearGradient>

          {/* Prismatic Violet Flare */}
          <linearGradient id="plothole-violet-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f5a0" />
            <stop offset="100%" stopColor="#7928ca" />
          </linearGradient>

          {/* Specular Center Vortex */}
          <radialGradient id="plothole-center-vortex" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#020408" />
            <stop offset="60%" stopColor="#080c14" />
            <stop offset="90%" stopColor="#00f5a0" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.8" />
          </radialGradient>
        </defs>

        {/* Outer Rounded Container Box */}
        <rect
          x="4"
          y="4"
          width="92"
          height="92"
          rx="24"
          fill="url(#plothole-base-grad)"
          stroke="url(#plothole-mint-grad)"
          strokeWidth="2.5"
          strokeOpacity="0.8"
        />

        {/* Film Strip Sprocket Notches (Left & Right) */}
        <rect x="8" y="22" width="4" height="7" rx="1.5" fill="#00f5a0" fillOpacity="0.7" />
        <rect x="8" y="46" width="4" height="7" rx="1.5" fill="#00f5a0" fillOpacity="0.7" />
        <rect x="8" y="70" width="4" height="7" rx="1.5" fill="#00f5a0" fillOpacity="0.7" />

        <rect x="88" y="22" width="4" height="7" rx="1.5" fill="#00f5a0" fillOpacity="0.7" />
        <rect x="88" y="46" width="4" height="7" rx="1.5" fill="#00f5a0" fillOpacity="0.7" />
        <rect x="88" y="70" width="4" height="7" rx="1.5" fill="#00f5a0" fillOpacity="0.7" />

        {/* Outer Film Wheel Arc 1 */}
        <path
          d="M 50 18 A 32 32 0 0 1 82 50"
          stroke="url(#plothole-mint-grad)"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Outer Film Wheel Arc 2 */}
        <path
          d="M 50 82 A 32 32 0 0 1 18 50"
          stroke="url(#plothole-mint-grad)"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Prismatic Cyan Flare Accents */}
        <path
          d="M 72 28 A 32 32 0 0 1 82 50"
          stroke="url(#plothole-violet-grad)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M 28 72 A 32 32 0 0 1 18 50"
          stroke="url(#plothole-violet-grad)"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Intersecting Aperture Blades */}
        <path
          d="M 50 26 L 68 44 L 54 62 L 32 48 Z"
          fill="none"
          stroke="url(#plothole-mint-grad)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeOpacity="0.9"
        />
        <path
          d="M 50 74 L 32 56 L 46 38 L 68 52 Z"
          fill="none"
          stroke="url(#plothole-mint-grad)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeOpacity="0.9"
        />

        {/* Central Core Vortex "The PlotHole" */}
        <circle cx="50" cy="50" r="14" fill="url(#plothole-center-vortex)" stroke="#00f5a0" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="6" fill="#00f5a0" className="animate-pulse" />
        <circle cx="50" cy="50" r="2.5" fill="#030508" />
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
            PLOT<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f5a0] via-[#7affd4] to-[#00d4ff] ml-0.5">HOLE</span>
          </span>
          {showTagline && (
            <span className={`font-mono text-slate-400 tracking-wider uppercase mt-0.5 font-medium ${taglineSizes[size] || taglineSizes.md}`}>
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
