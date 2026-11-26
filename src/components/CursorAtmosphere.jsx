// src/components/CursorAtmosphere.jsx
import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  startAtmosphereEngine,
  getSpotlightGradient,
  getAuraStyles
} from '../utils/atmosphereEngine';

/**
 * Atmospheric mist canvas layer and dynamic pointer spotlight.
 * Simulates real-time PM2.5, ozone, and clean ion flow around pointer interactions.
 */
export default function CursorAtmosphere() {
  const { isDark } = useTheme();
  const canvasRef = useRef(null);
  const spotlightRef = useRef(null);
  const auraRef = useRef(null);

  const [isHoveringClickable, setIsHoveringClickable] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const hasCoarsePointer = Boolean(
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(pointer: coarse)').matches
    );

    if (hasCoarsePointer) {
      setIsTouchDevice(true);
    }

    const engine = startAtmosphereEngine({
      canvas: canvasRef.current,
      spotlightEl: spotlightRef.current,
      auraEl: auraRef.current,
      isDark,
      hasCoarsePointer,
      onHoverChange: setIsHoveringClickable,
      onClickChange: setIsClicking
    });

    return () => {
      engine.destroy();
    };
  }, [isDark]);

  const spotlightStyle = getSpotlightGradient(isDark);
  const auraStyle = getAuraStyles({ isClicking, isHoveringClickable, isDark });

  return (
    <>
      {/* Interactive Mist Canvas Layer */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-10 transition-opacity duration-300"
        style={{ opacity: 0.95 }}
      />

      {/* Atmospheric Cursor / Touch Spotlight */}
      <div
        ref={spotlightRef}
        className="fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 w-[500px] sm:w-[650px] h-[500px] sm:h-[650px] rounded-full transition-opacity duration-500 will-change-transform"
        style={{ background: spotlightStyle }}
      />

      {/* Interactive Cursor Aura Ring (Desktop / Mouse only) */}
      {!isTouchDevice && (
        <div
          ref={auraRef}
          className="fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 will-change-transform transition-[width,height,border-color,background-color] duration-150 ease-out"
          style={auraStyle}
        >
          {/* Center dot in cursor */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-150"
            style={{
              width: isHoveringClickable ? '6px' : '4px',
              height: isHoveringClickable ? '6px' : '4px',
              backgroundColor: isDark ? '#38BDF8' : '#D97706'
            }}
          />
        </div>
      )}
    </>
  );
}
