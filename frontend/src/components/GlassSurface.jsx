import React, { useId, useRef, useEffect } from 'react';
import './GlassSurface.css';

/**
 * Apple-Grade Frosted Liquid Glass Surface
 * Blends heavy multi-pass backdrop blur, saturation amplification, dark obsidian frosted backing,
 * and optional chromatic edge refraction for maximum visual aesthetics and pristine legibility.
 */
const GlassSurface = ({
  children,
  width = '100%',
  height = 'auto',
  borderRadius = 20,
  borderWidth = 0.07,
  brightness = 60,
  opacity = 0.95,
  blur = 24,
  displace = 0,
  backgroundOpacity = 0.78,
  saturation = 1.8,
  distortionScale = 0,
  borderOpacity = 0.15,
  frosted = true,
  className = '',
  style = {},
  ...rest
}) => {
  const uniqueId = useId().replace(/:/g, '-');
  const filterId = `glass-filter-${uniqueId}`;
  const containerRef = useRef(null);

  // Compute CSS custom properties for Apple frosted liquid glass
  const bgAlpha = Math.min(Math.max(backgroundOpacity, 0.1), 0.98);
  const blurVal = Math.max(blur, 8);
  const satVal = Math.max(saturation, 1.0);
  const borderAlpha = Math.min(Math.max(borderOpacity, 0.05), 0.4);

  const containerStyle = {
    ...style,
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: `${borderRadius}px`,
    '--glass-bg-opacity': bgAlpha,
    '--glass-blur': `${blurVal}px`,
    '--glass-saturation': satVal,
    '--glass-border-opacity': borderAlpha
  };

  return (
    <div
      ref={containerRef}
      className={`glass-surface ${frosted ? 'glass-surface--frosted' : ''} ${className}`}
      style={containerStyle}
      {...rest}
    >
      <div className="glass-surface__content">{children}</div>
    </div>
  );
};

export default GlassSurface;
