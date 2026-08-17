import React from 'react';

/**
 * ShinyText component from React Bits
 * Provides continuous metallic luster across text elements.
 */
export default function ShinyText({
  text,
  disabled = false,
  speed = 3,
  className = '',
  shimmerColor = 'rgba(255, 255, 255, 0.8)'
}) {
  return (
    <span
      className={`inline-block bg-clip-text ${disabled ? '' : 'animate-shine'} ${className}`}
      style={{
        backgroundImage: `linear-gradient(120deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.3) 35%, ${shimmerColor} 50%, rgba(255, 255, 255, 0.3) 65%, rgba(255, 255, 255, 0.3) 100%)`,
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animationDuration: `${speed}s`,
        animationTimingFunction: 'linear',
        animationIterationCount: 'infinite'
      }}
    >
      {text}
    </span>
  );
}
