import React from 'react';
import './GlassSurface.css';

/**
 * Liquid Obsidian Frosted Glass Component
 * High-performance, GPU-accelerated, deterministic glassmorphism with 
 * native CSS backdrop-filter, obsidian tint, and inner specular bevel highlights.
 * Preserves all public props for seamless backward compatibility.
 */
const GlassSurface = ({
  children,
  width = '100%',
  height = 'auto',
  borderRadius = 20,
  borderWidth = 0.07,
  brightness = 50,
  opacity = 0.93,
  blur = 12,
  displace = 0,
  backgroundOpacity = 0.05,
  saturation = 1.35,
  distortionScale = -180,
  redOffset = 0,
  greenOffset = 10,
  blueOffset = 20,
  xChannel = 'R',
  yChannel = 'G',
  mixBlendMode = 'difference',
  borderOpacity = 0.12,
  frosted = false,
  className = '',
  style = {},
  ...rest
}) => {
  // Destructuring consumes all custom and legacy props (width, height, borderRadius,
  // borderWidth, brightness, opacity, blur, displace, backgroundOpacity, saturation,
  // distortionScale, redOffset, greenOffset, blueOffset, xChannel, yChannel, mixBlendMode,
  // borderOpacity, frosted) so they never leak to the underlying DOM <div> via ...rest.
  const containerStyle = {
    ...style,
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
    '--glass-frost': backgroundOpacity,
    '--glass-blur': typeof blur === 'number' ? `${blur}px` : blur,
    '--glass-saturation': saturation,
    '--glass-border-opacity': borderOpacity,
    '--glass-brightness': brightness > 2 ? (brightness / 50).toFixed(2) : brightness
  };

  return (
    <div
      className={[
        'glass-surface',
        frosted ? 'glass-surface--frosted' : 'glass-surface--obsidian',
        className
      ].filter(Boolean).join(' ')}
      style={containerStyle}
      {...rest}
    >
      <div className="glass-surface__content">{children}</div>
    </div>
  );
};

export default GlassSurface;
