// src/utils/atmosphereRenderer.js
/**
 * @fileoverview Particle simulation, drift mechanics, and canvas render loop for atmospheric effects.
 */

import { isInteractiveTarget } from './atmospherePalettes.js';

export class AtmosphericParticle {
  constructor(width, height) {
    this.reset(width, height, true);
  }

  reset(width, height, initial = false) {
    this.x = initial ? Math.random() * width : Math.random() > 0.5 ? -10 : width + 10;
    this.y = Math.random() * height;
    this.baseX = this.x;
    this.baseY = this.y;
    this.size = Math.random() * 2.8 + 1.2;
    this.vx = (Math.random() - 0.5) * 0.45;
    this.vy = (Math.random() - 0.5) * 0.35 - 0.1;
    this.alpha = Math.random() * 0.5 + 0.2;
    this.baseAlpha = this.alpha;
    this.pulse = Math.random() * Math.PI;
    this.type = Math.random() < 0.6 ? 0 : Math.random() < 0.85 ? 1 : 2;
  }

  update(width, height, mouse) {
    this.pulse += 0.02;
    this.alpha = this.baseAlpha + Math.sin(this.pulse) * 0.15;
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < -20) this.x = width + 20;
    if (this.x > width + 20) this.x = -20;
    if (this.y < -20) this.y = height + 20;
    if (this.y > height + 20) this.y = -20;

    if (mouse && mouse.isActive) {
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.hypot(dx, dy);

      if (dist < mouse.radius && dist > 0) {
        const force = (1 - dist / mouse.radius) * 3.5;
        const angle = Math.atan2(dy, dx);
        this.x += Math.cos(angle) * force * 1.8 + mouse.vx * 0.12;
        this.y += Math.sin(angle) * force * 1.8 + mouse.vy * 0.12;
        this.alpha = Math.min(0.9, this.alpha + 0.25);
      }
    }
  }

  draw(ctx, isDark) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);

    if (isDark) {
      if (this.type === 0) {
        ctx.fillStyle = `rgba(56, 189, 248, ${this.alpha * 0.75})`;
        ctx.shadowColor = '#38BDF8';
        ctx.shadowBlur = 6;
      } else if (this.type === 1) {
        ctx.fillStyle = `rgba(251, 191, 36, ${this.alpha * 0.65})`;
        ctx.shadowColor = '#FBBF24';
        ctx.shadowBlur = 4;
      } else {
        ctx.fillStyle = `rgba(248, 250, 252, ${this.alpha * 0.8})`;
      }
    } else {
      ctx.fillStyle =
        this.type === 0
          ? `rgba(14, 165, 233, ${this.alpha * 0.55})`
          : this.type === 1
            ? `rgba(217, 119, 6, ${this.alpha * 0.5})`
            : `rgba(100, 116, 139, ${this.alpha * 0.45})`;
    }

    ctx.fill();
    ctx.restore();
  }
}

export function startAtmosphereEngine({
  canvas,
  spotlightEl,
  auraEl,
  isDark,
  hasCoarsePointer,
  onHoverChange,
  onClickChange
}) {
  if (!canvas) return { destroy: () => {} };
  const ctx = canvas.getContext('2d');
  if (!ctx) return { destroy: () => {} };

  let animationFrameId;
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const handleResize = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', handleResize);

  const mouse = {
    x: width / 2,
    y: height / 2,
    targetX: width / 2,
    targetY: height / 2,
    prevX: width / 2,
    prevY: height / 2,
    vx: 0,
    vy: 0,
    radius: hasCoarsePointer ? 90 : 125,
    isActive: false
  };
  const aura = { x: width / 2, y: height / 2 };
  const particleCount = hasCoarsePointer ? 28 : Math.min(85, Math.floor((width * height) / 16000));
  const particles = Array.from(
    { length: particleCount },
    () => new AtmosphericParticle(width, height)
  );
  const mistTrails = [];

  const handleMouseMove = (e) => {
    mouse.isActive = true;
    mouse.targetX = e.clientX;
    mouse.targetY = e.clientY;
    document.documentElement.style.setProperty('--cursor-x', `${e.clientX}px`);
    document.documentElement.style.setProperty('--cursor-y', `${e.clientY}px`);

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
    if (onHoverChange) onHoverChange(isInteractiveTarget(e.target));
  };

  const handleTouch = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    const t = e.touches[0];
    mouse.isActive = true;
    mouse.x = mouse.targetX = t.clientX;
    mouse.y = mouse.targetY = t.clientY;
    document.documentElement.style.setProperty('--cursor-x', `${t.clientX}px`);
    document.documentElement.style.setProperty('--cursor-y', `${t.clientY}px`);
  };

  const handleMouseDown = () => onClickChange && onClickChange(true);
  const handleMouseUp = () => onClickChange && onClickChange(false);
  const handleMouseLeave = () => {
    mouse.isActive = false;
    if (onHoverChange) onHoverChange(false);
  };

  let touchEndTimer = null;
  const handleTouchEnd = () => {
    touchEndTimer = setTimeout(() => {
      mouse.isActive = false;
    }, 600);
  };

  window.addEventListener('mousemove', handleMouseMove, { passive: true });
  window.addEventListener('mousedown', handleMouseDown);
  window.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('mouseleave', handleMouseLeave);
  window.addEventListener('touchstart', handleTouch, { passive: true });
  window.addEventListener('touchmove', handleTouch, { passive: true });
  window.addEventListener('touchend', handleTouchEnd, { passive: true });

  const render = () => {
    ctx.clearRect(0, 0, width, height);
    mouse.vx = (mouse.targetX - mouse.x) * 0.2;
    mouse.vy = (mouse.targetY - mouse.y) * 0.2;
    mouse.x += mouse.vx;
    mouse.y += mouse.vy;
    aura.x += (mouse.targetX - aura.x) * 0.22;
    aura.y += (mouse.targetY - aura.y) * 0.22;

    if (auraEl && mouse.isActive)
      auraEl.style.transform = `translate3d(${aura.x}px, ${aura.y}px, 0)`;
    if (spotlightEl && mouse.isActive)
      spotlightEl.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0)`;

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

    for (let i = 0; i < particles.length; i++) {
      particles[i].update(width, height, mouse);
      particles[i].draw(ctx, isDark);
    }

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

  return {
    destroy: () => {
      if (touchEndTimer) clearTimeout(touchEndTimer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchstart', handleTouch);
      window.removeEventListener('touchmove', handleTouch);
      window.removeEventListener('touchend', handleTouchEnd);
      cancelAnimationFrame(animationFrameId);
    }
  };
}
