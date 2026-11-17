// src/components/CursorAtmosphere.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function CursorAtmosphere() {
  const { isDark } = useTheme();
  const canvasRef = useRef(null);
  const spotlightRef = useRef(null);
  const auraRef = useRef(null);

  const [isHoveringClickable, setIsHoveringClickable] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Detect touch device
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
      setIsTouchDevice(true);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse coordinates & velocity
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      prevX: width / 2,
      prevY: height / 2,
      vx: 0,
      vy: 0,
      radius: 125,
      isActive: false
    };

    // Smooth aura position
    const aura = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
    };

    // Particle system (Simulating PM2.5, mist droplets, and clean air ions)
    const particleCount = Math.min(85, Math.floor((width * height) / 16000));
    const particles = [];

    class Particle {
      constructor() {
        this.reset(true);
      }

      reset(initial = false) {
        this.x = initial ? Math.random() * width : (Math.random() > 0.5 ? -10 : width + 10);
        this.y = Math.random() * height;
        this.baseX = this.x;
        this.baseY = this.y;
        this.size = Math.random() * 2.8 + 1.2;
        this.vx = (Math.random() - 0.5) * 0.45;
        this.vy = (Math.random() - 0.5) * 0.35 - 0.1; // Gentle upward thermal drift
        this.alpha = Math.random() * 0.5 + 0.2;
        this.baseAlpha = this.alpha;
        this.pulse = Math.random() * Math.PI;
        // Distribute types: 0: mist droplet, 1: PM2.5 soot speck, 2: clean air ion
        this.type = Math.random() < 0.6 ? 0 : Math.random() < 0.85 ? 1 : 2;
      }

      update() {
        this.pulse += 0.02;
        this.alpha = this.baseAlpha + Math.sin(this.pulse) * 0.15;

        // Base floating motion
        this.x += this.vx;
        this.y += this.vy;

        // Wrap boundaries
        if (this.x < -20) this.x = width + 20;
        if (this.x > width + 20) this.x = -20;
        if (this.y < -20) this.y = height + 20;
        if (this.y > height + 20) this.y = -20;

        // Cursor atmospheric repulsion & fluid swirl
        if (mouse.isActive) {
          const dx = this.x - mouse.x;
          const dy = this.y - mouse.y;
          const dist = Math.hypot(dx, dy);

          if (dist < mouse.radius && dist > 0) {
            const force = (1 - dist / mouse.radius) * 3.5;
            const angle = Math.atan2(dy, dx);

            // Repel away from cursor (clearing a mini path in the smog!)
            this.x += Math.cos(angle) * force * 1.8;
            this.y += Math.sin(angle) * force * 1.8;

            // Swirl with cursor movement speed
            this.x += mouse.vx * 0.12;
            this.y += mouse.vy * 0.12;

            // Brighten slightly upon cursor contact
            this.alpha = Math.min(0.9, this.alpha + 0.25);
          }
        }
      }

      draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);

        if (isDark) {
          if (this.type === 0) {
            ctx.fillStyle = `rgba(56, 189, 248, ${this.alpha * 0.75})`; // Ozone Blue
            ctx.shadowColor = '#38BDF8';
            ctx.shadowBlur = 6;
          } else if (this.type === 1) {
            ctx.fillStyle = `rgba(251, 191, 36, ${this.alpha * 0.65})`; // Toxic Amber/Yellow
            ctx.shadowColor = '#FBBF24';
            ctx.shadowBlur = 4;
          } else {
            ctx.fillStyle = `rgba(248, 250, 252, ${this.alpha * 0.8})`; // Crisp white mist
          }
        } else {
          if (this.type === 0) {
            ctx.fillStyle = `rgba(14, 165, 233, ${this.alpha * 0.55})`; // Sky Blue mist
          } else if (this.type === 1) {
            ctx.fillStyle = `rgba(217, 119, 6, ${this.alpha * 0.5})`; // Haze Orange
          } else {
            ctx.fillStyle = `rgba(100, 116, 139, ${this.alpha * 0.45})`; // Soft slate
          }
        }

        ctx.fill();
        ctx.restore();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Dynamic mist trails created by fast cursor gestures
    const mistTrails = [];

    const handleMouseMove = (e) => {
      mouse.isActive = true;
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;

      // Update card spotlight CSS variables globally for subtle directional illumination
      document.documentElement.style.setProperty('--cursor-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--cursor-y', `${e.clientY}px`);

      // Spawn ephemeral mist trail wisps when moving quickly
      const speed = Math.hypot(e.clientX - mouse.prevX, e.clientY - mouse.prevY);
      if (speed > 8) {
        for (let j = 0; j < Math.min(3, Math.floor(speed / 10)); j++) {
          mistTrails.push({
            x: e.clientX + (Math.random() - 0.5) * 20,
            y: e.clientY + (Math.random() - 0.5) * 20,
            size: Math.random() * 8 + 4,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5 - 0.5,
            alpha: 0.35,
            decay: 0.015 + Math.random() * 0.015,
            color: isDark ? '56, 189, 248' : '217, 119, 6'
          });
        }
      }

      mouse.prevX = e.clientX;
      mouse.prevY = e.clientY;

      // Detect if hovering over clickable/interactive elements
      const target = e.target;
      if (
        target &&
        (target.tagName === 'BUTTON' ||
          target.tagName === 'A' ||
          target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'TEXTAREA' ||
          target.closest('button') ||
          target.closest('a') ||
          target.closest('[role="button"]') ||
          target.getAttribute('data-interactive') === 'true')
      ) {
        setIsHoveringClickable(true);
      } else {
        setIsHoveringClickable(false);
      }
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    const handleMouseLeave = () => {
      mouse.isActive = false;
      setIsHoveringClickable(false);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Animation Loop
    let lastTime = performance.now();
    const render = (time) => {
      // Calculate delta time
      const dt = Math.min(32, time - lastTime) / 16.66;
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // Smooth mouse interpolation & velocity calculation
      mouse.vx = (mouse.targetX - mouse.x) * 0.2;
      mouse.vy = (mouse.targetY - mouse.y) * 0.2;
      mouse.x += mouse.vx;
      mouse.y += mouse.vy;

      // Smooth aura ring interpolation (delicate spring effect)
      aura.x += (mouse.targetX - aura.x) * 0.22;
      aura.y += (mouse.targetY - aura.y) * 0.22;

      // Update aura DOM position
      if (auraRef.current && mouse.isActive) {
        auraRef.current.style.transform = `translate3d(${aura.x}px, ${aura.y}px, 0)`;
      }

      // Update spotlight position
      if (spotlightRef.current && mouse.isActive) {
        spotlightRef.current.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0)`;
      }

      // Connect nearby particles with subtle breeze lines (ambient particulate network)
      ctx.lineWidth = 0.6;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.hypot(dx, dy);

          if (dist < 85) {
            const lineAlpha = (1 - dist / 85) * 0.12;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = isDark
              ? `rgba(56, 189, 248, ${lineAlpha})`
              : `rgba(148, 163, 184, ${lineAlpha})`;
            ctx.stroke();
          }
        }
      }

      // Render & update particles
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }

      // Render & update mist trails
      for (let k = mistTrails.length - 1; k >= 0; k--) {
        const trail = mistTrails[k];
        trail.x += trail.vx;
        trail.y += trail.vy;
        trail.size += 0.3;
        trail.alpha -= trail.decay;

        if (trail.alpha <= 0) {
          mistTrails.splice(k, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(trail.x, trail.y, trail.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${trail.color}, ${trail.alpha})`;
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDark]);

  if (isTouchDevice) {
    return null;
  }

  return (
    <>
      {/* Interactive Mist Canvas Layer */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-10 transition-opacity duration-300"
        style={{ opacity: 0.95 }}
      />

      {/* Atmospheric Cursor Spotlight (Illuminating the fog wherever cursor moves) */}
      <div
        ref={spotlightRef}
        className="fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 w-[650px] h-[650px] rounded-full transition-opacity duration-500 will-change-transform"
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, rgba(56, 189, 248, 0.02) 40%, transparent 70%)'
            : 'radial-gradient(circle, rgba(217, 119, 6, 0.07) 0%, rgba(217, 119, 6, 0.02) 45%, transparent 70%)'
        }}
      />

      {/* Interactive Cursor Aura Ring */}
      <div
        ref={auraRef}
        className="fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 will-change-transform transition-[width,height,border-color,background-color] duration-150 ease-out"
        style={{
          width: isClicking ? '20px' : isHoveringClickable ? '44px' : '26px',
          height: isClicking ? '20px' : isHoveringClickable ? '44px' : '26px',
          borderRadius: '9999px',
          border: isHoveringClickable
            ? isDark
              ? '2px solid rgba(56, 189, 248, 0.85)'
              : '2px solid rgba(217, 119, 6, 0.85)'
            : isDark
            ? '1.5px solid rgba(248, 250, 252, 0.45)'
            : '1.5px solid rgba(51, 65, 85, 0.45)',
          backgroundColor: isHoveringClickable
            ? isDark
              ? 'rgba(56, 189, 248, 0.12)'
              : 'rgba(217, 119, 6, 0.12)'
            : 'transparent',
          boxShadow: isHoveringClickable
            ? isDark
              ? '0 0 16px rgba(56, 189, 248, 0.45)'
              : '0 0 16px rgba(217, 119, 6, 0.35)'
            : 'none'
        }}
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
    </>
  );
}
