import React, { useEffect, useRef, useState } from 'react';

/**
 * TrueFocus component from React Bits
 * Features an optical viewfinder targeting frame with dynamic focal blur.
 */
export default function TrueFocus({
  sentence = 'True Focus',
  manualMode = false,
  blurAmount = 4,
  borderColor = '#e50914',
  glowColor = 'rgba(229, 9, 20, 0.5)',
  animationDuration = 0.4,
  pauseBetweenAnimations = 1.2,
  className = ''
}) {
  const words = sentence.split(' ');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastActiveIndex, setLastActiveIndex] = useState(null);
  const containerRef = useRef(null);
  const wordRefs = useRef([]);
  const [focusRect, setFocusRect] = useState({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    if (manualMode) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, (animationDuration + pauseBetweenAnimations) * 1000);

    return () => clearInterval(interval);
  }, [manualMode, animationDuration, pauseBetweenAnimations, words.length]);

  useEffect(() => {
    if (currentIndex === null || currentIndex === -1) return;
    if (!wordRefs.current[currentIndex] || !containerRef.current) return;

    const parentRect = containerRef.current.getBoundingClientRect();
    const activeRect = wordRefs.current[currentIndex].getBoundingClientRect();

    setFocusRect({
      x: activeRect.left - parentRect.left,
      y: activeRect.top - parentRect.top,
      width: activeRect.width,
      height: activeRect.height
    });
  }, [currentIndex, words.length]);

  const handleMouseEnter = (index) => {
    if (manualMode) {
      setLastActiveIndex(index);
      setCurrentIndex(index);
    }
  };

  const handleMouseLeave = () => {
    if (manualMode) {
      setCurrentIndex(lastActiveIndex);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex flex-wrap items-center gap-x-2 gap-y-1 select-none ${className}`}
      onMouseLeave={handleMouseLeave}
    >
      {words.map((word, index) => {
        const isActive = index === currentIndex;
        return (
          <span
            key={index}
            ref={(el) => (wordRefs.current[index] = el)}
            className="relative cursor-pointer transition-all duration-300 inline-block font-display"
            style={{
              filter: isActive ? 'blur(0px)' : `blur(${blurAmount}px)`,
              opacity: isActive ? 1 : 0.45,
              transform: isActive ? 'scale(1.03)' : 'scale(1)'
            }}
            onMouseEnter={() => handleMouseEnter(index)}
          >
            {word}
          </span>
        );
      })}

      {/* Viewfinder Target Frame */}
      <div
        className="absolute pointer-events-none transition-all ease-out"
        style={{
          transform: `translate(${focusRect.x - 4}px, ${focusRect.y - 4}px)`,
          width: `${focusRect.width + 8}px`,
          height: `${focusRect.height + 8}px`,
          transitionDuration: `${animationDuration}s`,
          opacity: focusRect.width > 0 ? 1 : 0
        }}
      >
        {/* Top-Left Corner */}
        <span
          className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2"
          style={{ borderColor, filter: `drop-shadow(0 0 4px ${glowColor})` }}
        />
        {/* Top-Right Corner */}
        <span
          className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2"
          style={{ borderColor, filter: `drop-shadow(0 0 4px ${glowColor})` }}
        />
        {/* Bottom-Left Corner */}
        <span
          className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2"
          style={{ borderColor, filter: `drop-shadow(0 0 4px ${glowColor})` }}
        />
        {/* Bottom-Right Corner */}
        <span
          className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2"
          style={{ borderColor, filter: `drop-shadow(0 0 4px ${glowColor})` }}
        />
      </div>
    </div>
  );
}
