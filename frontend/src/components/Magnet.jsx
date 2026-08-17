import React, { useRef, useState, useEffect } from 'react';

/**
 * Magnet component from React Bits
 * Magnetically pulls elements towards the cursor within a proximity threshold.
 */
export default function Magnet({
  children,
  padding = 40,
  magnetStrength = 2.5,
  active = true,
  className = ''
}) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const magnetRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!active || !magnetRef.current) return;
    const { left, top, width, height } = magnetRef.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    const distX = e.clientX - centerX;
    const distY = e.clientY - centerY;

    if (
      Math.abs(distX) < width / 2 + padding &&
      Math.abs(distY) < height / 2 + padding
    ) {
      setPosition({
        x: distX / magnetStrength,
        y: distY / magnetStrength
      });
    } else {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div
      ref={magnetRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`inline-block transition-transform duration-200 ease-out ${className}`}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0px)`
      }}
    >
      {children}
    </div>
  );
}
