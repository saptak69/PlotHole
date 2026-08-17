import React from 'react';

/**
 * Animated Thinking Orb Component
 * Inspired by orbs.jakubantalik.com & beautiful-ui-five.vercel.app
 * 
 * States:
 * - 'idle': Gentle celestial breathing aura
 * - 'thinking': Dynamic spinning particle ring & orbital oscillation
 * - 'generating': Rapid chromatic expansion with radiant beams
 * - 'speaking': Pulsing vocal wave frequency
 */
export default function GlowingOrb({ state = 'idle', size = 'md', className = '' }) {
  const sizeClasses = {
    xs: 'w-5 h-5',
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-28 h-28 md:w-36 md:h-36',
    xl: 'w-40 h-40 md:w-48 md:h-48'
  };

  const orbSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`relative flex items-center justify-center select-none ${orbSize} ${className}`}>
      {/* Outer ambient radiant halo */}
      <div
        className={`absolute inset-[-40%] rounded-full blur-2xl transition-all duration-700 pointer-events-none ${
          state === 'thinking'
            ? 'bg-gradient-to-r from-amber-500/40 via-cyan-500/40 to-purple-500/40 animate-spin scale-110'
            : state === 'generating'
            ? 'bg-gradient-to-r from-cyan-400/50 via-amber-400/50 to-rose-500/50 scale-125 animate-pulse'
            : state === 'speaking'
            ? 'bg-amber-400/35 scale-115 animate-ping duration-1000'
            : 'bg-gradient-to-r from-amber-500/25 to-cyan-500/20 scale-95 opacity-80'
        }`}
      />

      {/* Secondary orbital ring */}
      <div
        className={`absolute inset-0 rounded-full border border-amber-400/30 transition-all duration-500 pointer-events-none ${
          state === 'thinking'
            ? 'animate-[spin_4s_linear_infinite] scale-125 border-dashed border-cyan-400/60'
            : state === 'generating'
            ? 'animate-[spin_2s_linear_infinite] scale-110 border-amber-300/80'
            : 'animate-[spin_12s_linear_infinite] scale-105 opacity-40'
        }`}
      />

      {/* Tertiary counter-rotating ring */}
      {(state === 'thinking' || state === 'generating') && (
        <div className="absolute inset-[-15%] rounded-full border border-purple-400/40 border-dotted animate-[spin_6s_linear_infinite_reverse] pointer-events-none" />
      )}

      {/* Central 3D Glowing Sphere Body */}
      <div
        className={`relative w-full h-full rounded-full shadow-2xl overflow-hidden transition-transform duration-500 ${
          state === 'thinking'
            ? 'animate-pulse scale-105'
            : state === 'speaking'
            ? 'scale-110'
            : 'hover:scale-105'
        }`}
        style={{
          background:
            state === 'generating'
              ? 'radial-gradient(circle at 35% 30%, #fff 0%, #fbbf24 25%, #f43f5e 60%, #38bdf8 100%)'
              : state === 'thinking'
              ? 'radial-gradient(circle at 30% 25%, #ffffff 0%, #38bdf8 30%, #f59e0b 65%, #6366f1 100%)'
              : state === 'speaking'
              ? 'radial-gradient(circle at 40% 30%, #ffffff 0%, #fbbf24 35%, #f59e0b 70%, #d97706 100%)'
              : 'radial-gradient(circle at 35% 30%, #ffffff 0%, #fbbf24 20%, #f59e0b 50%, #1e1b4b 100%)',
          boxShadow:
            state === 'thinking'
              ? '0 0 35px rgba(56, 189, 248, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.8)'
              : '0 0 30px rgba(245, 158, 11, 0.5), inset 0 0 15px rgba(255, 255, 255, 0.7)'
        }}
      >
        {/* Specular light reflection on the 3D surface */}
        <div className="absolute top-[8%] left-[18%] w-[30%] h-[20%] rounded-full bg-white/70 blur-[1px] transform -rotate-45" />

        {/* Dynamic inner fluid motion mesh */}
        <div
          className={`absolute inset-0 rounded-full opacity-60 mix-blend-overlay ${
            state === 'thinking'
              ? 'animate-[spin_3s_linear_infinite] bg-gradient-to-tr from-transparent via-white to-transparent'
              : 'animate-[spin_8s_linear_infinite] bg-gradient-to-br from-white/20 via-transparent to-black/40'
          }`}
        />
      </div>

      {/* Orbiting sub-particle dots for Thinking State */}
      {state === 'thinking' && (
        <>
          <div className="absolute w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_8px_#38bdf8] animate-[spin_2.5s_linear_infinite] -top-1 left-1/2 -translate-x-1/2" />
          <div className="absolute w-1.5 h-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_#fbbf24] animate-[spin_3.5s_linear_infinite_reverse] -bottom-1 left-1/3" />
        </>
      )}
    </div>
  );
}
